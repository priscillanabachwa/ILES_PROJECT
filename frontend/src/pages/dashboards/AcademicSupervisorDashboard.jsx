import { useState, useEffect } from 'react'
import { useAuth } from "../../context/AuthContext"
import { Link } from 'react-router-dom'
import dashboardService from "../../services/dashboardService"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const STATUS_STYLES = {
  'In Progress': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  ACTIVE:        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED:     'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PENDING:       'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  submitted:     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  reviewed:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  overdue:       'bg-red-500/20 text-red-300 border border-red-500/30',
  Overdue:       'bg-red-500/20 text-red-300 border border-red-500/30',
  draft:         'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

function Badge({ status, overdue = false }) {
  const s = overdue ? 'Overdue' : status
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${STATUS_STYLES[s] || 'bg-slate-500/20 text-slate-400'}`}>
      {overdue ? 'Overdue' : status}
    </span>
  )
}

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-amber-500',
  'bg-rose-500',   'bg-teal-600',    'bg-violet-600',
]

function AvatarCircle({ name, index = 0, size = 'md' }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length]
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-xs'
  return (
    <div className={`${sz} rounded-full ${bg} text-white flex items-center justify-center font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function MiniBarChart({ scores }) {
  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171']
  const xTicks = [0, 25, 50, 75, 100]
  return (
    <div>
      <div className="space-y-3 mb-2">
        {scores.map(({ criteria, score }, i) => (
          <div key={criteria}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{criteria}</span>
              <span className="font-semibold text-white">{Number(score).toFixed(0)}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(score, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-3 border-t border-slate-700">
        <div className="flex justify-between mt-1">
          {xTicks.map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="w-px h-1.5 bg-slate-600" />
              <span className="text-slate-500 mt-0.5" style={{ fontSize: '9px' }}>{tick}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 mt-1" style={{ fontSize: '9px' }}>Score (out of 100)</p>
      </div>
    </div>
  )
}

const Icon = {
  students: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  logbook:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  eval:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  report:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  search:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  chevron:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
}

function StatCard({ label, value, sub, subLink, icon, accent }) {
  const A = {
    indigo:  { bg: 'bg-indigo-600/10 border border-indigo-500/20',   icon: 'bg-indigo-600/20 text-indigo-400',   val: 'text-indigo-300',  sub: 'text-indigo-400'  },
    amber:   { bg: 'bg-amber-500/10 border border-amber-500/20',     icon: 'bg-amber-500/20 text-amber-400',     val: 'text-amber-300',   sub: 'text-amber-400'   },
    emerald: { bg: 'bg-emerald-500/10 border border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-400', val: 'text-emerald-300', sub: 'text-emerald-400' },
    rose:    { bg: 'bg-rose-500/10 border border-rose-500/20',       icon: 'bg-rose-500/20 text-rose-400',       val: 'text-rose-300',    sub: 'text-rose-400'    },
  }[accent] || {}
  return (
    <div className={`${A.bg} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${A.icon}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${A.val}`}>{value ?? '—'}</p>
        {sub && subLink
          ? <Link to={subLink} className={`text-xs font-medium mt-1 block hover:underline ${A.sub}`}>{sub} →</Link>
          : sub && <p className={`text-xs font-medium mt-1 ${A.sub}`}>{sub}</p>
        }
      </div>
    </div>
  )
}

function Card({ title, actionLabel, actionLink, children, headerRight }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <p className="text-sm font-bold text-white">{title}</p>
        <div className="flex items-center gap-3">
          {headerRight}
          {actionLabel && actionLink && (
            <Link to={actionLink} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              {actionLabel} →
            </Link>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function AcademicDashboard() {
  const { user } = useAuth()

  const [stats,      setStats]          = useState(null)
  const [placements, setPlacements]     = useState([])
  const [logbooks,   setLogbooks]       = useState([])
  const [activity,   setRecentActivity] = useState([])
  const [scores,     setScores]         = useState([])
  const [loading,    setLoading]        = useState(true)
  const [error,      setError]          = useState('')
  const [search,     setSearch]         = useState('')
  const [semester,   setSemester]       = useState('2024-II')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, placementsRes, logbooksRes, activityRes, scoresRes] = await Promise.all([
          dashboardService.getAcademicStats(semester),
          dashboardService.getAcademicPlacements(semester),
          dashboardService.getPendingReviews(semester),
          dashboardService.getRecentActivity(),
          dashboardService.getEvaluationScores(),
        ])
        setStats(statsRes.data)
        setPlacements(placementsRes.data)
        setLogbooks(logbooksRes.data)
        setRecentActivity(activityRes.data)
        setScores(scoresRes.data)
      } catch {
        // Mock data for frontend preview — remove when backend is connected
        setStats({ assigned_students: 12, pending_reviews: 4, completed_evaluations: 8, average_score: 76.4 })
        setPlacements([
          { id: 1, student_name: 'Amara Nkosi',    student_id: '2500703348', company: 'TechCorp Uganda',         status: 'ACTIVE'    },
          { id: 2, student_name: 'Brian Otim',     student_id: '2500703349', company: 'MTN Uganda',              status: 'ACTIVE'    },
          { id: 3, student_name: 'Cynthia Akello', student_id: '2500703350', company: 'Stanbic Bank',            status: 'ACTIVE'    },
          { id: 4, student_name: 'Denis Okello',   student_id: '2500703351', company: 'Uganda Revenue Authority', status: 'COMPLETED' },
        ])
        setLogbooks([
          { id: 1, student_name: 'Amara Nkosi',    week_number: 6, submitted_at: '2026-04-05', deadline: '2026-03-01', status: 'submitted' },
          { id: 2, student_name: 'Brian Otim',     week_number: 7, submitted_at: '2026-04-04', deadline: '2026-03-01', status: 'submitted' },
          { id: 3, student_name: 'Cynthia Akello', week_number: 5, submitted_at: '2026-04-03', deadline: '2026-04-10', status: 'reviewed'  },
        ])
        setRecentActivity([
          { id: 1, student_name: 'Amara Nkosi',    activity: 'Weekly Log — Week 6',  date: '2026-04-05', status: 'submitted' },
          { id: 2, student_name: 'Brian Otim',     activity: 'Weekly Log — Week 7',  date: '2026-04-04', status: 'submitted' },
          { id: 3, student_name: 'Cynthia Akello', activity: 'Evaluation Submitted', date: '2026-04-03', status: 'reviewed'  },
          { id: 4, student_name: 'Denis Okello',   activity: 'Final Report Draft',   date: '2026-04-01', status: 'approved'  },
        ])
        setScores([
          { criteria: 'Technical',       score: 80 },
          { criteria: 'Communication',   score: 74 },
          { criteria: 'Professionalism', score: 78 },
          { criteria: 'Report Quality',  score: 70 },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [semester])

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Supervisor'
  const filtered = placements.filter((p) =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.student_id?.toLowerCase().includes(search.toLowerCase())
  )
  const SEMESTERS = ['2023-I', '2023-II', '2024-I', '2024-II', '2025-I']

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {fullName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your assigned students, review internship logs, and track evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="text-xs font-medium text-slate-300 bg-transparent outline-none cursor-pointer pr-1"
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s} className="bg-slate-800">Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Students"    value={stats?.assigned_students}     sub="View all students" subLink="/academic/students"    accent="indigo"  icon={Icon.students} />
        <StatCard label="Pending Reviews"       value={stats?.pending_reviews}       sub="Review now"        subLink="/academic/logs"         accent="amber"   icon={Icon.logbook}  />
        <StatCard label="Completed Evaluations" value={stats?.completed_evaluations} sub="View summaries"    subLink="/academic/evaluations"  accent="emerald" icon={Icon.eval}     />
        <StatCard label="Average Score"         value={stats ? `${Number(stats.average_score).toFixed(0)}%` : null} sub="Across all students" accent="rose" icon={Icon.report} />
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left col — 3/5 */}
        <div className="lg:col-span-3 space-y-5">

          <Card
            title="Assigned Students"
            actionLabel="View All"
            actionLink="/academic/students"
            headerRight={
              <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5">
                <span className="text-slate-400">{Icon.search}</span>
                <input
                  type="text"
                  placeholder="Search name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs bg-transparent outline-none text-slate-300 placeholder-slate-500 w-32"
                />
              </div>
            }
          >
            {loading ? <ListSkeleton /> : (
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <p className="text-xs text-slate-500">{search ? 'No students match your search.' : 'No students assigned yet.'}</p>
                )}
                {filtered.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/30 transition">
                    <AvatarCircle name={p.student_name} index={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.student_name}</p>
                      <p className="text-xs text-slate-400">{p.student_id} · {p.company}</p>
                    </div>
                    <Badge status={p.status} />
                  </div>
                ))}
                {stats?.assigned_students > 0 && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    Showing {Math.min(filtered.length, 5)} of {stats.assigned_students} students
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card title="Recent Activity" actionLabel="View All" actionLink="/academic/activity">
            {loading ? <ListSkeleton /> : (
              activity.length === 0
                ? <p className="text-xs text-slate-500">No recent activity.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-700/50">
                          <th className="text-left pb-3 font-semibold w-1/4">Student</th>
                          <th className="text-left pb-3 font-semibold w-1/3">Activity</th>
                          <th className="text-left pb-3 font-semibold w-1/5">Submitted</th>
                          <th className="text-left pb-3 font-semibold w-1/6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {activity.map((a, i) => (
                          <tr key={a.id} className="hover:bg-slate-700/20 transition">
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <AvatarCircle name={a.student_name} index={i} size="sm" />
                                <span className="font-semibold text-white truncate">{a.student_name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-slate-400 truncate">{a.activity}</td>
                            <td className="py-3 pr-3 text-slate-500">{formatDate(a.date)}</td>
                            <td className="py-3"><Badge status={a.status} overdue={isOverdue(a.deadline)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </Card>
        </div>

        {/* Right col — 2/5 */}
        <div className="lg:col-span-2 space-y-5">

          <Card title="Pending Reviews" actionLabel="Review All" actionLink="/academic/logs">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-3">
                {logbooks.length === 0 && <p className="text-xs text-slate-500">No pending reviews.</p>}
                {logbooks.slice(0, 4).map((l, i) => (
                  <div
                    key={l.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition
                      ${isOverdue(l.deadline)
                        ? 'border-red-500/30 bg-red-500/10'
                        : 'border-slate-700/50 hover:bg-slate-700/30'}`}
                  >
                    <AvatarCircle name={l.student_name} index={i} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">Week {l.week_number} — {l.student_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Submitted {formatDate(l.submitted_at)}</p>
                      {isOverdue(l.deadline) && (
                        <p className="text-xs text-red-400 font-medium mt-0.5">Past deadline</p>
                      )}
                    </div>
                    <Badge status={l.status} overdue={isOverdue(l.deadline)} />
                  </div>
                ))}
                {stats?.pending_reviews > 4 && (
                  <Link to="/academic/logs" className="text-xs text-amber-400 font-semibold hover:underline block pt-1">
                    View all pending ({stats.pending_reviews}) →
                  </Link>
                )}
              </div>
            )}
          </Card>

          <Card title="Evaluation Summary Scores" actionLabel="Full Report" actionLink="/academic/evaluations">
            {loading ? <ListSkeleton /> : (
              <>
                {scores.length === 0
                  ? <p className="text-xs text-slate-500">No scores yet.</p>
                  : <MiniBarChart scores={scores} />
                }
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-indigo-400">Avg. Score</p>
                    <p className="text-xl font-bold text-indigo-300 mt-0.5">
                      {stats ? `${Number(stats.average_score).toFixed(0)}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-400">Evaluated</p>
                    <p className="text-xl font-bold text-emerald-300 mt-0.5">
                      {stats?.completed_evaluations ?? '—'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-2">
              {[
                { label: 'View My Students',  sub: 'All assigned students',         icon: Icon.students, to: '/academic/students',   color: 'text-indigo-400 bg-indigo-600/20' },
                { label: 'Review Submissions', sub: 'Pending internship logs',       icon: Icon.logbook,  to: '/academic/logs',        color: 'text-amber-400 bg-amber-500/20'   },
                { label: 'Submit Evaluation',  sub: 'Complete a student evaluation', icon: Icon.eval,     to: '/academic/evaluations', color: 'text-teal-400 bg-teal-500/20'     },
                { label: 'Generate Report',    sub: 'Download evaluation reports',   icon: Icon.report,   to: '/academic/evaluations', color: 'text-rose-400 bg-rose-500/20'     },
              ].map(({ label, sub, icon, to, color }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/40 hover:bg-indigo-600/10 transition group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300">{label}</p>
                    <p className="text-xs text-slate-500">{sub}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-indigo-400">{Icon.chevron}</span>
                </Link>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}

