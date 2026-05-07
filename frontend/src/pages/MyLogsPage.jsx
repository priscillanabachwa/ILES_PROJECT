import { useState, useEffect } from 'react'
import { Link,useLocation } from 'react-router-dom'
import axios from 'axios'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const STATUS_STYLES = {
  draft:     'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  submitted: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  reviewed:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
}

function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status || 'unknown'}
    </span>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
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

function WorkflowStep({ label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
        ${done   ? 'bg-indigo-600 border-indigo-600 text-white' :
          active ? 'bg-slate-800 border-indigo-500 text-indigo-400' :
                   'bg-slate-800 border-slate-600 text-slate-600'}`}>
        {done ? '✓' : ''}
      </div>
      <p className={`text-xs text-center ${active || done ? 'text-slate-300' : 'text-slate-600'}`}>{label}</p>
    </div>
  )
}

function WorkflowTracker({ status }) {
  const steps = ['draft', 'submitted', 'reviewed', 'approved']
  const idx   = steps.indexOf(status?.toLowerCase()) ?? 0
  return (
    <div className="flex items-start mt-3 pt-3 border-t border-slate-700/50">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <WorkflowStep
            label={step.charAt(0).toUpperCase() + step.slice(1)}
            active={i === idx}
            done={i < idx}
          />
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mt-[-10px] ${i < idx ? 'bg-indigo-600' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MyLogsPage() {
  // Logs list state
  const location = useLocation()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  // Form submission state
  const [activeView,        setActiveView]        = useState(location.state?.openForm? 'new':'history') // 'history' | 'new'
    // 'entry' | 'documents'
  const [weekNumber,        setWeekNumber]        = useState('')
  const [activities,        setActivities]        = useState('')
  const [challenges,        setChallenges]        = useState('')
  const [submitStatus,      setSubmitStatus]      = useState('draft')
  const [submitMessage,     setSubmitMessage]     = useState('')
  const [submitting,        setSubmitting]        = useState(false)
  const [attachedDocuments, setAttachedDocuments] = useState([])
   

  const token = localStorage.getItem('access_token')
  const SUPPORTED_FORMATS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']

  // File upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const validFiles = []
    const errors = []

    files.forEach((file) => {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase()
      const fileSizeMB = file.size / (1024 * 1024)

      if (!SUPPORTED_FORMATS.includes(fileExt)) {
        errors.push(`${file.name}: Unsupported format. Allowed: ${SUPPORTED_FORMATS.join(', ')}`)
        return
      }

      if (fileSizeMB > 10) {
        errors.push(`${file.name}: File size exceeds 10MB limit`)
        return
      }

      validFiles.push({
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: fileSizeMB.toFixed(2),
      })
    })

    if (errors.length > 0) {
      setSubmitMessage('error:' + errors.join(' | '))
      return
    }

    setAttachedDocuments([...attachedDocuments, ...validFiles])
    setSubmitMessage('')
    e.target.value = ''
  }

  const removeDocument = (id) => {
    setAttachedDocuments(attachedDocuments.filter((doc) => doc.id !== id))
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '🎯',
      pptx: '🎯',
    }
    return iconMap[ext] || '📎'
  }

  // Fetch logs function (used both on mount and after submission)
  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/weeklylogs/', {
        headers: { Authorization: 'Bearer ' + token }
      })
      setLogs(Array.isArray(response.data) ? response.data : response.data.results ?? [])
    } catch {
      setError('Failed to load your logbooks. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Log submission handler
  const handleSubmitLog = async () => {
    if (!weekNumber || !activities) {
      setSubmitMessage('error:Please fill in Week Number and Activities before saving.')
      return
    }
    setSubmitting(true)
    setSubmitMessage('')
    try {
      const formData = new FormData()
      formData.append('week_number', weekNumber)
      formData.append('activities', activities)
      formData.append('challenges', challenges)
      formData.append('status', submitStatus)
      formData.append('placement', 1)
      formData.append('deadline', '2026-12-31')

      attachedDocuments.forEach((doc) => {
        formData.append('documents', doc.file)
      })

      await axios.post(
        'http://127.0.0.1:8000/api/logs/',
        formData,
        {
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      setSubmitMessage('success:Log saved successfully!')
      // Reset form and reload logs
      setWeekNumber('')
      setActivities('')
      setChallenges('')
      setSubmitStatus('draft')
      setAttachedDocuments([])
      
      setActiveView('history')
      fetchLogs() // Reload logs
    } catch (error) {
      setSubmitMessage('error:' + (error.response?.data?.detail || 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Filter and search
  const safeLogs = Array.isArray(logs) ? logs : []
  const filtered = safeLogs.filter((l) => {
    const matchesFilter = filter === 'all' || l.status === filter
    const matchesSearch = search === '' ||
      `Week ${l.week_number}`.toLowerCase().includes(search.toLowerCase()) ||
      l.activities?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Stats
 
  const counts = {
    all:       safeLogs.length,
    draft:     safeLogs.filter((l) => l.status === 'draft').length,
    submitted: safeLogs.filter((l) => l.status === 'submitted').length,
    reviewed:  safeLogs.filter((l) => l.status === 'reviewed').length,
    approved:  safeLogs.filter((l) => l.status === 'approved').length,
  }

  const FILTERS = [
    { key: 'all',       label: 'All Logs'  },
    { key: 'draft',     label: 'Draft'     },
    { key: 'submitted', label: 'Submitted' },
    { key: 'reviewed',  label: 'Reviewed'  },
    { key: 'approved',  label: 'Approved'  },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header with view toggle ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Weekly Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeView === 'history' 
              ? 'All your internship logbook entries in one place.' 
              : 'Submit a new weekly log entry with supporting documents.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition
              ${activeView === 'history'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            📋 View Logs
          </button>
          <button
            onClick={() => setActiveView('new')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition
              ${activeView === 'new'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Submit New Log
          </button>
        </div>
      </div>

      {/* ── VIEW: LOG HISTORY ── */}
      {activeView === 'history' && (
        <>
      {/* ── Stat pills ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: 'all',       label: 'Total',     color: 'text-white'         },
          { key: 'draft',     label: 'Draft',     color: 'text-slate-400'     },
          { key: 'submitted', label: 'Submitted', color: 'text-amber-300'     },
          { key: 'reviewed',  label: 'Reviewed',  color: 'text-blue-300'      },
          { key: 'approved',  label: 'Approved',  color: 'text-emerald-300'   },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${filter === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1.5 text-xs ${filter === key ? 'text-indigo-200' : 'text-slate-600'}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-40"
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Logs list ── */}
      {loading ? <ListSkeleton /> : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-sm font-medium">
                {search ? 'No logs match your search.' : filter !== 'all' ? `No ${filter} logs yet.` : 'No logs submitted yet.'}
              </p>
              {filter === 'all' && !search && (
                <button onClick={() => setActiveView('new')} className="text-xs text-indigo-400 hover:underline mt-2 block">
                  Submit your first log →
                </button>
              )}
            </div>
          )}

          {filtered.map((log) => (
            <div
              key={log.id}
              className={`bg-slate-800/50 border rounded-2xl p-4 transition
                ${isOverdue(log.deadline) && log.status === 'draft'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-slate-700/50 hover:border-indigo-500/30'}`}
            >
              <div className="flex items-start gap-4">
                {/* Week number badge */}
                <div className="w-11 h-11 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  W{log.week_number}
                </div>

                {/* Log info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <p className="text-sm font-bold text-white">
                      Week {log.week_number} — Logbook Entry
                    </p>
                    <div className="flex items-center gap-2">
                      {isOverdue(log.deadline) && log.status === 'draft' && (
                        <span className="text-xs text-red-400 font-medium">Overdue!</span>
                      )}
                      <Badge status={log.status} />
                    </div>
                  </div>

                  {/* Activities preview */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                    {log.activities || 'No activities recorded.'}
                  </p>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {log.submitted_at && (
                      <span>Submitted: {formatDate(log.submitted_at)}</span>
                    )}
                    {log.deadline && (
                      <span className={isOverdue(log.deadline) && log.status === 'draft' ? 'text-red-400' : ''}>
                        Due: {formatDate(log.deadline)}
                      </span>
                    )}
                  </div>

                  {/* Challenges */}
                  {log.challenges && (
                    <div className="mt-2 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-700/50">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Challenges</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{log.challenges}</p>
                    </div>
                  )}

                  {/* Workflow tracker */}
                  <WorkflowTracker status={log.status} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                {log.status === 'draft' && (
                  <Link to="/student/logs" state={{openForm:true}}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Continue Draft
                  </Link>
                )}
                {log.status === 'reviewed' && log.feedback && (
                  <span className="text-xs text-blue-400 font-medium">
                    💬 Feedback available
                  </span>
                )}
                {log.status === 'approved' && (
                  <span className="text-xs text-emerald-400 font-medium">
                    ✓ Approved by supervisor
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-600">
                  Log #{log.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* ── VIEW: NEW LOG SUBMISSION ── */}
{activeView === 'new' && (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">

    {/* Card header — no tab buttons */}
    <div className="px-6 py-4 border-b border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Weekly Logbook Entry</p>
          <p className="text-xs text-slate-400">Document your internship activities</p>
        </div>
      </div>
    </div>

    {/* Form body — all fields on one page */}
    <div className="p-6 space-y-5">

      {/* Week Number */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Week Number <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="52"
          placeholder="e.g. 6"
          value={weekNumber}
          onChange={(e) => setWeekNumber(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 bg-slate-700/50 border border-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Activities */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Activities This Week <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Describe what you worked on this week..."
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 bg-slate-700/50 border border-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
        />
        <p className="text-xs text-slate-500">{activities.length} characters</p>
      </div>

      {/* Challenges */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Challenges Faced
        </label>
        <textarea
          rows={3}
          placeholder="Any difficulties or blockers you encountered..."
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 bg-slate-700/50 border border-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
        />
      </div>

      {/* Attach Documents  */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          📎 Attach Documents
        </label>
        <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX — Max 10MB per file
          </p>
          <input
            type="file"
            multiple
            accept={SUPPORTED_FORMATS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-600/5 transition"
          >
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500">Multiple files allowed</p>
            </div>
          </label>

          {attachedDocuments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Attached ({attachedDocuments.length})
              </p>
              {attachedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{getFileIcon(doc.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.size} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="ml-2 p-1.5 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save as */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Save as</label>
        <div className="flex gap-3">
          {[
            { value: 'draft',     label: 'Draft',      sub: 'Save for later',    color: 'border-slate-600 text-slate-300 bg-slate-700/30'   },
            { value: 'submitted', label: 'Submit Now', sub: 'Send to supervisor', color: 'border-indigo-500 text-indigo-300 bg-indigo-600/10' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition
                ${submitStatus === opt.value ? opt.color : 'border-slate-700/50 text-slate-500 hover:border-slate-600'}`}
            >
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={submitStatus === opt.value}
                onChange={() => setSubmitStatus(opt.value)}
                className="accent-indigo-500"
              />
              <div>
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs opacity-70">{opt.sub}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Message */}
      {submitMessage && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border
          ${submitMessage.startsWith('success:')
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <span>{submitMessage.startsWith('success:') ? '✓' : '✕'}</span>
          <span>{submitMessage.replace(/^(error|success):/, '')}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => setActiveView('history')}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition"
        >
          Back to Logs
        </button>
        <button
          onClick={handleSubmitLog}
          disabled={submitting}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm
            ${submitting
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : submitStatus === 'submitted'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'}`}
        >
          {submitting ? 'Saving…' : submitStatus === 'submitted' ? 'Submit Log' : 'Save Draft'}
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  )
}
