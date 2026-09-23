import React, { useState, useEffect } from 'react'
import {
  AlertOctagon,
  ShieldAlert,
  Ban,
  Copy,
  Check,
  ExternalLink,
  X,
  PhoneCall,
  MessageSquare,
  Volume2,
  Megaphone,
  Square,
  Type,
} from 'lucide-react'
import type { IncomingSMS } from '../lib/sms-database'
import { toggleBlockSender, reportSender } from '../lib/sms-database'
import { soundEngine, triggerVibration } from '../lib/notification'

interface TruecallerAlertModalProps {
  sms: IncomingSMS
  onClose: () => void
  onInspect: (sms: IncomingSMS) => void
}

type TextSize = 'normal' | 'large' | 'huge'

export const TruecallerAlertModal: React.FC<TruecallerAlertModalProps> = ({
  sms,
  onClose,
  onInspect,
}) => {
  const [copied, setCopied] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [isPlayingSiren, setIsPlayingSiren] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [textSize, setTextSize] = useState<TextSize>('large')

  const isCritical = sms.riskScore >= 70
  const bgHeader = isCritical ? 'bg-error-600' : 'bg-warning-600'

  // Play audio siren automatically when popup is displayed
  useEffect(() => {
    soundEngine.playSpamAlert()
    triggerVibration([250, 100, 250, 100, 400])

    return () => {
      soundEngine.stopSpeech()
    }
  }, [])

  const handlePlaySiren = async () => {
    setIsPlayingSiren(true)
    await soundEngine.playSpamAlert()
    triggerVibration([200, 100, 200])
    setTimeout(() => setIsPlayingSiren(false), 900)
  }

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      soundEngine.stopSpeech()
      setIsSpeaking(false)
    } else {
      setIsSpeaking(true)
      const warningText = `Warning! Truecaller Shield detected high risk scam SMS from ${sms.senderName || sms.sender}. Content: ${sms.body}`
      soundEngine.speakAlert(warningText)
      // Estimate speaking duration
      const wordCount = warningText.split(/\s+/).length
      const estimatedMs = Math.max(2500, (wordCount / 2.5) * 1000)
      setTimeout(() => setIsSpeaking(false), estimatedMs)
    }
  }

  const handleCopy = () => {
    const text = `[Truecaller Shield Alert]\nSender: ${sms.sender} (${sms.senderName})\nSpam Score: ${sms.riskScore}%\nMessage: "${sms.body}"\nCategory: ${sms.category}\nFlagged as ${sms.riskLevel.toUpperCase()}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBlockAndReport = () => {
    toggleBlockSender(sms.sender)
    reportSender(sms.sender, 'Direct mobile report from Truecaller Shield popup')
    setBlocked(true)
    setTimeout(() => {
      onClose()
    }, 1200)
  }

  // Render message body with high-contrast URL highlights
  const renderMessageBody = (text: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-error-500/60 rounded-3xl overflow-hidden shadow-2xl shadow-error-500/30 animate-slide-up my-auto">
        {/* Truecaller Alert Header */}
        <div className={`${bgHeader} px-5 py-4 text-white flex items-center justify-between shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-bounce">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-widest uppercase bg-black/35 px-2.5 py-0.5 rounded-full border border-white/20">
                  TRUECALLER HEADS-UP ALERT
                </span>
                <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
                  {sms.riskScore}% SPAM
                </span>
              </div>
              <h3 className="text-lg font-black text-white leading-tight mt-1">
                {isCritical ? '🚨 High-Risk Phishing / Scam SMS' : '⚠️ Suspicious Message Detected'}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.stopSpeech()
              onClose()
            }}
            className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Audio Siren & Voice Announcement Quick Actions */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlaySiren}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                isPlayingSiren
                  ? 'bg-error-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-error-400 border border-slate-700'
              }`}
              title="Play siren alert audio"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingSiren ? 'Playing Siren...' : 'Replay Siren'}</span>
            </button>

            <button
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                isSpeaking
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-primary-300 border border-slate-700'
              }`}
              title="Read alert message aloud"
            >
              {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Megaphone className="w-4 h-4" />}
              <span>{isSpeaking ? 'Stop Reading' : 'Speak Message Aloud'}</span>
            </button>
          </div>

          {/* Text Size Control for Enhanced Readability */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <Type className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setTextSize('normal')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                textSize === 'normal' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Standard text size"
            >
              A
            </button>
            <button
              onClick={() => setTextSize('large')}
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                textSize === 'large' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Large readable text size"
            >
              A+
            </button>
            <button
              onClick={() => setTextSize('huge')}
              className={`px-2 py-0.5 rounded text-sm font-extrabold ${
                textSize === 'huge' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Extra large high-contrast text"
            >
              A++
            </button>
          </div>
        </div>

        {/* Sender Info & High-Visibility Message Card */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Incoming Sender ID:
                </span>
                <p className="text-xl font-black text-white font-mono flex items-center gap-2 mt-0.5">
                  <PhoneCall className="w-5 h-5 text-error-400 shrink-0" />
                  <span>{sms.sender}</span>
                </p>
                <p className="text-sm font-bold text-error-400 mt-0.5">
                  {sms.senderName}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-black text-error-300 bg-error-500/20 border border-error-500/40 px-2.5 py-1 rounded-xl">
                  <AlertOctagon className="w-4 h-4 text-error-400" />
                  <span>{sms.communityReports > 0 ? `${sms.communityReports.toLocaleString()} Reports` : 'Scam Flag'}</span>
                </span>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  Tag: {sms.category}
                </p>
              </div>
            </div>

            {/* Readability Message Preview Box */}
            <div className="mt-4 pt-3.5 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <MessageSquare className="w-4 h-4 text-primary-400" />
                  <span>Interpreted SMS Text:</span>
                </div>
                <span className="text-[11px] text-amber-400 font-mono font-semibold">
                  ⚠️ Phishing link detected
                </span>
              </div>

              <div
                className={`bg-slate-900/90 text-white rounded-xl p-4 border border-slate-700 shadow-md font-sans leading-relaxed break-words select-text ${
                  textSize === 'huge'
                    ? 'text-lg sm:text-xl font-medium'
                    : textSize === 'large'
                    ? 'text-base font-medium'
                    : 'text-sm'
                }`}
              >
                {renderMessageBody(sms.body)}
              </div>
            </div>
          </div>

          {/* Threat Indicators Badges */}
          {sms.analysis.findings.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Threat Indicators Detected:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sms.analysis.findings.slice(0, 4).map((f) => (
                  <span
                    key={f.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-error-500/15 border border-error-500/30 text-error-300 font-semibold flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-error-400 animate-pulse" />
                    <span>{f.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={handleBlockAndReport}
              disabled={blocked}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                blocked
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-error-600 to-rose-600 hover:from-error-500 hover:to-rose-500 text-white shadow-error-600/30'
              }`}
            >
              {blocked ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Sender Blocked & Reported!</span>
                </>
              ) : (
                <>
                  <Ban className="w-5 h-5" />
                  <span>Block Sender & Report Fraud to Truecaller</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundEngine.stopSpeech()
                  onInspect(sms)
                  onClose()
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-primary-400" />
                <span>Deep AI Analysis</span>
              </button>

              <button
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Intel!' : 'Copy Alert Details'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
