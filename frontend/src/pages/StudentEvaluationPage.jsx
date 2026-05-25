import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function gradeColor(grade) {
  if (grade === 'A') return 'text-emerald-400'
  if (grade === 'B') return 'text-indigo-400'
  if (grade === 'C') return 'text-amber-400'
  if (grade) return 'text-red-400'
  return 'text-slate-500'
}

function gradeLabel(grade) {
  if (grade === 'A') return 'Excellent'
  if (grade === 'B') return 'Good'
  if (grade === 'C') return 'Satisfactory'
  if (grade === 'D') return 'Pass'
  if (grade === 'F') return 'Fail'
  return 'Not graded yet'
}

function computeGrade(score) {
  if (score == null) return null
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function EvaluationSection({ title, subtitle, evaluation, emptyMessage, logFeedback = [] }) {
  const items = Array.isArray(evaluation?.items) ? evaluation.items : []
  const score = evaluation?.total_score != null ? Number(evaluation.total_score) : null

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {evaluation?.status === 'SUBMITTED' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Submitted
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-500/15 text-amber-400 border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending
          </span>
        )}
      </div>

      {!evaluation || items.length === 0 ? (
        <div className="py-10 text-center px-6">
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Criteria', 'Score / 100'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-6 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {items.map((item, i) => {
                const pct = item.max_score > 0 ? Math.round((item.score / item.max_score) * 100) : 0
                return (
                  <tr key={i} className="hover:bg-slate-700/20 transition">
                    <td className="px-6 py-3.5">
                      <p className="text-slate-200 text-sm font-medium">
                        {item.criteria_name || `Criteria ${item.criteria}`}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-bold ${
                        pct >= 80 ? 'text-emerald-400' :
                        pct >= 60 ? 'text-amber-400' :
                                    'text-red-400'
                      }`}>
                        {Number(item.score) % 1 === 0
                          ? Number(item.score).toFixed(0)
                          : Number(item.score).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700/50 bg-slate-700/20">
                <td className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Score
                </td>
                <td className="px-6 py-3.5">
                  <span className={`text-sm font-black ${
                    score == null ? 'text-slate-500' :
                    score >= 80   ? 'text-emerald-400' :
                    score >= 60   ? 'text-amber-400' :
                                    'text-red-400'
                  }`}>
                    {score != null
                      ? `${score % 1 === 0 ? score.toFixed(0) : score.toFixed(2)} / 100`
                      : '—'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {evaluation?.status === 'SUBMITTED' && (
        <div className="px-6 py-4 border-t border-slate-700/50 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Supervisor Comment</p>

          {evaluation.overall_comment && (
            <p className="text-slate-300 text-sm">{evaluation.overall_comment}</p>
          )}

          {logFeedback.length > 0 && (
            <div className="space-y-2">
              {logFeedback.map(log => (
                <div key={log.id} className="bg-slate-700/30 border border-slate-700/50 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-400">Week {log.week_number}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      log.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                    }`}>
                      {log.status === 'approved' ? 'Approved' : 'Reviewed'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{log.supervisor_comment}</p>
                </div>
              ))}
            </div>
          )}

          {!evaluation.overall_comment && logFeedback.length === 0 && (
            <p className="text-slate-500 text-sm italic">No comment left by your supervisor.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudentEvaluationPage() {
  const [evals,    setEvals]    = useState([])
  const [logbooks, setLogbooks] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [evalsData, logsData] = await Promise.all([
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
          fetchWithAuth(`${API}/weeklylogs/logbooks/`).catch(() => []),
        ])
        setEvals(Array.isArray(evalsData) ? evalsData : [])
        setLogbooks(Array.isArray(logsData) ? logsData : [])
      } catch {
        setError('Failed to load your evaluation. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Report evaluation = the placement-level academic eval (no log, no visit number)
  const academicEval  = evals.find(e =>
    e.evaluator_role === 'academic_supervisor' && e.log == null && e.visit_number == null
  )
  const workplaceEval = evals.find(e => e.evaluator_role === 'workplace_supervisor')

  const academicScore  = academicEval?.total_score  != null ? Number(academicEval.total_score)  : null
  const workplaceScore = workplaceEval?.total_score != null ? Number(workplaceEval.total_score) : null

  const finalScore =
    academicScore != null && workplaceScore != null
      ? Number(((academicScore * 0.6) + (workplaceScore * 0.4)).toFixed(1))
      : academicScore ?? workplaceScore ?? null

  const grade = computeGrade(finalScore)

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">My Evaluations</h1>
        <p className="text-sm text-slate-400 mt-1">
          View scores submitted by your academic and workplace supervisors.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Final Score</p>
            <p className={`text-4xl font-black ${
              finalScore == null ? 'text-slate-500' :
              finalScore >= 80   ? 'text-emerald-400' :
              finalScore >= 60   ? 'text-amber-400' :
                                   'text-red-400'
            }`}>
              {finalScore != null ? `${finalScore.toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-slate-600 mt-2">
              {academicScore != null && workplaceScore != null
                ? 'Combined from both evaluations'
                : 'Awaiting both evaluations'}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Grade</p>
            <p className={`text-4xl font-black ${gradeColor(grade)}`}>
              {grade || '—'}
            </p>
            <p className="text-xs text-slate-600 mt-2">{gradeLabel(grade)}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Score Breakdown</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Academic (60%)</span>
              <span className={`text-sm font-bold ${academicScore != null ? 'text-indigo-400' : 'text-slate-600'}`}>
                {academicScore != null
                  ? `${academicScore % 1 === 0 ? academicScore.toFixed(0) : academicScore.toFixed(2)}%`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Workplace (40%)</span>
              <span className={`text-sm font-bold ${workplaceScore != null ? 'text-emerald-400' : 'text-slate-600'}`}>
                {workplaceScore != null
                  ? `${workplaceScore % 1 === 0 ? workplaceScore.toFixed(0) : workplaceScore.toFixed(2)}%`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <EvaluationSection
          title="Academic Supervisor Evaluation"
          subtitle="Scores submitted by your academic supervisor"
          evaluation={academicEval}
          emptyMessage="Your academic supervisor has not submitted an evaluation yet."
          logFeedback={logbooks
            .filter(l => l.supervisor_comment && ['reviewed', 'approved'].includes(l.status))
            .sort((a, b) => a.week_number - b.week_number)
          }
        />
      )}

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <EvaluationSection
          title="Workplace Supervisor Evaluation"
          subtitle="Scores submitted by your workplace supervisor"
          evaluation={workplaceEval}
          emptyMessage="Your workplace supervisor has not submitted an evaluation yet."
        />
      )}

    </div>
  )
}
