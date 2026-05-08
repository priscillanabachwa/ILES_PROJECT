import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'

const STATUS_STYLES = {
  draft:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  submitted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  reviewed:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize border whitespace-nowrap ${STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
      {status || 'unknown'}
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
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchWithAuth(`${API}/weeklylogs/logbooks/`)
        setLogs(Array.isArray(data) ? data : [])
      } catch {
        setError('Failed to load feedback. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  // Only show logbooks that have a non-empty supervisor comment
  const feedbackLogs = logs.filter(
    (l) => l.supervisor_comment && l.supervisor_comment.trim() !== ''
  )

  // Sort: most recent submission first
  const sorted = [...feedbackLogs].sort((a, b) => {
    if (!a.submitted_at && !b.submitted_at) return 0
    if (!a.submitted_at) return 1
    if (!b.submitted_at) return -1
    return new Date(b.submitted_at) - new Date(a.submitted_at)
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Supervisor Feedback</h1>
        <p className="text-sm text-slate-400 mt-1">
          Comments and feedback left by your supervisors on your weekly log entries.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stat Card */}
      {loading ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3 w-full sm:max-w-xs">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-12" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Feedback Received</p>
            <p className="text-4xl font-black text-indigo-400">{feedbackLogs.length}</p>
            <p className="text-xs text-slate-600 mt-2">
              out of {logs.length} {logs.length === 1 ? 'log' : 'logs'} total
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
          {!loading && feedbackLogs.length > 0 && (
            <span className="text-xs text-slate-500">{feedbackLogs.length} {feedbackLogs.length === 1 ? 'entry' : 'entries'}</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <FeedbackCardSkeleton key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl py-16 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"/>
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No feedback received yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Supervisor comments will appear here once your logs have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((log) => (
              <div
                key={log.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/30 transition"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <WeekBadge weekNumber={log.week_number} />
                    <div>
                      <p className="text-sm font-bold text-white">Week {log.week_number} N/A Logbook Entry</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submitted: {formatDate(log.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={log.status} />
                </div>

                {/* Supervisor Feedback Block */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"/>
                    </svg>
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Supervisor Feedback</p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {log.supervisor_comment}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-600">Log #{log.id}</span>
                  {log.status === 'approved' && (
                    <span className="text-xs text-emerald-400 font-medium">Approved by supervisor</span>
                  )}
                  {log.status === 'reviewed' && (
                    <span className="text-xs text-blue-400 font-medium">Reviewed N/A awaiting approval</span>
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
