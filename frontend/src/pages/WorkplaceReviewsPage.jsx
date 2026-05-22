import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

const STATUS_STYLES = {
  draft:               'bg-slate-500/15 text-slate-400 border-slate-500/25',
  submitted:           'bg-amber-500/15 text-amber-400 border-amber-500/25',
  workplace_reviewed:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  reviewed:            'bg-blue-500/15 text-blue-400 border-blue-500/25',
  approved:            'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected:            'bg-red-500/15 text-red-400 border-red-500/25',
}

const STATUS_LABEL = {
  draft:              'Draft',
  submitted:          'Submitted',
  workplace_reviewed: 'Reviewed',
  reviewed:           'Academically Reviewed',
  approved:           'Approved',
  rejected:           'Rejected',
}

export default function WorkplaceReviewsPage() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [logsData, placementsData] = await Promise.all([
          fetchWithAuth(`${API}/weeklylogs/logbooks/`).catch(() => []),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
        ])
        const pm = Object.fromEntries(
          (Array.isArray(placementsData) ? placementsData : []).map(p => [p.id, p])
        )
        setLogs(
          (Array.isArray(logsData) ? logsData : []).map(l => ({
            ...l,
            student_name: pm[l.placement]?.student_name || `Placement #${l.placement}`,
            company: pm[l.placement]?.company_name || '—',
          }))
        )
      } catch {
        toast.error('Failed to load logs.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const allLogs      = logs.filter(l => l.status !== 'draft')
  const submitted    = logs.filter(l => l.status === 'submitted').length
  const reviewed     = logs.filter(l => ['workplace_reviewed', 'reviewed'].includes(l.status)).length
  const approved     = logs.filter(l => l.status === 'approved').length

  const filtered = allLogs.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search && !l.student_name.toLowerCase().includes(search.toLowerCase()) &&
        !l.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const FILTERS = [
    { key: 'all',       label: 'All'       },
    { key: 'submitted', label: 'Submitted' },
    { key: 'workplace_reviewed', label: 'Reviewed' },
    { key: 'approved',  label: 'Approved'  },
  ]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Student Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Weekly internship log entries submitted by your assigned students</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Submitted',  value: submitted, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
          { label: 'Reviewed',   value: reviewed,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'      },
          { label: 'Approved',   value: approved,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'},
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
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
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">No logs found</p>
          <p className="text-slate-600 text-xs mt-1">
            {search ? 'Try a different search term.' : 'Logs submitted by your students will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id}
              className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Week badge */}
                  <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                    W{log.week_number}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Student + company */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-semibold text-sm capitalize">{log.student_name}</p>
                      <span className="text-slate-600 text-xs">·</span>
                      <p className="text-slate-400 text-xs">{log.company}</p>
                    </div>

                    {/* Week + date */}
                    <p className="text-xs text-slate-500 mb-2">
                      Week {log.week_number}
                      {log.submitted_at && <span> · Submitted {formatDate(log.submitted_at)}</span>}
                    </p>

                    {/* Activities preview */}
                    <p className="text-slate-400 text-sm line-clamp-2">{log.activities || '—'}</p>

                    {/* Challenges + Lessons (collapsed preview) */}
                    {log.challenges && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        <span className="text-slate-600">Challenges: </span>{log.challenges}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${STATUS_STYLES[log.status] || STATUS_STYLES.draft}`}>
                  {STATUS_LABEL[log.status] || log.status}
                </span>
              </div>

              {/* Attachment */}
              {log.attachment_url && (
                <div className="mt-3 pt-3 border-t border-slate-700/40">
                  <a href={log.attachment_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    {decodeURIComponent(log.attachment_url.split('/').pop())}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-slate-600 text-xs text-right">
        Showing {filtered.length} of {allLogs.length} logs
      </div>
    </div>
  )
}
