import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function StatCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GradeColor(grade) {
  if (grade === 'A') return 'text-emerald-400'
  if (grade === 'B') return 'text-indigo-400'
  if (grade === 'C') return 'text-amber-400'
  if (grade) return 'text-red-400'
  return 'text-slate-500'
}

function ScoreBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0
  const barColor =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-amber-500' :
                'bg-red-500'
  return (
    <div className="flex items-center gap-3 w-32">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = (status || '').toUpperCase()
  const style =
    s === 'SUBMITTED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    s === 'PENDING'   ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        s === 'SUBMITTED' ? 'bg-emerald-400' :
        s === 'PENDING'   ? 'bg-amber-400' :
                            'bg-slate-400'
      }`} />
      {status || 'Unknown'}
    </span>
  )
}

export default function StudentEvaluationPage() {
  const [evaluation, setEvaluation] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const fetchEvaluation = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchWithAuth(`${API}/evaluations/evaluations/`)
        const list = Array.isArray(data) ? data : []
        // Students see their own evaluation N/A take the first one
        setEvaluation(list.length > 0 ? list[0] : null)
      } catch {
        setError('Failed to load your evaluation. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvaluation()
  }, [])

  const totalScore  = evaluation?.total_score != null ? Number(evaluation.total_score) : null
  const grade       = evaluation?.grade || null
  const status      = evaluation?.status || null
  const items       = Array.isArray(evaluation?.items) ? evaluation.items : []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Evaluation</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your final internship evaluation score and detailed criteria breakdown.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Final Score */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Final Score</p>
            <p className={`text-4xl font-black ${
              totalScore == null ? 'text-slate-500' :
              totalScore >= 80   ? 'text-emerald-400' :
              totalScore >= 60   ? 'text-amber-400' :
                                   'text-red-400'
            }`}>
              {totalScore != null ? `${totalScore.toFixed(0)}%` : '—'}
            </p>
            {totalScore != null && (
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    totalScore >= 80 ? 'bg-emerald-500' :
                    totalScore >= 60 ? 'bg-amber-500' :
                                       'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, totalScore)}%` }}
                />
              </div>
            )}
          </div>

          {/* Grade */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Grade</p>
            <p className={`text-4xl font-black ${GradeColor(grade)}`}>
              {grade || '—'}
            </p>
            <p className="text-xs text-slate-600 mt-2">
              {grade === 'A' ? 'Excellent performance' :
               grade === 'B' ? 'Good performance' :
               grade === 'C' ? 'Satisfactory performance' :
               grade         ? 'Needs improvement' :
                               'Grade not assigned yet'}
            </p>
          </div>

          {/* Status */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Evaluation Status</p>
            <div className="mt-1">
              {status ? (
                <StatusBadge status={status} />
              ) : (
                <span className="text-slate-500 text-sm">Not available</span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              {(status || '').toUpperCase() === 'SUBMITTED'
                ? 'Your evaluation has been finalised.'
                : 'Evaluation is still in progress.'}
            </p>
          </div>
        </div>
      )}

      {/* Criteria Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Criteria Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Score per evaluation criteria</p>
          </div>
          {!loading && items.length > 0 && (
            <span className="text-xs text-slate-500">{items.length} criteria</span>
          )}
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : !evaluation ? (
          /* Empty state N/A no evaluation at all */
          <div className="py-16 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No evaluation submitted yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Your evaluation will appear here once your supervisor submits it.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center px-6">
            <p className="text-slate-500 text-sm">No criteria details available for this evaluation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Criteria', 'Score', 'Max Score', 'Progress'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-6 py-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {items.map((item, i) => {
                  const pct = item.max_score > 0
                    ? Math.round((item.score / item.max_score) * 100)
                    : 0
                  return (
                    <tr key={i} className="hover:bg-slate-700/20 transition">
                      <td className="px-6 py-4">
                        <p className="text-slate-200 text-sm font-medium">
                          {item.criteria_name || (item.criteria ? `Criteria ${item.criteria}` : `Item ${i + 1}`)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${
                          pct >= 80 ? 'text-emerald-400' :
                          pct >= 60 ? 'text-amber-400' :
                                      'text-red-400'
                        }`}>
                          {item.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-sm">{item.max_score}</span>
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBar score={item.score} maxScore={item.max_score} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700/50 bg-slate-700/20">
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-black ${
                      totalScore == null ? 'text-slate-500' :
                      totalScore >= 80   ? 'text-emerald-400' :
                      totalScore >= 60   ? 'text-amber-400' :
                                           'text-red-400'
                    }`}>
                      {totalScore != null ? `${totalScore.toFixed(0)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm font-bold">100</span>
                  </td>
                  <td className="px-6 py-4">
                    {totalScore != null && (
                      <ScoreBar score={totalScore} maxScore={100} />
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
