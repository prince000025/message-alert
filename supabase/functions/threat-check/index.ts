const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ThreatIntelRequest {
  url: string;
  hostname: string;
}

interface ThreatIntelResult {
  flagged: boolean;
  sources: string[];
  threatType: string | null;
  confidence: "low" | "medium" | "high";
  details: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url, hostname } = await req.json() as ThreatIntelRequest;

    if (!hostname) {
      return new Response(
        JSON.stringify({ error: "hostname is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sources: string[] = [];
    let threatType: string | null = null;
    let confidence: "low" | "medium" | "high" = "low";
    const details: string[] = [];

    // 1. Check URLhaus (abuse.ch) — free threat intelligence API
    try {
      const urlhausBody = new URLSearchParams();
      urlhausBody.append("url", url || hostname);

      const urlhausResp = await fetch("https://urlhaus-api.abuse.ch/v1/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: urlhausBody.toString(),
      });

      if (urlhausResp.ok) {
        const urlhausData = await urlhausResp.json();
        if (urlhausData.query_status === "online" && urlhausData.url_status) {
          sources.push("URLhaus (abuse.ch)");
          threatType = urlhausData.threat || "malicious URL";
          confidence = "high";
          details.push(`URLhaus status: ${urlhausData.url_status}`);
        }
      }
    } catch {
      details.push("URLhaus lookup failed (network error)");
    }

    // 2. Check PhishTank via URL — PhishTank's free API requires a key but we can
    // do a heuristic domain reputation check by querying Google Safe Browsing-style
    // public DNS-based blocklist (e.g. Spamhaus DBL via DNS TXT lookup is not
    // available in edge runtime; instead we use a heuristic reputation approach).
    //
    // We use the free "Checkphish" style heuristic: check if domain was recently
    // registered or has suspicious patterns via a lightweight DNS-over-HTTPS query.

    // 3. DNS-over-HTTPS lookup to resolve the hostname — if it doesn't resolve,
    // it could be a parked/non-existent domain (common in phishing)
    try {
      const dohResp = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
        { headers: { "Accept": "application/dns-json" } },
      );
      if (dohResp.ok) {
        const dohData = await dohResp.json();
        if (dohData.Status === 3) {
          // NXDOMAIN — domain doesn't exist
          sources.push("DNS Resolution (Google DoH)");
          if (!threatType) threatType = "non-existent domain";
          confidence = confidence === "high" ? "high" : "medium";
          details.push("Domain does not resolve (NXDOMAIN) — may be parked or fake");
        } else if (dohData.Answer) {
          const ips = dohData.Answer
            .filter((a: { type: number }) => a.type === 1)
            .map((a: { data: string }) => a.data);
          details.push(`Resolves to: ${ips.join(", ")}`);
        }
      }
    } catch {
      details.push("DNS lookup failed (network error)");
    }

    // 4. Check for recently-registered domain heuristic via free RDAP lookup
    // RDAP is the modern replacement for WHOIS and has a free, well-known bootstrap
    try {
      const rdapResp = await fetch(
        `https://rdap.org/domain/${encodeURIComponent(hostname)}`,
        { headers: { "Accept": "application/rdap+json" }, redirect: "follow" },
      );
      if (rdapResp.ok) {
        const rdapData = await rdapResp.json();
        // Look for registration date in events
        const events = rdapData.events || [];
        const registrationEvent = events.find(
          (e: { eventAction: string }) => e.eventAction === "registration",
        );
        if (registrationEvent && registrationEvent.eventDate) {
          const regDate = new Date(registrationEvent.eventDate);
          const daysSinceReg = Math.floor(
            (Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          details.push(`Domain registered: ${regDate.toISOString().split("T")[0]} (${daysSinceReg} days ago)`);
          // Newly registered domains (less than 30 days) are suspicious
          if (daysSinceReg < 30) {
            sources.push("RDAP Registration Age");
            if (!threatType) threatType = "recently registered domain";
            confidence = confidence === "high" ? "high" : "medium";
            details.push("Domain registered less than 30 days ago — high-risk for phishing");
          } else if (daysSinceReg < 90) {
            if (confidence === "low") confidence = "medium";
            details.push("Domain registered less than 90 days ago — moderate risk");
          }
        }
      }
    } catch {
      // RDAP often fails for certain TLDs — not critical
      details.push("RDAP registration lookup unavailable for this TLD");
    }

    const result: ThreatIntelResult = {
      flagged: sources.length > 0,
      sources,
      threatType,
      confidence,
      details: details.join("\n"),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
