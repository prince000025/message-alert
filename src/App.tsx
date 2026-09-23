import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  Shield,
  Link2,
  MessageSquare,
  Scan,
  History,
  AlertTriangle,
  Sparkles,
  Zap,
  Loader2,
  Radar,
  GraduationCap,
  Phone,
  Radio,
  Sliders,
  Lightbulb,
  Download,
  Play,
} from 'lucide-react'
import { soundEngine, triggerVibration } from './lib/notification'
import { analyzeInput } from './lib/analyzer'
import type { AnalysisResult } from './lib/analyzer'
import { generateAIInsight } from './lib/ai-insight'
import { saveScan, getScanHistory, deleteScan, checkThreatIntel } from './lib/database'
import type { ScanRecord } from './lib/database'
import type { IncomingSMS } from './lib/sms-database'
import { getSecuritySettings, processIncomingSMS } from './lib/sms-database'
import RiskGauge from './components/RiskGauge'
import FindingsList from './components/FindingsList'
import HistoryList from './components/HistoryList'
import AIAnalysisPanel from './components/AIAnalysisPanel'
import AIInsightPanel from './components/AIInsightPanel'
import TrainingMode from './components/TrainingMode'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import { TruecallerAlertModal } from './components/TruecallerAlertModal'
import { SMSLiveMonitor } from './components/SMSLiveMonitor'
import { SenderLookup } from './components/SenderLookup'
import { ProtectionSettings } from './components/ProtectionSettings'
import SecurityTipsGuide from './components/SecurityTipsGuide'
import MobileAppDownloader from './components/MobileAppDownloader'
import { IncomingSMSQuickBar } from './components/IncomingSMSQuickBar'

