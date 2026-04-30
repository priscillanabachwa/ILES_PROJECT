import { useState, useEffect } from 'react'
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from 'react-router-dom'
import  dashboardService  from "../../services/dashboardService";



const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false


const STATUS_STYLES = {
  'In Progress': 'bg-indigo-50 text-indigo-700',
  ACTIVE:        'bg-indigo-50 text-indigo-700',
  COMPLETED:     'bg-emerald-50 text-emerald-700',
  PENDING:       'bg-amber-50 text-amber-700',
  submitted:     'bg-amber-50 text-amber-700',
  reviewed:      'bg-blue-50 text-blue-700',
  approved:      'bg-emerald-50 text-emerald-700',
  overdue:       'bg-red-50 text-red-600',
  draft:         'bg-gray-100 text-gray-500',
}

function Badge({ status, overdue = false }) {
  const s = overdue ? 'Overdue' : status;
  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${STATUS_STYLES[s] || 'bg-gray-100 text-gray-500'}`}
    >
      {overdue ? 'Overdue' : status}
    </span>
  );
}



const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-400',   'bg-teal-500',    'bg-violet-500',
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
  return <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />
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
  const COLORS = ['#4f46e5', '#0d9488', '#f59e0b', '#f43f5e']
  return (
    <div className="space-y-3">
      {scores.map(({ criteria, score }, i) => (
        <div key={criteria}>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{criteria}</span>
            <span className="font-semibold text-gray-700">{Number(score).toFixed(0)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
          </div>
        </div>
      ))}
    </div>
  )
}


const Icon = {
  students: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  logbook:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  eval:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  report:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  bell:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  search:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  chevron:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
}


function Navbar({ user, notifications = 0, onLogout }) {
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">ILES</div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">ILES</p>
          <p className="text-gray-400 leading-tight" style={{ fontSize: '9px' }}>Internship Logging & Evaluation System</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-indigo-600 text-xs font-semibold border-b-2 border-indigo-600 pb-0.5">Dashboard</Link>
        <Link to="/students"  className="text-gray-400 text-xs hover:text-gray-700 transition font-medium">My Students</Link>
        <Link to="/reviews"   className="text-gray-400 text-xs hover:text-gray-700 transition font-medium">Reviews</Link>
        <Link to="/reports"   className="text-gray-400 text-xs hover:text-gray-700 transition font-medium">Reports</Link>
      </div>
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button className="text-gray-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-indigo-50">
            {Icon.bell}
          </button>
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold" style={{ fontSize: '9px' }}>
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.first_name?.[0] || '?'}
          </div>
          <span className="text-xs font-medium text-gray-700">
            {[user?.first_name, user?.last_name].filter(Boolean).join(' ')}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}


function StatCard({ label, value, sub, subLink, icon, accent }) {
  const A = {
    indigo:  { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600',  val: 'text-indigo-700',  sub: 'text-indigo-500'  },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',    val: 'text-amber-700',   sub: 'text-amber-500'   },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600',val: 'text-emerald-700', sub: 'text-emerald-500' },
    rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',      val: 'text-rose-700',    sub: 'text-rose-500'    },
  }[accent] || {}
  return (
    <div className={`${A.bg} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${A.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <div className="flex items-center gap-3">
          {headerRight}
          {actionLabel && actionLink && (
            <Link to={actionLink} className="text-xs font-semibold text-indigo-600 hover:underline">{actionLabel} →</Link>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}


export default function AcademicDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [stats,      setStats]      = useState(null)
  const [placements, setPlacements] = useState([])
  const [logbooks,   setLogbooks]   = useState([])
  const [activity,   setRecentActivity]   = useState([])
  const [scores,     setScores]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [semester,   setSemester]   = useState('2024-II')

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
        setError('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [semester])

  const handleLogout = () => { logout(); navigate('/login') }

  const fullName   = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Academic Supervisor'
  const filtered   = placements.filter((p) =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  const SEMESTERS = ['2023-I', '2023-II', '2024-I', '2024-II', '2025-I']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} notifications={stats?.pending_reviews || 0} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {fullName} 👋</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your assigned students, review internship logs, and track evaluations.
            </p>
          </div>
          {/* Semester Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="text-xs font-medium text-gray-600 bg-transparent outline-none cursor-pointer pr-1"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Assigned Students"    value={stats?.assigned_students}     sub="View all students"  subLink="/students"    accent="indigo"  icon={Icon.students} />
          <StatCard label="Pending Reviews"       value={stats?.pending_reviews}       sub="Review now"         subLink="/reviews"     accent="amber"   icon={Icon.logbook}  />
          <StatCard label="Completed Evaluations" value={stats?.completed_evaluations} sub="View summaries"     subLink="/reports"     accent="emerald" icon={Icon.eval}     />
          <StatCard label="Average Score"         value={stats ? `${Number(stats.average_score).toFixed(0)}%` : null} sub="Across all students" accent="rose" icon={Icon.report} />
        </div>

        {/* ── Main content — asymmetric 2-col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left col — 3/5 width */}
          <div className="lg:col-span-3 space-y-5">

            {/* Assigned Students with search */}
            <Card
              title="Assigned Students"
              actionLabel="View All"
              actionLink="/students"
              headerRight={
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-gray-400">{Icon.search}</span>
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-xs bg-transparent outline-none text-gray-600 placeholder-gray-300 w-32"
                  />
                </div>
              }
            >
              {loading ? <ListSkeleton /> : (
                <div className="space-y-3">
                  {filtered.length === 0 && (
                    <p className="text-xs text-gray-400">{search ? 'No students match your search.' : 'No students assigned yet.'}</p>
                  )}
                  {filtered.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                      <AvatarCircle name={p.student_name} index={i} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.student_name}</p>
                        <p className="text-xs text-gray-400">{p.student_id} · {p.company}</p>
                      </div>
                      <Badge status="In Progress" />
                    </div>
                  ))}
                  {stats?.assigned_students > 0 && (
                    <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                      Showing {Math.min(filtered.length, 5)} of {stats.assigned_students} students
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Activity" actionLabel="View All" actionLink="/activity">
              {loading ? <ListSkeleton /> : (
                activity.length === 0
                  ? <p className="text-xs text-gray-400">No recent activity.</p>
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-100">
                            <th className="text-left pb-3 font-semibold w-1/4">Student</th>
                            <th className="text-left pb-3 font-semibold w-1/3">Activity</th>
                            <th className="text-left pb-3 font-semibold w-1/5">Submitted</th>
                            <th className="text-left pb-3 font-semibold w-1/6">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activity.map((a, i) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition">
                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-2">
                                  <AvatarCircle name={a.student_name} index={i} size="sm" />
                                  <span className="font-semibold text-gray-800 truncate">{a.student_name}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-3 text-gray-600 truncate">{a.activity}</td>
                              <td className="py-3 pr-3 text-gray-400">{formatDate(a.date)}</td>
                              <td className="py-3">
                                <Badge status={a.status} overdue={isOverdue(a.deadline)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              )}
            </Card>
          </div>

          {/* Right col — 2/5 width */}
          <div className="lg:col-span-2 space-y-5">

            {/* Pending Reviews */}
            <Card title="Pending Reviews" actionLabel="Review All" actionLink="/reviews">
              {loading ? <ListSkeleton /> : (
                <div className="space-y-3">
                  {logbooks.length === 0 && <p className="text-xs text-gray-400">No pending reviews.</p>}
                  {logbooks.slice(0, 4).map((l, i) => (
                    <div key={l.id} className={`flex items-start gap-3 p-2.5 rounded-xl border transition ${isOverdue(l.deadline) ? 'border-red-100 bg-red-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <AvatarCircle name={l.student_name} index={i} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">Week {l.week_number} — {l.student_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(l.submitted_at)}</p>
                        {isOverdue(l.deadline) && (
                          <p className="text-xs text-red-500 font-medium mt-0.5">Past deadline</p>
                        )}
                      </div>
                      <Badge status={l.status} overdue={isOverdue(l.deadline)} />
                    </div>
                  ))}
                  {stats?.pending_reviews > 4 && (
                    <Link to="/reviews" className="text-xs text-amber-600 font-semibold hover:underline block pt-1">
                      View all pending ({stats.pending_reviews}) →
                    </Link>
                  )}
                </div>
              )}
            </Card>

            {/* Evaluation Scores */}
            <Card title="Evaluation Summary Scores" actionLabel="Full Report" actionLink="/reports">
              {loading ? <ListSkeleton /> : (
                <>
                  {scores.length === 0
                    ? <p className="text-xs text-gray-400">No scores yet.</p>
                    : <MiniBarChart scores={scores} />
                  }
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-indigo-400">Avg. Score</p>
                      <p className="text-xl font-bold text-indigo-700 mt-0.5">
                        {stats ? `${Number(stats.average_score).toFixed(0)}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-400">Evaluated</p>
                      <p className="text-xl font-bold text-emerald-700 mt-0.5">
                        {stats?.completed_evaluations ?? '—'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="space-y-2">
                {[
                  { label: 'View My Students',  sub: 'All assigned students',        icon: Icon.students, to: '/students',    color: 'text-indigo-500 bg-indigo-50'  },
                  { label: 'Review Submissions', sub: 'Pending internship logs',      icon: Icon.logbook,  to: '/reviews',     color: 'text-amber-500 bg-amber-50'    },
                  { label: 'Submit Evaluation',  sub: 'Complete a student evaluation',icon: Icon.eval,     to: '/evaluations', color: 'text-teal-500 bg-teal-50'      },
                  { label: 'Generate Report',    sub: 'Download evaluation reports',  icon: Icon.report,   to: '/reports',     color: 'text-rose-500 bg-rose-50'      },
                ].map(({ label, sub, icon, to, color }) => (
                  <Link
                    key={label}
                    to={to}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-700">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-indigo-400">{Icon.chevron}</span>
                  </Link>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

