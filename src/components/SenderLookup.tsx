import React, { useState } from 'react'
import {
  Search,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Flag,
  CheckCircle,
  AlertCircle,
  Users,
  Building,
  Globe,
  MessageSquare,
} from 'lucide-react'
import type { SenderProfile } from '../lib/sms-database'
import {
  lookupSender,
  reportSender,
  toggleBlockSender,
  getSenderProfiles,
} from '../lib/sms-database'

interface SenderLookupProps {
  onSimulateForSender: (sender: string, senderName: string) => void
}

export const SenderLookup: React.FC<SenderLookupProps> = ({ onSimulateForSender }) => {
  const [query, setQuery] = useState('')
  const [activeProfile, setActiveProfile] = useState<SenderProfile | null>(null)
  const [reportText, setReportText] = useState('')
  const [showReportInput, setShowReportInput] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  const communityProfiles = getSenderProfiles()

  const handleSearch = (target?: string) => {
    const term = (target ?? query).trim()
    if (!term) return
    const prof = lookupSender(term)
    setActiveProfile(prof)
    setIsBlocked(prof.isBlockedByUser)
    setShowReportInput(false)
    setReportSuccess(false)
  }

  const handleToggleBlock = () => {
    if (!activeProfile) return
    const newState = toggleBlockSender(activeProfile.identifier)
    setIsBlocked(newState)
    setActiveProfile({ ...activeProfile, isBlockedByUser: newState })
  }

  const handleSubmitReport = () => {
    if (!activeProfile) return
    reportSender(activeProfile.identifier, reportText)
    setReportSuccess(true)
    setShowReportInput(false)
    setReportText('')
    // Refresh profile
    const updated = lookupSender(activeProfile.identifier)
    setActiveProfile(updated)
    setTimeout(() => setReportSuccess(false), 3000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="glass rounded-2xl border border-slate-800 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400 mx-auto mb-3">
          <Phone className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Truecaller Number & Sender Lookup</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
          Check if a phone number or SMS sender ID is flagged for spam, fraud, or phishing by the global community.
        </p>

        <div className="max-w-md mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter phone (+1 800...) or sender (VK-HDFCBK)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-primary-500 shadow-inner"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shrink-0"
          >
            Lookup
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">Popular lookups:</span>
          {communityProfiles.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setQuery(p.identifier)
                handleSearch(p.identifier)
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-mono text-[11px] border border-slate-700/60 transition-colors"
            >
              {p.identifier}
            </button>
          ))}
        </div>
      </div>

      {/* Result Card */}
      {activeProfile && (
        <div className="glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl animate-slide-up">
          {/* Header Banner */}
          <div className={`px-6 py-5 flex items-start justify-between gap-4 ${
            activeProfile.spamScore >= 70
              ? 'bg-gradient-to-r from-error-950/80 via-slate-900 to-slate-950 border-b border-error-500/30'
              : activeProfile.isVerified
              ? 'bg-gradient-to-r from-success-950/80 via-slate-900 to-slate-950 border-b border-success-500/30'
              : 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 border-b border-slate-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                activeProfile.spamScore >= 70
                  ? 'bg-error-500/20 border-error-500/40 text-error-400'
                  : activeProfile.isVerified
                  ? 'bg-success-500/20 border-success-500/40 text-success-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {activeProfile.spamScore >= 70 ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : activeProfile.isVerified ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <Phone className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-extrabold text-white font-mono">
                    {activeProfile.identifier}
                  </h4>
                  {activeProfile.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-success-400 bg-success-500/15 border border-success-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                  {activeProfile.spamScore >= 70 && (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-error-400 bg-error-500/20 border border-error-500/30 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> SPAM ALERT
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {activeProfile.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: {activeProfile.category} · {activeProfile.country}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Spam Score</span>
                <span className={`text-2xl font-black font-mono leading-none mt-1 ${
                  activeProfile.spamScore >= 70
                    ? 'text-error-400'
                    : activeProfile.spamScore >= 40
                    ? 'text-warning-400'
                    : 'text-success-400'
                }`}>
                  {activeProfile.spamScore}%
                </span>
                <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {activeProfile.reportsCount.toLocaleString()} Reports
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-5">
            {/* Meta Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5" /> Carrier / Route
                </span>
                <p className="text-slate-200 font-medium truncate">
                  {activeProfile.carrier || 'Telecommunications Network'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5" /> Region
                </span>
                <p className="text-slate-200 font-medium">
                  {activeProfile.country}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Local Status
                </span>
                <p className={`font-semibold ${isBlocked ? 'text-error-400' : 'text-success-400'}`}>
                  {isBlocked ? 'Blocked on this Device' : 'Allowed / Unblocked'}
                </p>
              </div>
            </div>

            {/* Community Reports Quotes */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Community Feedback & Reports ({activeProfile.sampleReports.length})
              </h5>
              <div className="space-y-2">
                {activeProfile.sampleReports.map((report, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 leading-relaxed italic"
                  >
                    "{report}"
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={handleToggleBlock}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isBlocked
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-error-600 hover:bg-error-500 text-white shadow-md'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                {isBlocked ? 'Unblock Sender' : 'Block Number on Device'}
              </button>

              <button
                onClick={() => setShowReportInput(!showReportInput)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Flag className="w-3.5 h-3.5 text-warning-400" />
                Report as Spammer
              </button>

              <button
                onClick={() => onSimulateForSender(activeProfile.identifier, activeProfile.name)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 border border-primary-500/30 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Simulate Incoming SMS from this Sender
              </button>
            </div>

            {/* Report Input Form */}
            {showReportInput && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3 animate-fade-in">
                <label className="block text-xs font-semibold text-white">
                  Add details about this spam / scam attempt:
                </label>
                <textarea
                  rows={2}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="e.g. Sent fake parcel delivery link demanding credit card payment..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary-500 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowReportInput(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-warning-500 hover:bg-warning-600 text-slate-950 shadow-md"
                  >
                    Submit Community Report
                  </button>
                </div>
              </div>
            )}

            {reportSuccess && (
              <div className="p-3 rounded-xl bg-success-500/10 border border-success-500/30 text-success-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Thank you! Your report has been added to the community database.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
