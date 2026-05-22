import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getAuthToken, fetchWithAuth } from '../services/authService'

const API = '/api'

const ACCEPTED_EXT  = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'
const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])
const MAX_MB = 10

// ── utilities ──────────────────────────────────────────────────────────────

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const fmtSize = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`

const isOverdue = (d) => (d ? new Date(d) < new Date() : false)

const STATUS = {
  draft:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  submitted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  reviewed:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

// ── small shared components ────────────────────────────────────────────────

function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize border whitespace-nowrap
      ${STATUS[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
      {status || 'unknown'}
    </span>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-700/50 ${className}`} />
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50">
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function WorkflowTracker({ status }) {
  const steps = ['draft', 'submitted', 'reviewed', 'approved']
  const idx   = steps.indexOf(status?.toLowerCase() ?? '')
  return (
    <div className="flex items-start mt-3 pt-3 border-t border-slate-700/50">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition
              ${i <= idx ? 'bg-indigo-600 border-indigo-600 text-white' :
                           'bg-slate-800 border-slate-600'}`}>
              {i <= idx && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <p className={`text-xs text-center ${i <= idx ? 'text-slate-300' : 'text-slate-600'}`}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 -mt-3 ${i < idx ? 'bg-indigo-600' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function AttachmentLink({ url }) {
  if (!url) return null
  const name = decodeURIComponent(url.split('/').pop()) || 'attachment'
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
      </svg>
      {name.length > 40 ? name.slice(0, 40) + '...' : name}
    </a>
  )
}

// ── field wrapper ──────────────────────────────────────────────────────────

function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
          </svg>
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  )
}

const inputCls = (hasErr) =>
  `w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 bg-slate-700/50 outline-none transition
   border focus:ring-2 ${hasErr
     ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
     : 'border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20'}`

// ══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════

export default function MyLogsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  /* ── list state ─────────────────────────────────────────────────────── */
  const [logs,        setLogs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [listError,   setListError]   = useState('')
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('all')
  const [placementId,  setPlacementId]  = useState(null)
  const [placement,    setPlacement]    = useState(null)

  /* ── form state ─────────────────────────────────────────────────────── */
  const [view,        setView]       = useState(location.state?.openForm ? 'new' : 'history')
  const [editingLog,  setEditingLog] = useState(null)
  const [weekNumber,  setWeekNumber] = useState('')
  const [activities,  setActivities] = useState('')
  const [challenges,  setChallenges] = useState('')
  const [lesson,      setLesson]     = useState('')
  const [saveAs,      setSaveAs]     = useState('submitted')
  const [attachment,  setAttachment] = useState(null)
  const [submitting,  setSubmitting] = useState(false)

  // inline field errors (only shown after submit attempt)
  const [fieldErrors, setFieldErrors] = useState({})

  const fileRef    = useRef(null)
  const formTopRef = useRef(null)

  /* ── data ───────────────────────────────────────────────────────────── */
  const fetchLogs = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API}/weeklylogs/logbooks/`)
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      setListError(err.message || 'Failed to refresh logs. Please reload the page.')
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [logData, placements] = await Promise.all([
          fetchWithAuth(`${API}/weeklylogs/logbooks/`),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
        ])
        setLogs(Array.isArray(logData) ? logData : [])
        const active = Array.isArray(placements)
          ? placements.find(p => p.status === 'ACTIVE') || placements[0]
          : null
        setPlacementId(active?.id ?? null)
        setPlacement(active ?? null)
      } catch {
        setListError('Failed to load your logbooks. Please refresh.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ── file handling ──────────────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_MIME.has(file.type)) {
      toast.error('File type not supported. Use PDF, Word, Excel, JPG or PNG.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File exceeds ${MAX_MB} MB limit. Please choose a smaller file.`)
      e.target.value = ''
      return
    }
    setAttachment(file)
    setFieldErrors(p => ({ ...p, file: '' }))
  }

  const removeFile = () => {
    setAttachment(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── form reset ─────────────────────────────────────────────────────── */
  const resetForm = () => {
    setEditingLog(null)
    setWeekNumber('')
    setActivities('')
    setChallenges('')
    setLesson('')
    setSaveAs('submitted')
    setAttachment(null)
    setFieldErrors({})
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── load draft into form ────────────────────────────────────────────── */
  const handleEditDraft = (log) => {
    setEditingLog(log)
    setWeekNumber(String(log.week_number))
    setActivities(log.activities || '')
    setChallenges(log.challenges || '')
    setLesson(log.lesson || '')
    setSaveAs('draft')
    setAttachment(null)
    setFieldErrors({})
    if (fileRef.current) fileRef.current.value = ''
    setView('new')
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  /* ── submit ─────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    // ── validation ──────────────────────────────────────────────────────
    const errs = {}
    if (!weekNumber || isNaN(Number(weekNumber)) || Number(weekNumber) < 1) {
      errs.weekNumber = 'Enter a valid week number.'
    }
    if (!activities.trim()) {
      errs.activities = 'Activities field is required.'
    }
    if (saveAs === 'submitted' && !lesson.trim()) {
      errs.lesson = 'Lessons Learned is required when submitting.'
    }
    setFieldErrors(errs)

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0]
      const messages = { weekNumber: 'Please enter a week number.', activities: 'Please fill in the Activities field — it is required.', lesson: 'Please fill in Lessons Learned before submitting.' }
      toast.error(messages[firstKey] || 'Please fix the highlighted fields before saving.')
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (!placementId) {
      toast.error('No active placement found. Ask your administrator to assign you to a placement.')
      return
    }

    if (saveAs === 'submitted' && (!placement?.workplace_supervisor || !placement?.academic_supervisor)) {
      toast.error('You cannot submit a log until both supervisors have been assigned. Please contact your administrator.', { autoClose: 6000 })
      return
    }

    // ── send ─────────────────────────────────────────────────────────────
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('placement',   placementId)
      body.append('week_number', Number(weekNumber))
      body.append('activities',  activities.trim())
      body.append('challenges',  challenges.trim())
      body.append('lesson',      lesson.trim())
      body.append('status',      saveAs)
      if (attachment) body.append('attachment', attachment)

      if (editingLog) {
        await axios.patch(`${API}/weeklylogs/logbooks/${editingLog.id}/`, body, {
          headers: { Authorization: `Token ${getAuthToken()}` },
        })
      } else {
        await axios.post(`${API}/weeklylogs/logbooks/`, body, {
          headers: { Authorization: `Token ${getAuthToken()}` },
        })
      }

      toast.success(
        saveAs === 'submitted'
          ? 'Log submitted successfully! Your supervisor has been notified.'
          : editingLog
            ? 'Draft updated. You can continue editing or submit when ready.'
            : 'Draft saved. You can edit and submit it later.'
      )

      resetForm()
      setFilter('all')
      await fetchLogs()
      setView('history')

    } catch (err) {
      const data = err.response?.data
      let msg = 'Something went wrong. Please try again.'
      if (data) {
        if (typeof data === 'string') {
          msg = data
        } else if (data.detail) {
          msg = data.detail
        } else if (data.non_field_errors) {
          const raw = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors
          // friendlier message for unique-week constraint
          msg = raw.toLowerCase().includes('week_number')
            ? `You already have a log for Week ${weekNumber}. Please choose a different week number.`
            : raw
        } else if (data.week_number) {
          msg = Array.isArray(data.week_number) ? data.week_number[0] : data.week_number
        } else if (data.activities) {
          msg = 'Activities field is required.'
        } else {
          const first = Object.entries(data)[0]
          if (first) {
            const [field, val] = first
            const valMsg = Array.isArray(val) ? val[0] : val
            msg = `${field}: ${valMsg}`
          }
        }
      } else if (err.message) {
        msg = err.message
      }
      console.error('[LOG SUBMIT ERROR]', err.response?.status, data)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── derived list values ────────────────────────────────────────────── */
  const safeLogs = Array.isArray(logs) ? logs : []
  const filtered = safeLogs.filter(l =>
    (filter === 'all' || l.status === filter) &&
    (!search ||
      `Week ${l.week_number}`.toLowerCase().includes(search.toLowerCase()) ||
      l.activities?.toLowerCase().includes(search.toLowerCase()))
  )
  const counts = {
    all:       safeLogs.length,
    draft:     safeLogs.filter(l => l.status === 'draft').length,
    submitted: safeLogs.filter(l => l.status === 'submitted').length,
    reviewed:  safeLogs.filter(l => l.status === 'reviewed').length,
    approved:  safeLogs.filter(l => l.status === 'approved').length,
  }

  const FILTERS = [
    { key: 'all',       label: 'All'       },
    { key: 'draft',     label: 'Draft'     },
    { key: 'submitted', label: 'Submitted' },
    { key: 'reviewed',  label: 'Reviewed'  },
    { key: 'approved',  label: 'Approved'  },
  ]

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Weekly Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            {view === 'history'
              ? 'All your internship logbook entries.'
              : 'Document your internship activities for the week.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setView('history'); resetForm() }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition
              ${view === 'history'
                ? 'bg-indigo-600 text-white shadow'
                : 'border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            View Logs
          </button>
          <button
            onClick={() => { resetForm(); setView('new') }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition
              ${view === 'new'
                ? 'bg-indigo-600 text-white shadow'
                : 'border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            New Log
          </button>
        </div>
      </div>

      {/* ══════════ LOG HISTORY ═════════════════════════════════════ */}
      {view === 'history' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'all',       label: 'Total',     color: 'text-white'       },
              { key: 'draft',     label: 'Draft',     color: 'text-slate-400'   },
              { key: 'submitted', label: 'Submitted', color: 'text-amber-300'   },
              { key: 'reviewed',  label: 'Reviewed',  color: 'text-blue-300'    },
              { key: 'approved',  label: 'Approved',  color: 'text-emerald-300' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`bg-slate-800/50 border rounded-xl p-3 text-center transition hover:border-indigo-500/40
                  ${filter === key ? 'border-indigo-500/50' : 'border-slate-700/50'}`}
              >
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
              </button>
            ))}
          </div>

          {/* Filter bar + search */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex-wrap">
              {FILTERS.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                    ${filter === key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                  {label}
                  {counts[key] > 0 && (
                    <span className={`ml-1 ${filter === key ? 'text-indigo-200' : 'text-slate-600'}`}>
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
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-36"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {listError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
              {listError}
            </div>
          )}

          {loading ? <ListSkeleton /> : (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor"
                    strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <p className="text-sm text-slate-500 font-medium">
                    {search ? 'No logs match your search.' : filter !== 'all' ? `No ${filter} logs yet.` : 'No logs submitted yet.'}
                  </p>
                  {filter === 'all' && !search && (
                    <button
                      onClick={() => { resetForm(); setView('new') }}
                      className="mt-2 text-xs text-indigo-400 hover:underline">
                      Submit your first log
                    </button>
                  )}
                </div>
              ) : filtered.map(log => (
                <div key={log.id}
                  className={`bg-slate-800/50 border rounded-2xl p-4 transition hover:bg-slate-800/70
                    ${isOverdue(log.deadline) && log.status === 'draft'
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-slate-700/50 hover:border-indigo-500/30'}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      W{log.week_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <p className="text-sm font-bold text-white">Week {log.week_number} – Logbook Entry</p>
                        <div className="flex items-center gap-2">
                          {isOverdue(log.deadline) && log.status === 'draft' && (
                            <span className="text-xs text-red-400 font-semibold">Overdue!</span>
                          )}
                          <Badge status={log.status} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                        {log.activities || 'No activities recorded.'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {log.submitted_at && <span>Submitted: {fmt(log.submitted_at)}</span>}
                        {log.deadline && (
                          <span className={isOverdue(log.deadline) && log.status === 'draft' ? 'text-red-400' : ''}>
                            Due: {fmt(log.deadline)}
                          </span>
                        )}
                        <span>Log #{log.id}</span>
                      </div>
                      {log.attachment_url && <AttachmentLink url={log.attachment_url} />}
                      {log.supervisor_comment && (
                        <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Supervisor Feedback</p>
                          <p className="text-xs text-blue-300 line-clamp-2">{log.supervisor_comment}</p>
                        </div>
                      )}
                      <WorkflowTracker status={log.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50 text-xs">
                    <span>
                      {log.status === 'approved'            && <span className="text-emerald-400 font-medium">Approved by supervisor</span>}
                      {log.status === 'reviewed'            && <span className="text-blue-400 font-medium">Reviewed – awaiting approval</span>}
                      {log.status === 'submitted'           && <span className="text-amber-400 font-medium">Awaiting workplace supervisor review</span>}
                      {log.status === 'draft'               && <span className="text-slate-500">Draft – not yet submitted</span>}
                    </span>
                    {log.status === 'draft' && (
                      <button
                        onClick={() => handleEditDraft(log)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/25 transition"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Edit &amp; Submit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════ NEW LOG FORM ════════════════════════════════════ */}
      {view === 'new' && (
        <div ref={formTopRef} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">

          {/* Form header */}
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingLog ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {editingLog
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                }
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {editingLog ? `Edit Draft — Week ${editingLog.week_number}` : 'New Weekly Logbook Entry'}
              </p>
              <p className="text-xs text-slate-400">
                {editingLog
                  ? 'Update your draft and submit when ready.'
                  : <>Fields marked <span className="text-red-400">*</span> are required</>
                }
              </p>
            </div>
          </div>

          {/* No placement banner */}
          {!loading && !placementId && (
            <div className="mx-6 mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>No active placement found. Contact your administrator before submitting logs.</span>
            </div>
          )}

          {/* Missing supervisors banner */}
          {!loading && placementId && (!placement?.workplace_supervisor || !placement?.academic_supervisor) && (
            <div className="mx-6 mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div>
                <p className="font-semibold">Supervisors not yet assigned</p>
                <p className="mt-0.5 text-red-400">
                  {!placement?.workplace_supervisor && !placement?.academic_supervisor
                    ? 'You have no workplace supervisor or academic supervisor assigned.'
                    : !placement?.workplace_supervisor
                      ? 'You have no workplace supervisor assigned.'
                      : 'You have no academic supervisor assigned.'}
                  {' '}You can save drafts but <strong>cannot submit</strong> until both are assigned. Please contact your administrator.
                </p>
              </div>
            </div>
          )}

          <div className="p-6 space-y-5">

            {/* Week Number */}
            <Field label="Week Number" required error={fieldErrors.weekNumber}>
              <input
                type="number"
                min="1"
                max="52"
                placeholder="e.g. 6"
                value={weekNumber}
                onChange={e => { setWeekNumber(e.target.value); setFieldErrors(p => ({ ...p, weekNumber: '' })) }}
                className={inputCls(!!fieldErrors.weekNumber)}
              />
            </Field>

            {/* Activities */}
            <Field label="Activities This Week" required error={fieldErrors.activities}
              hint={!fieldErrors.activities ? `${activities.length} characters` : ''}>
              <textarea
                rows={5}
                placeholder="Describe what you worked on this week..."
                value={activities}
                onChange={e => { setActivities(e.target.value); setFieldErrors(p => ({ ...p, activities: '' })) }}
                className={`${inputCls(!!fieldErrors.activities)} resize-none`}
              />
            </Field>

            {/* Challenges */}
            <Field label="Challenges Faced">
              <textarea
                rows={3}
                placeholder="Any difficulties or blockers you encountered..."
                value={challenges}
                onChange={e => setChallenges(e.target.value)}
                className={`${inputCls(false)} resize-none`}
              />
            </Field>

            {/* Lessons Learned */}
            <Field
              label="Lessons Learned"
              required={saveAs === 'submitted'}
              error={fieldErrors.lesson}
              hint={!fieldErrors.lesson ? `${lesson.length} characters` : ''}
            >
              <textarea
                rows={3}
                placeholder="What did you learn this week?"
                value={lesson}
                onChange={e => { setLesson(e.target.value); setFieldErrors(p => ({ ...p, lesson: '' })) }}
                className={`${inputCls(!!fieldErrors.lesson)} resize-none`}
              />
            </Field>

            {/* Supporting Document */}
            <Field label="Supporting Document" hint="PDF, Word, Excel, JPG, PNG — max 10 MB">
              {/* Existing attachment on edit (when no new file picked yet) */}
              {!attachment && editingLog?.attachment_url && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/30 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 mb-0.5">Current attachment</p>
                    <a href={editingLog.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-indigo-400 hover:text-indigo-300 truncate block">
                      {decodeURIComponent(editingLog.attachment_url.split('/').pop())}
                    </a>
                  </div>
                  <span className="text-xs text-slate-500">Replace below</span>
                </div>
              )}
              {attachment ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/30">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-slate-500">{fmtSize(attachment.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-600
                  bg-slate-700/20 hover:border-indigo-500 hover:bg-indigo-500/5 cursor-pointer transition">
                  <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <div>
                    <p className="text-sm text-slate-300">Click to attach a file</p>
                    <p className="text-xs text-slate-500">PDF, Word, Excel, JPG, PNG</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_EXT}
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </Field>

            {/* Save As */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Save As <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'draft',     label: 'Draft',       sub: 'Save for later'     },
                  { value: 'submitted', label: 'Submit Now',  sub: 'Send to supervisor' },
                ].map(({ value, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setSaveAs(value); setFieldErrors(p => ({ ...p, lesson: '' })) }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
                      ${saveAs === value
                        ? value === 'submitted'
                          ? 'border-indigo-500 bg-indigo-600/15 ring-1 ring-indigo-500/30'
                          : 'border-slate-500 bg-slate-700/60 ring-1 ring-slate-500/30'
                        : 'border-slate-700/60 text-slate-500 hover:border-slate-500 hover:bg-slate-700/30'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition
                      ${saveAs === value
                        ? value === 'submitted' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-400 bg-slate-500'
                        : 'border-slate-600'}`}>
                      {saveAs === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${saveAs === value ? 'text-white' : 'text-slate-400'}`}>{label}</p>
                      <p className="text-xs text-slate-500">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Action Buttons ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => { resetForm(); navigate('/student/logs'); setView('history') }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400
                  hover:bg-slate-700/50 hover:text-white disabled:opacity-50 transition active:scale-[0.98]"
              >
                Back to Logs
              </button>

              {/* THE ONE SUBMIT BUTTON */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2
                  transition active:scale-[0.98] shadow-sm
                  ${submitting
                    ? 'bg-indigo-600/60 text-white cursor-not-allowed'
                    : saveAs === 'submitted'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                      : 'bg-slate-600 hover:bg-slate-500 text-white cursor-pointer'}`}
              >
                {submitting ? (
                  <>
                    <Spinner />
                    {saveAs === 'submitted' ? 'Submitting...' : 'Saving...'}
                  </>
                ) : saveAs === 'submitted' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    Submit Log
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                    </svg>
                    Save Draft
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
