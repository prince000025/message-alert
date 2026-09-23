export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: string
  title: string
  description: string
  severity: Severity
  category: 'url' | 'domain' | 'content' | 'structure' | 'redirect' | 'brand' | 'reputation'
  detail: string
}

export interface FeatureVector {
  label: string
  value: number
  max: number
  description: string
}

export interface ThreatIntelResult {
  flagged: boolean
  sources: string[]
  threatType: string | null
  confidence: 'low' | 'medium' | 'high'
  details: string
}

export interface AnalysisResult {
  input: string
  inputType: 'url' | 'message'
  riskScore: number
  riskLevel: 'safe' | 'caution' | 'suspicious' | 'dangerous'
  findings: Finding[]
  summary: string
  scannedAt: string
  features: FeatureVector[]
  threatIntel: ThreatIntelResult | null
  confidence: number
}

// Known legitimate domains (used for brand impersonation detection)
const LEGITIMATE_DOMAINS: Record<string, string[]> = {
  'paypal': ['paypal.com'],
  'google': ['google.com', 'accounts.google.com'],
  'microsoft': ['microsoft.com', 'login.live.com', 'login.microsoftonline.com'],
  'apple': ['apple.com', 'icloud.com'],
  'amazon': ['amazon.com'],
  'netflix': ['netflix.com'],
  'facebook': ['facebook.com'],
  'instagram': ['instagram.com'],
  'coinbase': ['coinbase.com'],
  'binance': ['binance.com'],
  'metamask': ['metamask.io'],
  'github': ['github.com'],
  'linkedin': ['linkedin.com'],
  'twitter': ['twitter.com', 'x.com'],
  'chase': ['chase.com'],
  'bankofamerica': ['bankofamerica.com'],
  'wellsfargo': ['wellsfargo.com'],
  'citi': ['citi.com'],
  'dropbox': ['dropbox.com'],
  'adobe': ['adobe.com'],
  'outlook': ['outlook.com', 'outlook.live.com'],
  'office365': ['office.com', 'office365.com'],
}

// Suspicious TLDs commonly used in phishing
const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.country', '.stream', '.download', '.loan', '.work', '.men', '.racing', '.review', '.party', '.trade', '.date', '.kim', '.science', '.zip', '.mov', '.accountant', '.cricket', '.faith', '.help', '.host']

// Common URL shortener services
const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 't.ly', 'lnkd.in', 'tiny.cc', 'rb.gy']

// Phishing keywords commonly found in scam messages
const PHISHING_PATTERNS: RegExp[] = [
  /\b(verify|verification)\s+(your\s+)?(account|identity|email|identity)/gi,
  /\bsuspend(ed|ing|s)?\s+(your\s+)?(account|access)/gi,
  /\baccount\s+(has\s+)?been\s+(locked|suspended|compromised|restricted|limited)/gi,
  /\bconfirm\s+(your\s+)?(identity|account|details|information|password)/gi,
  /\bupdate\s+(your\s+)?(account|payment|billing|information|details)/gi,
  /\b(urgent|immediate)\s+(action|attention)\s+(required|needed)/gi,
  /\b(act\s+now|respond\s+immediately|don't\s+wait)/gi,
  /\b(click\s+(here|below)|follow\s+this\s+link)\b/gi,
  /\b(login\s+to|sign\s+in\s+to)\s+(verify|confirm|update|secure)/gi,
  /\b(unusual|suspicious)\s+(activity|sign-in|login\s+attempt)/gi,
  /\b(password|credential)\s+(expired|expires?|reset|update)/gi,
  /\b(billing|payment)\s+(failed|declined|update|issue|problem)/gi,
  /\b(you\s+have\s+(won|been\s+selected)|congratulations|claim\s+your\s+prize)/gi,
  /\b(inheritance|lottery|sweepstakes|prize\s+money)\b/gi,
  /\b(wire\s+transfer|western\s+union|money\s+gram|gift\s+card)\b/gi,
  /\b(IRS|tax\s+refund|tax\s+payment|unpaid\s+tax)\b/gi,
  /\b(secure|safety|security)\s+(your\s+)?(account|wallet|funds|assets)/gi,
  /\b(connect|sync|link)\s+(your\s+)?wallet\b/gi,
  /\b(seed\s+phrase|recovery\s+phrase|private\s+key)\b/gi,
  /\b(investment|crypto)\s+(opportunity|guaranteed|returns?|doubles?)\b/gi,
  /\b(shipping\s+(address|confirmation)|package\s+(delivery|pending)|parcel)/gi,
  /\binvoice\s+(attached|pending|overdue)\b/gi,
  /\b(hr|human\s+resources|payroll|direct\s+deposit)\b/gi,
  /\b(review\s+(document|file|report)|shared\s+(document|file))\b/gi,
  /\b(deadline|expires?\s+(today|in\s+\d+\s+hours?|within\s+\d+))/gi,
]

// Urgency / fear indicators
const URGENCY_PATTERNS: RegExp[] = [
  /\b(24\s*hours?|48\s*hours?|today|immediately|right\s+now|asap|urgent|final\s+(notice|warning|reminder))/gi,
  /\b\d+\s*(hours?|hrs|minutes?|mins?)\s*(left|remaining|before|until)/gi,
  /\b(last|final)\s+(chance|warning|notice|opportunity|reminder)/gi,
  /\b(don't\s+lose|avoid\s+(suspension|termination|closure|losing))\b/gi,
]

const normalizeInput = (input: string): string => input.trim()

// Levenshtein distance for typosquatting detection
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function extractRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.')
  if (parts.length < 2) return hostname
  // Handle common two-part TLDs
  const twoPartTlds = ['co.uk', 'co.jp', 'com.au', 'co.nz', 'co.in', 'com.br', 'co.kr', 'com.tw']
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join('.')
    if (twoPartTlds.includes(lastTwo)) {
      return parts.slice(-3).join('.')
    }
  }
  return parts.slice(-2).join('.')
}

