import React, { useState, useEffect } from 'react'
import {
  Radio,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Play,
  Trash2,
  PlusCircle,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ArrowDownToLine,
  Flame,
  Lightbulb,
  ArrowRight,
  Megaphone,
  Type,
  Square,
  Sparkles,
} from 'lucide-react'
import type { IncomingSMS, SecuritySettings } from '../lib/sms-database'
import {
  getIncomingSMSList,
  processIncomingSMS,
  deleteIncomingSMS,
  clearAllSMS,
  getSecuritySettings,
  saveSecuritySettings,
} from '../lib/sms-database'
import {
  requestNotificationPermission,
  getNotificationPermission,
  soundEngine,
  triggerVibration,
} from '../lib/notification'
import { getTipOfTheDay } from '../lib/tips-database'

interface SMSLiveMonitorProps {
  onTriggerAlert: (sms: IncomingSMS) => void
  onInspectSMS: (sms: IncomingSMS) => void
  onViewTips?: (category?: string) => void
  autoStartTrial?: boolean
  onTrialFinished?: () => void
}

const PRESET_SCENARIOS = [
  {
    id: 'bank-kyc',
    label: 'Urgent Bank KYC Scam',
    icon: Flame,
    sender: '+1 (800) 492-3841',
    senderName: 'Fake Chase Fraud Desk',
    color: 'text-error-400 bg-error-500/10 border-error-500/20',
    body: 'CHASE-ALERT: Your debit card ending in 4108 has been temporarily restricted due to suspicious activity. Verify identity within 2 hours or access will be revoked: http://chase-security-auth.xyz/verify?acc=9912',
  },
  {
    id: 'crypto-drain',
    label: 'MetaMask / Wallet Drainer',
    icon: Zap,
    sender: 'WALLET-SYNC',
    senderName: 'Spoofed Crypto Service',
    color: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
    body: 'URGENT: MetaMask security protocol update required. Please submit your 12-word seed phrase at https://metamask-sync-tokens.xyz to avoid wallet suspension and fund freeze.',
  },
  {
    id: 'fedex-delivery',
    label: 'FedEx Unpaid Customs Fee',
    icon: ArrowDownToLine,
    sender: '+44 7911 123456',
    senderName: 'Fake Delivery Notification',
    color: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
    body: 'FedEx: Your parcel #FX-8941 cannot be delivered due to an outstanding customs fee of $2.49. Update shipping address and pay here: http://fedx-customs-fee.tk/track',
  },
  {
    id: 'job-scam',
    label: 'Part-Time Job WhatsApp Scam',
    icon: AlertTriangle,
    sender: '+91 98765 43210',
    senderName: 'Recruitment Bot',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    body: 'Congratulations! You have been selected for a remote part-time assistant position. Earn $250-$800 daily by reviewing apps. No experience needed. Contact HR manager immediately on WhatsApp: +1-202-555-0143.',
  },
  {
    id: 'safe-otp',
    label: 'Authentic Bank 2FA OTP (Safe)',
    icon: CheckCircle2,
    sender: 'VK-HDFCBK',
    senderName: 'HDFC Official Gateway',
    color: 'text-success-400 bg-success-500/10 border-success-500/20',
    body: '849201 is your OTP for purchase of USD 42.50 at Amazon. Valid for 10 mins. Never share OTP with anyone, including bank officials.',
  },
]

