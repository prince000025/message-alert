import React, { useState, useEffect } from 'react'
import {
  Download,
  Smartphone,
  X,
  Check,
  Copy,
  QrCode,
  Sparkles,
  HelpCircle,
  Apple,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

interface PWAInstallBannerProps {
  forceShowAndroidModal?: boolean
  onCloseAndroidModal?: () => void
}

type DeviceTab = 'android' | 'ios' | 'qr'

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  forceShowAndroidModal,
  onCloseAndroidModal,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall()
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<DeviceTab>('android')
  const [dismissed, setDismissed] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Default active tab based on detected platform
  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios')
    } else if (isAndroid) {
      setActiveTab('android')
    } else {
      // Desktop
      setActiveTab('android')
    }
  }, [isIOS, isAndroid])

  const isModalOpen = forceShowAndroidModal || showModal

  const handleCloseModal = () => {
    setShowModal(false)
    onCloseAndroidModal?.()
  }

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    navigator.clipboard?.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`

  return (
    <>
      {/* Top Banner on Page (shown if not running in standalone and not dismissed) */}
      {!isInstalled && !dismissed && (
        <div className="bg-gradient-to-r from-primary-950/95 via-slate-900 to-slate-950 border border-primary-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500/30 to-blue-600/20 border border-primary-400/40 flex items-center justify-center text-primary-300 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Download Truecaller Shield on Your Phone
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                Install directly to your mobile home screen with 1 tap. Get instant full-screen spam alerts, offline threat detection, and zero battery drain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center shrink-0 w-full sm:w-auto relative z-10 justify-between sm:justify-end">
            {isInstallable ? (
              <button
                onClick={install}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>1-Tap Install</span>
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download App</span>
              </button>
            )}

            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              title="Download instructions"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-slate-800 transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Download & Installation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-7 shadow-2xl text-left my-8 relative">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/30 to-emerald-500/20 border border-primary-500/40 text-primary-300 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  Download on Mobile
                </h3>
                <p className="text-xs text-slate-400">
                  Instant install without Play Store or App Store — runs natively as a PWA!
                </p>
              </div>
            </div>

            {/* Platform Selection Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-5">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'android'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
                {isAndroid && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ios'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
                {isIOS && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>

              <button
                onClick={() => setActiveTab('qr')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'qr'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* 1-Tap browser prompt ready (if Chrome supports beforeinstallprompt) */}
            {isInstallable && activeTab === 'android' && (
              <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Your Browser Supports 1-Click Install!</p>
                    <p className="text-[11px] text-slate-300">Tap below to add Truecaller Shield immediately.</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await install()
                    handleCloseModal()
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition shrink-0"
                >
                  Install Now
                </button>
              </div>
            )}

            {/* Tab: Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/30">
                    1
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      Open this link in Google Chrome or Samsung Internet
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ensure you are in Chrome on your Android mobile device.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/30">
                    2
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Tap the</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-primary-300 font-mono font-bold text-xs">
                        ⋮ (Three Dots)
                      </span>
                      <span>menu in the top-right corner</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Located right next to the browser address bar.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    3
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Select</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                        <Download className="w-3 h-3" />
                        "Install app"
                      </span>
                      <span>or</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                        "Add to Home screen"
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Confirm by tapping <strong className="text-white">Install</strong> when prompted.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/30">
                    4
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      Done! Open Truecaller Shield from your app drawer
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      It launches in full-screen standalone mode without any browser URL bar, with instant spam SMS alerts and offline capability!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: iOS / iPhone Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/30">
                    1
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      Open this link in Safari on your iPhone or iPad
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Apple requires using Safari to add web apps to your Home Screen.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/30">
                    2
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Tap the</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-primary-300 font-bold text-xs">
                        <Share2 className="w-3 h-3" />
                        Share button
                      </span>
                      <span>at the bottom toolbar</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      The square icon with an arrow pointing up at the bottom of the screen.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    3
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Scroll down and select</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                        "Add to Home Screen"
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tap <strong className="text-white">Add</strong> in the top-right corner to confirm.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/30">
                    4
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      Ready! Launch from your Home Screen
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Truecaller Shield will launch as a full native app icon with full screen view and security playbooks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: QR Code to open on mobile */}
            {activeTab === 'qr' && (
              <div className="animate-fade-in text-center p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={qrUrl}
                    alt="Scan QR code with your mobile camera"
                    className="w-44 h-44 bg-white p-2 rounded-2xl shadow-lg border-2 border-slate-700"
                  />
                  <p className="text-xs sm:text-sm font-bold text-white mt-3 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-primary-400" />
                    Scan with Your Phone's Camera
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Point your iPhone or Android camera at this QR code to open the application directly on your device.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Share / Copy URL bar */}
            <div className="mt-4 p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="min-w-0 w-full sm:w-auto">
                <p className="text-[11px] font-semibold text-slate-400">Share or open directly:</p>
                <p className="text-xs text-slate-200 font-mono truncate max-w-sm">
                  {currentUrl}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Security Guarantee badge */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Free & Safe • Verified PWA Service Worker • Zero Battery Drain</span>
            </div>

            <button
              onClick={handleCloseModal}
              className="mt-4 w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-primary-600/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
