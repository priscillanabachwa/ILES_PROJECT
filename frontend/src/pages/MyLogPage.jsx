import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all') // all | draft | submitted | reviewed | approved

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/weeklylogs/', {
          headers: { Authorization: 'Bearer ' + token }
        })
        setLogs(response.data)
      } catch {
        setError('Failed to load your logbooks. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  // Filter and search
  const filtered = logs.filter((l) => {
    const matchesFilter = filter === 'all' || l.status === filter
    const matchesSearch = search === '' ||
      `Week ${l.week_number}`.toLowerCase().includes(search.toLowerCase()) ||
      l.activities?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Stats
  const counts = {
    all:       logs.length,
    draft:     logs.filter((l) => l.status === 'draft').length,
    submitted: logs.filter((l) => l.status === 'submitted').length,
    reviewed:  logs.filter((l) => l.status === 'reviewed').length,
    approved:  logs.filter((l) => l.status === 'approved').length,
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

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Weekly Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            All your internship logbook entries in one place.
          </p>
        </div>
        <Link
          to="/student/logs/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Submit New Log
        </Link>
      </div>

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
                <Link to="/student/logs/new" className="text-xs text-indigo-400 hover:underline mt-2 block">
                  Submit your first log →
                </Link>
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
                  <Link
                    to={`/student/logs/new`}
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
    </div>
  )
}