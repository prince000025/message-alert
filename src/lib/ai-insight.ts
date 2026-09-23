import type { AnalysisResult, Finding } from './analyzer'

export interface AIInsight {
  headline: string
  threatAssessment: string
  attackVector: string
  recommendations: string[]
  riskNarrative: string
  classification: string
  targetLikelihood: string
}

function classifyAttack(findings: Finding[], inputType: 'url' | 'message'): string {
  const categories = new Set(findings.map(f => f.category))
  const hasBrand = categories.has('brand')
  const hasContent = categories.has('content')
  const hasDomain = categories.has('domain')
  const hasReputation = categories.has('reputation')
  const hasRedirect = categories.has('redirect')

  if (hasBrand && hasDomain) return 'Brand Impersonation + Domain Spoofing'
  if (hasBrand && hasContent) return 'Spear-Phishing with Brand Impersonation'
  if (hasBrand) return 'Brand Impersonation Attack'
  if (hasContent && inputType === 'message') return 'Social Engineering / Message-Based Phishing'
  if (hasDomain && hasReputation) return 'Known Malicious Infrastructure'
  if (hasDomain) return 'Domain-Based Phishing'
  if (hasRedirect) return 'Redirection-Based Attack'
  if (hasContent) return 'Content-Based Social Engineering'
  return 'Heuristic Anomaly'
}

function assessAttackVector(findings: Finding[], inputType: 'url' | 'message'): string {
  const parts: string[] = []

  if (inputType === 'url') {
    parts.push('The primary attack vector is a malicious URL designed to trick users into visiting a fraudulent website.')

    const brandFinding = findings.find(f => f.category === 'brand')
    if (brandFinding) {
      parts.push(`The URL leverages brand impersonation — ${brandFinding.title.toLowerCase()} — to establish false trust with the victim.`)
    }

    const typoFinding = findings.find(f => f.id.includes('typosquatting'))
    if (typoFinding) {
      parts.push('A typosquatting technique is employed, exploiting common typing errors to capture users who mistype legitimate domain names.')
    }

    const homoglyphFinding = findings.find(f => f.id === 'homoglyph' || f.id === 'punycode')
    if (homoglyphFinding) {
      parts.push('The domain uses non-ASCII characters (homoglyph attack) to visually impersonate a legitimate domain — a technique that bypasses casual visual inspection.')
    }

    const credsFinding = findings.find(f => f.id === 'embedded-creds' || f.id === 'at-symbol')
    if (credsFinding) {
      parts.push('Embedded credentials in the URL structure attempt to confuse the victim about the actual destination domain.')
    }

    const shortenerFinding = findings.find(f => f.id === 'url-shortener' || f.id.includes('shortener'))
    if (shortenerFinding) {
      parts.push('A URL shortener is used to conceal the true destination, preventing the user from verifying the target before clicking.')
    }

    const ipFinding = findings.find(f => f.id === 'ip-hostname' || f.id.includes('ip-'))
    if (ipFinding) {
      parts.push('The use of a raw IP address instead of a domain name is a strong indicator of malicious infrastructure, as legitimate services always use domain names.')
    }

    const tldFinding = findings.find(f => f.id === 'suspicious-tld')
    if (tldFinding) {
      parts.push('The domain uses a top-level domain frequently associated with phishing campaigns due to low registration costs and minimal verification requirements.')
    }

    const noHttps = findings.find(f => f.id === 'no-https')
    if (noHttps) {
      parts.push('The lack of HTTPS encryption indicates the connection is unsecured — modern legitimate services universally use HTTPS.')
    }
  } else {
    parts.push('The primary attack vector is a social engineering message designed to manipulate the recipient into taking a harmful action.')

    const urgencyFinding = findings.find(f => f.id === 'urgency-pressure')
    if (urgencyFinding) {
      parts.push('The message employs urgency and pressure tactics to force rapid decision-making, preventing the victim from critically evaluating the request.')
    }

    const sensitiveFinding = findings.find(f => f.id === 'sensitive-request')
    if (sensitiveFinding) {
      parts.push('The message requests sensitive information — a definitive red flag, as legitimate organizations never ask for credentials, financial details, or security codes via unsolicited messages.')
    }

    const phishingKeywords = findings.find(f => f.id === 'phishing-keywords')
    if (phishingKeywords) {
      parts.push('Multiple phishing language patterns were detected, indicating the message follows known scam templates.')
    }

    const genericGreeting = findings.find(f => f.id === 'generic-greeting')
    if (genericGreeting) {
      parts.push('The use of a generic greeting instead of the recipient\'s name is characteristic of mass-distributed phishing campaigns.')
    }

    const linkFindings = findings.filter(f => f.id.includes('msg-') || f.id === 'msg-has-links')
    if (linkFindings.length > 0) {
      parts.push(`The message contains ${linkFindings.length > 1 ? 'embedded links' : 'an embedded link'} that direct the victim to fraudulent infrastructure.`)
    }

    const socialEng = findings.find(f => f.id === 'social-engineering')
    if (socialEng) {
      parts.push('Notably, this message uses phishing tactics without including links — suggesting an advance-fee scam, romance scam, or phone-based social engineering attempt.')
    }
  }

  return parts.join(' ')
}