function detectTyposquatting(hostname: string): { brand: string; distance: number; typoDomain: string } | null {
  const registrable = extractRegistrableDomain(hostname)
  for (const [brand, legitDomains] of Object.entries(LEGITIMATE_DOMAINS)) {
    for (const legit of legitDomains) {
      const legitRegistrable = extractRegistrableDomain(legit)
      if (registrable === legitRegistrable) continue // it IS the legit domain
      const distance = levenshtein(registrable, legitRegistrable)
      // Flag if edit distance is small (1-3) but not identical
      if (distance > 0 && distance <= 3 && registrable.includes(brand.slice(0, 3))) {
        return { brand, distance, typoDomain: registrable }
      }
    }
  }
  return null
}

function tryParseUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    let candidate = trimmed
    if (!/^https?:\/\//i.test(candidate)) {
      if (/^[\w-]+(\.[\w-]+)+(\/|\?|#|$)/.test(candidate)) {
        candidate = 'https://' + candidate
      } else {
        return null
      }
    }
    return new URL(candidate)
  } catch {
    return null
  }
}

function detectUrlsInMessage(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']{4,}|www\.[^\s<>"']{4,}|[\w-]+\.(?:com|net|org|io|co|edu|gov|mil|info|biz|xyz|tk|ml|ga|cf|gq|top|click|cc|tv|me|app|dev|ai|cloud|online|site|store|shop|live|stream|download|loan|work|men|racing|review|party|trade|date|kim|science|zip|mov|accountant|cricket|faith|help|host|us|uk|de|fr|jp|cn|ru|br|in|au|ca|ch|nl|se|no|fi|dk|pl|it|es|mx|kr|tw|hk|sg|my|th|vn|id|ph|nz|ie|pt|gr|at|be|cz|hu|ro|bg|hr|sk|si|lt|lv|ee|lu|is|mt|cy)(?:\/[^\s<>"']*)?/gi
  return text.match(urlRegex) || []
}

function countSubdomains(hostname: string): number {
  const parts = hostname.split('.')
  if (parts.length <= 2) return 0
  return parts.length - 2
}

function hasHomoglyph(hostname: string): boolean {
  const homoglyphRanges = /[\u00e0-\u00ff\u0100-\u017f\u0180-\u024f\u0250-\u02af\u0300-\u036f\u0400-\u04ff\u0531-\u058f\u05d0-\u05ea\u0600-\u06ff\u0900-\u097f]/u
  return homoglyphRanges.test(hostname)
}

function getTld(hostname: string): string {
  const parts = hostname.split('.')
  if (parts.length < 2) return ''
  return '.' + parts[parts.length - 1]
}

function detectImpersonatedBrand(hostname: string): string | null {
  const lowerHost = hostname.toLowerCase()
  for (const [brand, legitDomains] of Object.entries(LEGITIMATE_DOMAINS)) {
    if (lowerHost.includes(brand)) {
      const isLegit = legitDomains.some(d => lowerHost === d || lowerHost.endsWith('.' + d))
      if (!isLegit) return brand
    }
  }
  return null
}

function extractDomainFromUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr)
    return u.hostname.toLowerCase()
  } catch {
    return ''
  }
}

