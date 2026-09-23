import { Cpu, Globe, ShieldCheck, AlertTriangle, Database, Activity } from 'lucide-react'
import type { FeatureVector, ThreatIntelResult } from '../lib/analyzer'

interface AIAnalysisPanelProps {
  features: FeatureVector[]
  threatIntel: ThreatIntelResult | null
  confidence: number
}

export default function AIAnalysisPanel({ features, threatIntel, confidence }: AIAnalysisPanelProps) {
  const activeFeatures = features.filter(f => f.value > 0)
  const confidencePct = Math.round(confidence * 100)

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-slate-200">AI Analysis</h3>
        <span className="ml-auto text-xs text-slate-500">
          {activeFeatures.length}/{features.length} features triggered
        </span>
      </div>

      {/* Confidence meter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Model Confidence</span>
          <span className="text-sm font-semibold text-primary-300">{confidencePct}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-700"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* Feature vector visualization */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Feature Vector
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((feature) => {
            const pct = feature.max > 0 ? (feature.value / feature.max) * 100 : 0
            const isActive = feature.value > 0
            return (
              <div
                key={feature.label}
                className={`rounded-lg p-3 border transition-all ${
                  isActive
                    ? 'bg-primary-500/5 border-primary-500/20'
                    : 'bg-slate-900/40 border-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                    {feature.label}
                  </span>
                  <span className={`text-xs font-mono ${isActive ? 'text-primary-300' : 'text-slate-600'}`}>
                    {feature.value}/{feature.max}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isActive ? 'bg-primary-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Threat intelligence section */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          Threat Intelligence
        </h4>

        {!threatIntel ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
            <Activity className="w-4 h-4 animate-pulse text-primary-400" />
            <span>Threat intelligence lookup not performed for this scan.</span>
          </div>
        ) : threatIntel.flagged ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-error-500/10 border border-error-500/20">
              <AlertTriangle className="w-5 h-5 text-error-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error-300 mb-1">
                  {threatIntel.threatType || 'Flagged by external sources'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {threatIntel.sources.map((source) => (
                    <span
                      key={source}
                      className="text-xs px-2 py-1 rounded-md bg-error-500/10 text-error-300 border border-error-500/20"
                    >
                      {source}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-slate-500 mt-2 block">
                  Confidence: <span className="font-semibold text-error-300">{threatIntel.confidence}</span>
                </span>
              </div>
            </div>
            {threatIntel.details && (
              <pre className="text-xs text-slate-400 bg-slate-900/60 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono border border-slate-800/50">
                {threatIntel.details}
              </pre>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-success-500/10 border border-success-500/20">
              <ShieldCheck className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success-300">
                  No threats detected by external intelligence
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Checked against URLhaus, DNS resolution, and RDAP domain registration records.
                </p>
              </div>
            </div>
            {threatIntel.details && (
              <pre className="text-xs text-slate-400 bg-slate-900/60 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono border border-slate-800/50">
                {threatIntel.details}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Data sources */}
      <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-800/50">
        <Database className="w-3.5 h-3.5" />
        <span>Sources: URLhaus (abuse.ch), Google DNS-over-HTTPS, RDAP domain registration</span>
      </div>
    </div>
  )
}
