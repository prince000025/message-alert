import { analyzeInput, type AnalysisResult } from './analyzer'
import { sendSystemAlert, soundEngine, triggerVibration } from './notification'

export interface IncomingSMS {
  id: string
  sender: string
  senderName: string
  body: string
  timestamp: string
  riskScore: number
  riskLevel: 'safe' | 'caution' | 'suspicious' | 'dangerous'
  category: string
  communityReports: number
  analysis: AnalysisResult
  actionTaken: 'blocked' | 'warned' | 'allowed'
  isRead: boolean
}

export interface SenderProfile {
  id: string
  identifier: string // Phone number or shortcode
  name: string
  category: string
  spamScore: number // 0-100
  reportsCount: number
  isVerified: boolean
  isBlockedByUser: boolean
  country: string
  carrier?: string
  sampleReports: string[]
  updatedAt: string
}

export interface SecuritySettings {
  protectionActive: boolean
  notificationsEnabled: boolean
  soundAlerts: boolean
  vibrationAlerts: boolean
  sensitivity: 'aggressive' | 'balanced' | 'lenient'
  autoBlockHighRisk: boolean
  autoScanClipboard: boolean
  blockedKeywords: string[]
  blockedSenders: string[]
}

const SMS_STORAGE_KEY = 'truecaller_sms_messages_v1'
const PROFILES_STORAGE_KEY = 'truecaller_sender_profiles_v1'
const SETTINGS_STORAGE_KEY = 'truecaller_security_settings_v1'

const DEFAULT_SETTINGS: SecuritySettings = {
  protectionActive: true,
  notificationsEnabled: true,
  soundAlerts: true,
  vibrationAlerts: true,
  sensitivity: 'balanced',
  autoBlockHighRisk: true,
  autoScanClipboard: true,
  blockedKeywords: ['urgent kyc', 'account suspended', 'claim prize', 'seed phrase', 'send money', 'part-time job 500$'],
  blockedSenders: ['+1 (800) 555-0199', 'VK-FAKECITY', 'ALERT-PAY'],
}

// Pre-seeded Truecaller-style community directory
const INITIAL_COMMUNITY_PROFILES: SenderProfile[] = [
  {
    id: 'prof-1',
    identifier: '+1 (800) 555-0199',
    name: 'IRS / Tax Refund Impersonator',
    category: 'Government Impersonation',
    spamScore: 98,
    reportsCount: 5412,
    isVerified: false,
    isBlockedByUser: true,
    country: 'United States',
    carrier: 'VoIP Provider (Twilio/Bandwidth)',
    sampleReports: [
      'Pretended to be IRS demanding tax payment via gift cards.',
      'Threatened arrest within 2 hours if fee not paid.',
      'Automated robotic call with fake badge number.',
    ],
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'prof-2',
    identifier: 'VK-HDFCBK',
    name: 'HDFC Bank Customer Support',
    category: 'Banking / Finance',
    spamScore: 4,
    reportsCount: 2,
    isVerified: true,
    isBlockedByUser: false,
    country: 'India',
    carrier: 'Telecom Commercial Route',
    sampleReports: ['Official transaction notifications and 2FA OTP codes.'],
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'prof-3',
    identifier: '+44 7700 900077',
    name: 'Hermes / Evri Fake Delivery Fee',
    category: 'Package Delivery Fraud',
    spamScore: 95,
    reportsCount: 3890,
    isVerified: false,
    isBlockedByUser: false,
    country: 'United Kingdom',
    carrier: 'Mobile Virtual Network Operator',
    sampleReports: [
      'Sent link claiming £1.45 redelivery fee for a parcel I never ordered.',
      'Link leads to phishing site asking for credit card CVV and billing address.',
    ],
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'prof-4',
    identifier: 'AMZ-DEALZ',
    name: 'Suspicious Amazon Gift Card Bot',
    category: 'Reward / Lottery Scam',
    spamScore: 91,
    reportsCount: 2150,
    isVerified: false,
    isBlockedByUser: false,
    country: 'Global',
    carrier: 'Bulk SMS Gateway',
    sampleReports: [
      'Claimed I won a $1,000 Amazon shopping spree.',
      'Link asks for SSN and phone verification.',
    ],
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'prof-5',
    identifier: '+1 (888) 234-5678',
    name: 'Chase Bank Alerts',
    category: 'Banking / Official',
    spamScore: 2,
    reportsCount: 0,
    isVerified: true,
    isBlockedByUser: false,
    country: 'United States',
    carrier: 'JPMorgan Chase Official Shortcode',
    sampleReports: ['Official fraud verification texts and login authorizations.'],
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
]

export function getSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore
  }
}

export function getSenderProfiles(): SenderProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(INITIAL_COMMUNITY_PROFILES))
      return INITIAL_COMMUNITY_PROFILES
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_COMMUNITY_PROFILES
  }
}

export function lookupSender(identifier: string): SenderProfile {
  const profiles = getSenderProfiles()
  const clean = identifier.replace(/[\s\-()]/g, '').toLowerCase()
  const match = profiles.find((p) => p.identifier.replace(/[\s\-()]/g, '').toLowerCase() === clean)

  if (match) return match

  // Auto-generate profile based on heuristics
  const isLikelyShortcode = /^[A-Z]{2}-[A-Z0-9]+$/i.test(identifier) || identifier.length <= 6
  return {
    id: `prof-${Date.now()}`,
    identifier,
    name: isLikelyShortcode ? `Sender ${identifier}` : `Number ${identifier}`,
    category: 'Unverified Number',
    spamScore: 25,
    reportsCount: 1,
    isVerified: false,
    isBlockedByUser: false,
    country: identifier.startsWith('+1') ? 'United States' : identifier.startsWith('+91') ? 'India' : identifier.startsWith('+44') ? 'United Kingdom' : 'International',
    sampleReports: ['No verified community complaints yet. Treat with caution.'],
    updatedAt: new Date().toISOString(),
  }
}

