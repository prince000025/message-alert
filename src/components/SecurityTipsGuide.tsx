import { useState, useMemo, useCallback } from 'react'
import {
  Lightbulb,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Sparkles,
  PhoneCall,
  Link2,
  CreditCard,
  Package,
  Radio,
  Flame,
  LifeBuoy,
  XCircle,
  ExternalLink,
  ChevronDown,
  BookOpen,
} from 'lucide-react'
import {
  SECURITY_TIPS,
  getLearnedTipIds,
  toggleLearnedTip,
} from '../lib/tips-database'
import type { SecurityTip } from '../lib/tips-database'

interface SecurityTipsGuideProps {
  onAnalyzeSample?: (sampleText: string) => void
  initialCategory?: string
}

export default function SecurityTipsGuide({
  onAnalyzeSample,
  initialCategory = 'all',
}: SecurityTipsGuideProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [expandedTipId, setExpandedTipId] = useState<string | null>(SECURITY_TIPS[0]?.id || null)
  const [learnedIds, setLearnedIds] = useState<string[]>(() => getLearnedTipIds())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleToggleLearned = useCallback((id: string) => {
    const updated = toggleLearnedTip(id)
    setLearnedIds(updated)
  }, [])

  const handleCopyTip = useCallback((tip: SecurityTip) => {
    const content = `🛡️ Security Tip: ${tip.title}\n\n${tip.summary}\n\n⚠️ Red Flags:\n${tip.redFlags.map(r => `• ${r}`).join('\n')}\n\n✅ What to Do:\n${tip.actionDo.map(a => `• ${a}`).join('\n')}\n\n💡 Rule: ${tip.quickTakeaway}\n\n— via Truecaller Shield`
    navigator.clipboard?.writeText(content)
    setCopiedId(tip.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const categories = [
    { id: 'all', label: 'All Tips', icon: BookOpen, count: SECURITY_TIPS.length },
    { id: 'emergency', label: 'Emergency Protocol', icon: LifeBuoy, count: SECURITY_TIPS.filter(t => t.category === 'emergency').length, highlight: true },
    { id: 'sms', label: 'SMS & Smishing', icon: Radio, count: SECURITY_TIPS.filter(t => t.category === 'sms').length },
    { id: 'calls', label: 'Calls & Vishing', icon: PhoneCall, count: SECURITY_TIPS.filter(t => t.category === 'calls').length },
    { id: 'urls', label: 'URLs & Domains', icon: Link2, count: SECURITY_TIPS.filter(t => t.category === 'urls').length },
    { id: 'banking', label: 'Banking & UPI', icon: CreditCard, count: SECURITY_TIPS.filter(t => t.category === 'banking').length },
    { id: 'delivery', label: 'Delivery Scams', icon: Package, count: SECURITY_TIPS.filter(t => t.category === 'delivery').length },
    { id: 'impersonation', label: 'Govt & Jobs', icon: Flame, count: SECURITY_TIPS.filter(t => t.category === 'impersonation').length },
  ]

  const filteredTips = useMemo(() => {
    return SECURITY_TIPS.filter((tip) => {
      // Category filter
      if (selectedCategory !== 'all' && tip.category !== selectedCategory) {
        return false
      }

      // Severity filter
      if (severityFilter !== 'all' && tip.severity !== severityFilter) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = tip.title.toLowerCase().includes(q)
        const matchSummary = tip.summary.toLowerCase().includes(q)
        const matchKeywords = tip.keywords.some(k => k.toLowerCase().includes(q))
        const matchRedFlags = tip.redFlags.some(r => r.toLowerCase().includes(q))
        const matchExample = tip.realWorldExample.toLowerCase().includes(q)
        if (!matchTitle && !matchSummary && !matchKeywords && !matchRedFlags && !matchExample) {
          return false
        }
      }

      return true
    })
  }, [selectedCategory, severityFilter, searchQuery])

  const masteredCount = learnedIds.length
  const totalTips = SECURITY_TIPS.length
  const progressPercent = Math.min(100, Math.round((masteredCount / totalTips) * 100))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Mastery Status */}
      <div className="glass rounded-2xl p-6 sm:p-8 border border-primary-500/20 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-semibold mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-primary-400" />
              Cyber Defense & Anti-Fraud Playbook
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Security Tips & Threat Handbook
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Comprehensive guidelines, deceptive psychology triggers, red-flag signatures, and immediate emergency protocols for modern mobile threats.
            </p>
          </div>

          {/* Mastery Progress Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-w-[240px] shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mastery Progress
              </span>
              <span className="font-bold text-white font-mono">
                {masteredCount} / {totalTips} ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>{progressPercent === 100 ? '🎉 All Tips Mastered!' : `${totalTips - masteredCount} tips remaining`}</span>
              {masteredCount > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('truecaller_shield_learned_tips_v1')
                    setLearnedIds([])
                  }}
                  className="text-slate-500 hover:text-slate-300 underline text-[10px]"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Emergency First Aid Banner */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-red-950/20 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:px-8 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30 animate-pulse">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-200">Already in a Compromise Emergency?</p>
              <p className="text-[11px] text-red-300/80">Clicked an unknown link or revealed an OTP in the past hour? Follow the containment protocol immediately.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('emergency')
              setExpandedTipId('emergency-clicked-link')
            }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-900/40 shrink-0 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            View Emergency Steps
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tips, red flags, scams (e.g., OTP, FedEx, QR code, AnyDesk)..."
              className="w-full bg-slate-900/80 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              aria-label="Filter tips by priority"
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500/50"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Rules Only</option>
              <option value="high">High Risk Threats</option>
              <option value="pro-tip">Pro Hygiene Tips</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? cat.highlight
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                      : 'bg-primary-500/20 text-primary-300 border-primary-500/40 shadow-sm'
                    : cat.highlight
                    ? 'bg-red-950/20 text-red-400 border-red-900/40 hover:bg-red-900/30'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/10 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tip List */}
      {filteredTips.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-slate-800">
          <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No matching security tips found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or select "All Tips" to view all threat prevention guides.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSeverityFilter('all')
            }}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTips.map((tip) => {
            const isExpanded = expandedTipId === tip.id
            const isLearned = learnedIds.includes(tip.id)
            const isEmergency = tip.category === 'emergency'

            const severityBadge = {
              critical: { label: 'Critical Rule', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
              high: { label: 'High Threat', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
              'pro-tip': { label: 'Pro Hygiene', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
            }[tip.severity]

            return (
              <div
                key={tip.id}
                className={`glass rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isEmergency
                    ? 'border-red-500/30 bg-red-950/10 shadow-red-950/20'
                    : isLearned
                    ? 'border-emerald-500/20 bg-slate-900/40'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="p-5 sm:p-6 flex items-start gap-4">
                  {/* Mastered checkbox button */}
                  <button
                    onClick={() => handleToggleLearned(tip.id)}
                    title={isLearned ? 'Mark as Unread' : 'Mark as Mastered'}
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all border mt-0.5 ${
                      isLearned
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:text-emerald-400 hover:border-emerald-500/50'
                    }`}
                  >
                    <Check className={`w-4 h-4 ${isLearned ? 'stroke-[3]' : 'stroke-[2]'}`} />
                  </button>

                  {/* Main Header Content */}
                  <div
                    onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                    className="flex-1 min-w-0 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${severityBadge.color}`}>
                        {severityBadge.label}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {tip.categoryLabel}
                      </span>
                      {isLearned && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Mastered
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white hover:text-primary-300 transition-colors">
                      {tip.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      {tip.summary}
                    </p>

                    {/* Quick Takeaway Banner */}
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{tip.quickTakeaway}</span>
                    </div>
                  </div>

                  {/* Expand Chevron */}
                  <button
                    onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                    className="shrink-0 p-2 text-slate-400 hover:text-white rounded-lg transition-transform duration-300"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary-400' : ''}`} />
                  </button>
                </div>

                {/* Expanded Deep-Dive Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 sm:px-6 border-t border-slate-800/80 pt-5 space-y-5 animate-slide-up">
                    {/* Red Flags & Action Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Red Flags Card */}
                      <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          Telltale Red Flags
                        </h4>
                        <ul className="space-y-2">
                          {tip.redFlags.map((flag, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-red-200/90 leading-relaxed">
                              <span className="text-red-400 font-bold mt-0.5">•</span>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* What to Do (Safe Action) */}
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          What You Should Do (Safe Path)
                        </h4>
                        <ul className="space-y-2">
                          {tip.actionDo.map((act, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-emerald-200/90 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* What NOT to do */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 mb-3">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        Never Do This (Common Pitfalls)
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {tip.actionDont.map((dont, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                            <span className="text-rose-400 font-bold mt-0.5">✕</span>
                            <span>{dont}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Real-World Scenario Snippet */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-primary-400" />
                          Real-World Attack Lure Example
                        </span>
                        {onAnalyzeSample && (
                          <button
                            onClick={() => onAnalyzeSample(tip.realWorldExample)}
                            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Test in Threat Scanner
                          </button>
                        )}
                      </div>
                      <div className="font-mono text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                        "{tip.realWorldExample}"
                      </div>
                    </div>

                    {/* Action Bar at bottom of card */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => handleToggleLearned(tip.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isLearned
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isLearned ? 'Mastered (Click to Unmark)' : 'Mark as Mastered'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyTip(tip)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/50 transition-all"
                        >
                          {copiedId === tip.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Tip</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