function generateRecommendations(findings: Finding[], riskLevel: string, _inputType: 'url' | 'message'): string[] {
  const recs: string[] = []

  if (riskLevel === 'dangerous') {
    recs.push('Do NOT click any links, download attachments, or respond to this message under any circumstances.')
    recs.push('If you have already clicked a link or entered credentials, immediately change your password on the affected account and enable two-factor authentication.')
    recs.push('Report this phishing attempt to your organization\'s security team or to anti-phishing organizations such as the Anti-Phishing Working Group (APWG).')
  } else if (riskLevel === 'suspicious') {
    recs.push('Do not click any links or provide any information until you have independently verified the source.')
    recs.push('Contact the organization directly using a known, trusted contact method — not the contact information provided in this message.')
    recs.push('If you are unsure, forward the message to your security team for professional analysis.')
  } else if (riskLevel === 'caution') {
    recs.push('Exercise caution. Verify the sender and destination through an independent channel before taking any action.')
    recs.push('Check for subtle signs of manipulation even if the message appears legitimate at first glance.')
  } else {
    recs.push('No significant threats detected, but remain vigilant. New phishing techniques emerge constantly.')
    recs.push('Always verify unexpected messages, even from known contacts, through a secondary communication channel.')
  }

  const hasBrand = findings.some(f => f.category === 'brand')
  if (hasBrand) {
    recs.push('To verify the legitimate organization, navigate directly to their official website by typing the known URL into your browser — do not use links from this message.')
  }

  const hasSensitive = findings.some(f => f.id === 'sensitive-request')
  if (hasSensitive) {
    recs.push('Never provide passwords, PINs, credit card numbers, Social Security numbers, cryptocurrency seed phrases, or one-time verification codes in response to any message.')
  }

  const hasShortener = findings.some(f => f.id === 'url-shortener' || f.id.includes('shortener'))
  if (hasShortener) {
    recs.push('Expand shortened URLs using a link-expansion service before clicking to reveal the true destination.')
  }

  const hasThreatIntel = findings.some(f => f.category === 'reputation' && f.severity !== 'info')
  if (hasThreatIntel) {
    recs.push('This domain has been flagged by external threat intelligence sources. Block this domain at your network/firewall level if you manage organizational security.')
  }

  return recs
}

function assessTargetLikelihood(findings: Finding[], _inputType: 'url' | 'message'): string {
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const hasUrgency = findings.some(f => f.id === 'urgency-pressure')
  const hasBrand = findings.some(f => f.category === 'brand')
  const hasSensitive = findings.some(f => f.id === 'sensitive-request')

  let score = 0
  if (criticalCount > 0) score += 30
  if (highCount > 0) score += 20
  if (hasUrgency) score += 15
  if (hasBrand) score += 20
  if (hasSensitive) score += 15
  score = Math.min(score, 100)

  if (score >= 75) return `Very High (${score}%) — This attack is highly likely to succeed against untrained users. The combination of techniques creates a convincing facade that requires security awareness to detect.`
  if (score >= 50) return `High (${score}%) — This attack has a strong chance of deceiving average users. Multiple indicators work together to create a plausible scenario.`
  if (score >= 25) return `Moderate (${score}%) — This attack may succeed against inattentive users but contains enough red flags that a moderately aware person would likely notice.`
  return `Low (${score}%) — This content has limited deceptive potential. Most users would likely recognize the indicators if they pause to examine it.`
}

