import React, { useState } from 'react'
import {
  Shield,
  Bell,
  Volume2,
  Vibrate,
  Sliders,
  Ban,
  Tag,
  Plus,
  CheckCircle,
} from 'lucide-react'
import type { SecuritySettings } from '../lib/sms-database'
import { getSecuritySettings, saveSecuritySettings } from '../lib/sms-database'
import { requestNotificationPermission, getNotificationPermission, sendSystemAlert, soundEngine } from '../lib/notification'

export const ProtectionSettings: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>(() => getSecuritySettings())
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() => getNotificationPermission())
  const [newSender, setNewSender] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null)

  const updateSetting = <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSecuritySettings(updated)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 1500)
  }

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      updateSetting('notificationsEnabled', true)
      sendSystemAlert('Truecaller Shield Active', 'Mobile push alerts configured successfully!', false)
    }
  }

  const handleAddSender = () => {
    const trimmed = newSender.trim()
    if (!trimmed || settings.blockedSenders.includes(trimmed)) return
    updateSetting('blockedSenders', [trimmed, ...settings.blockedSenders])
    setNewSender('')
  }

  const handleRemoveSender = (s: string) => {
    updateSetting(
      'blockedSenders',
      settings.blockedSenders.filter((x) => x !== s)
    )
  }

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase()
    if (!trimmed || settings.blockedKeywords.includes(trimmed)) return
    updateSetting('blockedKeywords', [trimmed, ...settings.blockedKeywords])
    setNewKeyword('')
  }

  const handleRemoveKeyword = (kw: string) => {
    updateSetting(
      'blockedKeywords',
      settings.blockedKeywords.filter((x) => x !== kw)
    )
  }

  const handleTestClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setClipboardStatus('Clipboard access not permitted by browser.')
        return
      }
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setClipboardStatus('Clipboard is empty.')
        return
      }
      setClipboardStatus(`Scanned clipboard: "${text.slice(0, 45)}..."`)
    } catch {
      setClipboardStatus('Clipboard permission required.')
    }
    setTimeout(() => setClipboardStatus(null), 3000)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Title */}
      <div className="glass rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mobile Protection & Alert Settings</h3>
              <p className="text-xs text-slate-400">Configure how Truecaller Shield detects and alerts you to spam SMS</p>
            </div>
          </div>

          {savedSuccess && (
            <span className="text-xs text-success-400 font-semibold flex items-center gap-1 animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Alert & Notification Controls */}
      <div className="glass rounded-2xl border border-slate-800 p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-400" />
          Alerts & System Push Notifications
        </h4>

        <div className="divide-y divide-slate-800 text-xs">
          {/* Real-time SMS Protection */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Live SMS Protection</p>
              <p className="text-slate-400">Automatically filter incoming SMS in real-time</p>
            </div>
            <button
              onClick={() => updateSetting('protectionActive', !settings.protectionActive)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.protectionActive ? 'bg-primary-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.protectionActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* System Push Notifications */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">System Notification Alerts</p>
              <p className="text-slate-400">
                Show heads-up notification banner when spam is intercepted
              </p>
            </div>
            {notifPerm === 'granted' ? (
              <button
                onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.notificationsEnabled ? 'bg-primary-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            ) : (
              <button
                onClick={handleRequestNotif}
                className="px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg font-semibold border border-primary-500/40"
              >
                Allow Notifications
              </button>
            )}
          </div>

          {/* Audio Siren Alert */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-semibold text-white">Audio Warning Siren</p>
                <p className="text-slate-400">Play distinctive chime when high-risk phishing message arrives</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await soundEngine.unlock()
                  soundEngine.playSpamAlert()
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-primary-400 rounded-lg text-xs font-bold border border-slate-700"
                title="Test siren audio"
              >
                Test Siren
              </button>
              <button
                onClick={() => updateSetting('soundAlerts', !settings.soundAlerts)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.soundAlerts ? 'bg-primary-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.soundAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Vibration Alert */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-semibold text-white">Haptic Vibration</p>
                <p className="text-slate-400">Vibrate phone on incoming spam alert</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('vibrationAlerts', !settings.vibrationAlerts)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.vibrationAlerts ? 'bg-primary-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.vibrationAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Clipboard Auto-Scan */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Clipboard Auto-Scan</p>
              <p className="text-slate-400">Inspect copied messages from WhatsApp/SMS for hidden scam links</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestClipboard}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px]"
              >
                Scan Now
              </button>
              <button
                onClick={() => updateSetting('autoScanClipboard', !settings.autoScanClipboard)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.autoScanClipboard ? 'bg-primary-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.autoScanClipboard ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {clipboardStatus && (
          <p className="text-xs text-primary-300 bg-primary-500/10 border border-primary-500/20 p-2.5 rounded-lg">
            {clipboardStatus}
          </p>
        )}
      </div>

      {/* Detection Sensitivity */}
      <div className="glass rounded-2xl border border-slate-800 p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary-400" />
          Filter Sensitivity Threshold
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['lenient', 'balanced', 'aggressive'] as const).map((mode) => {
            const isSelected = settings.sensitivity === mode
            return (
              <button
                key={mode}
                onClick={() => updateSetting('sensitivity', mode)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-primary-500/15 border-primary-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold capitalize mb-1 flex items-center justify-between">
                  <span>{mode}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  {mode === 'aggressive'
                    ? 'Flags any unknown shortcode or suspicious phrasing (25%+ risk).'
                    : mode === 'balanced'
                    ? 'Standard Truecaller heuristic filter (40%+ risk).'
                    : 'Flags only confirmed malicious threats & blacklisted senders (65%+ risk).'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Blocked Phone Numbers & Senders */}
      <div className="glass rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Ban className="w-4 h-4 text-error-400" />
            Blocked Senders & Numbers ({settings.blockedSenders.length})
          </h4>
        </div>
        <p className="text-xs text-slate-400">
          Messages from these senders will be blocked immediately without ringing or alerting.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSender}
            onChange={(e) => setNewSender(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSender()}
            placeholder="+1 800... or SPAM-SENDER"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleAddSender}
            className="px-4 py-2 bg-error-600 hover:bg-error-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Block Sender
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {settings.blockedSenders.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-error-500/10 border border-error-500/20 text-xs font-mono text-error-300"
            >
              <span>{s}</span>
              <button
                onClick={() => handleRemoveSender(s)}
                className="hover:text-white p-0.5"
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Blocked Spam Keywords */}
      <div className="glass rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Tag className="w-4 h-4 text-warning-400" />
            Custom Spam Keywords Filter ({settings.blockedKeywords.length})
          </h4>
        </div>
        <p className="text-xs text-slate-400">
          Any SMS containing these phrases is marked as spam and automatically suppressed.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            placeholder="e.g. urgent kyc, free cash, seed phrase..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleAddKeyword}
            className="px-4 py-2 bg-warning-500 hover:bg-warning-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Keyword
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {settings.blockedKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warning-500/10 border border-warning-500/20 text-xs text-warning-300"
            >
              <span>{kw}</span>
              <button
                onClick={() => handleRemoveKeyword(kw)}
                className="hover:text-white p-0.5"
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
