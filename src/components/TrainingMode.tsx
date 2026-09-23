import { useState, useCallback } from 'react'
import { GraduationCap, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Trophy, ChevronRight, Lightbulb } from 'lucide-react'
import { generateTrainingScenarios } from '../lib/ai-insight'
import type { TrainingScenario } from '../lib/ai-insight'
import { analyzeInput } from '../lib/analyzer'

interface TrainingModeProps {
  onAnalyze: (input: string) => void
  onViewTips?: () => void
}

export default function TrainingMode({ onAnalyze, onViewTips }: TrainingModeProps) {
  const [scenarios, setScenarios] = useState<TrainingScenario[]>(() => generateTrainingScenarios())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [guesses, setGuesses] = useState<Record<string, 'phishing' | 'safe'>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)

  const current = scenarios[currentIndex]
  const total = scenarios.length
  const isRevealed = revealed.has(current.id)
  const userGuess = guesses[current.id]

  const handleGuess = useCallback((guess: 'phishing' | 'safe') => {
    if (isRevealed) return
    setGuesses((prev) => ({ ...prev, [current.id]: guess }))
    setRevealed((prev) => new Set([...prev, current.id]))
    if (guess === current.type) {
      setScore((s) => s + 1)
    }
  }, [current, isRevealed])

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setCompleted(true)
    }
  }, [currentIndex, total])

  const handleRestart = useCallback(() => {
    setScenarios(generateTrainingScenarios())
    setCurrentIndex(0)
    setGuesses({})
    setRevealed(new Set())
    setScore(0)
    setCompleted(false)
  }, [])

  if (completed) {
    const percentage = Math.round((score / total) * 100)
    const passed = percentage >= 70

    return (
      <div className="animate-fade-in space-y-6">
        <div className="glass rounded-2xl p-8 sm:p-12 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            passed ? 'bg-success-500/15' : 'bg-warning-500/15'
          }`}>
            <Trophy className={`w-10 h-10 ${passed ? 'text-success-400' : 'text-warning-400'}`} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {passed ? 'Excellent work!' : 'Keep practicing!'}
          </h2>
          <p className="text-slate-400 mb-6">
            You correctly identified {score} out of {total} scenarios ({percentage}%)
          </p>
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-xl bg-slate-900/60 border border-slate-800/50 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-400">{score}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Correct</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-error-400">{total - score}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Missed</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center">
              <div className={`text-3xl font-bold ${passed ? 'text-success-400' : 'text-warning-400'}`}>{percentage}%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Score</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-primary-500/20"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            {onViewTips && (
              <button
                onClick={onViewTips}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition-all"
              >
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Study All Tips & Playbook
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center border border-primary-500/20">
              <GraduationCap className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Phishing Awareness Training</h2>
              <p className="text-xs text-slate-500">Test your ability to spot phishing attempts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onViewTips && (
              <button
                onClick={onViewTips}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>All Tips</span>
              </button>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-300">{score}/{total}</div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + (isRevealed ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Scenario {currentIndex + 1} of {total}</span>
          <span>{Math.round(((currentIndex + (isRevealed ? 1 : 0)) / total) * 100)}% complete</span>
        </div>
      </div>

      {/* Scenario */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            {isRevealed ? `Tactic: ${current.tactic}` : 'Analyze this message'}
          </span>
        </div>

        {/* Message content */}
        <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800/50 mb-6">
          <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">{current.message}</pre>
        </div>

        {/* Guess buttons */}
        {!isRevealed && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleGuess('phishing')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-error-500/10 hover:bg-error-500/20 text-error-300 border border-error-500/30 rounded-xl font-medium transition-all"
            >
              <XCircle className="w-5 h-5" />
              This is Phishing
            </button>
            <button
              onClick={() => handleGuess('safe')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-success-500/10 hover:bg-success-500/20 text-success-300 border border-success-500/30 rounded-xl font-medium transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              This is Safe
            </button>
          </div>
        )}

        {/* Reveal: explanation + result */}
        {isRevealed && (
          <div className="animate-scale-in space-y-4">
            <div className={`flex items-start gap-3 p-4 rounded-xl ${
              userGuess === current.type
                ? 'bg-success-500/10 border border-success-500/20'
                : 'bg-error-500/10 border border-error-500/20'
            }`}>
              {userGuess === current.type ? (
                <CheckCircle2 className="w-6 h-6 text-success-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-error-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${userGuess === current.type ? 'text-success-300' : 'text-error-300'}`}>
                  {userGuess === current.type ? 'Correct!' : 'Incorrect!'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  This is <span className={`font-semibold ${current.type === 'phishing' ? 'text-error-300' : 'text-success-300'}`}>
                    {current.type === 'phishing' ? 'a phishing attempt' : 'a legitimate message'}
                  </span>.
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Why?</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{current.explanation}</p>
            </div>

            {/* Quick analysis */}
            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10">
              <h4 className="text-xs uppercase tracking-wider text-primary-400 mb-2">PhishGuard's Analysis</h4>
              {(() => {
                const result = analyzeInput(current.message)
                return (
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      result.riskLevel === 'dangerous' ? 'bg-error-500/20 text-error-300' :
                      result.riskLevel === 'suspicious' ? 'bg-accent-500/20 text-accent-300' :
                      result.riskLevel === 'caution' ? 'bg-warning-500/20 text-warning-300' :
                      'bg-success-500/20 text-success-300'
                    }`}>
                      {result.riskLevel.toUpperCase()} · {result.riskScore}/100
                    </div>
                    <div className="text-sm text-slate-400">
                      {result.findings.length} indicators detected
                    </div>
                    <button
                      onClick={() => onAnalyze(current.message)}
                      className="ml-auto flex items-center gap-1.5 text-xs text-primary-300 hover:text-primary-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Full analysis
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-primary-500/20"
            >
              {currentIndex < total - 1 ? (
                <>
                  Next Scenario
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  See Results
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Toggle visibility hint */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        <span>{isRevealed ? 'Answer revealed — review the explanation and analysis above' : 'Make your guess, then see the explanation and PhishGuard\'s analysis'}</span>
      </div>
    </div>
  )
}