// ML-style weighted scoring: each finding contributes a weighted score
// and we also build a normalized feature vector for the "AI analysis" panel
function buildFeatureVector(params: {
  brandImpersonation: boolean
  typosquatting: boolean
  homoglyph: boolean
  suspiciousTld: boolean
  ipHostname: boolean
  embeddedCreds: boolean
  urlShortener: boolean
  noHttps: boolean
  excessiveSubdomains: boolean
  phishingKeywords: number
  urgencySignals: number
  sensitiveRequest: boolean
  threatIntelFlagged: boolean
}): FeatureVector[] {
  const f = (label: string, value: number, max: number, description: string): FeatureVector => ({
    label, value: Math.min(value, max), max, description,
  })

  return [
    f('Brand Impersonation', params.brandImpersonation ? 1 : 0, 1, 'Domain mimics a known brand'),
    f('Typosquatting', params.typosquatting ? 1 : 0, 1, 'Domain is a small typo of a real brand domain'),
    f('Homoglyph Attack', params.homoglyph ? 1 : 0, 1, 'Non-ASCII chars spoof legitimate domains'),
    f('Suspicious TLD', params.suspiciousTld ? 1 : 0, 1, 'TLD commonly abused for phishing'),
    f('IP Hostname', params.ipHostname ? 1 : 0, 1, 'Raw IP instead of domain name'),
    f('Embedded Credentials', params.embeddedCreds ? 1 : 0, 1, 'user:pass@ in URL to disguise destination'),
    f('URL Shortener', params.urlShortener ? 1 : 0, 1, 'Shortened link hiding real destination'),
    f('No HTTPS', params.noHttps ? 1 : 0, 1, 'Unencrypted connection'),
    f('Excessive Subdomains', params.excessiveSubdomains ? 1 : 0, 1, 'Deep subdomain nesting to hide real domain'),
    f('Phishing Keywords', params.phishingKeywords, 5, 'Phishing language patterns detected'),
    f('Urgency Signals', params.urgencySignals, 4, 'Pressure tactics to rush action'),
    f('Sensitive Info Request', params.sensitiveRequest ? 1 : 0, 1, 'Asks for passwords, cards, or codes'),
    f('Threat Intel Flags', params.threatIntelFlagged ? 1 : 0, 1, 'Flagged by external threat intelligence'),
  ]
}

// Sigmoid-based confidence: more findings = higher confidence in the verdict
function calculateConfidence(findings: Finding[], threatIntel: ThreatIntelResult | null): number {
  const findingCount = findings.length
  const hasThreatIntel = threatIntel?.flagged ? 1 : 0
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const raw = 0.4 + findingCount * 0.05 + criticalCount * 0.1 + hasThreatIntel * 0.15
  return Math.min(Math.round(raw * 100) / 100, 0.99)
}

export function analyzeInput(rawInput: string, threatIntel?: ThreatIntelResult | null): AnalysisResult {
  const input = normalizeInput(rawInput)
  const url = tryParseUrl(input)
  const inputType: 'url' | 'message' = url && input.length < 250 && !/\s/.test(input) ? 'url' : 'message'

  const findings: Finding[] = []
  const featureParams = {
    brandImpersonation: false,
    typosquatting: false,
    homoglyph: false,
    suspiciousTld: false,
    ipHostname: false,
    embeddedCreds: false,
    urlShortener: false,
    noHttps: false,
    excessiveSubdomains: false,
    phishingKeywords: 0,
    urgencySignals: 0,
    sensitiveRequest: false,
    threatIntelFlagged: threatIntel?.flagged ?? false,
  }

  if (inputType === 'url') {
    analyzeUrl(url!, findings, () => { /* score tracked via features */ }, featureParams)
  } else {
    analyzeMessage(input, findings, () => {}, featureParams)
  }

  // Merge threat intelligence findings
  if (threatIntel?.flagged) {
    findings.push({
      id: 'threat-intel',
      title: `Flagged by threat intelligence: ${threatIntel.sources.join(', ')}`,
      description: threatIntel.threatType
        ? `This URL/domain was flagged by external threat intelligence sources as: ${threatIntel.threatType}. Confidence: ${threatIntel.confidence}.`
        : `This URL/domain was flagged by external threat intelligence sources.`,
      severity: threatIntel.confidence === 'high' ? 'critical' : 'high',
      category: 'reputation',
      detail: threatIntel.details,
    })
  } else if (threatIntel && !threatIntel.flagged && threatIntel.details) {
    findings.push({
      id: 'threat-intel-clean',
      title: 'Threat intelligence: no flags',
      description: 'This domain was not flagged by URLhaus, DNS, or RDAP reputation checks.',
      severity: 'info',
      category: 'reputation',
      detail: threatIntel.details,
    })
  }

  // ML-style weighted scoring: weight each feature by severity and normalize
  const weights: Record<Severity, number> = { critical: 30, high: 20, medium: 12, low: 6, info: 0 }
  let score = findings.reduce((sum, f) => sum + weights[f.severity], 0)

  // Apply diminishing returns: above 50, each additional point contributes less
  if (score > 50) {
    score = 50 + Math.round((score - 50) * 0.6)
  }

  score = Math.min(score, 100)

  const riskLevel = score >= 70 ? 'dangerous' : score >= 40 ? 'suspicious' : score >= 20 ? 'caution' : 'safe'

  const features = buildFeatureVector(featureParams)
  const confidence = calculateConfidence(findings, threatIntel ?? null)
  const summary = buildSummary(riskLevel, findings, inputType, threatIntel ?? null, confidence)

  return {
    input: input.length > 500 ? input.substring(0, 500) + '...' : input,
    inputType,
    riskScore: score,
    riskLevel,
    findings: findings.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity)),
    summary,
    scannedAt: new Date().toISOString(),
    features,
    threatIntel: threatIntel ?? null,
    confidence,
  }
}

