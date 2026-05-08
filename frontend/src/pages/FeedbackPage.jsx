import { useState, useEffect } from 'react'
import axios from 'axios'

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-UG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

const timeAgo = (iso) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso)
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(iso)
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function FeedbackSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-2.5 w-1/6" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// Avatar with colored initials
const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
]
const avatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

function Avatar({ name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div
      className={`${sz} ${avatarColor(name)} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  )
}

function SupervisorTypeBadge({ type }) {
  const styles = {
    workplace: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    academic:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  }
  const labels = { workplace: 'Workplace', academic: 'Academic' }
  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${
        styles[type] || 'bg-slate-500/20 text-slate-400'
      }`}
    >
      {labels[type] || type}
    </span>
  )
}

function EmptyState({ filter, search, onClear }) {
  return (
    <div className="text-center py-20 text-slate-500">
      <svg
        className="w-14 h-14 mx-auto mb-4 opacity-20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <p className="text-sm font-semibold text-slate-400 mb-1">
        {search
          ? 'No feedback matches your search.'
          : filter !== 'all'
          ? `No ${filter} supervisor feedback yet.`
          : 'No feedback received yet.'}
      </p>
      <p className="text-xs text-slate-600">
        {search || filter !== 'all'
          ? ''
          : 'Feedback from your supervisors will appear here once they review your logs.'}
      </p>
      {(search || filter !== 'all') && (
        <button
          onClick={onClear}
          className="mt-3 text-xs text-indigo-400 hover:underline"
        >
          Clear filters →
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [filter,       setFilter]       = useState('all')   // 'all' | 'workplace' | 'academic'
  const [search,       setSearch]       = useState('')
  const [expanded,     setExpanded]     = useState(null)    // id of expanded card

  const token = localStorage.getItem('access_token')

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true)
      setError('')
      try {
        // Primary endpoint — adjust to match your backend route
        const res = await axios.get('http://127.0.0.1:8000/api/feedback/', {
          headers: { Authorization: 'Bearer ' + token },
        })
        const data = Array.isArray(res.data) ? res.data : res.data.results ?? []
        setFeedbackList(data)
      } catch {
        // ── Mock data — remove when backend is connected ──────────────────
        setFeedbackList([
          {
            id: 1,
            week_number: 6,
            supervisor_name: 'David Ochieng',
            supervisor_email: 'd.ochieng@techcorp.co.ug',
            supervisor_type: 'workplace',
            date: '2026-04-05',
            comment:
              'Good work on the API documentation. Make sure to include error handling examples in the next log. The code quality has improved significantly over the past two weeks.',
          },
          {
            id: 2,
            week_number: 6,
            supervisor_name: 'Prof. Grace Atim',
            supervisor_email: 'g.atim@mak.ac.ug',
            supervisor_type: 'academic',
            date: '2026-04-02',
            comment:
              'Your reflection on challenges shows good academic thinking. Keep linking theory to practice. I would like to see more references to course material in your next entry.',
          },
          {
            id: 3,
            week_number: 5,
            supervisor_name: 'David Ochieng',
            supervisor_email: 'd.ochieng@techcorp.co.ug',
            supervisor_type: 'workplace',
            date: '2026-03-29',
            comment:
              'Excellent database schema design. The normalization approach was well thought out. Consider documenting the entity relationships more clearly.',
          },
          {
            id: 4,
            week_number: 5,
            supervisor_name: 'Prof. Grace Atim',
            supervisor_email: 'g.atim@mak.ac.ug',
            supervisor_type: 'academic',
            date: '2026-03-28',
            comment:
              'Solid week. Your log was detailed and structured well. Focus on articulating how your work aligns with the learning objectives of the internship programme.',
          },
          {
            id: 5,
            week_number: 4,
            supervisor_name: 'David Ochieng',
            supervisor_email: 'd.ochieng@techcorp.co.ug',
            supervisor_type: 'workplace',
            date: '2026-03-22',
            comment:
              'The UI mockups were impressive. Good attention to the client requirements. Next time, prepare a few alternative designs for comparison.',
          },
        ])
        // ── End mock data ─────────────────────────────────────────────────
      } finally {
        setLoading(false)
      }
    }
    fetchFeedback()
  }, [token])

  // ── Counts ─────────────────────────────────────────────────────────────────
  const counts = {
    all:       feedbackList.length,
    workplace: feedbackList.filter((f) => f.supervisor_type === 'workplace').length,
    academic:  feedbackList.filter((f) => f.supervisor_type === 'academic').length,
  }

  // ── Filter + Search ────────────────────────────────────────────────────────
  const filtered = feedbackList.filter((f) => {
    const matchType   = filter === 'all' || f.supervisor_type === filter
    const matchSearch =
      search === '' ||
      f.supervisor_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.comment?.toLowerCase().includes(search.toLowerCase()) ||
      `week ${f.week_number}`.includes(search.toLowerCase())
    return matchType && matchSearch
  })

  // Group by week number for the grouped view
  const groupedByWeek = filtered.reduce((acc, fb) => {
    const key = fb.week_number
    if (!acc[key]) acc[key] = []
    acc[key].push(fb)
    return acc
  }, {})
  const sortedWeeks = Object.keys(groupedByWeek)
    .map(Number)
    .sort((a, b) => b - a) // latest week first

  const clearFilters = () => {
    setFilter('all')
    setSearch('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Supervisor Feedback</h1>
          <p className="text-sm text-slate-400 mt-1">
            All comments and evaluations from your workplace and academic supervisors.
          </p>
        </div>

        {/* Total count pill */}
        {!loading && feedbackList.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/10 border border-indigo-500/20 text-indigo-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            {feedbackList.length} feedback {feedbackList.length === 1 ? 'entry' : 'entries'}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Stat cards ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'all',       label: 'Total',     color: 'text-white',        bg: 'bg-slate-800/50 border-slate-700/50'          },
            { key: 'workplace', label: 'Workplace',  color: 'text-indigo-300',   bg: 'bg-indigo-600/10 border-indigo-500/20'        },
            { key: 'academic',  label: 'Academic',   color: 'text-emerald-300',  bg: 'bg-emerald-500/10 border-emerald-500/20'      },
          ].map(({ key, label, color, bg }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`${bg} border rounded-xl p-4 text-center transition hover:opacity-90
                ${filter === key ? 'ring-2 ring-indigo-500/40' : ''}`}
            >
              <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Filter tabs + Search ── */}
      {!loading && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
            {[
              { key: 'all',       label: 'All'       },
              { key: 'workplace', label: 'Workplace' },
              { key: 'academic',  label: 'Academic'  },
            ].map(({ key, label }) => (
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
              placeholder="Search by supervisor or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-52"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <FeedbackSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} search={search} onClear={clearFilters} />
      ) : (
        <div className="space-y-8">
          {sortedWeeks.map((week) => (
            <div key={week}>
              {/* Week label */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-700/50 text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-slate-700">
                  W{week}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Week {week}</p>
                  <p className="text-xs text-slate-500">
                    {groupedByWeek[week].length} feedback {groupedByWeek[week].length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="flex-1 h-px bg-slate-700/50 ml-2" />
              </div>

              {/* Feedback cards for this week */}
              <div className="space-y-3 pl-3 border-l-2 border-slate-700/50 ml-4">
                {groupedByWeek[week].map((fb) => {
                  const isOpen = expanded === fb.id
                  const isLong = fb.comment?.length > 160
                  return (
                    <div
                      key={fb.id}
                      className={`bg-slate-800/50 border rounded-2xl p-5 transition
                        ${fb.supervisor_type === 'workplace'
                          ? 'border-indigo-500/10 hover:border-indigo-500/30'
                          : 'border-emerald-500/10 hover:border-emerald-500/30'}`}
                    >
                      {/* Top row */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar name={fb.supervisor_name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-sm font-bold text-white">{fb.supervisor_name}</p>
                            <div className="flex items-center gap-2">
                              <SupervisorTypeBadge type={fb.supervisor_type} />
                              <span className="text-xs text-slate-500">{timeAgo(fb.date)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{fb.supervisor_email}</p>
                        </div>
                      </div>

                      {/* Comment */}
                      <div className={`bg-slate-700/30 rounded-xl p-4 border border-slate-700/50`}>
                        <p className={`text-sm text-slate-300 leading-relaxed ${!isOpen && isLong ? 'line-clamp-3' : ''}`}>
                          {fb.comment}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => setExpanded(isOpen ? null : fb.id)}
                            className="text-xs text-indigo-400 hover:underline mt-2 block font-medium"
                          >
                            {isOpen ? 'Show less ↑' : 'Read more →'}
                          </button>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          {formatDate(fb.date)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          Logbook Week {fb.week_number}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
