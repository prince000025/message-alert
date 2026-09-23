import { useEffect, useState } from 'react'

interface RiskGaugeProps {
  score: number
  level: 'safe' | 'caution' | 'suspicious' | 'dangerous'
}

const levelConfig = {
  safe: { label: 'Safe', color: '#22c55e', bgClass: 'glow-green', textColor: 'text-success-400', bgTextColor: 'text-success-500' },
  caution: { label: 'Caution', color: '#f59e0b', bgClass: '', textColor: 'text-warning-400', bgTextColor: 'text-warning-500' },
  suspicious: { label: 'Suspicious', color: '#f97316', bgClass: '', textColor: 'text-accent-400', bgTextColor: 'text-accent-500' },
  dangerous: { label: 'Dangerous', color: '#ef4444', bgClass: 'glow-red', textColor: 'text-error-400', bgTextColor: 'text-error-500' },
}

export default function RiskGauge({ score, level }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const config = levelConfig[level]

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * score))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const radius = 90
  const circumference = 2 * Math.PI * radius
  const semiArc = circumference / 2

  return (
    <div className={`flex flex-col items-center ${config.bgClass} rounded-full transition-all duration-500`}>
      <div className="relative w-[220px] h-[140px] overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Background arc */}
          <circle
            cx="100" cy="110" r={radius}
            fill="none" stroke="#1a2332" strokeWidth="14"
            strokeDasharray={`${semiArc} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(180 100 110)"
          />
          {/* Score arc */}
          <circle
            cx="100" cy="110" r={radius}
            fill="none" stroke={config.color} strokeWidth="14"
            strokeDasharray={`${(animatedScore / 100) * semiArc} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(180 100 110)"
            style={{ transition: 'stroke-dasharray 0.3s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className={`text-5xl font-bold ${config.textColor} tabular-nums`}>
            {animatedScore}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">Risk Score</span>
        </div>
      </div>
      <div className={`mt-2 px-6 py-1.5 rounded-full text-sm font-semibold ${config.bgTextColor} bg-slate-800/50 border border-slate-700/50`}>
        {config.label}
      </div>
    </div>
  )
}
