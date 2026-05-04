import { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import { Link } from 'react-router-dom'
import dashboardService from "../../services/dashboardService"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const STATUS_STYLES = {
  ACTIVE:    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PENDING:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  submitted: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  reviewed:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  rejected:  'bg-red-500/20 text-red-300 border border-red-500/30',
  draft:     'bg-slate-500/20 text-slate-400 border border-slate-500/30',
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
      {[1,2,3,4].map((i) => (
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
  const COLORS = ['#818cf8','#34d399','#fbbf24','#f87171']
  const xTicks = [0,25,50,75,100]
  return (
    <div>
      <div className="space-y-3 mb-2">
        {scores.map(({ criteria, score }, i) => (
          <div key={criteria}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{criteria}</span>
              <span className="font-semibold text-white">{Number(score).toFixed(0)}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(score,100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-3 border-t border-slate-700">
        <div className="flex justify-between mt-1">
          {xTicks.map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="w-px h-1.5 bg-slate-600" />
              <span className="text-slate-500 mt-0.5" style={{ fontSize:'9px' }}>{tick}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 mt-1" style={{ fontSize:'9px' }}>Score (out of 100)</p>
      </div>
    </div>
  )
}

const Icon = {
  students: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  logbook:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  score:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  approved: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  report:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  chevron:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
  check:    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  reject:   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
}

function StatCard({ label, value, sub, subLink, icon, accent }) {
  const A = {
    indigo:  { bg:'bg-indigo-600/10 border border-indigo-500/20',   icon:'bg-indigo-600/20 text-indigo-400',   val:'text-indigo-300',  sub:'text-indigo-400'  },
    amber:   { bg:'bg-amber-500/10 border border-amber-500/20',     icon:'bg-amber-500/20 text-amber-400',     val:'text-amber-300',   sub:'text-amber-400'   },
    emerald: { bg:'bg-emerald-500/10 border border-emerald-500/20', icon:'bg-emerald-500/20 text-emerald-400', val:'text-emerald-300', sub:'text-emerald-400' },
    rose:    { bg:'bg-rose-500/10 border border-rose-500/20',       icon:'bg-rose-500/20 text-rose-400',       val:'text-rose-300',    sub:'text-rose-400'    },
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

function Card({ title, actionLabel, actionLink, children }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <p className="text-sm font-bold text-white">{title}</p>
        {actionLabel && actionLink && (
          <Link to={actionLink} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">{actionLabel} →</Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// No Navbar, no outer wrapper — AppLayout handles sidebar, header and padding
export default function WorkplaceSupervisorDashboard() {
  const { user } = useAuth()

  const [stats,      setStats]      = useState(null)
  const [placements, setPlacements] = useState([])
  const [reviews,    setReviews]    = useState([])
  const [scores,     setScores]     = useState([])
  const [activity,   setActivity]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError('')
      try {
        const [statsRes, placementsRes, reviewsRes, scoresRes, activityRes] = await Promise.all([
          dashboardService.getWorkplaceStats(),
          dashboardService.getWorkplacePlacements(),
          dashboardService.getWorkplacePendingReviews(),
          dashboardService.getWorkplaceScores(),
          dashboardService.getWorkplaceActivity(),
        ])
        setStats(statsRes.data); setPlacements(placementsRes.data)
        setReviews(reviewsRes.data); setScores(scoresRes.data); setActivity(activityRes.data)
      } catch {
        // Mock data for frontend preview — remove when backend is connected
        setStats({ assigned_students: 8, pending_reviews: 3, approved_logs: 24, average_score: 82 })
        setPlacements([
          { id:1, student_name:'Amara Nkosi',    student_id:'2500703348', department:'Computer Science',    status:'ACTIVE'    },
          { id:2, student_name:'Brian Otim',     student_id:'2500703349', department:'Software Engineering', status:'ACTIVE'    },
          { id:3, student_name:'Cynthia Akello', student_id:'2500703350', department:'Information Systems',  status:'ACTIVE'    },
          { id:4, student_name:'Denis Okello',   student_id:'2500703351', department:'Computer Science',    status:'COMPLETED' },
        ])
        setReviews([
          { id:1, student_name:'Amara Nkosi',    week_number:6, submitted_at:'2026-04-05', deadline:'2026-03-01', status:'submitted', activities_preview:'Developed REST API endpoints for user authentication...' },
          { id:2, student_name:'Brian Otim',     week_number:7, submitted_at:'2026-04-04', deadline:'2026-04-10', status:'submitted', activities_preview:'Attended team standup and worked on database schema...' },
          { id:3, student_name:'Cynthia Akello', week_number:5, submitted_at:'2026-04-03', deadline:'2026-04-10', status:'submitted', activities_preview:'Completed UI mockups and reviewed with senior engineer...' },
        ])
        setScores([
          { criteria:'Technical Skills', score:85 },
          { criteria:'Communication',    score:78 },
          { criteria:'Professionalism',  score:82 },
          { criteria:'Initiative',       score:80 },
        ])
        setActivity([
          { id:1, student_name:'Amara Nkosi',    activity:'Weekly Log — Week 6',  date:'2026-04-05', status:'submitted', deadline:'2026-03-01' },
          { id:2, student_name:'Brian Otim',     activity:'Weekly Log — Week 7',  date:'2026-04-04', status:'submitted', deadline:'2026-04-10' },
          { id:3, student_name:'Cynthia Akello', activity:'Log Approved — Week 4',date:'2026-04-03', status:'approved',  deadline:null         },
          { id:4, student_name:'Denis Okello',   activity:'Score Submitted',      date:'2026-04-01', status:'reviewed',  deadline:null         },
        ])
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Supervisor'

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {fullName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Review student logs, approve submissions, and score intern performance.</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-400 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Semester 2024 — Semester II
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Students"   value={stats?.assigned_students}  sub="View all students" subLink="/supervisor/students" accent="indigo"  icon={Icon.students} />
        <StatCard label="Pending Reviews"      value={stats?.pending_reviews}    sub="Review now"        subLink="/supervisor/reviews"  accent="amber"   icon={Icon.logbook}  />
        <StatCard label="Approved Logs"        value={stats?.approved_logs}      sub="View approved"     subLink="/supervisor/reviews"  accent="emerald" icon={Icon.approved} />
        <StatCard label="Avg. Workplace Score" value={stats ? `${Number(stats.average_score).toFixed(0)}%` : null} sub="Contributes 40% to final" accent="rose" icon={Icon.score} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <div className="lg:col-span-3 space-y-5">

          <Card title="Pending Reviews" actionLabel="View All" actionLink="/supervisor/reviews">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-3">
                {reviews.length === 0 && <p className="text-xs text-slate-500">No pending reviews. You are all caught up!</p>}
                {reviews.slice(0,4).map((r, i) => (
                  <div key={r.id} className={`p-3 rounded-xl border transition ${isOverdue(r.deadline) ? 'border-red-500/30 bg-red-500/10' : 'border-slate-700/50 hover:border-indigo-500/40 hover:bg-indigo-600/10'}`}>
                    <div className="flex items-start gap-3">
                      <AvatarCircle name={r.student_name} index={i} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-sm font-semibold text-white">Week {r.week_number} — {r.student_name}</p>
                          {isOverdue(r.deadline) ? <Badge status="overdue" /> : <Badge status={r.status} />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{r.activities_preview}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Submitted {formatDate(r.submitted_at)}
                          {isOverdue(r.deadline) && <span className="text-red-400 font-medium ml-2">· Past deadline</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      <Link to={`/supervisor/reviews/${r.id}`} className="flex-1 text-center text-xs font-semibold text-indigo-400 border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 py-1.5 rounded-lg transition">
                        Review & Comment
                      </Link>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition">
                        {Icon.check} Approve
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition">
                        {Icon.reject} Reject
                      </button>
                    </div>
                  </div>
                ))}
                {stats?.pending_reviews > 4 && (
                  <Link to="/supervisor/reviews" className="text-xs text-amber-400 font-semibold hover:underline block pt-1">
                    View all pending ({stats.pending_reviews}) →
                  </Link>
                )}
              </div>
            )}
          </Card>

          <Card title="Recent Activity" actionLabel="View All" actionLink="/supervisor/activity">
            {loading ? <ListSkeleton /> : activity.length === 0 ? <p className="text-xs text-slate-500">No recent activity.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ tableLayout:'fixed' }}>
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <th className="text-left pb-3 font-semibold w-1/4">Student</th>
                      <th className="text-left pb-3 font-semibold w-1/3">Activity</th>
                      <th className="text-left pb-3 font-semibold w-1/5">Date</th>
                      <th className="text-left pb-3 font-semibold w-1/6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {activity.map((a, i) => (
                      <tr key={a.id} className="hover:bg-slate-700/20 transition">
                        <td className="py-3 pr-3"><div className="flex items-center gap-2"><AvatarCircle name={a.student_name} index={i} size="sm" /><span className="font-semibold text-white truncate">{a.student_name}</span></div></td>
                        <td className="py-3 pr-3 text-slate-400 truncate">{a.activity}</td>
                        <td className="py-3 pr-3 text-slate-500">{formatDate(a.date)}</td>
                        <td className="py-3"><Badge status={a.status} overdue={isOverdue(a.deadline)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">

          <Card title="Assigned Students" actionLabel="View All" actionLink="/supervisor/students">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-3">
                {placements.length === 0 && <p className="text-xs text-slate-500">No students assigned yet.</p>}
                {placements.slice(0,4).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/30 transition">
                    <AvatarCircle name={p.student_name} index={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.student_name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.student_id} · {p.department}</p>
                    </div>
                    <Badge status={p.status} />
                  </div>
                ))}
                {stats?.assigned_students > 0 && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">Total: {stats.assigned_students} students</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Workplace Scores" actionLabel="View All" actionLink="/supervisor/scores">
            {loading ? <ListSkeleton /> : (
              <>
                {scores.length === 0 ? <p className="text-xs text-slate-500">No scores submitted yet.</p> : <MiniBarChart scores={scores} />}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-indigo-400">Avg. Score</p>
                    <p className="text-xl font-bold text-indigo-300 mt-0.5">{stats ? `${Number(stats.average_score).toFixed(0)}%` : '—'}</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-400">Weight</p>
                    <p className="text-xl font-bold text-amber-300 mt-0.5">40%</p>
                  </div>
                </div>
                <div className="mt-3 bg-slate-700/30 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium mb-1">Your contribution</p>
                  <p className="text-xs text-slate-500">Your scores contribute 40% to each student's final grade</p>
                </div>
              </>
            )}
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-2">
              {[
                { label:'View My Students',  sub:'All assigned interns',          icon:Icon.students, to:'/supervisor/students', color:'text-indigo-400 bg-indigo-600/20'  },
                { label:'Review Submissions', sub:'Approve or reject log entries', icon:Icon.logbook,  to:'/supervisor/reviews',  color:'text-amber-400 bg-amber-500/20'    },
                { label:'Score Performance',  sub:'Submit workplace scores',       icon:Icon.score,    to:'/supervisor/scores',   color:'text-emerald-400 bg-emerald-500/20' },
                { label:'Generate Report',    sub:'Download student reports',      icon:Icon.report,   to:'/supervisor/reports',  color:'text-rose-400 bg-rose-500/20'      },
              ].map(({ label, sub, icon, to, color }) => (
                <Link key={label} to={to} className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/40 hover:bg-indigo-600/10 transition group">
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