type Tab = 'live' | 'lookup' | 'analyzer' | 'download' | 'settings' | 'training' | 'tips' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('live')
  const [tipsCategory, setTipsCategory] = useState<string>('all')
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState(false)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [checkingIntel, setCheckingIntel] = useState(false)
  const [history, setHistory] = useState<ScanRecord[]>([])
  const [selectedHistory, setSelectedHistory] = useState<ScanRecord | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [livePreview, setLivePreview] = useState<AnalysisResult | null>(null)
  const [activeAlertSMS, setActiveAlertSMS] = useState<IncomingSMS | null>(null)
  const [autoStartTrial, setAutoStartTrial] = useState(false)
  const [clipboardToast, setClipboardToast] = useState<string | null>(null)
  const lastScannedClipboard = useRef<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    const records = await getScanHistory()
    setHistory(records)
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  // 1. Web Share Target listener: when user shares an SMS from phone Messages app into Truecaller Shield PWA
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sharedText = params.get('text') || params.get('body') || params.get('url')
    const sharedSender = params.get('sender') || params.get('title') || '+1 (Mobile Share)'

    if (sharedText && sharedText.trim().length > 3) {
      window.history.replaceState({}, '', window.location.pathname)
      const { sms, triggeredAlert } = processIncomingSMS(sharedSender, sharedText.trim(), 'Shared Mobile SMS')
      if (triggeredAlert) {
        soundEngine.unlock().then(() => {
          soundEngine.playSpamAlert()
          triggerVibration([250, 100, 250, 100, 400])
        })
        setActiveAlertSMS(sms)
      } else {
        setInput(sharedText.trim())
        setTab('analyzer')
        setTimeout(() => handleAnalyzeRef.current?.(), 150)
      }
    }
  }, [])

  // 2. Clipboard auto-scan listener on window focus and app resume
  useEffect(() => {
    const checkClipboard = async () => {
      const settings = getSecuritySettings()
      if (!settings.autoScanClipboard) return

      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText()
          const trimmed = (text || '').trim()
          if (trimmed.length >= 8 && trimmed !== lastScannedClipboard.current) {
            lastScannedClipboard.current = trimmed
            const preview = analyzeInput(trimmed)
            if (preview.riskScore >= 30) {
              setClipboardToast(trimmed)
              // If high threat (risk >= 65), sound siren and trigger heads-up alert
              if (settings.protectionActive && settings.soundAlerts && preview.riskScore >= 65) {
                soundEngine.playSpamAlert()
                triggerVibration([250, 100, 250])
              }
            }
          }
        }
      } catch {
        // Clipboard read permission might not be granted
      }
    }

    const handleFocus = () => checkClipboard()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkClipboard()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Live preview: quick heuristic scan as the user types (no threat intel, no save)
  useEffect(() => {
    if (!autoScan || !input.trim() || selectedHistory) {
      setLivePreview(null)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const preview = analyzeInput(input)
      setLivePreview(preview)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input, autoScan, selectedHistory])

  const handleAnalyzeRef = useRef<(() => void) | null>(null)

  const handlePaste = useCallback(() => {
    if (!autoScan) return
    setTimeout(() => {
      handleAnalyzeRef.current?.()
    }, 100)
  }, [autoScan])

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) return
    setAnalyzing(true)
    setResult(null)
    setLivePreview(null)

    await new Promise((r) => setTimeout(r, 450))

    const analysisResult = analyzeInput(input)
    setResult(analysisResult)
    setAnalyzing(false)

    if (analysisResult.inputType === 'url') {
      setCheckingIntel(true)
      try {
        const url = new URL(
          analysisResult.input.startsWith('http')
            ? analysisResult.input
            : 'https://' + analysisResult.input
        )
        const threatIntel = await checkThreatIntel(analysisResult.input, url.hostname)
        if (threatIntel) {
          const enhancedResult = analyzeInput(input, threatIntel)
          setResult(enhancedResult)
          saveScan(enhancedResult)
        } else {
          saveScan(analysisResult)
        }
      } catch {
        saveScan(analysisResult)
      }
      setCheckingIntel(false)
    } else {
      saveScan(analysisResult)
    }
  }, [input])

  useEffect(() => {
    handleAnalyzeRef.current = handleAnalyze
  }, [handleAnalyze])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAnalyze()
    }
  }

  const handleDeleteScan = useCallback(
    async (id: string) => {
      await deleteScan(id)
      setHistory((prev) => prev.filter((r) => r.id !== id))
      if (selectedHistory?.id === id) setSelectedHistory(null)
    },
    [selectedHistory]
  )

  const handleSelectHistory = (r: ScanRecord) => {
    setSelectedHistory(r)
    setTab('analyzer')
  }

  const handleTrainingAnalyze = useCallback((scenarioInput: string) => {
    setInput(scenarioInput)
    setTab('analyzer')
    setSelectedHistory(null)
    setTimeout(() => {
      handleAnalyzeRef.current?.()
    }, 200)
  }, [])

  const handleViewTips = useCallback((cat?: string) => {
    setTipsCategory(cat || 'all')
    setTab('tips')
  }, [])

  const handleAnalyzeSample = useCallback((sampleText: string) => {
    setInput(sampleText)
    setSelectedHistory(null)
    setTab('analyzer')
    setTimeout(() => {
      handleAnalyzeRef.current?.()
    }, 200)
  }, [])

  const handleInspectIncomingSMS = useCallback((sms: IncomingSMS) => {
    setInput(sms.body)
    setSelectedHistory(null)
    setTab('analyzer')
    setTimeout(() => {
      handleAnalyzeRef.current?.()
    }, 150)
  }, [])

  const handleSimulateForSender = (sender: string, senderName: string) => {
    setTab('live')
    const sampleBody = `ALERT from ${senderName}: Immediate account verification required. Please confirm details at http://auth-portal-${sender.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8)}.xyz/login`
    const { sms, triggeredAlert } = processIncomingSMS(sender, sampleBody, senderName)
    if (triggeredAlert) {
      setActiveAlertSMS(sms)
    }
  }

  const sampleTests = [
    { label: 'Fake PayPal login', input: 'http://paypal-secure-login.tk/account/verify?id=4821&token=abc123' },
    { label: 'Typosquat Amazon', input: 'https://www.amaz0n.com/account/signin' },
    { label: 'Urgent bank SMS', input: 'CHASE-ALERT: Your account has been suspended. Verify identity within 2 hours: http://banc0famer1ca.com/login' },
    { label: 'Safe Google link', input: 'https://www.google.com/search?q=phishing+awareness' },
    { label: 'Crypto wallet drain', input: 'Your wallet has been flagged for suspicious activity. Enter your seed phrase at wallet-recover.xyz to secure your funds immediately.' },
  ]

  const displayResult = selectedHistory || result
  const aiInsight = useMemo(() => {
    if (!displayResult) return null
    return generateAIInsight(displayResult)
  }, [displayResult])

  const handleLaunchTrial = async () => {
    setTab('live')
    await soundEngine.unlock()
    setAutoStartTrial(true)
  }

  return (
    <div className="min-h-screen grid-pattern pb-20 sm:pb-8">
      {/* Floating Truecaller-Style Heads-Up Alert Popup */}
      {activeAlertSMS && (
        <TruecallerAlertModal
          sms={activeAlertSMS}
          onClose={() => setActiveAlertSMS(null)}
          onInspect={handleInspectIncomingSMS}
        />
      )}

      {/* Floating Clipboard Auto-Scan Notification */}
      {clipboardToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-slate-900/95 backdrop-blur-md border-2 border-warning-500/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-warning-500/20 text-warning-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-white leading-tight">Copied SMS Flagged</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning-500/20 text-warning-300 border border-warning-500/30">
                  Suspicious
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5 font-mono">
                "{clipboardToast}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                const text = clipboardToast
                setClipboardToast(null)
                await soundEngine.unlock()
                const { sms, triggeredAlert } = processIncomingSMS(
                  'Copied Message',
                  text,
                  'Clipboard Intercept'
                )
                if (triggeredAlert) {
                  await soundEngine.playSpamAlert()
                  triggerVibration([250, 100, 250, 100, 400])
                  setActiveAlertSMS(sms)
                } else {
                  setInput(text)
                  setTab('analyzer')
                  setTimeout(() => handleAnalyzeRef.current?.(), 100)
                }
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-error-600 to-rose-600 hover:from-error-500 hover:to-rose-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              🚨 Alert
            </button>
            <button
              onClick={() => {
                const text = clipboardToast
                setInput(text)
                setTab('analyzer')
                setClipboardToast(null)
                setTimeout(() => handleAnalyzeRef.current?.(), 100)
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
            >
              Inspect
            </button>
            <button
              onClick={() => setClipboardToast(null)}
              className="p-1 text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-700 flex items-center justify-center border border-primary-400/40 shadow-md shadow-primary-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight leading-tight">Truecaller Shield</h1>
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  Mobile Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-tight">Spam SMS & Phishing Alert</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setTab('live')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'live'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-primary-400" />
              <span>Live Alerts</span>
            </button>
            <button
              onClick={() => setTab('lookup')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'lookup'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
            <button
              onClick={() => {
                setTab('analyzer')
                setSelectedHistory(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'analyzer'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scanner</span>
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'settings'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Rules</span>
            </button>
            <button
              onClick={() => setTab('training')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'training'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Training</span>
            </button>
            <button
              onClick={() => {
                setTab('tips')
                setTipsCategory('all')
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'tips'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>All Tips</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 rounded-full px-1.5 py-0.2 border border-amber-500/30">
                20+
              </span>
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === 'history'
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {history.length > 0 && (
                <span className="text-[10px] bg-slate-700 text-slate-300 rounded-full px-1.5 py-0.2">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('download')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'download'
                  ? 'bg-emerald-500/25 text-emerald-300 shadow-sm border border-emerald-500/40'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>App Downloader</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunchTrial}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 via-error-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-950/40 transition-all active:scale-95 animate-pulse shrink-0 cursor-pointer"
              title="Start 5-Second Security & Audio Trial"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Start Live Trial</span>
              <span className="sm:hidden">Trial</span>
            </button>

            <button
              onClick={() => setTab('download')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0 ${
                tab === 'download'
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
              }`}
              title="Download Truecaller Shield on Mobile"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">App Downloader</span>
              <span className="xs:hidden">Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* PWA Install Banner: Enables true Mobile App installation */}
        <PWAInstallBanner
          forceShowAndroidModal={showAndroidInstallModal}
          onCloseAndroidModal={() => setShowAndroidInstallModal(false)}
        />

        {/* Real Mobile Incoming SMS Quick Action & Interceptor Bar */}
        {tab !== 'download' && (
          <IncomingSMSQuickBar
            onTriggerAlert={(sms) => setActiveAlertSMS(sms)}
            onInspectSMS={handleInspectIncomingSMS}
          />
        )}

        {/* Tab 0: Mobile Application Downloader & Hub */}
        {tab === 'download' && (
          <MobileAppDownloader onOpenLiveAlerts={() => setTab('live')} />
        )}

        {/* Tab 1: Live SMS Protection & Truecaller Alerts */}
        {tab === 'live' && (
          <SMSLiveMonitor
            onTriggerAlert={(sms) => setActiveAlertSMS(sms)}
            onInspectSMS={handleInspectIncomingSMS}
            onViewTips={handleViewTips}
            autoStartTrial={autoStartTrial}
            onTrialFinished={() => setAutoStartTrial(false)}
          />
        )}

        {/* Tab 2: Truecaller Phone & Sender ID Lookup */}
        {tab === 'lookup' && (
          <SenderLookup onSimulateForSender={handleSimulateForSender} />
        )}

        {/* Tab 3: Deep Heuristic & Threat Intelligence Analyzer */}
        {tab === 'analyzer' && (
          <div className="animate-fade-in">
            {!displayResult && !analyzing && (
              <div className="text-center mb-8 animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  AI Analyst + Threat Intelligence + Heuristics
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 leading-tight">
                  Analyze Any Suspicious <span className="gradient-text">Message or Link</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto text-sm">
                  Paste an SMS or URL to evaluate attack vectors, brand impersonation, typosquatting, and live reputation blocklists.
                </p>
              </div>
            )}

            {!displayResult && (
              <div className="glass rounded-2xl p-6 sm:p-8 animate-scale-in">
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-primary-400" />
                    URL
                  </span>
                  <span className="text-slate-600">or</span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary-400" />
                    Message text
                  </span>
                  <span className="text-slate-600">— auto-detected</span>
                </div>

                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Paste an SMS message or suspicious link here..."
                    className="w-full h-36 bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-slate-200 placeholder-slate-600 font-mono text-sm resize-none focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    disabled={analyzing}
                  />

                  {autoScan && livePreview && input.trim() && (
                    <div
                      className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        livePreview.riskLevel === 'dangerous'
                          ? 'bg-error-500/15 text-error-300 border-error-500/30'
                          : livePreview.riskLevel === 'suspicious'
                          ? 'bg-accent-500/15 text-accent-300 border-accent-500/30'
                          : livePreview.riskLevel === 'caution'
                          ? 'bg-warning-500/15 text-warning-300 border-warning-500/30'
                          : 'bg-success-500/15 text-success-300 border-success-500/30'
                      } animate-fade-in`}
                    >
                      <Radar className="w-3 h-3" />
                      {livePreview.riskLevel === 'dangerous'
                        ? 'Dangerous'
                        : livePreview.riskLevel === 'suspicious'
                        ? 'Suspicious'
                        : livePreview.riskLevel === 'caution'
                        ? 'Caution'
                        : 'Safe'}
                      <span className="text-slate-500 font-normal ml-0.5">
                        ({livePreview.riskScore})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAutoScan(!autoScan)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        autoScan
                          ? 'bg-primary-500/10 text-primary-300 border-primary-500/30'
                          : 'bg-slate-800/60 text-slate-500 border-slate-700/50'
                      }`}
                    >
                      <Radar className={`w-3.5 h-3.5 ${autoScan ? 'animate-pulse' : ''}`} />
                      Auto-detect {autoScan ? 'ON' : 'OFF'}
                    </button>
                    <p className="text-xs text-slate-500 hidden sm:block">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 text-xs">
                        ⌘ + Enter
                      </kbd>
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={!input.trim() || analyzing}
                    className="ml-auto flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:shadow-none"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Analyze Threat
                      </>
                    )}
                  </button>
                </div>

                {/* Sample tests */}
                <div className="mt-6 pt-6 border-t border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Try a sample test:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sampleTests.map((sample) => (
                      <button
                        key={sample.label}
                        onClick={() => setInput(sample.input)}
                        className="px-3 py-1.5 text-xs bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700/50 transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Want to learn how hackers trick your eyes?
                    </span>
                    <button
                      onClick={() => handleViewTips('urls')}
                      className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      Browse All Defense Tips →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-primary-500 animate-spin" />
                  <Scan className="absolute inset-0 m-auto w-8 h-8 text-primary-400" />
                </div>
                <p className="text-slate-400 mt-6 text-sm">Evaluating phishing patterns and threat intelligence...</p>
              </div>
            )}

            {displayResult && !analyzing && (
              <div className="animate-slide-up space-y-6">
                <div className="glass rounded-2xl p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                    <RiskGauge score={displayResult.riskScore} level={displayResult.riskLevel} />

                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-3">
                        {displayResult.inputType === 'url' ? (
                          <Link2 className="w-4 h-4 text-primary-400" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-primary-400" />
                        )}
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                          {displayResult.inputType === 'url' ? 'URL analyzed' : 'Message analyzed'}
                        </span>
                        {checkingIntel && (
                          <span className="text-xs text-primary-400 ml-2 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Checking threat intel...
                          </span>
                        )}
                        {selectedHistory && !checkingIntel && (
                          <span className="text-xs text-slate-600 ml-2">from history</span>
                        )}
                      </div>

                      <div className="bg-slate-900/60 rounded-xl p-3 mb-4 border border-slate-800/50">
                        <p className="text-sm text-slate-300 font-mono break-all line-clamp-4">
                          {displayResult.input}
                        </p>
                      </div>

                      <div
                        className={`flex items-start gap-3 p-4 rounded-xl ${
                          displayResult.riskLevel === 'dangerous'
                            ? 'bg-error-500/10 border border-error-500/20'
                            : displayResult.riskLevel === 'suspicious'
                            ? 'bg-accent-500/10 border border-accent-500/20'
                            : displayResult.riskLevel === 'caution'
                            ? 'bg-warning-500/10 border border-warning-500/20'
                            : 'bg-success-500/10 border border-success-500/20'
                        }`}
                      >
                        {displayResult.riskLevel === 'safe' ? (
                          <Shield className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              displayResult.riskLevel === 'dangerous'
                                ? 'text-error-400'
                                : displayResult.riskLevel === 'suspicious'
                                ? 'text-accent-400'
                                : 'text-warning-400'
                            }`}
                          />
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed">{displayResult.summary}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                          const count = displayResult.findings.filter((f) => f.severity === sev).length
                          const colors = {
                            critical: 'text-error-400 bg-error-500/10',
                            high: 'text-accent-400 bg-accent-500/10',
                            medium: 'text-warning-400 bg-warning-500/10',
                            low: 'text-primary-400 bg-primary-500/10',
                          }
                          return (
                            <div key={sev} className={`rounded-lg p-3 text-center ${colors[sev]}`}>
                              <div className="text-2xl font-bold">{count}</div>
                              <div className="text-xs uppercase tracking-wide mt-0.5">{sev}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => {
                        setResult(null)
                        setSelectedHistory(null)
                        setInput('')
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Scan className="w-4 h-4" />
                      New Scan
                    </button>
                  </div>
                </div>

                {aiInsight && (
                  <AIInsightPanel insight={aiInsight} riskLevel={displayResult.riskLevel} />
                )}

                {displayResult.features && displayResult.features.length > 0 && (
                  <AIAnalysisPanel
                    features={displayResult.features}
                    threatIntel={displayResult.threatIntel}
                    confidence={displayResult.confidence}
                  />
                )}

                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary-400" />
                    Detailed Findings
                    <span className="text-sm text-slate-500 font-normal">
                      ({displayResult.findings.length})
                    </span>
                  </h3>
                  <FindingsList findings={displayResult.findings} onViewTips={handleViewTips} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Protection & Blocklist Settings */}
        {tab === 'settings' && <ProtectionSettings />}

        {/* Tab 5: Training Mode */}
        {tab === 'training' && (
          <TrainingMode
            onAnalyze={handleTrainingAnalyze}
            onViewTips={() => handleViewTips('all')}
          />
        )}

        {/* Tab 6: Security Tips & Anti-Scam Playbook */}
        {tab === 'tips' && (
          <SecurityTipsGuide
            onAnalyzeSample={handleAnalyzeSample}
            initialCategory={tipsCategory}
          />
        )}

        {/* Tab 7: History */}
        {tab === 'history' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Scan History</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Local device scan records with threat intelligence
                </p>
              </div>
              {history.length > 0 && (
                <span className="text-sm text-slate-500">
                  {history.length} {history.length === 1 ? 'scan' : 'scans'}
                </span>
              )}
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : (
              <HistoryList
                records={history}
                onSelect={handleSelectHistory}
                onDelete={handleDeleteScan}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Truecaller App Experience) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setTab('live')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'live' ? 'text-primary-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Radio className={`w-5 h-5 ${tab === 'live' ? 'animate-pulse' : ''}`} />
          <span className="text-[10px]">Alerts</span>
        </button>

        <button
          onClick={() => setTab('lookup')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'lookup' ? 'text-primary-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[10px]">Lookup</span>
        </button>

        <button
          onClick={() => {
            setTab('analyzer')
            setSelectedHistory(null)
          }}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'analyzer' ? 'text-primary-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Scan className="w-5 h-5" />
          <span className="text-[10px]">Scan</span>
        </button>

        <button
          onClick={() => {
            setTab('tips')
            setTipsCategory('all')
          }}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'tips' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span className="text-[10px]">Tips</span>
        </button>

        <button
          onClick={() => setTab('training')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'training' ? 'text-primary-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-[10px]">Quiz</span>
        </button>

        <button
          onClick={() => setTab('download')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'download' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Download className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px]">Install</span>
        </button>

        <button
          onClick={() => setTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all ${
            tab === 'history' ? 'text-primary-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">History</span>
        </button>
      </div>

      <footer className="hidden sm:block border-t border-slate-800/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-slate-600">
            Truecaller Shield — Real-time mobile spam SMS & phishing detector with live community threat intelligence.
          </p>
        </div>
      </footer>

      {/* Truecaller Live Heads-Up Alert Popup Modal */}
      {activeAlertSMS && (
        <TruecallerAlertModal
          sms={activeAlertSMS}
          onClose={() => setActiveAlertSMS(null)}
          onInspect={handleInspectIncomingSMS}
        />
      )}
    </div>
  )
}
