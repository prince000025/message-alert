import React, { useState } from 'react'
import {
  ClipboardCopy,
  ShieldAlert,
  HelpCircle,
  X,
  PhoneCall,
  Share2,
  Lock,
  ArrowRight,
  AlertTriangle,
  Send,
} from 'lucide-react'
import { processIncomingSMS, type IncomingSMS } from '../lib/sms-database'
import { soundEngine, triggerVibration } from '../lib/notification'

interface IncomingSMSQuickBarProps {
  onTriggerAlert: (sms: IncomingSMS) => void
  onInspectSMS: (sms: IncomingSMS) => void
}

export const IncomingSMSQuickBar: React.FC<IncomingSMSQuickBarProps> = ({
  onTriggerAlert,
  onInspectSMS,
}) => {
  const [showExplainModal, setShowExplainModal] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [manualText, setManualText] = useState('')
  const [manualSender, setManualSender] = useState('+1 (800) 000-0000')
  const [pasting, setPasting] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)

  const handleQuickPasteFromClipboard = async () => {
    setPasting(true)
    setPasteError(null)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        const trimmed = (text || '').trim()
        if (trimmed.length > 5) {
          await soundEngine.unlock()
          const { sms, triggeredAlert } = processIncomingSMS(
            'Received Message',
            trimmed,
            'Copied from Mobile'
          )
          if (triggeredAlert) {
            await soundEngine.playSpamAlert()
            triggerVibration([250, 100, 250, 100, 400])
            onTriggerAlert(sms)
          } else {
            onInspectSMS(sms)
          }
          return
        }
      }
      // If clipboard empty or denied, open manual paste modal
      setShowPasteModal(true)
    } catch {
      // Permission blocked by browser; open modal
      setShowPasteModal(true)
    } finally {
      setPasting(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return
    await soundEngine.unlock()
    const { sms, triggeredAlert } = processIncomingSMS(
      manualSender.trim() || 'Incoming SMS',
      manualText.trim(),
      'User Tested Message'
    )
    setShowPasteModal(false)
    setManualText('')

    if (triggeredAlert) {
      await soundEngine.playSpamAlert()
      triggerVibration([250, 100, 250, 100, 400])
      onTriggerAlert(sms)
    } else {
      onInspectSMS(sms)
    }
  }

  return (
    <>
      {/* High-Visibility Sticky / Top Quick Interceptor Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950/60 to-slate-900 border border-primary-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/40 text-primary-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                Received a Real SMS on Your Phone?
              </h3>
              <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                Live Scanner
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              Copy any text message or tap below to instantly trigger the Truecaller Alert & Siren.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={() => setShowExplainModal(true)}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Why doesn't the phone SMS pop up silently?"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Why not automatic?</span>
            <span className="sm:hidden">Help</span>
          </button>

          <button
            onClick={handleQuickPasteFromClipboard}
            disabled={pasting}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-primary-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ClipboardCopy className="w-4 h-4" />
            <span>{pasting ? 'Reading Clipboard...' : '📋 Paste & Intercept SMS'}</span>
          </button>
        </div>
      </div>

      {/* Manual Paste Modal if Clipboard is Blocked */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-primary-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                  <ClipboardCopy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Paste Received SMS</h4>
                  <p className="text-xs text-slate-400">Trigger Truecaller Shield Live Alert</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pasteError && (
              <p className="text-xs text-error-400 bg-error-500/10 p-2.5 rounded-xl border border-error-500/20">
                {pasteError}
              </p>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Sender Number or Bank Name (Optional):
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={manualSender}
                    onChange={(e) => setManualSender(e.target.value)}
                    placeholder="+1 (800) 492-3841 or CHASE-ALERT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Message Content / Phishing Link:
                </label>
                <textarea
                  rows={4}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste the SMS you just received here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 resize-none font-sans text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualText.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 disabled:opacity-50 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Trigger Truecaller Live Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explainer Modal: Why browsers cannot silently snoop on phone SMS */}
      {showExplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Why Didn't It Pop Up Silently?</h3>
                  <p className="text-xs text-amber-400">Mobile Sandbox Security Explained</p>
                </div>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Android & Apple Privacy Restriction:</strong>
                  <p className="text-slate-400 mt-0.5">
                    For your personal and banking security, web browsers (Chrome, Safari) are <em>strictly blocked</em> by the phone operating system from silently reading incoming cellular SMS in the background. If websites could do this without your action, malicious websites could steal your private 2FA banking OTP codes!
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white pt-1">
                How to get instant Truecaller protection for real messages:
              </h4>

              {/* 3 Methods */}
              <div className="space-y-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white">1-Tap Quick Paste (Fastest):</strong>
                    <p className="text-slate-400 mt-0.5">
                      When you get a text message, tap "Copy" in your Messages app and tap the blue <span className="text-primary-300 font-bold">📋 Paste & Intercept SMS</span> button. Truecaller Shield immediately sounds the alarm and shows the alert popup.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white">Share via Truecaller Shield (PWA):</strong>
                    <p className="text-slate-400 mt-0.5">
                      Install the app to your Home Screen. When viewing any SMS in Google/Samsung Messages, tap <Share2 className="w-3 h-3 inline text-emerald-400 mx-0.5" /> <strong>Share</strong> and select <strong>Truecaller Shield</strong>!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white">Auto Clipboard Detection:</strong>
                    <p className="text-slate-400 mt-0.5">
                      Copy any message on your phone, then switch to this tab. Truecaller Shield instantly checks your clipboard and alerts you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowExplainModal(false)
                  handleQuickPasteFromClipboard()
                }}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Try Pasting a Received SMS Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