function severityWeight(s: Severity): number {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[s]
}

function analyzeUrl(
  parsedUrl: URL,
  findings: Finding[],
  addScore: (n: number) => void,
  fp: {
    brandImpersonation: boolean; typosquatting: boolean; homoglyph: boolean;
    suspiciousTld: boolean; ipHostname: boolean; embeddedCreds: boolean;
    urlShortener: boolean; noHttps: boolean; excessiveSubdomains: boolean;
    phishingKeywords: number; urgencySignals: number; sensitiveRequest: boolean;
  },
) {
  const hostname = parsedUrl.hostname.toLowerCase()
  const href = parsedUrl.href
  const protocol = parsedUrl.protocol

  // 1. IP address as hostname
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    findings.push({
      id: 'ip-hostname',
      title: 'IP address used as hostname',
      description: 'The link points to a raw IP address instead of a domain name. Legitimate services use domain names.',
      severity: 'high',
      category: 'domain',
      detail: `Hostname: ${hostname}`,
    })
    addScore(25)
    fp.ipHostname = true
  }

  // 2. Suspicious TLD
  const tld = getTld(hostname)
  if (SUSPICIOUS_TLDS.includes(tld)) {
    findings.push({
      id: 'suspicious-tld',
      title: `Suspicious top-level domain (${tld})`,
      description: 'This TLD is commonly associated with phishing and spam campaigns due to low registration costs and weak oversight.',
      severity: 'medium',
      category: 'domain',
      detail: `TLD: ${tld}`,
    })
    addScore(15)
    fp.suspiciousTld = true
  }

  // 3. Brand impersonation
  const brand = detectImpersonatedBrand(hostname)
  if (brand) {
    findings.push({
      id: 'brand-impersonation',
      title: `Possible ${brand} impersonation`,
      description: `The domain contains "${brand}" but does not match the official ${brand} domain. This is a common phishing technique.`,
      severity: 'critical',
      category: 'brand',
      detail: `Detected brand "${brand}" in hostname: ${hostname}`,
    })
    addScore(30)
    fp.brandImpersonation = true
  }

  // 3b. Typosquatting (Levenshtein distance)
  const typo = detectTyposquatting(hostname)
  if (typo) {
    findings.push({
      id: 'typosquatting',
      title: `Typosquatting detected (${typo.brand})`,
      description: `The domain "${typo.typoDomain}" is only ${typo.distance} character${typo.distance > 1 ? 's' : ''} different from the real ${typo.brand} domain. This is a common phishing technique where attackers register misspelled versions of popular domains.`,
      severity: 'critical',
      category: 'brand',
      detail: `Domain: ${typo.typoDomain}\nEdit distance from real ${typo.brand} domain: ${typo.distance}`,
    })
    addScore(28)
    fp.typosquatting = true
  }

  // 4. Homoglyph / punycode attack
  if (hasHomoglyph(hostname)) {
    findings.push({
      id: 'homoglyph',
      title: 'Non-ASCII characters in domain',
      description: 'The domain contains Unicode characters that may look like normal letters but are actually different, a technique used to disguise fake domains.',
      severity: 'critical',
      category: 'domain',
      detail: `Hostname contains non-ASCII characters: ${hostname}`,
    })
    addScore(25)
    fp.homoglyph = true
  } else if (hostname.includes('xn--')) {
    findings.push({
      id: 'punycode',
      title: 'Punycode (internationalized) domain',
      description: 'This domain uses encoded international characters (punycode), which can be used to create look-alike domain names.',
      severity: 'high',
      category: 'domain',
      detail: `Punycode domain: ${hostname}`,
    })
    addScore(20)
    fp.homoglyph = true
  }

  // 5. Excessive subdomains
  const subdomainCount = countSubdomains(hostname)
  if (subdomainCount >= 3) {
    findings.push({
      id: 'excessive-subdomains',
      title: 'Excessive subdomain nesting',
      description: `The URL has ${subdomainCount} levels of subdomains. Phishing campaigns often use deeply nested subdomains to hide the real domain.`,
      severity: 'medium',
      category: 'structure',
      detail: `Subdomain chain: ${hostname.split('.').slice(0, -2).join('.')}`,
    })
    addScore(12)
    fp.excessiveSubdomains = true
  }

  // 6. URL shortener
  if (URL_SHORTENERS.some(s => hostname === s || hostname.endsWith('.' + s))) {
    findings.push({
      id: 'url-shortener',
      title: 'URL shortener detected',
      description: 'This link uses a URL shortening service, which hides the actual destination. Always expand shortened links before clicking.',
      severity: 'medium',
      category: 'redirect',
      detail: `Shortener domain: ${hostname}`,
    })
    addScore(10)
    fp.urlShortener = true
  }

  // 7. Embedded credentials in URL (user:pass@)
  if (parsedUrl.username || parsedUrl.password) {
    findings.push({
      id: 'embedded-creds',
      title: 'Credentials embedded in URL',
      description: 'The URL contains a username and/or password before the @ symbol. This is a classic trick to hide the real destination.',
      severity: 'critical',
      category: 'structure',
      detail: `Username: "${parsedUrl.username}", Password: "${parsedUrl.password}"`,
    })
    addScore(30)
    fp.embeddedCreds = true
  }

  // 8. @ symbol in path (before the actual domain)
  if (href.includes('@') && !parsedUrl.username) {
    findings.push({
      id: 'at-symbol',
      title: '@ symbol in URL',
      description: 'The @ symbol in a URL can be used to confuse users about the actual destination domain.',
      severity: 'medium',
      category: 'structure',
      detail: 'URL contains @ character',
    })
    addScore(10)
  }

  // 9. Excessive URL length
  if (href.length > 100) {
    findings.push({
      id: 'long-url',
      title: 'Unusually long URL',
      description: `This URL is ${href.length} characters long. Extremely long URLs can be used to hide tracking parameters or obfuscate the destination.`,
      severity: 'low',
      category: 'structure',
      detail: `URL length: ${href.length} characters`,
    })
    addScore(5)
  }

  // 10. HTTP (not HTTPS)
  if (protocol === 'http:') {
    findings.push({
      id: 'no-https',
      title: 'No HTTPS encryption',
      description: 'This link uses HTTP instead of HTTPS. The connection is not encrypted, and legitimate services almost always use HTTPS.',
      severity: 'medium',
      category: 'url',
      detail: 'Protocol: http (unencrypted)',
    })
    addScore(12)
    fp.noHttps = true
  }

  // 11. Suspicious path keywords
  const pathLower = (parsedUrl.pathname + parsedUrl.search).toLowerCase()
  const suspiciousPathKeywords = ['login', 'signin', 'verify', 'confirm', 'update', 'secure', 'account', 'password', 'wallet', 'reset', 'validate', 'unlock', 'suspend', 'activate', 'billing', 'payment', 'alert', 'warning', 'limited', 'restricted']
  const matchedPathKeywords = suspiciousPathKeywords.filter(k => pathLower.includes(k))
  if (matchedPathKeywords.length >= 2) {
    findings.push({
      id: 'suspicious-path',
      title: 'Multiple sensitive keywords in URL path',
      description: `The URL path contains several keywords commonly used in phishing: ${matchedPathKeywords.join(', ')}`,
      severity: 'medium',
      category: 'content',
      detail: `Matched keywords: ${matchedPathKeywords.join(', ')}`,
    })
    addScore(10)
  } else if (matchedPathKeywords.length === 1) {
    findings.push({
      id: 'sensitive-keyword',
      title: 'Sensitive keyword in URL path',
      description: `The URL path contains "${matchedPathKeywords[0]}", which is common in phishing links.`,
      severity: 'low',
      category: 'content',
      detail: `Matched keyword: ${matchedPathKeywords[0]}`,
    })
    addScore(4)
  }

  // 12. URL-encoded characters (obfuscation)
  const encodedCount = (href.match(/%[0-9a-f]{2}/gi) || []).length
  if (encodedCount >= 5) {
    findings.push({
      id: 'url-encoding',
      title: 'Heavy URL encoding',
      description: `The URL contains ${encodedCount} percent-encoded characters, which can be used to obfuscate the actual destination.`,
      severity: 'low',
      category: 'structure',
      detail: `${encodedCount} encoded characters detected`,
    })
    addScore(8)
  }

  // 13. Port number
  if (parsedUrl.port && parsedUrl.port !== '80' && parsedUrl.port !== '443') {
    findings.push({
      id: 'non-standard-port',
      title: `Non-standard port :${parsedUrl.port}`,
      description: 'The URL specifies a non-standard port, which can indicate the server is not a legitimate web service.',
      severity: 'low',
      category: 'structure',
      detail: `Port: ${parsedUrl.port}`,
    })
    addScore(5)
  }

  // 14. Hex-encoded IP in hostname
  if (/0x[0-9a-f]{8}/i.test(hostname) || /^\d{8,}$/.test(hostname.replace(/\./g, ''))) {
    findings.push({
      id: 'encoded-ip',
      title: 'Encoded IP address in hostname',
      description: 'The hostname appears to contain an encoded or decimal IP address, a technique used to disguise the real server.',
      severity: 'high',
      category: 'domain',
      detail: `Hostname pattern: ${hostname}`,
    })
    addScore(18)
  }

  // 15. Many query parameters (tracking/obfuscation)
  const params = parsedUrl.searchParams
  if (Array.from(params.keys()).length > 5) {
    findings.push({
      id: 'many-params',
      title: 'Many query parameters',
      description: `The URL has ${Array.from(params.keys()).length} query parameters, which can be used for tracking or to obfuscate redirects.`,
      severity: 'low',
      category: 'structure',
      detail: `${Array.from(params.keys()).length} parameters`,
    })
    addScore(4)
  }
}

