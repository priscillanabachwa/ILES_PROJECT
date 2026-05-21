import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'
import { capName } from '../services/dashboardService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

const STATUS_STYLES = {
  draft:     'bg-slate-500/15 text-slate-400 border-slate-500/25',
  submitted: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  reviewed:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  approved:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/25',
}

function ReviewModal({ log, onClose, onSuccess }) {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!comment.trim()) { toast.error('Supervisor comment is required.'); return }
    setSubmitting(true)
    try {
      await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/review/`, {
        method: 'POST',
        body: JSON.stringify({ supervisor_comment: comment.trim() }),
      })
      toast.success('Log marked as reviewed.')
      onSuccess(log.id, 'reviewed', comment.trim())
      onClose()
    } catch {
      toast.error('Failed to review log.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Review Log — Week {log.week_number}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{log.student_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50 space-y-3 max-h-48 overflow-y-auto">
            <div>
              <p className="text-xs text-slate-500 mb-1">Activities</p>
              <p className="text-slate-300 text-sm">{log.activities || 'No activities recorded.'}</p>
            </div>
            {log.challenges && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Challenges</p>
                <p className="text-slate-300 text-sm">{log.challenges}</p>
              </div>
            )}
            {log.lesson && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Lessons Learned</p>
                <p className="text-slate-300 text-sm">{log.lesson}</p>
              </div>
            )}
          </div>
          {log.attachment_url && (
            <a
              href={log.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-600/20 transition group"
            >
              <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <span className="text-sm text-indigo-300 group-hover:text-indigo-200 flex-1 truncate">
                {decodeURIComponent(log.attachment_url.split('/').pop())}
              </span>
              <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          )}
          {log.workplace_comment && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <p className="text-xs text-purple-400 mb-1">Workplace Supervisor Comment</p>
              <p className="text-slate-300 text-sm">{log.workplace_comment}</p>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              Supervisor Comment <span className="text-red-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Enter your review comment..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-4 border-t border-slate-700/50 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LogDetailModal({ log, onClose }) {
  if (!log) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Week {log.week_number} — {log.student_name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{log.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Activities</p>
              <p className="text-slate-300 text-sm">{log.activities || 'No activities recorded.'}</p>
            </div>
            {log.challenges && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Challenges</p>
                <p className="text-slate-300 text-sm">{log.challenges}</p>
              </div>
            )}
            {log.lesson && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Lessons Learned</p>
                <p className="text-slate-300 text-sm">{log.lesson}</p>
              </div>
            )}
          </div>
          {log.workplace_comment && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-xs text-purple-400 mb-1">Workplace Supervisor Comment</p>
              <p className="text-slate-300 text-sm">{log.workplace_comment}</p>
            </div>
          )}
          {log.supervisor_comment && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-400 mb-1">Academic Supervisor Comment</p>
              <p className="text-slate-300 text-sm">{log.supervisor_comment}</p>
            </div>
          )}
          {log.attachment_url && (
            <a
              href={log.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-600/20 transition group"
            >
              <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <span className="text-sm text-indigo-300 group-hover:text-indigo-200 flex-1 truncate">
                {log.attachment_url.split('/').pop()}
              </span>
              <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[log.status] || STATUS_STYLES.draft}`}>
                {log.status}
              </span>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Submitted</p>
              <p className="text-slate-300 text-xs">{formatDate(log.submitted_at)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AcademicLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewLog, setReviewLog] = useState(null)
  const [detailLog, setDetailLog] = useState(null)

  const [evaluatedPlacements, setEvaluatedPlacements] = useState(new Set())

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [logsData, placementsData, evalsData] = await Promise.all([
          fetchWithAuth(`${API}/weeklylogs/logbooks/`).catch(() => []),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
        ])
        const pm = Object.fromEntries(
          (Array.isArray(placementsData) ? placementsData : []).map(p => [p.id, p])
        )
        setLogs(
          (Array.isArray(logsData) ? logsData : []).map(l => ({
            ...l,
            student_name: capName(pm[l.placement]?.student_name || `Placement #${l.placement}`),
            company: pm[l.placement]?.company_name || '—',
          }))
        )
        setEvaluatedPlacements(new Set(
          (Array.isArray(evalsData) ? evalsData : [])
            .filter(e => e.status === 'SUBMITTED')
            .map(e => e.placement)
        ))
      } catch {
        toast.error('Failed to load logs.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const handleStatusUpdate = (id, newStatus, comment) => {
    setLogs(prev => prev.map(l =>
      l.id === id ? { ...l, status: newStatus, supervisor_comment: comment || l.supervisor_comment } : l
    ))
  }

  const handleApprove = async (log) => {
    try {
      await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/approve/`, { method: 'POST' })
      toast.success('Log approved.')
      handleStatusUpdate(log.id, 'approved', '')
    } catch {
      toast.error('Failed to approve log.')
    }
  }

  const total    = logs.length
  const submitted = logs.filter(l => l.status === 'submitted').length
  const reviewed  = logs.filter(l => l.status === 'reviewed').length
  const approved  = logs.filter(l => l.status === 'approved').length

  const filtered = logs.filter((l) => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    const matchSearch = search === '' ||
      l.student_name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {reviewLog && (
        <ReviewModal log={reviewLog} onClose={() => setReviewLog(null)} onSuccess={handleStatusUpdate} />
      )}
      {detailLog && (
        <LogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Internship Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Review and approve weekly logs from your assigned students</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs',  value: total,     color: 'text-white',       bg: 'bg-slate-800/50 border-slate-700/50'    },
          { label: 'Submitted',   value: submitted, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
          { label: 'Reviewed',    value: reviewed,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'      },
          { label: 'Approved',    value: approved,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'},
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search by student or company..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',       label: 'All'      },
            { key: 'submitted', label: 'Submitted' },
            { key: 'reviewed',  label: 'Reviewed'  },
            { key: 'approved',  label: 'Approved'  },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                statusFilter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Student', 'Company', 'Week', 'Status', 'Submitted', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No logs found.</td>
                  </tr>
                )}
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/20 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                          {log.student_name?.[0] || '?'}
                        </div>
                        <p className="text-white text-sm font-medium">{log.student_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300 text-sm">{log.company}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-300 text-sm font-medium">Week {log.week_number}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[log.status] || STATUS_STYLES.draft}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-500 text-xs">{formatDate(log.submitted_at)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDetailLog(log)}
                          className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-medium transition">
                          View
                        </button>
                        {log.status === 'submitted' && (
                          <button onClick={() => setReviewLog(log)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition">
                            Review
                          </button>
                        )}
                        {log.status === 'reviewed' && (() => {
                          const canApprove = evaluatedPlacements.has(log.placement)
                          return (
                            <div className="relative group">
                              <button
                                onClick={() => canApprove && handleApprove(log)}
                                disabled={!canApprove}
                                className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition ${
                                  canApprove
                                    ? 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-700/30 text-slate-500 border-slate-600/30 cursor-not-allowed'
                                }`}>
                                Approve
                              </button>
                              {!canApprove && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                                  Submit an evaluation for this student first
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {total} logs</p>
          <p className="text-slate-500 text-xs">{submitted} pending your review · {reviewed} awaiting approval</p>
        </div>
      </div>
    </div>
  )
}

