import { useState } from 'react'
import { Trash2, Shield, Link as LinkIcon, MessageSquare, ChevronRight } from 'lucide-react'
import type { ScanRecord } from '../lib/database'

const levelConfig = {
  safe: { label: 'Safe', color: 'text-success-400', bg: 'bg-success-500/10', border: 'border-success-500/30', dot: 'bg-success-400' },
  caution: { label: 'Caution', color: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/30', dot: 'bg-warning-400' },
  suspicious: { label: 'Suspicious', color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/30', dot: 'bg-accent-400' },
  dangerous: { label: 'Dangerous', color: 'text-error-400', bg: 'bg-error-500/10', border: 'border-error-500/30', dot: 'bg-error-400' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function HistoryList({
  records,
  onSelect,
  onDelete,
}: {
  records: ScanRecord[]
  onSelect: (r: ScanRecord) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (records.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Shield className="w-14 h-14 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-1">No scans yet</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Your scan history will appear here. Paste a link or message on the analyzer tab to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const config = levelConfig[record.riskLevel]
        const isConfirming = confirmDelete === record.id

        return (
          <div
            key={record.id}
            className={`glass rounded-xl border ${config.border} p-4 flex items-center gap-4 hover:bg-white/[0.03] transition-all group`}
          >
            <div className={`shrink-0 w-12 h-12 rounded-lg ${config.bg} flex flex-col items-center justify-center`}>
              {record.inputType === 'url' ? (
                <LinkIcon className={`w-5 h-5 ${config.color}`} />
              ) : (
                <MessageSquare className={`w-5 h-5 ${config.color}`} />
              )}
            </div>

            <button onClick={() => onSelect(record)} className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">{record.riskScore}/100</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">{formatDate(record.scannedAt)}</span>
              </div>
              <p className="text-sm text-slate-200 truncate font-mono">{record.input}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{record.summary}</p>
            </button>

            <div className="flex items-center gap-1">
              {isConfirming ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { onDelete(record.id); setConfirmDelete(null) }}
                    className="text-xs text-error-400 hover:text-error-300 px-2 py-1 rounded hover:bg-error-500/10 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs text-slate-400 px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelect(record)}
                    className="p-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="View details"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(record.id)}
                    className="p-2 text-slate-500 hover:text-error-400 rounded-lg hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
