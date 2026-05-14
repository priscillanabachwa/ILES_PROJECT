import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const STATUS_STYLES = {
  draft:               'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  submitted:           'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  workplace_reviewed:  'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  reviewed:            'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  overdue:             'bg-red-500/20 text-red-300 border border-red-500/30',
}

function Badge({ status, overdue = false }) {
  const s = overdue ? 'overdue' : status
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[s] || 'bg-slate-500/20 text-slate-400'}`}>
      {overdue ? 'Overdue' : status?.toLowerCase()}
    </span>
  )
}

const AVATAR_COLORS = ['bg-indigo-600','bg-emerald-600','bg-amber-500','bg-rose-500','bg-teal-600','bg-violet-600']

function AvatarCircle({ name, index = 0 }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div className={`w-8 h-8 rounded-full ${bg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function LogSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3,4,5].map((_i) => (
        <div key={_i} className="p-4 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-20 rounded-full ml-auto" />
          </div>
          <Skeleton className="h-2.5 w-2/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function LogDetailModal({ log, onClose, onStatusChange }) {
  const [feedback, setFeedback] = useState(log.supervisor_comment || '')
  const [saving,   setSaving]   = useState(false)

  const handleAction = async (action) => {
    if (action === 'reviewed' && !feedback.trim()) {
      toast.error('A comment is required to mark a log as reviewed.')
      return
    }
    setSaving(true)
    try {
      if (action === 'reviewed') {
        await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/review/`, {
          method: 'POST',
          body: JSON.stringify({ supervisor_comment: feedback.trim() }),
        })
      } else if (action === 'approved') {
        await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/approve/`, { method: 'POST' })
      }
      onStatusChange(log.id, action, feedback)
      toast.success(`Log ${action} successfully!`)
      onClose()
    } catch (err) {
      toast.error(err.message || `Failed to ${action} log.`)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div>
            <p className="text-sm font-bold text-white">Week {log.week_number} — Log #{log.id}</p>
            <p className="text-xs text-slate-400 mt-0.5">Submitted {formatDate(log.submitted_at)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Badge status={log.status} overdue={isOverdue(log.deadline) && log.status === 'submitted'} />
            {log.deadline && (
              <span className={`text-xs ${isOverdue(log.deadline) && log.status !== 'approved' ? 'text-red-400' : 'text-slate-500'}`}>
                Due: {formatDate(log.deadline)}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Activities This Week</p>
            <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed">{log.activities || 'No activities recorded.'}</p>
            </div>
          </div>

          {log.challenges && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Challenges Faced</p>
              <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{log.challenges}</p>
              </div>
            </div>
          )}

          {log.lesson && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lessons Learned</p>
              <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{log.lesson}</p>
              </div>
            </div>
          )}

          {log.attachment_url && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Attached Document</p>
              <a
                href={log.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-600/20 transition group"
              >
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
                <span className="text-sm text-indigo-300 group-hover:text-indigo-200 truncate">
                  {log.attachment_url.split('/').pop()}
                </span>
                <svg className="w-4 h-4 text-indigo-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          )}

          {log.workplace_comment && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Workplace Supervisor Comment</p>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300">{log.workplace_comment}</p>
              </div>
            </div>
          )}

          {log.status !== 'approved' && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {log.status === 'reviewed' ? 'Academic Supervisor Comment' : 'Admin Comment (required to review)'}
              </p>
              <textarea
                rows={3}
                placeholder="Write a comment for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-slate-700/50 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder-slate-500 resize-none"
              />
            </div>
          )}

          {log.status !== 'approved' && (
            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
                Cancel
              </button>
              {log.status === 'submitted' && (
                <button onClick={() => handleAction('reviewed')} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Mark Reviewed'}
                </button>
              )}
              {log.status === 'reviewed' && (
                <button onClick={() => handleAction('approved')} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Approve'}
                </button>
              )}
            </div>
          )}

          {log.status === 'approved' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-300 font-medium">This log has been approved</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLogsPage() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [selectedLog,     setSelectedLog]     = useState(null)
  const [actioningId,     setActioningId]     = useState(null)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchWithAuth(`${API}/weeklylogs/logbooks/`)
        setLogs(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Failed to load logs.')
      } finally { setLoading(false) }
    }
    fetchLogs()
  }, [])

  const handleStatusChange = (id, newStatus, feedback) => {
    setLogs((prev) => prev.map((l) =>
      l.id === id ? { ...l, status: newStatus, supervisor_comment: feedback || l.supervisor_comment } : l
    ))
    // Update modal log if open
    if (selectedLog?.id === id) {
      setSelectedLog(prev => ({ ...prev, status: newStatus, supervisor_comment: feedback || prev.supervisor_comment }))
    }
  }

  const handleQuickApprove = async (log) => {
    if (actioningId) return
    setActioningId(log.id)
    try {
      await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/approve/`, { method: 'POST' })
      handleStatusChange(log.id, 'approved', '')
      toast.success(`Log approved for ${log.placement_label || `Log #${log.id}`}!`)
    } catch (err) {
      toast.error(err.message || 'Failed to approve log.')
    } finally { setActioningId(null) }
  }

  const handleQuickReview = async (log) => {
    if (actioningId) return
    setActioningId(log.id)
    try {
      await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/review/`, {
        method: 'POST',
        body: JSON.stringify({ supervisor_comment: 'Reviewed by administrator' }),
      })
      handleStatusChange(log.id, 'reviewed', 'Reviewed by administrator')
      toast.success(`Log marked as reviewed!`)
    } catch (err) {
      toast.error(err.message || 'Failed to review log.')
    } finally { setActioningId(null) }
  }

  const filtered = logs.filter((l) => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    const matchSearch = search === '' ||
      `week ${l.week_number}`.includes(search.toLowerCase()) ||
      l.activities?.toLowerCase().includes(search.toLowerCase()) ||
      String(l.placement).includes(search)
    return matchStatus && matchSearch
  })

  const counts = {
    all:       logs.length,
    draft:     logs.filter((l) => l.status === 'draft').length,
    submitted: logs.filter((l) => l.status === 'submitted').length,
    reviewed:  logs.filter((l) => l.status === 'reviewed').length,
    approved:  logs.filter((l) => l.status === 'approved').length,
    overdue:   logs.filter((l) => isOverdue(l.deadline) && l.status === 'submitted').length,
  }

  const FILTERS = [
    { key:'all',       label:'All'       },
    { key:'submitted', label:'Submitted' },
    { key:'reviewed',  label:'Reviewed'  },
    { key:'approved',  label:'Approved'  },
    { key:'draft',     label:'Draft'     },
  ]

  return (
    <div className="space-y-6">

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Internship Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            View, review and approve all student logbook submissions.
          </p>
        </div>
        {counts.overdue > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {counts.overdue} overdue {counts.overdue === 1 ? 'log' : 'logs'} need attention
          </div>
        )}
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key:'all',       label:'Total',   color:'text-white'       },
          { key:'submitted', label:'Pending', color:'text-amber-300'   },
          { key:'reviewed',  label:'Reviewed',color:'text-blue-300'    },
          { key:'approved',  label:'Approved',color:'text-emerald-300' },
          { key:'draft',     label:'Draft',   color:'text-slate-400'   },
          { key:'overdue',   label:'Overdue', color:'text-red-300'     },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${statusFilter === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1.5 text-xs ${statusFilter === key ? 'text-indigo-200' : 'text-slate-600'}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search activities or week number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {loading ? <LogSkeleton /> : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-sm font-medium">No logs match your filter.</p>
            </div>
          )}

          {filtered.map((log) => (
            <div
              key={log.id}
              className={`bg-slate-800/50 border rounded-2xl p-4 transition
                ${isOverdue(log.deadline) && log.status === 'submitted'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-slate-700/50 hover:border-indigo-500/30'}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  W{log.week_number}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div>
                      <p className="text-sm font-bold text-white">Week {log.week_number} — Placement #{log.placement}</p>
                      <p className="text-xs text-slate-500">Log #{log.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue(log.deadline) && log.status === 'submitted' && (
                        <span className="text-xs text-red-400 font-medium">Overdue!</span>
                      )}
                      <Badge status={log.status} overdue={isOverdue(log.deadline) && log.status === 'submitted'} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-2 mt-1">{log.activities}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    {log.submitted_at && <span>Submitted: {formatDate(log.submitted_at)}</span>}
                    {log.deadline && (
                      <span className={isOverdue(log.deadline) && log.status !== 'approved' ? 'text-red-400' : ''}>
                        Due: {formatDate(log.deadline)}
                      </span>
                    )}
                    {log.attachment_url && <span className="text-indigo-400 text-xs">Attachment</span>}
                    {log.supervisor_comment && <span className="text-blue-400">Comment added</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => setSelectedLog(log)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 transition"
                >
                  View Details
                </button>

                {log.status === 'reviewed' && (
                  <button
                    onClick={() => handleQuickApprove(log)}
                    disabled={actioningId === log.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {actioningId === log.id ? 'Approving...' : 'Approve'}
                  </button>
                )}

                {log.status === 'submitted' && (
                  <button
                    onClick={() => handleQuickReview(log)}
                    disabled={actioningId === log.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition disabled:opacity-50"
                  >
                    {actioningId === log.id ? 'Reviewing...' : 'Mark Reviewed'}
                  </button>
                )}

                {log.status === 'approved' && (
                  <span className="text-xs text-emerald-400 font-medium ml-1">Approved</span>
                )}

                <span className="ml-auto text-xs text-slate-600">Log #{log.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