function analyzeMessage(
  text: string,
  findings: Finding[],
  addScore: (n: number) => void,
  fp: {
    brandImpersonation: boolean; typosquatting: boolean; homoglyph: boolean;
    suspiciousTld: boolean; ipHostname: boolean; embeddedCreds: boolean;
    urlShortener: boolean; noHttps: boolean; excessiveSubdomains: boolean;
    phishingKeywords: number; urgencySignals: number; sensitiveRequest: boolean;
  },
) {
  // 1. Detect URLs in message
  const urls = detectUrlsInMessage(text)
  if (urls.length > 0) {
    for (const urlStr of urls.slice(0, 5)) {
      const parsed = tryParseUrl(urlStr)
      const domain = extractDomainFromUrl(urlStr)

      if (parsed) {
        const brand = detectImpersonatedBrand(parsed.hostname.toLowerCase())
        if (brand) {
          findings.push({
            id: `msg-brand-${brand}-${domain}`,
            title: `Suspicious link impersonating ${brand}`,
            description: `The message contains a link to "${parsed.hostname}" which appears to impersonate ${brand}. The official domain is different.`,
            severity: 'critical',
            category: 'brand',
            detail: `Link: ${urlStr}`,
          })
          addScore(25)
          fp.brandImpersonation = true
        }

        // Also check typosquatting in message links
        const typo = detectTyposquatting(parsed.hostname.toLowerCase())
        if (typo) {
          findings.push({
            id: `msg-typo-${typo.brand}-${domain}`,
            title: `Link typosquats ${typo.brand}`,
            description: `A link in the message points to "${typo.typoDomain}", which is only ${typo.distance} character${typo.distance > 1 ? 's' : ''} different from the real ${typo.brand} domain.`,
            severity: 'high',
            category: 'brand',
            detail: `Link: ${urlStr}\nEdit distance: ${typo.distance}`,
          })
          addScore(20)
          fp.typosquatting = true
        }

        const tld = getTld(parsed.hostname.toLowerCase())
        if (SUSPICIOUS_TLDS.includes(tld)) {
          findings.push({
            id: `msg-tld-${domain}`,
            title: `Link uses suspicious domain (${tld})`,
            description: `A link in the message uses the ${tld} TLD, which is commonly abused for phishing.`,
            severity: 'medium',
            category: 'domain',
            detail: `Link: ${urlStr}`,
          })
          addScore(12)
          fp.suspiciousTld = true
        }

        if (parsed.protocol === 'http:') {
          findings.push({
            id: `msg-http-${domain}`,
            title: 'Link uses unencrypted HTTP',
            description: 'A link in the message uses HTTP instead of HTTPS, meaning the connection is not secured.',
            severity: 'low',
            category: 'url',
            detail: `Link: ${urlStr}`,
          })
          addScore(6)
          fp.noHttps = true
        }

        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname)) {
          findings.push({
            id: `msg-ip-${domain}`,
            title: 'Link points to raw IP address',
            description: 'A link in the message points directly to an IP address instead of a domain name.',
            severity: 'high',
            category: 'domain',
            detail: `IP: ${parsed.hostname}`,
          })
          addScore(18)
          fp.ipHostname = true
        }

        if (URL_SHORTENERS.some(s => parsed.hostname === s || parsed.hostname.endsWith('.' + s))) {
          findings.push({
            id: `msg-shortener-${domain}`,
            title: 'Shortened link detected',
            description: 'The message contains a shortened URL that hides the real destination.',
            severity: 'medium',
            category: 'redirect',
            detail: `Shortened link: ${urlStr}`,
          })
          addScore(8)
          fp.urlShortener = true
        }

        if (parsed.username || parsed.password) {
          findings.push({
            id: `msg-creds-${domain}`,
            title: 'Link has embedded credentials',
            description: 'A link in the message contains credentials before the @ symbol, used to disguise the destination.',
            severity: 'critical',
            category: 'structure',
            detail: `Link: ${urlStr}`,
          })
          addScore(20)
          fp.embeddedCreds = true
        }
      } else if (domain) {
        const brand = detectImpersonatedBrand(domain)
        if (brand) {
          findings.push({
            id: `msg-bare-brand-${domain}`,
            title: `Bare domain impersonating ${brand}`,
            description: `The message mentions "${domain}" which appears to impersonate ${brand}.`,
            severity: 'high',
            category: 'brand',
            detail: `Domain: ${domain}`,
          })
          addScore(20)
          fp.brandImpersonation = true
        }
      }
    }

    if (urls.length > 0) {
      findings.push({
        id: 'msg-has-links',
        title: `${urls.length} link${urls.length > 1 ? 's' : ''} found in message`,
        description: urls.length > 1
          ? 'The message contains multiple links. Phishing messages often include several links to increase the chance of a click.'
          : 'The message contains a link. Verify the destination before clicking.',
        severity: 'info',
        category: 'content',
        detail: urls.slice(0, 3).join('\n'),
      })
      addScore(3)
    }
  }

  // 2. Phishing keyword patterns
  const matchedPatterns: string[] = []
  for (const pattern of PHISHING_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      matchedPatterns.push(...matches.slice(0, 2))
    }
  }

  fp.phishingKeywords = matchedPatterns.length

  if (matchedPatterns.length >= 3) {
    findings.push({
      id: 'phishing-keywords',
      title: 'Multiple phishing indicators detected',
      description: `The message contains ${matchedPatterns.length} phrases commonly used in phishing: "${matchedPatterns.slice(0, 4).join('", "')}"`,
      severity: 'high',
      category: 'content',
      detail: `Matched phrases:\n${matchedPatterns.slice(0, 8).map(p => `• ${p}`).join('\n')}`,
    })
    addScore(22)
  } else if (matchedPatterns.length >= 1) {
    findings.push({
      id: 'phishing-keywords',
      title: 'Phishing language detected',
      description: `The message contains phrases commonly used in phishing: "${matchedPatterns.join('", "')}"`,
      severity: 'medium',
      category: 'content',
      detail: `Matched phrases:\n${matchedPatterns.map(p => `• ${p}`).join('\n')}`,
    })
    addScore(12)
  }

  // 3. Urgency / pressure tactics
  const urgencyMatches: string[] = []
  for (const pattern of URGENCY_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) urgencyMatches.push(...matches.slice(0, 2))
  }

  fp.urgencySignals = urgencyMatches.length

  if (urgencyMatches.length >= 2) {
    findings.push({
      id: 'urgency-pressure',
      title: 'Urgency and pressure tactics',
      description: `The message creates false urgency to rush you into acting without thinking: "${urgencyMatches.slice(0, 3).join('", "')}"`,
      severity: 'high',
      category: 'content',
      detail: `Urgency phrases:\n${urgencyMatches.map(p => `• ${p}`).join('\n')}`,
    })
    addScore(15)
  } else if (urgencyMatches.length === 1) {
    findings.push({
      id: 'urgency-pressure',
      title: 'Urgency language detected',
      description: `The message uses urgency to pressure action: "${urgencyMatches[0]}"`,
      severity: 'medium',
      category: 'content',
      detail: `Urgency phrase: ${urgencyMatches[0]}`,
    })
    addScore(8)
  }

  // 4. Request for sensitive information
  const sensitiveRequests = [
    { pattern: /\b(password|passwd|pin\s*code|passcode)\b/gi, label: 'password or PIN' },
    { pattern: /\b(credit\s*card|card\s*number|cvv|cvc|expiry)\b/gi, label: 'credit card details' },
    { pattern: /\b(ssn|social\s*security)\b/gi, label: 'Social Security number' },
    { pattern: /\b(bank\s*account|routing\s*number|account\s*number)\b/gi, label: 'bank account details' },
    { pattern: /\b(seed\s*phrase|recovery\s*phrase|private\s*key|mnemonic)\b/gi, label: 'crypto wallet keys' },
    { pattern: /\b(otp|one\s*time\s*password|verification\s*code|2fa\s*code)\b/gi, label: 'verification codes' },
  ]

  const sensitiveFound: string[] = []
  for (const req of sensitiveRequests) {
    if (req.pattern.test(text)) {
      sensitiveFound.push(req.label)
      req.pattern.lastIndex = 0
    }
  }

  if (sensitiveFound.length >= 2) {
    findings.push({
      id: 'sensitive-request',
      title: 'Requests for multiple types of sensitive information',
      description: `The message asks for: ${sensitiveFound.join(', ')}. Legitimate organizations never ask for these via message.`,
      severity: 'critical',
      category: 'content',
      detail: `Requested: ${sensitiveFound.join(', ')}`,
    })
    addScore(25)
    fp.sensitiveRequest = true
  } else if (sensitiveFound.length === 1) {
    findings.push({
      id: 'sensitive-request',
      title: `Requests for ${sensitiveFound[0]}`,
      description: `The message asks for ${sensitiveFound[0]}. Legitimate organizations never request this via message.`,
      severity: 'high',
      category: 'content',
      detail: `Requested: ${sensitiveFound[0]}`,
    })
    addScore(15)
    fp.sensitiveRequest = true
  }

  // 5. Generic greeting (no personalized name)
  if (/\b(dear\s+(customer|user|sir|madam|valued\s+customer|account\s+holder|member))\b/gi.test(text)) {
    findings.push({
      id: 'generic-greeting',
      title: 'Generic greeting',
      description: 'The message uses a generic greeting instead of your name. Legitimate organizations usually address you by name.',
      severity: 'medium',
      category: 'content',
      detail: 'Generic greeting detected (e.g., "Dear Customer")',
    })
    addScore(8)
  }

  // 6. Spelling and grammar issues (heuristic: check for common patterns)
  const grammarIssues: string[] = []
  if (/\b(i\s+am\s+writing\s+this|i\s+wish\s+to\s+inform)\b/gi.test(text)) grammarIssues.push('phrasing typical of scam templates')
  if (/\b(kindly|please\s+sir|dear\s+sir)\b/gi.test(text)) grammarIssues.push('overly formal/scam-typical language')
  if (/[!?]{2,}/g.test(text)) grammarIssues.push('multiple exclamation/question marks')
  if (/\b[C\$]\s*\d{3,}/g.test(text) || /\b\d{4,}\s*(dollars?|usd|euros?|pounds?)\b/gi.test(text)) grammarIssues.push('large monetary amounts')

  if (grammarIssues.length >= 2) {
    findings.push({
      id: 'grammar-issues',
      title: 'Writing style consistent with scam messages',
      description: `Multiple indicators: ${grammarIssues.join('; ')}`,
      severity: 'low',
      category: 'content',
      detail: grammarIssues.map(g => `• ${g}`).join('\n'),
    })
    addScore(8)
  }

  // 7. Mismatch between displayed text and actual link (check for [text](url) or <a> patterns)
  if (/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi.test(text) || /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi.test(text)) {
    findings.push({
      id: 'link-text-mismatch',
      title: 'Potential link/display mismatch',
      description: 'The message contains formatted links where the displayed text may differ from the actual URL. Always hover to verify.',
      severity: 'medium',
      category: 'content',
      detail: 'Formatted links detected - verify actual URLs',
    })
    addScore(10)
  }

  // 8. Attachment references
  if (/\b(\.pdf|\.zip|\.exe|\.scr|\.docm?|\.xlsm?|\.js|\.jar|\.bat|\.cmd)\b/gi.test(text)) {
    findings.push({
      id: 'attachment-reference',
      title: 'References to file attachments',
      description: 'The message references file attachments. Malicious attachments can contain malware or scripts.',
      severity: 'medium',
      category: 'content',
      detail: 'File attachment reference detected',
    })
    addScore(8)
  }

  // 9. Email spoofing indicators (From: / Reply-To: headers visible in pasted email)
  if (/\b(from|reply-to|return-path)\s*:.*@/gi.test(text)) {
    findings.push({
      id: 'email-headers',
      title: 'Email headers visible',
      description: 'The message appears to be a pasted email with headers visible. Check if the sender domain matches the claimed organization.',
      severity: 'info',
      category: 'content',
      detail: 'Email headers detected in message',
    })
    addScore(5)
  }

  // 10. No links but phishing keywords (pure social engineering)
  if (urls.length === 0 && matchedPatterns.length >= 2) {
    findings.push({
      id: 'social-engineering',
      title: 'Social engineering without links',
      description: 'The message uses phishing tactics but contains no links. This could be a setup for a phone scam or an attempt to establish trust.',
      severity: 'medium',
      category: 'content',
      detail: 'Phishing language without links - possible advance-fee or romance scam',
    })
    addScore(10)
  }
}

