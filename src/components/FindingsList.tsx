import { useState } from 'react'
import { ChevronDown, AlertTriangle, ShieldAlert, Shield, Info, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react'
import type { Finding, Severity } from '../lib/analyzer'

const severityConfig: Record<Severity, {
  icon: typeof Shield
  color: string
  bgClass: string
  borderClass: string
  iconColor: string
  label: string
}> = {
  critical: { icon: ShieldAlert, color: 'text-error-300', bgClass: 'bg-error-500/10', borderClass: 'border-error-500/30', iconColor: 'text-error-400', label: 'Critical' },
  high: { icon: AlertTriangle, color: 'text-accent-300', bgClass: 'bg-accent-500/10', borderClass: 'border-accent-500/30', iconColor: 'text-accent-400', label: 'High' },
  medium: { icon: AlertCircle, color: 'text-warning-300', bgClass: 'bg-warning-500/10', borderClass: 'border-warning-500/30', iconColor: 'text-warning-400', label: 'Medium' },
  low: { icon: Info, color: 'text-primary-300', bgClass: 'bg-primary-500/10', borderClass: 'border-primary-500/30', iconColor: 'text-primary-400', label: 'Low' },
  info: { icon: Shield, color: 'text-slate-300', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30', iconColor: 'text-slate-400', label: 'Info' },
}

const categoryLabels: Record<string, string> = {
  url: 'URL Structure',
  domain: 'Domain Analysis',
  content: 'Content Analysis',
  structure: 'URL Structure',
  redirect: 'Redirection',
  brand: 'Brand Impersonation',
  reputation: 'Threat Intelligence',
}

function getContextualTipForFinding(finding: Finding): { tip: string; tipCategory: string } | null {
  if (finding.category === 'brand' || finding.id.includes('brand')) {
    return {
      tip: 'Never click verification links in messages claiming to be a brand. Open the official app or type their known URL into your browser directly.',
      tipCategory: 'urls',
    }
  }
  if (finding.id.includes('urgency') || finding.id.includes('pressure')) {
    return {
      tip: 'Artificial panic ("2 hours left", "account suspended") is designed to bypass your logical caution. Genuine providers send postal grace notices.',
      tipCategory: 'sms',
    }
  }
  if (finding.id.includes('sensitive') || finding.id.includes('credentials') || finding.id.includes('otp')) {
    return {
      tip: 'Banks and legit platforms never ask for OTPs, passwords, or PINs to cancel charges. Never disclose these codes to anyone.',
      tipCategory: 'banking',
    }
  }
  if (finding.category === 'domain' || finding.id.includes('typosquatting') || finding.id.includes('tld')) {
    return {
      tip: 'Look directly before the final extension (like .com or .org). Subdomains at the beginning are often decoys to spoof recognizable brands.',
      tipCategory: 'urls',
    }
  }
  if (finding.id.includes('shortener')) {
    return {
      tip: 'Shortened links (bit.ly, is.gd) disguise where you are really heading. Use unshorteners or Truecaller Shield to reveal destination paths.',
      tipCategory: 'urls',
    }
  }
  return {
    tip: 'When in doubt, pause and verify through a trusted secondary channel before interacting.',
    tipCategory: 'all',
  }
}

export default function FindingsList({
  findings,
  onViewTips,
}: {
  findings: Finding[]
  onViewTips?: (category?: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(findings[0]?.id || null)

  if (findings.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Shield className="w-12 h-12 text-success-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-200 mb-1">No issues detected</h3>
        <p className="text-slate-400 text-sm">No phishing indicators were found in this input.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {findings.map((finding) => {
        const config = severityConfig[finding.severity]
        const Icon = config.icon
        const isOpen = expanded === finding.id
        const contextualTip = getContextualTipForFinding(finding)

        return (
          <div
            key={finding.id}
            className={`glass rounded-xl border ${config.borderClass} overflow-hidden transition-all duration-300 hover:border-opacity-50`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : finding.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className={`shrink-0 w-10 h-10 rounded-lg ${config.bgClass} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${config.iconColor}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-500">{categoryLabels[finding.category] || finding.category}</span>
                </div>
                <h4 className="text-sm font-medium text-slate-100 mt-0.5">{finding.title}</h4>
                {!isOpen && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{finding.description}</p>
                )}
              </div>
              <ChevronDown className={`shrink-0 w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pl-17">
                  <div className="ml-13 border-l-2 border-slate-700/50 pl-4 space-y-3">
                    <p className="text-sm text-slate-300 leading-relaxed">{finding.description}</p>
                    {finding.detail && (
                      <pre className="text-xs text-slate-400 bg-slate-900/60 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                        {finding.detail}
                      </pre>
                    )}

                    {contextualTip && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Defense Tip</span>
                            <p className="text-xs text-amber-200/90 leading-relaxed mt-0.5">
                              {contextualTip.tip}
                            </p>
                          </div>
                        </div>
                        {onViewTips && (
                          <button
                            onClick={() => onViewTips(contextualTip.tipCategory)}
                            className="text-[11px] font-bold text-amber-300 hover:text-amber-100 shrink-0 flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg transition-all self-center"
                          >
                            All Tips
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