export const SMSLiveMonitor: React.FC<SMSLiveMonitorProps> = ({
  onTriggerAlert,
  onInspectSMS,
  onViewTips,
  autoStartTrial = false,
  onTrialFinished,
}) => {
  const [messages, setMessages] = useState<IncomingSMS[]>(() => getIncomingSMSList())
  const [settings, setSettings] = useState<SecuritySettings>(() => getSecuritySettings())
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() => getNotificationPermission())
  const [filter, setFilter] = useState<'all' | 'spam' | 'safe'>('all')
  const [streamTextSize, setStreamTextSize] = useState<'normal' | 'large' | 'huge'>('large')
  const [audioTestingState, setAudioTestingState] = useState<'idle' | 'siren' | 'voice'>('idle')
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [trialRunning, setTrialRunning] = useState(false)
  const [trialStepMessage, setTrialStepMessage] = useState<string>('')
  const tipOfDay = getTipOfTheDay()

  // Auto trigger trial if requested via prop
  useEffect(() => {
    if (autoStartTrial && !trialRunning) {
      handleRunSecurityTrial()
      onTrialFinished?.()
    }
  }, [autoStartTrial])

  // Custom Simulator State
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customSender, setCustomSender] = useState('+1 (800) 555-0199')
  const [customBody, setCustomBody] = useState('')

  const handleToggleSetting = (key: keyof SecuritySettings) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    saveSecuritySettings(updated)
  }

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      const updated = { ...settings, notificationsEnabled: true }
      setSettings(updated)
      saveSecuritySettings(updated)
    }
  }

  const handleSimulateMessage = async (sender: string, body: string, senderName?: string) => {
    await soundEngine.unlock()
    const { sms, triggeredAlert } = processIncomingSMS(sender, body, senderName)
    setMessages(getIncomingSMSList())
    if (triggeredAlert) {
      await soundEngine.playSpamAlert()
      triggerVibration([250, 100, 250, 100, 300])
      onTriggerAlert(sms)
    }
  }

  // Full Security & Audio Trial Runner
  const handleRunSecurityTrial = async () => {
    if (trialRunning) return
    setTrialRunning(true)

    try {
      // Step 1: Initialize Audio Hardware & Play Siren
      setTrialStepMessage('Step 1/3: Audio unmuted - sounding emergency dual-frequency siren...')
      await soundEngine.unlock()
      await soundEngine.playSpamAlert()
      triggerVibration([250, 100, 250, 100, 300])

      await new Promise((r) => setTimeout(r, 1100))

      // Step 2: Voice Alert Announcement
      setTrialStepMessage('Step 2/3: Speech Synthesis - announcing incoming high-risk attack...')
      soundEngine.speakAlert('Live Security Trial Initiated. Simulating urgent banking phishing attack.')

      await new Promise((r) => setTimeout(r, 1800))

      // Step 3: Intercept and Launch Heads-Up Truecaller Alert Modal
      setTrialStepMessage('Step 3/3: Intercepted spoofed Chase KYC SMS - displaying Heads-Up Alert Popup!')
      const trialSender = '+1 (800) 492-3841'
      const trialBody = 'CHASE-ALERT: Your debit card ending in 4108 has been temporarily restricted due to suspicious activity. Verify identity within 2 hours or access will be revoked: http://chase-security-auth.xyz/verify?acc=9912'
      const trialSenderName = 'Fake Chase Fraud Desk'

      const { sms } = processIncomingSMS(trialSender, trialBody, trialSenderName)
      setMessages(getIncomingSMSList())
      onTriggerAlert(sms)
    } finally {
      setTimeout(() => {
        setTrialRunning(false)
        setTrialStepMessage('')
      }, 1000)
    }
  }

  // Audio Testing Handlers
  const handleTestSiren = async () => {
    setAudioTestingState('siren')
    await soundEngine.unlock()
    await soundEngine.playSpamAlert()
    triggerVibration([250, 100, 250])
    setTimeout(() => {
      setAudioTestingState('idle')
    }, 1000)
  }

  const handleTestVoice = async () => {
    setAudioTestingState('voice')
    await soundEngine.unlock()
    soundEngine.speakAlert('Truecaller Shield Alert: High risk phishing SMS detected from Chase Fraud Desk.')
    setTimeout(() => {
      setAudioTestingState('idle')
    }, 3200)
  }

  const handleSpeakSingleSMS = (sms: IncomingSMS) => {
    if (speakingMessageId === sms.id) {
      soundEngine.stopSpeech()
      setSpeakingMessageId(null)
    } else {
      setSpeakingMessageId(sms.id)
      soundEngine.unlock()
      const speech = `SMS from ${sms.senderName || sms.sender}. Content: ${sms.body}`
      soundEngine.speakAlert(speech)
      const words = speech.split(/\s+/).length
      setTimeout(() => {
        setSpeakingMessageId((current) => (current === sms.id ? null : current))
      }, Math.max(2500, (words / 2.5) * 1000))
    }
  }

  const handleDelete = (id: string) => {
    deleteIncomingSMS(id)
    setMessages(getIncomingSMSList())
  }

  const handleClearAll = () => {
    clearAllSMS()
    setMessages([])
  }

  // Render message body with high-visibility link highlight
  const renderHighlightedMessage = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:xyz|tk|com|net|org|top|biz|info|site|online)[^\s]*)/gi
    const parts = text.split(urlRegex)

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <span
            key={i}
            className="inline-block bg-error-500/25 text-error-200 border border-error-500/50 px-2 py-0.5 rounded font-mono font-bold mx-0.5 underline decoration-error-400 break-all"
          >
            ⚠️ {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === 'spam') return m.riskScore >= 40
    if (filter === 'safe') return m.riskScore < 40
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Protection Status Hero Card */}
      <div className="relative overflow-hidden glass rounded-3xl border border-primary-500/30 p-5 sm:p-6 shadow-xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-primary-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center border transition-all ${
                settings.protectionActive
                  ? 'bg-primary-500/20 border-primary-500/40 text-primary-400 glow-blue shadow-lg shadow-primary-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <Radio className={`w-7 h-7 ${settings.protectionActive ? 'animate-pulse text-primary-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {settings.protectionActive ? 'Truecaller Live Shield Active' : 'Spam Shield Inactive'}
                </h3>
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    settings.protectionActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {settings.protectionActive ? 'Monitoring SMS' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Incoming messages are scanned automatically for smishing, KYC fraud, and malicious links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => handleToggleSetting('protectionActive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                settings.protectionActive
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {settings.protectionActive ? 'Shield Enabled' : 'Enable Shield'}
            </button>
          </div>
        </div>

        {/* Action Toggle Pills */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleRequestNotif}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              notifPerm === 'granted' && settings.notificationsEnabled
                ? 'bg-primary-500/20 border-primary-500/40 text-primary-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {notifPerm === 'granted' && settings.notificationsEnabled ? (
              <Bell className="w-3.5 h-3.5 text-primary-400" />
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
            <span>
              {notifPerm === 'granted'
                ? settings.notificationsEnabled
                  ? 'Push Alerts: ON'
                  : 'Push Alerts: Muted'
                : 'Enable Push Notifications'}
            </span>
          </button>

          <button
            onClick={() => handleToggleSetting('soundAlerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              settings.soundAlerts
                ? 'bg-primary-500/20 border-primary-500/40 text-primary-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {settings.soundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{settings.soundAlerts ? 'Audio Siren: ON' : 'Audio Siren: Muted'}</span>
          </button>

          <button
            onClick={() => handleToggleSetting('vibrationAlerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              settings.vibrationAlerts
                ? 'bg-primary-500/20 border-primary-500/40 text-primary-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Vibrate className="w-3.5 h-3.5" />
            <span>{settings.vibrationAlerts ? 'Vibration: ON' : 'Vibration: OFF'}</span>
          </button>
        </div>

        {/* Dedicated Audio & Sound Access Diagnostic Bar */}
        <div className="mt-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Audio & Voice Engine Ready
              </p>
              <p className="text-[11px] text-slate-400">
                Tap below to test speaker sound, volume, and voice alert announcements:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestSiren}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                audioTestingState === 'siren'
                  ? 'bg-error-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-error-400 border border-slate-700'
              }`}
              title="Test Siren Audio Alert"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{audioTestingState === 'siren' ? 'Playing Siren...' : '🔊 Test Siren'}</span>
            </button>

            <button
              onClick={handleTestVoice}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                audioTestingState === 'voice'
                  ? 'bg-primary-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-primary-300 border border-slate-700'
              }`}
              title="Test Speech Synthesis Voice Alert"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{audioTestingState === 'voice' ? 'Speaking...' : '🗣️ Test Voice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Tip of the Day Card */}
      {tipOfDay && (
        <div className="glass rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/40 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Tip of the Day
                </span>
                <span className="text-xs text-slate-500">{tipOfDay.categoryLabel}</span>
              </div>
              <h4 className="text-sm font-bold text-white truncate">{tipOfDay.title}</h4>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                {tipOfDay.quickTakeaway}
              </p>
            </div>
          </div>
          {onViewTips && (
            <button
              onClick={() => onViewTips(tipOfDay.category)}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Explore All Tips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Live Security & Audio Interactive Trial Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Full Interactive Security Trial</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Experience the 5-Second Live Attack & Alarm Trial
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Test all critical defenses in one go: speaker unmuting, loud dual-tone emergency siren, text-to-speech voice alert announcement, and the high-visibility Truecaller Alert Heads-Up popup with resizable text and link threat highlights.
            </p>

            {/* Trial step progress if running */}
            {trialRunning && (
              <div className="mt-3 p-3 bg-slate-950/90 rounded-2xl border border-rose-500/40 text-xs text-rose-300 font-bold flex items-center gap-2.5 animate-pulse">
                <div className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin shrink-0" />
                <span>{trialStepMessage}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={handleRunSecurityTrial}
              disabled={trialRunning}
              className="px-6 py-4 bg-gradient-to-r from-rose-600 via-error-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>{trialRunning ? 'Executing Live Trial...' : '🚀 Start 5-Sec Live Trial'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Quick Triggers: Test Instant Incoming SMS Alert */}
      <div className="glass rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary-400" />
            <h4 className="text-sm sm:text-base font-bold text-white">Simulate Incoming SMS Attack</h4>
          </div>
          <button
            onClick={() => setShowCustomModal(true)}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1.5 font-bold px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-xl"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Custom SMS
          </button>
        </div>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Tap any scenario below to trigger a live incoming message. This immediately launches the <strong className="text-white">Truecaller Heads-Up Alert Popup Modal</strong> and plays the audio siren:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            return (
              <button
                key={scenario.id}
                onClick={() => handleSimulateMessage(scenario.sender, scenario.body, scenario.senderName)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] shadow-lg ${scenario.color}`}
              >
                <div className="p-2 rounded-xl bg-black/30 shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold leading-tight truncate">{scenario.label}</div>
                  <div className="text-[11px] opacity-90 font-mono truncate mt-0.5">{scenario.sender}</div>
                  <div className="text-[10px] text-slate-300 line-clamp-1 mt-1 font-sans opacity-80">
                    {scenario.body}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Incoming Messages Stream & Reader View */}
      <div className="glass rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white">Intercepted Message Stream</h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-mono font-bold">
              {messages.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Text Size Accessibility Controls */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold px-1 flex items-center gap-1">
                <Type className="w-3 h-3" />
                Size:
              </span>
              <button
                onClick={() => setStreamTextSize('normal')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  streamTextSize === 'normal' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Normal Text Size"
              >
                A
              </button>
              <button
                onClick={() => setStreamTextSize('large')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  streamTextSize === 'large' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Large Readable Text"
              >
                A+
              </button>
              <button
                onClick={() => setStreamTextSize('huge')}
                className={`px-2 py-0.5 rounded text-xs font-black ${
                  streamTextSize === 'huge' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Extra Large Text"
              >
                A++
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  filter === 'all' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('spam')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  filter === 'spam' ? 'bg-error-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Spam
              </button>
              <button
                onClick={() => setFilter('safe')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  filter === 'safe' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Safe
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2 text-slate-400 hover:text-error-400 rounded-xl hover:bg-slate-800 transition-colors"
                title="Clear all messages"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-300">No messages in stream yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tap any test attack scenario above to trigger an incoming SMS and see the Truecaller alert popup and sound siren in action!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => {
              const isSpam = msg.riskScore >= 40
              const isBlocked = msg.actionTaken === 'blocked'
              const isSpeakingThis = speakingMessageId === msg.id

              return (
                <div
                  key={msg.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-lg ${
                    isBlocked
                      ? 'bg-error-950/20 border-error-500/40'
                      : isSpam
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isBlocked
                            ? 'bg-error-500/20 text-error-400 border border-error-500/30'
                            : isSpam
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isBlocked ? (
                          <Ban className="w-5 h-5" />
                        ) : isSpam ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-white font-mono truncate">
                            {msg.sender}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              isBlocked
                                ? 'bg-error-500/20 text-error-300 border border-error-500/30'
                                : isSpam
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isBlocked ? 'SPAM BLOCKED' : isSpam ? 'WARNED' : 'SAFE'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate">
                          {msg.senderName} · {msg.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-black font-mono px-2 py-0.5 rounded-lg border ${
                          msg.riskScore >= 70
                            ? 'bg-error-500/20 text-error-300 border-error-500/30'
                            : msg.riskScore >= 40
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {msg.riskScore}% RISK
                      </span>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-1.5 text-slate-400 hover:text-error-400 rounded-lg transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Readable Message Body */}
                  <div
                    className={`bg-slate-950 text-slate-100 p-3.5 sm:p-4 rounded-xl border border-slate-800 font-sans leading-relaxed select-text shadow-inner ${
                      streamTextSize === 'huge'
                        ? 'text-base sm:text-lg font-medium'
                        : streamTextSize === 'large'
                        ? 'text-sm sm:text-base font-medium'
                        : 'text-xs sm:text-sm'
                    }`}
                  >
                    {renderHighlightedMessage(msg.body)}
                  </div>

                  {/* Message Bottom Action Toolbar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Received:{' '}
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Audio Read Aloud Button */}
                      <button
                        onClick={() => handleSpeakSingleSMS(msg)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSpeakingThis
                            ? 'bg-primary-500 text-white border-primary-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Read this message aloud using Text-To-Speech"
                      >
                        {isSpeakingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Megaphone className="w-3.5 h-3.5" />}
                        <span>{isSpeakingThis ? 'Stop Voice' : 'Listen'}</span>
                      </button>

                      {/* Launch Alert Modal */}
                      <button
                        onClick={() => onTriggerAlert(msg)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error-500/15 hover:bg-error-500/25 text-error-300 font-bold border border-error-500/30 transition-all"
                        title="Open full Truecaller Alert modal"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Alert Popup</span>
                      </button>

                      {/* Deep Inspect */}
                      <button
                        onClick={() => onInspectSMS(msg)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all shadow-md"
                      >
                        <span>Deep Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Custom Simulation Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-primary-400" />
                Custom Incoming SMS Injector
              </h4>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Incoming Sender (Phone number or shortcode):
                </label>
                <input
                  type="text"
                  value={customSender}
                  onChange={(e) => setCustomSender(e.target.value)}
                  placeholder="+1 (800) 555-0199 or BANK-ALERT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  SMS Message Body:
                </label>
                <textarea
                  rows={4}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Paste or type any suspicious message or phishing link to test live detection..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 resize-none font-sans text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customBody.trim()) {
                    handleSimulateMessage(customSender.trim() || 'UNKNOWN-SENDER', customBody.trim())
                    setShowCustomModal(false)
                    setCustomBody('')
                  }
                }}
                disabled={!customBody.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white transition-all shadow-md active:scale-95"
              >
                Transmit SMS Attack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
