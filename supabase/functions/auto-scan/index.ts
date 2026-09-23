import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AutoScanRequest {
  message: string;
  source?: string;
}

interface AutoScanResponse {
  flagged: boolean;
  riskScore: number;
  riskLevel: "safe" | "caution" | "suspicious" | "dangerous";
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    category: string;
  }>;
  action: "allow" | "warn" | "block";
}

// Heuristic analysis replicated server-side for the webhook
const LEGITIMATE_DOMAINS: Record<string, string[]> = {
  paypal: ["paypal.com"],
  google: ["google.com", "accounts.google.com"],
  microsoft: ["microsoft.com", "login.live.com", "login.microsoftonline.com"],
  apple: ["apple.com", "icloud.com"],
  amazon: ["amazon.com"],
  netflix: ["netflix.com"],
  facebook: ["facebook.com"],
  instagram: ["instagram.com"],
  coinbase: ["coinbase.com"],
  binance: ["binance.com"],
  metamask: ["metamask.io"],
  github: ["github.com"],
  linkedin: ["linkedin.com"],
  twitter: ["twitter.com", "x.com"],
  chase: ["chase.com"],
  bankofamerica: ["bankofamerica.com"],
  wellsffargo: ["wellsfargo.com"],
  citi: ["citi.com"],
  dropbox: ["dropbox.com"],
  adobe: ["adobe.com"],
  outlook: ["outlook.com", "outlook.live.com"],
  office365: ["office.com", "office365.com"],
};

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click", ".stream", ".download", ".loan", ".work", ".men", ".racing", ".review", ".party", ".trade", ".date", ".kim", ".science", ".zip", ".mov", ".accountant", ".cricket", ".faith", ".help", ".host"];

const URL_SHORTENERS = ["bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at", "t.ly", "lnkd.in", "tiny.cc", "rb.gy"];

const PHISHING_PATTERNS: RegExp[] = [
  /\b(verify|verification)\s+(your\s+)?(account|identity|email)/gi,
  /\bsuspend(ed|ing|s)?\s+(your\s+)?(account|access)/gi,
  /\baccount\s+(has\s+)?been\s+(locked|suspended|compromised|restricted)/gi,
  /\bconfirm\s+(your\s+)?(identity|account|details|password)/gi,
  /\bupdate\s+(your\s+)?(account|payment|billing|information)/gi,
  /\b(urgent|immediate)\s+(action|attention)\s+(required|needed)/gi,
  /\b(click\s+(here|below)|follow\s+this\s+link)\b/gi,
  /\b(password|credential)\s+(expired|reset|update)/gi,
  /\b(seed\s+phrase|recovery\s+phrase|private\s+key)\b/gi,
  /\b(connect|sync|link)\s+(your\s+)?wallet\b/gi,
  /\b(gift\s+card|wire\s+transfer|western\s+union)\b/gi,
];

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']{4,}|www\.[^\s<>"']{4,}|[\w-]+\.(?:com|net|org|io|co|xyz|tk|ml|ga|cf|gq|top|click|cc|tv|me|app|dev|ai|cloud|online|site|store|shop|live|stream|download|loan|work|help|host)(?:\/[^\s<>"']*)?/gi;
  return text.match(urlRegex) || [];
}

function getHostname(urlStr: string): string {
  try {
    const u = new URL(urlStr.startsWith("http") ? urlStr : "https://" + urlStr);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function getTld(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length < 2) return "";
  return "." + parts[parts.length - 1];
}

function detectBrand(hostname: string): string | null {
  for (const [brand, legitDomains] of Object.entries(LEGITIMATE_DOMAINS)) {
    if (hostname.includes(brand)) {
      const isLegit = legitDomains.some((d) => hostname === d || hostname.endsWith("." + d));
      if (!isLegit) return brand;
    }
  }
  return null;
}

function analyzeMessageServerSide(text: string) {
  const findings: Array<{ id: string; title: string; severity: string; category: string }> = [];
  let score = 0;

  const urls = extractUrls(text);
  for (const urlStr of urls.slice(0, 5)) {
    const hostname = getHostname(urlStr);
    if (!hostname) continue;

    const brand = detectBrand(hostname);
    if (brand) {
      findings.push({ id: `brand-${hostname}`, title: `Impersonates ${brand}`, severity: "critical", category: "brand" });
      score += 30;
    }

    const tld = getTld(hostname);
    if (SUSPICIOUS_TLDS.includes(tld)) {
      findings.push({ id: `tld-${hostname}`, title: `Suspicious TLD (${tld})`, severity: "medium", category: "domain" });
      score += 15;
    }

    if (URL_SHORTENERS.some((s) => hostname === s || hostname.endsWith("." + s))) {
      findings.push({ id: `shortener-${hostname}`, title: "Shortened URL", severity: "medium", category: "redirect" });
      score += 10;
    }

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      findings.push({ id: `ip-${hostname}`, title: "Raw IP address", severity: "high", category: "domain" });
      score += 25;
    }
  }

  let phishingMatches = 0;
  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.test(text)) {
      phishingMatches++;
      pattern.lastIndex = 0;
    }
  }
  if (phishingMatches >= 3) {
    findings.push({ id: "phishing-keywords", title: `${phishingMatches} phishing phrases detected`, severity: "high", category: "content" });
    score += 22;
  } else if (phishingMatches >= 1) {
    findings.push({ id: "phishing-keywords", title: "Phishing language detected", severity: "medium", category: "content" });
    score += 12;
  }

  if (/\b(password|credit\s*card|cvv|ssn|seed\s*phrase|otp|verification\s*code)\b/gi.test(text)) {
    findings.push({ id: "sensitive-request", title: "Requests sensitive information", severity: "critical", category: "content" });
    score += 25;
  }

  if (/\b(24\s*hours|48\s*hours|immediately|urgent|final\s+notice|act\s+now)\b/gi.test(text)) {
    findings.push({ id: "urgency", title: "Urgency tactics detected", severity: "high", category: "content" });
    score += 15;
  }

  score = Math.min(score, 100);
  const riskLevel = score >= 70 ? "dangerous" : score >= 40 ? "suspicious" : score >= 20 ? "caution" : "safe";

  return { findings, riskScore: score, riskLevel };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, source } = await req.json() as AutoScanRequest;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Run server-side heuristic analysis
    const analysis = analyzeMessageServerSide(message);

    // Determine action: block dangerous, warn suspicious, allow otherwise
    let action: "allow" | "warn" | "block" = "allow";
    if (analysis.riskLevel === "dangerous") action = "block";
    else if (analysis.riskLevel === "suspicious" || analysis.riskLevel === "caution") action = "warn";

    const response: AutoScanResponse = {
      flagged: analysis.riskScore >= 20,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel as AutoScanResponse["riskLevel"],
      findings: analysis.findings,
      action,
    };

    // Store the scan in the database for audit trail
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      await supabase.from("scan_history").insert({
        input_text: message.substring(0, 2000),
        input_type: "message",
        risk_score: analysis.riskScore,
        risk_level: analysis.riskLevel,
        findings: analysis.findings,
        summary: `Auto-scanned via webhook${source ? ` from ${source}` : ""}. Action: ${action}.`,
        confidence: 0.5 + analysis.findings.length * 0.05,
      });
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