export function reportSender(identifier: string, reportComment: string): void {
  const profiles = getSenderProfiles()
  const clean = identifier.replace(/[\s\-()]/g, '').toLowerCase()
  const existing = profiles.find((p) => p.identifier.replace(/[\s\-()]/g, '').toLowerCase() === clean)

  if (existing) {
    existing.reportsCount += 1
    existing.spamScore = Math.min(100, Math.max(existing.spamScore, 85) + 2)
    if (reportComment.trim()) {
      existing.sampleReports.unshift(reportComment.trim())
      existing.sampleReports = existing.sampleReports.slice(0, 5)
    }
    existing.updatedAt = new Date().toISOString()
  } else {
    profiles.push({
      id: `prof-${Date.now()}`,
      identifier,
      name: `Reported Spammer (${identifier})`,
      category: 'Community Flagged Spam',
      spamScore: 88,
      reportsCount: 1,
      isVerified: false,
      isBlockedByUser: true,
      country: 'Unknown',
      sampleReports: [reportComment || 'Reported as phishing/spam by user.'],
      updatedAt: new Date().toISOString(),
    })
  }

  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
  } catch {
    // Ignore
  }
}

export function toggleBlockSender(identifier: string): boolean {
  const settings = getSecuritySettings()
  const isBlocked = settings.blockedSenders.includes(identifier)
  if (isBlocked) {
    settings.blockedSenders = settings.blockedSenders.filter((s) => s !== identifier)
  } else {
    settings.blockedSenders.push(identifier)
  }
  saveSecuritySettings(settings)

  // Update profile
  const profiles = getSenderProfiles()
  const prof = profiles.find((p) => p.identifier === identifier)
  if (prof) {
    prof.isBlockedByUser = !isBlocked
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
  }

  return !isBlocked
}

export function getIncomingSMSList(): IncomingSMS[] {
  try {
    const raw = localStorage.getItem(SMS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveIncomingSMS(sms: IncomingSMS): void {
  try {
    const list = getIncomingSMSList().filter((m) => m.id !== sms.id)
    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify([sms, ...list].slice(0, 100)))
  } catch {
    // Ignore
  }
}

export function deleteIncomingSMS(id: string): void {
  try {
    const list = getIncomingSMSList().filter((m) => m.id !== id)
    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Ignore
  }
}

export function clearAllSMS(): void {
  try {
    localStorage.removeItem(SMS_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

// Process an incoming SMS through the Truecaller-style AI Filter
export function processIncomingSMS(sender: string, body: string, customName?: string): {
  sms: IncomingSMS
  triggeredAlert: boolean
} {
  const settings = getSecuritySettings()
  const profile = lookupSender(sender)
  const analysis = analyzeInput(body)

  // Check user blocklists and keyword filters
  const isSenderBlocked = settings.blockedSenders.some((s) => s.toLowerCase() === sender.toLowerCase())
  const hasBlockedKeyword = settings.blockedKeywords.some((kw) => body.toLowerCase().includes(kw.toLowerCase()))

  // Combine heuristic score with sender reputation and custom filters
  let compositeScore = analysis.riskScore
  if (profile.spamScore > 75) {
    compositeScore = Math.max(compositeScore, profile.spamScore)
  }
  if (isSenderBlocked || hasBlockedKeyword) {
    compositeScore = Math.max(compositeScore, 92)
  }
  if (profile.isVerified && analysis.riskScore < 25) {
    compositeScore = Math.min(compositeScore, 10)
  }

  // Adjust by sensitivity
  let threshold = 40
  if (settings.sensitivity === 'aggressive') threshold = 25
  if (settings.sensitivity === 'lenient') threshold = 65

  const isSpam = compositeScore >= threshold || isSenderBlocked

  let actionTaken: 'blocked' | 'warned' | 'allowed' = 'allowed'
  if (compositeScore >= 70 || isSenderBlocked) {
    actionTaken = 'blocked'
  } else if (isSpam) {
    actionTaken = 'warned'
  }

  let riskLevel: IncomingSMS['riskLevel'] = 'safe'
  if (compositeScore >= 70) riskLevel = 'dangerous'
  else if (compositeScore >= 40) riskLevel = 'suspicious'
  else if (compositeScore >= 20) riskLevel = 'caution'

  const sms: IncomingSMS = {
    id: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender,
    senderName: customName || profile.name,
    body,
    timestamp: new Date().toISOString(),
    riskScore: compositeScore,
    riskLevel,
    category: profile.category,
    communityReports: profile.reportsCount,
    analysis,
    actionTaken,
    isRead: false,
  }

  saveIncomingSMS(sms)

  let triggeredAlert = false
  if (settings.protectionActive && isSpam) {
    triggeredAlert = true
    if (settings.soundAlerts) {
      soundEngine.playSpamAlert()
      triggerVibration([250, 100, 250, 100, 400])
    }
    if (settings.notificationsEnabled) {
      const alertTitle = `🚨 Truecaller Alert: SPAM from ${sender}`
      const alertBody = `[Score: ${compositeScore}%] ${sms.senderName}. Message: "${body.slice(0, 75)}..."`
      sendSystemAlert(alertTitle, alertBody, false)
    }
  }

  return { sms, triggeredAlert }
}
