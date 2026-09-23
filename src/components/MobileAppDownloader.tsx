import { useState, useEffect } from 'react'
import {
  Download,
  Smartphone,
  Apple,
  QrCode,
  Check,
  Copy,
  Shield,
  Zap,
  HardDrive,
  BatteryCharging,
  WifiOff,
  BellRing,
  Send,
  MessageCircle,
  Sparkles,
  ArrowRight,
  FileCheck,
  Share2,
} from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { SECURITY_TIPS } from '../lib/tips-database'

interface MobileAppDownloaderProps {
  onOpenLiveAlerts?: () => void
}

type TabType = 'android' | 'ios' | 'offline_pack'

export default function MobileAppDownloader({ onOpenLiveAlerts }: MobileAppDownloaderProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall()
  const [activeTab, setActiveTab] = useState<TabType>('android')
  const [copiedLink, setCopiedLink] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios')
    } else {
      setActiveTab('android')
    }
  }, [isIOS])

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-hyp66ripl3tlheunb45xqq-206654315163.asia-east1.run.app'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(appUrl)}`

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(appUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Download Truecaller Shield on your phone for real-time mobile spam SMS & phishing defense: ${appUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleShareSMS = () => {
    const text = encodeURIComponent(
      `Download Truecaller Shield Mobile App: ${appUrl}`
    )
    window.location.href = `sms:?body=${text}`
  }

  const handleDownloadOfflineToolkit = () => {
    setIsExporting(true)
    try {
      const exportData = {
        app: 'Truecaller Shield Mobile Security Pack',
        version: '2.4.0',
        generatedAt: new Date().toISOString(),
        description: 'Complete offline cyber defense guidelines, attack signatures, and phishing rules.',
        tipsCatalog: SECURITY_TIPS,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `truecaller-shield-offline-pack-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950/70 to-slate-950 border border-primary-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Mobile Application Downloader</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Download & Install <span className="gradient-text">Truecaller Shield</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Install the full mobile application directly to your Android or iPhone home screen. Enjoy zero-latency spam SMS scanning, pop-up heads-up alerts, offline threat detection, and battery-friendly operation.
            </p>

            {/* Quick Status pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
                <HardDrive className="w-3.5 h-3.5 text-primary-400" />
                <span>Size: ~1.2 MB (Ultra Lightweight)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span>0.1% Battery Drain</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>100% Offline Ready</span>
              </span>
            </div>
          </div>

          {/* Action Card inside Hero */}
          <div className="w-full md:w-auto shrink-0 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <p className="text-sm font-bold text-white">Truecaller Shield v2.4.0</p>
              <p className="text-xs text-slate-400">Mobile Progressive Web App</p>
            </div>

            {isInstalled ? (
              <div className="w-full py-2.5 px-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>App Already Installed</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>1-Tap Install Now</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById('step-by-step-guide')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>See Install Steps</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">URL Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy App Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: QR Code Phone Transfer + Quick Share */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* QR Code Card */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center justify-between shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-bold text-white">Scan with Mobile Camera</h3>
          </div>

          <p className="text-xs text-slate-400 max-w-sm mb-4">
            If you are reading this on your desktop or laptop, point your phone's camera at the QR code to open the downloader directly on mobile.
          </p>

          <div className="relative group p-3 bg-white rounded-2xl shadow-xl border-4 border-slate-700/50 mb-4 transition-transform group-hover:scale-105">
            <img
              src={qrUrl}
              alt="Scan QR code to install Truecaller Shield on Mobile"
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
            />
          </div>

          <div className="w-full flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">Live Instant Access</span>
          </div>
        </div>

        {/* Share & Transfer Methods */}
        <div className="md:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Send Link to Your Phone</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Instantly send the download link to yourself or a friend via messaging:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleShareWhatsApp}
                className="w-full p-3 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Send via WhatsApp</p>
                    <p className="text-[11px] text-slate-400">Share with yourself or family</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleShareSMS}
                className="w-full p-3 bg-primary-950/40 hover:bg-primary-950/70 border border-primary-500/40 rounded-xl text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-primary-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Send via SMS Message</p>
                    <p className="text-[11px] text-slate-400">Direct text message link</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white">Copy Direct Link</p>
                    <p className="text-[11px] text-slate-400 truncate font-mono">{appUrl}</p>
                  </div>
                </div>
                <span className="text-xs text-primary-400 font-bold shrink-0">
                  {copiedLink ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Offline Security Pack Download */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  Offline Security Rules File (.JSON)
                </p>
                <p className="text-[11px] text-slate-400">
                  Save all security guidelines & attack signatures locally to your phone.
                </p>
              </div>
              <button
                onClick={handleDownloadOfflineToolkit}
                disabled={isExporting}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>{exportSuccess ? 'Saved!' : 'Save File'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Installation Guides */}
      <div id="step-by-step-guide" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Download className="w-6 h-6 text-primary-400" />
              Installation Instructions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select your phone's operating system below for tailored instructions:
            </p>
          </div>

          {/* Platform Tab Toggles */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'android'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android</span>
              {isAndroid && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ios'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone / iOS</span>
              {isIOS && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveTab('offline_pack')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'offline_pack'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Offline Kit</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Android Walkthrough */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 font-black text-xs flex items-center justify-center mb-3 border border-primary-500/30">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Open in Chrome</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Open this URL on your phone inside Google Chrome or Samsung Internet.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Chrome or Samsung Browser
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 font-black text-xs flex items-center justify-center mb-3 border border-primary-500/30">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Tap 3-Dots Menu</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tap the vertical three dots (<span className="text-primary-300 font-bold font-mono">⋮</span>) at the top-right corner of Chrome.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Top-right next to URL bar
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center mb-3 border border-emerald-500/30">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Tap "Install App"</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select <strong className="text-emerald-300">"Install app"</strong> or <strong className="text-slate-200">"Add to Home screen"</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Confirms in 1 second
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 font-black text-xs flex items-center justify-center mb-3 border border-primary-500/30">
                    4
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Launch Fullscreen</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Truecaller Shield now sits on your home screen and drawer with instant alerts!
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400 font-bold">
                  ✓ Ready for Daily Protection
                </div>
              </div>
            </div>

            {/* Android Pro Tips */}
            <div className="p-4 bg-primary-950/30 border border-primary-500/30 rounded-2xl flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">Why install as an Android PWA instead of an APK?</p>
                <p>
                  Progressive Web Apps run inside the hardened Android sandbox without dangerous system permission prompts, take less than 2 MB of storage, receive automatic updates instantly, and avoid malware risks from unofficial APK file mirrors.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: iPhone / iOS Walkthrough */}
        {activeTab === 'ios' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 font-black text-xs flex items-center justify-center mb-3 border border-primary-500/30">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Open in Safari</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ensure this link is open in Apple Safari on your iPhone or iPad.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Safari browser required
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 font-black text-xs flex items-center justify-center mb-3 border border-primary-500/30">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Tap Share Icon</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tap the Share button (<span className="text-primary-300 font-bold">⎋</span> square with arrow pointing up) at the bottom toolbar.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Bottom navigation bar
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center mb-3 border border-emerald-500/30">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Add to Home Screen</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scroll down the sharing sheet and tap <strong className="text-emerald-300">"Add to Home Screen"</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Tap 'Add' in top right
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 font-black text-xs flex items-center justify-center mb-3 border border-primary-500/30">
                    4
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1">Standalone Mode</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Open Truecaller Shield like any native iOS app with full screen view and tips library.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400 font-bold">
                  ✓ Installed on iOS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Offline Kit */}
        {activeTab === 'offline_pack' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Emergency Offline Cyber Defense Pack (.json)
                </h4>
                <p className="text-xs text-slate-400 max-w-xl">
                  Contains all 20+ cyber fraud protection guides, threat indicators, bank alert patterns, and heuristic signatures for offline reference when you have zero network signal.
                </p>
              </div>

              <button
                onClick={handleDownloadOfflineToolkit}
                disabled={isExporting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{exportSuccess ? 'Downloaded!' : 'Download Offline Pack'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div
          onClick={onOpenLiveAlerts}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-primary-500/40 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Live SMS Heads-Up Alerts</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulates incoming messages and alerts you instantly of suspicious banking or lottery SMS.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Truecaller Sender ID Lookup</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Identifies who is sending you SMS codes, bank notifications, or scam offers.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Instant Clipboard Scanner</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automatically checks copied suspicious links or SMS codes when you return to the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