function generateRiskNarrative(result: AnalysisResult): string {
  const { riskScore, riskLevel, findings, inputType, threatIntel, confidence } = result
  const confidencePct = Math.round(confidence * 100)
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const mediumCount = findings.filter(f => f.severity === 'medium').length

  let narrative = `PhishGuard's analysis engine evaluated this ${inputType === 'url' ? 'URL' : 'message'} against ${findings.length} detection heuristics, `

  if (threatIntel?.flagged) {
    narrative += `cross-referenced with live threat intelligence from ${threatIntel.sources.join(' and ')}, `
  }

  narrative += `and assigned a risk score of ${riskScore}/100 (${riskLevel.toUpperCase()}). `

  if (criticalCount > 0) {
    narrative += `${criticalCount} critical-severity indicator${criticalCount > 1 ? 's were' : ' was'} detected, `
  }
  if (highCount > 0) {
    narrative += `${highCount} high-severity signal${highCount > 1 ? 's' : ''}${criticalCount > 0 ? ', and ' : ''}`
  }
  if (criticalCount > 0 || highCount > 0) {
    narrative += `${mediumCount > 0 ? `along with ${mediumCount} medium-severity finding${mediumCount > 1 ? 's' : ''}, ` : ''}contributing to the overall risk assessment. `
  } else if (mediumCount > 0) {
    narrative += `${mediumCount} medium-severity finding${mediumCount > 1 ? 's were' : ' was'} detected. `
  }

  if (riskLevel === 'dangerous') {
    narrative += 'The convergence of multiple high-confidence indicators strongly suggests this is a coordinated phishing attempt. The attack surface is broad, employing several techniques simultaneously to maximize the probability of victim engagement.'
  } else if (riskLevel === 'suspicious') {
    narrative += 'The detected indicators are consistent with known phishing patterns, though the evidence is not conclusive enough to classify as a confirmed attack. The risk profile warrants caution and independent verification.'
  } else if (riskLevel === 'caution') {
    narrative += 'While no definitive attack signature was identified, several minor indicators suggest this content warrants careful review. The risk is low but non-negligible.'
  } else {
    narrative += 'No significant phishing indicators were detected. The content exhibits characteristics consistent with legitimate communications. However, automated analysis cannot guarantee safety — zero-day phishing techniques may evade heuristic detection.'
  }

  narrative += ` Model confidence: ${confidencePct}%.`

  return narrative
}

export function generateAIInsight(result: AnalysisResult): AIInsight {
  const classification = classifyAttack(result.findings, result.inputType)
  const attackVector = assessAttackVector(result.findings, result.inputType)
  const recommendations = generateRecommendations(result.findings, result.riskLevel, result.inputType)
  const targetLikelihood = assessTargetLikelihood(result.findings, result.inputType)
  const riskNarrative = generateRiskNarrative(result)

  const headline = result.riskLevel === 'dangerous'
    ? `Confirmed Phishing Threat: ${classification}`
    : result.riskLevel === 'suspicious'
      ? `Likely Phishing Attempt: ${classification}`
      : result.riskLevel === 'caution'
        ? `Suspicious Content Detected: ${classification}`
        : `No Threat Detected: ${classification}`

  const threatAssessment = `This ${result.inputType === 'url' ? 'URL' : 'message'} has been classified as a "${classification}" with a risk score of ${result.riskScore}/100. ${targetLikelihood}`

  return {
    headline,
    threatAssessment,
    attackVector,
    recommendations,
    riskNarrative,
    classification,
    targetLikelihood,
  }
}

// === Training Scenario Generator ===

export interface TrainingScenario {
  id: string
  type: 'phishing' | 'safe'
  tactic: string
  message: string
  explanation: string
}

