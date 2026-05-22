import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const STATUS_STYLES = {
  draft:               'bg-slate-500/20 text-slate-400 border-slate-500/30',
  submitted:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
  workplace_reviewed:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  reviewed:            'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const STATUS_LABELS = {
  draft:               'Draft',
  submitted:           'Submitted',
  workplace_reviewed:  'Workplace Reviewed',
  reviewed:            'Reviewed',
  approved:            'Approved',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border whitespace-nowrap ${STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
      {STATUS_LABELS[status] || status || 'unknown'}
    </span>
  )
}

function WeekBadge({ weekNumber }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-bold border border-indigo-500/20 flex-shrink-0">
      W{weekNumber}
    </span>
  )
}

function EvalBadge({ role }) {
  const isWorkplace = role === 'workplace_supervisor'
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold border flex-shrink-0 ${
      isWorkplace
        ? 'bg-purple-600/20 text-purple-400 border-purple-500/20'
        : 'bg-blue-600/20 text-blue-400 border-blue-500/20'
    }`}>
      {isWorkplace ? 'WS' : 'AS'}
    </span>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function FeedbackCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export default function StudentFeedbackPage() {
  const [logs,    setLogs]    = useState([])
  const [evals,   setEvals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [logsData, evalsData] = await Promise.all([
          fetchWithAuth(`${API}/weeklylogs/logbooks/`),
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
        ])
        setLogs(Array.isArray(logsData) ? logsData : [])
        setEvals(Array.isArray(evalsData) ? evalsData : [])
      } catch {
        setError('Failed to load feedback. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // --- Build unified feedback list ---

  // 1. Evaluation overall_comment feedback (workplace + academic supervisors)
  const evalFeedbacks = evals
    .filter(e => e.overall_comment && e.overall_comment.trim() !== '' && e.status === 'SUBMITTED')
    .map(e => ({
      type:         'evaluation',
      id:           `eval-${e.id}`,
      from:         e.evaluator_role === 'workplace_supervisor' ? 'Workplace Supervisor' : 'Academic Supervisor',
      evaluatorRole: e.evaluator_role,
      date:         e.submitted_at || e.created_at,
      comment:      e.overall_comment,
      score:        e.total_score,
    }))

  // 2. Logbook supervisor_comment feedback (academic supervisor log reviews)
  const logFeedbacks = logs
    .filter(l => l.supervisor_comment && l.supervisor_comment.trim() !== '')
    .map(l => ({
      type:        'logbook',
      id:          `log-${l.id}`,
      from:        'Academic Supervisor',
      week:        l.week_number,
      date:        l.submitted_at,
      comment:     l.supervisor_comment,
      status:      l.status,
    }))

  // Merge and sort by date (most recent first)
  const allFeedback = [...evalFeedbacks, ...logFeedbacks].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date) - new Date(a.date)
  })

  const totalFeedback = allFeedback.length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Supervisor Feedback</h1>
        <p className="text-sm text-slate-400 mt-1">
          Comments and feedback left by your supervisors — from evaluations and weekly log reviews.
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
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Feedback Received</p>
            <p className="text-4xl font-black text-indigo-400">{totalFeedback}</p>
            <p className="text-xs text-slate-600 mt-2">
              {evalFeedbacks.length} from evaluations · {logFeedbacks.length} from log reviews
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reviewed Logs</p>
            <p className="text-4xl font-black text-blue-400">
              {logs.filter((l) => l.status === 'reviewed').length}
            </p>
            <p className="text-xs text-slate-600 mt-2">awaiting final approval</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Approved Logs</p>
            <p className="text-4xl font-black text-emerald-400">
              {logs.filter((l) => l.status === 'approved').length}
            </p>
            <p className="text-xs text-slate-600 mt-2">fully approved by supervisor</p>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white">Feedback Entries</h2>
          {!loading && totalFeedback > 0 && (
            <span className="text-xs text-slate-500">{totalFeedback} {totalFeedback === 1 ? 'entry' : 'entries'}</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <FeedbackCardSkeleton key={i} />
            ))}
          </div>
        ) : allFeedback.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl py-16 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"/>
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No feedback received yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Feedback from evaluations and log reviews will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allFeedback.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/30 transition"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {item.type === 'logbook' ? (
                      <WeekBadge weekNumber={item.week} />
                    ) : (
                      <EvalBadge role={item.evaluatorRole} />
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">
                        {item.type === 'logbook'
                          ? `Week ${item.week} — Log Review`
                          : `Performance Evaluation`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.from} · {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  {item.type === 'logbook' ? (
                    <StatusBadge status={item.status} />
                  ) : item.score != null ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-indigo-500/20 text-indigo-300 border-indigo-500/30 whitespace-nowrap">
                      Score: {Number(item.score).toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 whitespace-nowrap">
                      Submitted
                    </span>
                  )}
                </div>

                {/* Feedback Comment Block */}
                <div className={`border rounded-xl px-4 py-3 ${
                  item.type === 'evaluation' && item.evaluatorRole === 'workplace_supervisor'
                    ? 'bg-purple-500/10 border-purple-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${
                      item.type === 'evaluation' && item.evaluatorRole === 'workplace_supervisor'
                        ? 'text-purple-400' : 'text-blue-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"/>
                    </svg>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${
                      item.type === 'evaluation' && item.evaluatorRole === 'workplace_supervisor'
                        ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {item.from}
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {item.comment}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-600">
                    {item.type === 'logbook' ? `Week #${item.week} logbook` : 'Performance evaluation'}
                  </span>
                  {item.type === 'logbook' && item.status === 'approved' && (
                    <span className="text-xs text-emerald-400 font-medium">Approved by supervisor</span>
                  )}
                  {item.type === 'logbook' && item.status === 'reviewed' && (
                    <span className="text-xs text-blue-400 font-medium">Reviewed — awaiting approval</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
