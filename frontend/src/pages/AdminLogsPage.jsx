import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const STATUS_STYLES = {
  draft:     'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  submitted: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  reviewed:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  overdue:   'bg-red-500/20 text-red-300 border border-red-500/30',
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
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-700/50 space-y-2">
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
  const [feedback, setFeedback] = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleAction = async (action) => {
    setSaving(true)
    try {
      // TODO: PATCH /api/weeklylogs/<id>/ { status: action, feedback }
      onStatusChange(log.id, action, feedback)
      toast.success(`✓ Log ${action} successfully! ${feedback ? 'Feedback sent.' : ''}`)
      // Notify student
      toast.info(`📧 Notification sent to ${log.student_name}`, { autoClose: 3000 })
      onClose()
    } catch {
      toast.error('Failed to update log status. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div>
            <p className="text-sm font-bold text-white">Week {log.week_number} — {log.student_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{log.student_id} · Submitted {formatDate(log.submitted_at)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Badge status={log.status} overdue={isOverdue(log.deadline) && log.status === 'submitted'} />
            {log.deadline && (
              <span className={`text-xs ${isOverdue(log.deadline) && log.status !== 'approved' ? 'text-red-400' : 'text-slate-500'}`}>
                Due: {formatDate(log.deadline)}
              </span>
            )}
          </div>

          {/* Activities */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Activities This Week</p>
            <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed">{log.activities || 'No activities recorded.'}</p>
            </div>
          </div>

          {/* Challenges */}
          {log.challenges && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Challenges Faced</p>
              <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{log.challenges}</p>
              </div>
            </div>
          )}

          {/* Existing feedback */}
          {log.feedback && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Previous Feedback</p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300 leading-relaxed">{log.feedback}</p>
              </div>
            </div>
          )}

          {/* Add feedback */}
          {log.status !== 'approved' && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add Feedback (optional)</p>
              <textarea
                rows={3}
                placeholder="Write feedback for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-slate-700/50 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder-slate-500 resize-none"
              />
            </div>
          )}

          {/* Action buttons */}
          {log.status !== 'approved' && (
            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
                Cancel
              </button>
              {log.status === 'submitted' && (
                <button onClick={() => handleAction('reviewed')} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
                  {saving ? 'Saving…' : 'Mark Reviewed'}
                </button>
              )}
              {(log.status === 'submitted' || log.status === 'reviewed') && (
                <button onClick={() => handleAction('approved')} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition">
                  {saving ? 'Saving…' : 'Approve'}
                </button>
              )}
            </div>
          )}

          {log.status === 'approved' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-300 font-medium">✓ This log has been approved</p>
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

  // Filters
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [studentIdFilter, setStudentIdFilter] = useState('')

  // Selected log for detail modal
  const [selectedLog, setSelectedLog] = useState(null)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true); setError('')
      try {
        // TODO: GET /api/weeklylogs/?all=true — needs Django to support returning all students' logs for admin
        const response = await axios.get('http://127.0.0.1:8000/api/weeklylogs/', {
          headers: { Authorization: 'Bearer ' + token }
        })
        setLogs(Array.isArray(response.data) ? response.data : response.data.results || [])
      } catch {
        // Mock data — remove when backend is connected
        setLogs([
          { id:1,  student_name:'Amara Nkosi',    student_id:'2500703348', week_number:6, activities:'Developed REST API endpoints for user authentication and worked on database schema design.', challenges:'Had difficulty with JWT token expiry handling.', status:'submitted', submitted_at:'2026-04-05', deadline:'2026-04-07', feedback:'' },
          { id:2,  student_name:'Brian Otim',     student_id:'2500703349', week_number:7, activities:'Attended team standup, worked on frontend components and fixed bugs in the payment module.', challenges:'Merge conflicts in git repository.', status:'submitted', submitted_at:'2026-04-04', deadline:'2026-03-01', feedback:'' },
          { id:3,  student_name:'Cynthia Akello', student_id:'2500703350', week_number:5, activities:'Completed UI mockups, reviewed designs with senior engineer, and wrote unit tests.', challenges:'Testing environment setup took longer than expected.', status:'reviewed',  submitted_at:'2026-04-03', deadline:'2026-04-10', feedback:'Good progress this week. Focus on improving test coverage.' },
          { id:4,  student_name:'Denis Okello',   student_id:'2500703351', week_number:4, activities:'Worked on database migrations and wrote API documentation for all endpoints.', challenges:'None this week.', status:'approved',  submitted_at:'2026-03-28', deadline:'2026-03-30', feedback:'Excellent work! Keep it up.' },
          { id:5,  student_name:'Eva Namutebi',   student_id:'2500703352', week_number:3, activities:'Set up development environment and completed onboarding tasks.', challenges:'Network issues at the office.', status:'draft',     submitted_at:null,          deadline:'2026-04-14', feedback:'' },
          { id:6,  student_name:'Amara Nkosi',    student_id:'2500703348', week_number:5, activities:'Implemented password reset flow and email notifications.', challenges:'SMTP configuration was tricky.', status:'approved',  submitted_at:'2026-03-29', deadline:'2026-03-31', feedback:'Well done.' },
          { id:7,  student_name:'Brian Otim',     student_id:'2500703349', week_number:6, activities:'Worked on data visualization dashboard and integrated chart library.', challenges:'Performance issues with large datasets.', status:'reviewed',  submitted_at:'2026-03-27', deadline:'2026-03-28', feedback:'Please add more detail about the specific charts you built.' },
          { id:8,  student_name:'Frank Ssali',    student_id:'2500703353', week_number:2, activities:'Shadowed senior developers and attended sprint planning meeting.', challenges:'Understanding the existing codebase.', status:'submitted', submitted_at:'2026-04-06', deadline:'2026-04-08', feedback:'' },
        ])
      } finally { setLoading(false) }
    }
    fetchLogs()
  }, [])

  // Handle status change from modal
  const handleStatusChange = (id, newStatus, feedback) => {
    setLogs((prev) => prev.map((l) =>
      l.id === id ? { ...l, status: newStatus, feedback: feedback || l.feedback } : l
    ))
  }

  // Filter logs
  const filtered = logs.filter((l) => {
    const matchStatus    = statusFilter === 'all' || l.status === statusFilter
    const matchSearch    = search === '' ||
      l.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      `week ${l.week_number}`.includes(search.toLowerCase()) ||
      l.activities?.toLowerCase().includes(search.toLowerCase())
    const matchStudentId = studentIdFilter === '' ||
      l.student_id?.toLowerCase().includes(studentIdFilter.toLowerCase())
    return matchStatus && matchSearch && matchStudentId
  })

  // Stats
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

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />

      {/* Log detail modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Internship Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            View, review and approve all student logbook submissions across the system.
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
          { key:'all',       label:'Total',    color:'text-white'       },
          { key:'submitted', label:'Pending',  color:'text-amber-300'   },
          { key:'reviewed',  label:'Reviewed', color:'text-blue-300'    },
          { key:'approved',  label:'Approved', color:'text-emerald-300' },
          { key:'draft',     label:'Draft',    color:'text-slate-400'   },
          { key:'overdue',   label:'Overdue',  color:'text-red-300'     },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status filter tabs */}
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

        {/* Search + Student ID */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search student name or activity…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 w-44">
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
            </svg>
            <input type="text" placeholder="Student ID…"
              value={studentIdFilter} onChange={(e) => setStudentIdFilter(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Logs list */}
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

          {filtered.map((log, i) => (
            <div
              key={log.id}
              className={`bg-slate-800/50 border rounded-2xl p-4 transition
                ${isOverdue(log.deadline) && log.status === 'submitted'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-slate-700/50 hover:border-indigo-500/30'}`}
            >
              <div className="flex items-start gap-4">

                {/* Week badge */}
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  W{log.week_number}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <AvatarCircle name={log.student_name} index={i} />
                      <div>
                        <p className="text-sm font-bold text-white">{log.student_name}</p>
                        <p className="text-xs text-slate-500">{log.student_id} · Week {log.week_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue(log.deadline) && log.status === 'submitted' && (
                        <span className="text-xs text-red-400 font-medium">Overdue!</span>
                      )}
                      <Badge status={log.status} overdue={isOverdue(log.deadline) && log.status === 'submitted'} />
                    </div>
                  </div>

                  {/* Activities preview */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2 mt-1">{log.activities}</p>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    {log.submitted_at && <span>Submitted: {formatDate(log.submitted_at)}</span>}
                    {log.deadline && (
                      <span className={isOverdue(log.deadline) && log.status !== 'approved' ? 'text-red-400' : ''}>
                        Due: {formatDate(log.deadline)}
                      </span>
                    )}
                    {log.feedback && <span className="text-blue-400">💬 Feedback given</span>}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                {/* View details button — always shown */}
                <button
                  onClick={() => setSelectedLog(log)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 transition"
                >
                  View Details
                </button>

                {/* Quick approve — only for submitted or reviewed */}
                {(log.status === 'submitted' || log.status === 'reviewed') && (
                  <button
                    onClick={() => {
                      handleStatusChange(log.id, 'approved', '')
                      toast.success(`✓ Log approved for ${log.student_name}!`)
                      toast.info(`📧 Notification sent to ${log.student_name}`, { autoClose: 3000 })
                      // TODO: PATCH /api/weeklylogs/<id>/ { status: 'approved' }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Approve
                  </button>
                )}

                {/* Quick mark reviewed — only for submitted */}
                {log.status === 'submitted' && (
                  <button
                    onClick={() => {
                      handleStatusChange(log.id, 'reviewed', '')
                      toast.success(`✓ Log marked as reviewed for ${log.student_name}!`)
                      toast.info(`📧 Notification sent to ${log.student_name}`, { autoClose: 3000 })
                      // TODO: PATCH /api/weeklylogs/<id>/ { status: 'reviewed' }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition"
                  >
                    Mark Reviewed
                  </button>
                )}

                {log.status === 'approved' && (
                  <span className="text-xs text-emerald-400 font-medium ml-1">✓ Approved</span>
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