const PHISHING_TEMPLATES = [
  {
    tactic: 'Authority + Urgency',
    template: (brand: string) => `Dear ${brand} Customer,

Your account security is our top priority. We have detected unusual sign-in activity on your account from an unrecognized device in Moscow, Russia.

If this was you, please disregard this email. If this was NOT you, your account will be permanently suspended within 24 hours unless you verify your identity immediately.

Verify now: http://${brand.toLowerCase().replace(/\s/g, '')}-security-verify.tk/account/confirm?uid=8842

${brand} Security Team`,
    explanation: 'Uses authority (impersonating a known brand) and urgency (24-hour deadline, account suspension threat) to pressure the victim into clicking a link to a suspicious .tk domain.',
  },
  {
    tactic: 'Fear + Financial Loss',
    template: (brand: string) => `URGENT: Unauthorized Transaction Alert

A transaction of $847.50 was attempted from your ${brand} account to an unknown recipient.

If you did not authorize this payment, you must confirm your identity within 48 hours or the transaction will be processed and cannot be reversed.

Click here to dispute this charge: http://secure-${brand.toLowerCase().replace(/\s/g, '')}.xyz/verify?transaction=TXN9921

Do not reply to this email. This mailbox is not monitored.

${brand} Fraud Prevention`,
    explanation: 'Exploits fear of financial loss with a specific dollar amount and deadline. Uses a .xyz domain with "secure" prefix to appear legitimate.',
  },
  {
    tactic: 'Curiosity + Credential Harvest',
    template: () => `You have 1 new voicemail message

From: Unknown Number
Duration: 0:42
Received: Today at 2:34 PM

Listen to your voicemail: http://voicemail-preview.click/play?id=7729

This message will expire in 24 hours.`,
    explanation: 'Uses curiosity (a voicemail notification) and urgency (24-hour expiry) with a .click domain to lure the victim into clicking. Minimal branding makes it harder to identify as phishing.',
  },
  {
    tactic: 'Cryptocurrency + Greed',
    template: () => `Your wallet has been selected for a complimentary security upgrade.

Due to recent network activity, your wallet requires immediate synchronization to prevent loss of funds.

To secure your assets, enter your 12-word recovery phrase at our verification portal:

https://wallet-sync-secure.xyz/verify

Failure to sync within 12 hours may result in permanent loss of access to your funds.

This is an automated message. Do not reply.`,
    explanation: 'Targets cryptocurrency users with a fake wallet sync. The goal is to harvest the recovery phrase, which gives full access to the victim\'s wallet. Uses greed (fear of losing funds) and urgency (12-hour deadline).',
  },
  {
    tactic: 'Social Engineering (No Links)',
    template: () => `Hello,

I am Dr. James Mwangi, senior auditor at the International Bank of Lagos. During our recent audit, I discovered an inactive account belonging to a deceased client with a balance of $14.2 million USD.

The account has no next of kin on record. I am writing to request your assistance in transferring these funds to a safe account. For your cooperation, you will receive 30% of the total amount.

This transaction is 100% legal and risk-free. I only need your full name, bank account details, and a copy of your identification to proceed.

Kindly respond to this email at your earliest convenience.

Best regards,
Dr. James Mwangi`,
    explanation: 'Classic advance-fee fraud (Nigerian Prince scam). Uses no links — instead it relies on social engineering to extract personal and banking information directly. The large sum and promise of easy money exploit greed.',
  },
]

const SAFE_TEMPLATES = [
  {
    tactic: 'Legitimate Notification',
    template: () => `Your package has been shipped!

Order #ORD-2024-8842
Carrier: UPS
Tracking: 1Z999AA10123456789
Estimated delivery: September 25, 2026

Track your package at: https://www.ups.com/track?tracknum=1Z999AA10123456789

Thank you for your purchase!`,
    explanation: 'This is a legitimate shipping notification. It uses HTTPS, a real domain (ups.com), specific order details, and does not request sensitive information.',
  },
  {
    tactic: 'Legitimate Security Alert',
    template: () => `Security alert: New sign-in to your account

Hi,

A new sign-in was detected on your Google Account.

Device: Chrome on Windows
Location: San Francisco, CA, USA
Time: September 22, 2026 at 10:42 AM PDT

If this was you, no action is needed.

If this wasn't you, someone might have your password. Secure your account now:
https://myaccount.google.com/security

Thanks,
The Google Accounts team`,
    explanation: 'This is a legitimate security alert. It uses HTTPS, the real google.com domain, provides specific device/location details, and directs the user to a known legitimate URL.',
  },
]

export function generateTrainingScenarios(): TrainingScenario[] {
  const scenarios: TrainingScenario[] = []

  PHISHING_TEMPLATES.forEach((template, i) => {
    const brand = ['Microsoft', 'PayPal', 'Bank of America', 'MetaMask', ''][i] || 'Account'
    scenarios.push({
      id: `phish-${i}`,
      type: 'phishing',
      tactic: template.tactic,
      message: template.template(brand),
      explanation: template.explanation,
    })
  })

  SAFE_TEMPLATES.forEach((template, i) => {
    scenarios.push({
      id: `safe-${i}`,
      type: 'safe',
      tactic: template.tactic,
      message: template.template(),
      explanation: template.explanation,
    })
  })

  // Shuffle for training
  return scenarios.sort(() => Math.random() - 0.5)
}
