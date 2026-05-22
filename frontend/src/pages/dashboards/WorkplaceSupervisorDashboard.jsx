import { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import dashboardService from "../../services/dashboardService"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const STATUS_STYLES = {
  ACTIVE:              'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED:           'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PENDING:             'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  CANCELLED:           'bg-red-500/20 text-red-300 border border-red-500/30',
  submitted:           'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  reviewed:            'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  rejected:            'bg-red-500/20 text-red-300 border border-red-500/30',
  draft:               'bg-slate-500/20 text-slate-400 border border-slate-500/30',
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
          ? <Link to={subLink} className={`text-xs font-medium mt-1 block hover:underline ${A.sub}`}>{sub} </Link>
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
          <Link to={actionLink} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">{actionLabel} </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function WorkplaceSupervisorDashboard() {
  const { user } = useAuth()

  const [stats,      setStats]      = useState(null)
  const [placements, setPlacements] = useState([])
  const [scores,     setScores]     = useState([])
  const [activity,   setActivity]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError('')
      try {
        const [statsRes, placementsRes, scoresRes, activityRes] = await Promise.all([
          dashboardService.getWorkplaceStats(),
          dashboardService.getWorkplacePlacements(),
          dashboardService.getWorkplaceScores(),
          dashboardService.getWorkplaceActivity(),
        ])
        setStats(statsRes.data); setPlacements(placementsRes.data)
        setScores(scoresRes.data); setActivity(activityRes.data)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data. Please refresh.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).map(cap).join(' ') || 'Supervisor'

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {fullName} </h1>
          <p className="text-sm text-slate-400 mt-1">Evaluate intern performance and track your assigned students.</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Students"    value={stats?.assigned_students}  sub="View all students"        subLink="/supervisor/scores" accent="indigo"  icon={Icon.students} />
        <StatCard label="Pending Reviews"     value={stats?.pending_reviews}    sub="Logs awaiting your review" subLink="/supervisor/logs"   accent="amber"   icon={Icon.logbook}  />
        <StatCard label="Approved Logs"       value={stats?.approved_logs}      sub="Logs approved"             subLink="/supervisor/scores" accent="emerald" icon={Icon.approved} />
        <StatCard label="Avg. Workplace Score" value={stats?.average_score != null ? `${Number(stats.average_score).toFixed(0)}%` : '—'} sub="Contributes 40% to final" accent="rose" icon={Icon.report} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <div className="lg:col-span-3 space-y-5">

          <Card title="Recent Student Activity" actionLabel="View All" actionLink="/supervisor/scores">
            {loading ? <ListSkeleton /> : activity.length === 0 ? (
              <p className="text-xs text-slate-500">No recent activity from your students.</p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 5).map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-700/20 transition">
                    <AvatarCircle name={a.student_name} index={i} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm font-semibold text-white capitalize">{a.student_name}</p>
                        <Badge status={a.status} overdue={isOverdue(a.deadline)} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{a.activity}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{formatDate(a.date)}</p>
                    </div>
                  </div>
                ))}
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
                        <td className="py-3 pr-3"><div className="flex items-center gap-2"><AvatarCircle name={a.student_name} index={i} size="sm" /><span className="font-semibold text-white truncate capitalize">{a.student_name}</span></div></td>
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
                      <p className="text-sm font-semibold text-white truncate capitalize">{p.student_name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.company || 'No company assigned'}</p>
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

          <Card title="Quick Actions">
            <div className="space-y-2">
              {[
                { label:'View My Students', sub:'All assigned interns',      icon:Icon.students, to:'/supervisor/scores',  color:'text-indigo-400 bg-indigo-600/20'   },
                { label:'Score Performance', sub:'Submit workplace scores',   icon:Icon.score,    to:'/supervisor/scores',  color:'text-emerald-400 bg-emerald-500/20' },
                { label:'Generate Report',  sub:'Download student reports',  icon:Icon.report,   to:'/supervisor/reports', color:'text-rose-400 bg-rose-500/20'       },
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