function buildSummary(
  level: AnalysisResult['riskLevel'],
  findings: Finding[],
  type: 'url' | 'message',
  threatIntel: ThreatIntelResult | null,
  confidence: number,
): string {
  const typeLabel = type === 'url' ? 'link' : 'message'
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const confidencePct = Math.round(confidence * 100)

  let intelNote = ''
  if (threatIntel?.flagged) {
    intelNote = ` External threat intelligence sources (${threatIntel.sources.join(', ')}) also flagged this ${typeLabel}.`
  }

  switch (level) {
    case 'dangerous':
      return `This ${typeLabel} is very likely a phishing attempt. ${criticalCount > 0 ? `${criticalCount} critical ${criticalCount === 1 ? 'indicator' : 'indicators'} ` : ''}${highCount > 0 ? `${highCount} high-severity ${highCount === 1 ? 'signal' : 'signals'} ` : ''}were detected.${intelNote} Do not click any links or provide any information. Confidence: ${confidencePct}%.`
    case 'suspicious':
      return `This ${typeLabel} shows several warning signs of phishing. Exercise caution and verify the source through an independent channel before taking any action.${intelNote} Confidence: ${confidencePct}%.`
    case 'caution':
      return `This ${typeLabel} has some characteristics worth reviewing. While not clearly malicious, a few indicators suggest you should proceed with care. Confidence: ${confidencePct}%.`
    case 'safe':
      return `No significant phishing indicators were detected in this ${typeLabel}. However, always remain vigilant — new phishing techniques emerge constantly, and no automated tool is foolproof. Confidence: ${confidencePct}%.`
  }
}
