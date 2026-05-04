import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import dashboardService from "../../services/dashboardService"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const STATUS_STYLES = {
  ACTIVE:              'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED:           'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PENDING:             'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  CANCELLED:           'bg-red-500/20 text-red-300 border border-red-500/30',
  student:             'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  academic_supervisor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  workplace_supervisor:'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  admin:               'bg-rose-500/20 text-rose-300 border border-rose-500/30',
}

function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status?.toLowerCase().replace(/_/g, ' ')}
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

const Icon = {
  students:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  placements: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  supervisors:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  score:      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  report:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  plus:       <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
  assign:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
  eval:       <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  warning:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  users:      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  chevron:    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
}

function StatCard({ label, value, sub, subLink, icon, accent }) {
  const A = {
    indigo:  { bg: 'bg-indigo-600/10 border border-indigo-500/20',   icon: 'bg-indigo-600/20 text-indigo-400',   val: 'text-indigo-300',  sub: 'text-indigo-400'  },
    amber:   { bg: 'bg-amber-500/10 border border-amber-500/20',     icon: 'bg-amber-500/20 text-amber-400',     val: 'text-amber-300',   sub: 'text-amber-400'   },
    emerald: { bg: 'bg-emerald-500/10 border border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-400', val: 'text-emerald-300', sub: 'text-emerald-400' },
    rose:    { bg: 'bg-rose-500/10 border border-rose-500/20',       icon: 'bg-rose-500/20 text-rose-400',       val: 'text-rose-300',    sub: 'text-rose-400'    },
    teal:    { bg: 'bg-teal-500/10 border border-teal-500/20',       icon: 'bg-teal-500/20 text-teal-400',       val: 'text-teal-300',    sub: 'text-teal-400'    },
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
          <Link to={actionLink} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
            {actionLabel} →
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function InternshipAdministratorDashboard() {
  const { user } = useAuth()

  const [stats,       setStats]       = useState(null)
  const [placements,  setPlacements]  = useState([])
  const [users,       setUsers]       = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [alerts,      setAlerts]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, placementsRes, usersRes, evaluationsRes] = await Promise.all([
          dashboardService.getAdminStats(),
          dashboardService.getAdminPlacements(),
          dashboardService.getAdminUsers(),
          dashboardService.getAdminEvaluations(),
        ])
        setStats(statsRes.data)
        setPlacements(placementsRes.data)
        setUsers(usersRes.data)
        setEvaluations(evaluationsRes.data)
      } catch {
        // Mock data for frontend preview — remove when backend is connected
        setStats({
          total_students:    42,
          total_placements:  38,
          total_supervisors: 12,
          average_score:     74.8,
          active_placements: 30,
          pending_placements: 4,
          unassigned_students: 4,
          evaluations_complete: 28,
        })
        setPlacements([
          { id: 1, student_name: 'Amara Nkosi',    company: 'TechCorp Uganda',         academic_supervisor: 'Prof. Grace Atim',  workplace_supervisor: 'David Ochieng', status: 'ACTIVE',    start_date: '2025-09-01', end_date: '2025-11-30' },
          { id: 2, student_name: 'Brian Otim',     company: 'MTN Uganda',              academic_supervisor: 'Dr. James Okello',  workplace_supervisor: 'Sarah Nambi',   status: 'ACTIVE',    start_date: '2025-09-01', end_date: '2025-11-30' },
          { id: 3, student_name: 'Cynthia Akello', company: 'Stanbic Bank',            academic_supervisor: 'Prof. Grace Atim',  workplace_supervisor: 'Peter Mugisha', status: 'ACTIVE',    start_date: '2025-09-01', end_date: '2025-11-30' },
          { id: 4, student_name: 'Denis Okello',   company: 'Uganda Revenue Authority',academic_supervisor: 'Dr. James Okello',  workplace_supervisor: 'Alice Tendo',   status: 'COMPLETED', start_date: '2025-06-01', end_date: '2025-08-30' },
          { id: 5, student_name: 'Eva Namutebi',   company: 'Airtel Uganda',           academic_supervisor: 'Prof. Grace Atim',  workplace_supervisor: 'John Ssali',    status: 'PENDING',   start_date: '2026-01-01', end_date: '2026-03-30' },
        ])
        setUsers([
          { id: 1, name: 'Amara Nkosi',      email: 'a.nkosi@uni.ac.ug',        role: 'student',             joined: '2025-08-15' },
          { id: 2, name: 'Brian Otim',       email: 'b.otim@uni.ac.ug',         role: 'student',             joined: '2025-08-15' },
          { id: 3, name: 'Prof. Grace Atim', email: 'g.atim@mak.ac.ug',         role: 'academic_supervisor', joined: '2025-07-01' },
          { id: 4, name: 'David Ochieng',    email: 'd.ochieng@techcorp.co.ug', role: 'workplace_supervisor',joined: '2025-08-10' },
          { id: 5, name: 'Dr. James Okello', email: 'j.okello@mak.ac.ug',       role: 'academic_supervisor', joined: '2025-07-01' },
        ])
        setEvaluations([
          { id: 1, student_name: 'Amara Nkosi',    workplace_score: 80, academic_score: 74, logbook_score: 74, final_score: 76.4, grade: 'B+' },
          { id: 2, student_name: 'Brian Otim',     workplace_score: 75, academic_score: 70, logbook_score: 72, final_score: 72.4, grade: 'B'  },
          { id: 3, student_name: 'Cynthia Akello', workplace_score: 88, academic_score: 82, logbook_score: 80, final_score: 83.8, grade: 'A'  },
          { id: 4, student_name: 'Denis Okello',   workplace_score: 65, academic_score: 60, logbook_score: 68, final_score: 64.4, grade: 'C+' },
        ])
        setAlerts([
          { id: 1, message: '4 students have no placement assigned', type: 'warning', link: '/admin/students' },
          { id: 2, message: '6 logbooks are overdue for review',     type: 'warning', link: '/admin/logs'     },
          { id: 3, message: '2 placements ending within 2 weeks',    type: 'info',    link: '/admin/placements'},
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Administrator'

  // User role breakdown for the user overview card
  const roleBreakdown = [
    { role: 'Students',              count: stats?.total_students,   color: 'bg-indigo-500',  label: 'student'             },
    { role: 'Academic Supervisors',  count: stats?.total_supervisors ? Math.round(stats.total_supervisors * 0.5) : null, color: 'bg-emerald-500', label: 'academic' },
    { role: 'Workplace Supervisors', count: stats?.total_supervisors ? Math.round(stats.total_supervisors * 0.5) : null, color: 'bg-amber-500',   label: 'workplace' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {fullName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage students, placements, supervisors, and system-wide reports.
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-400 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Semester 2024 — Semester II
        </div>
      </div>

      {/* ── System Alerts ── */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium
                ${a.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'}`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                {a.message}
              </div>
              <Link to={a.link} className="text-xs font-semibold hover:underline ml-4 whitespace-nowrap">
                Fix now →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"    value={stats?.total_students}    sub="View all students"    subLink="/admin/students"    accent="indigo"  icon={Icon.students}   />
        <StatCard label="Active Placements" value={stats?.active_placements} sub="View all placements"  subLink="/admin/placements"  accent="emerald" icon={Icon.placements} />
        <StatCard label="Total Supervisors" value={stats?.total_supervisors} sub="View all supervisors" subLink="/admin/supervisors" accent="amber"   icon={Icon.supervisors}/>
        <StatCard label="Average Score"     value={stats ? `${Number(stats.average_score).toFixed(1)}%` : null} sub="View all evaluations" subLink="/admin/evaluations" accent="rose" icon={Icon.score} />
      </div>

      {/* ── Second row stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Pending Placements</p>
          <p className="text-2xl font-bold text-amber-300">{stats?.pending_placements ?? '—'}</p>
          <Link to="/admin/placements" className="text-xs text-amber-400 hover:underline mt-1 block">Assign now →</Link>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Unassigned Students</p>
          <p className="text-2xl font-bold text-rose-300">{stats?.unassigned_students ?? '—'}</p>
          <Link to="/admin/students" className="text-xs text-rose-400 hover:underline mt-1 block">Assign now →</Link>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Evaluations Complete</p>
          <p className="text-2xl font-bold text-emerald-300">{stats?.evaluations_complete ?? '—'}</p>
          <Link to="/admin/evaluations" className="text-xs text-emerald-400 hover:underline mt-1 block">View reports →</Link>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Placements</p>
          <p className="text-2xl font-bold text-indigo-300">{stats?.total_placements ?? '—'}</p>
          <Link to="/admin/placements" className="text-xs text-indigo-400 hover:underline mt-1 block">View all →</Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left col — 3/5 */}
        <div className="lg:col-span-3 space-y-5">

          {/* Recent Placements */}
          <Card title="Recent Placements" actionLabel="View All" actionLink="/admin/placements">
            {loading ? <ListSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <th className="text-left pb-3 font-semibold">Student</th>
                      <th className="text-left pb-3 font-semibold">Company</th>
                      <th className="text-left pb-3 font-semibold">Supervisors</th>
                      <th className="text-left pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {placements.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-700/20 transition">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <AvatarCircle name={p.student_name} index={i} size="sm" />
                            <span className="font-semibold text-white">{p.student_name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-slate-400">{p.company}</td>
                        <td className="py-3 pr-3">
                          <p className="text-slate-400 truncate max-w-[120px]">{p.academic_supervisor}</p>
                          <p className="text-slate-500 truncate max-w-[120px]">{p.workplace_supervisor}</p>
                        </td>
                        <td className="py-3"><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* System-wide Evaluations */}
          <Card title="Evaluation Overview" actionLabel="View All" actionLink="/admin/evaluations">
            {loading ? <ListSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <th className="text-left pb-3 font-semibold">Student</th>
                      <th className="text-left pb-3 font-semibold text-center">Workplace</th>
                      <th className="text-left pb-3 font-semibold text-center">Academic</th>
                      <th className="text-left pb-3 font-semibold text-center">Logbook</th>
                      <th className="text-left pb-3 font-semibold text-center">Final</th>
                      <th className="text-left pb-3 font-semibold text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {evaluations.map((e, i) => (
                      <tr key={e.id} className="hover:bg-slate-700/20 transition">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <AvatarCircle name={e.student_name} index={i} size="sm" />
                            <span className="font-semibold text-white">{e.student_name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-center text-slate-400">{e.workplace_score ?? '—'}</td>
                        <td className="py-3 pr-3 text-center text-slate-400">{e.academic_score ?? '—'}</td>
                        <td className="py-3 pr-3 text-center text-slate-400">{e.logbook_score ?? '—'}</td>
                        <td className="py-3 pr-3 text-center font-semibold text-white">
                          {e.final_score != null ? `${Number(e.final_score).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-bold text-sm
                            ${e.grade?.startsWith('A') ? 'text-emerald-400' :
                              e.grade?.startsWith('B') ? 'text-indigo-400' :
                              e.grade?.startsWith('C') ? 'text-amber-400' : 'text-red-400'}`}>
                            {e.grade || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right col — 2/5 */}
        <div className="lg:col-span-2 space-y-5">

          {/* User Overview */}
          <Card title="User Overview" actionLabel="Manage Users" actionLink="/admin/users">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-4">
                {/* Role breakdown bars */}
                {roleBreakdown.map(({ role, count, color }) => (
                  <div key={role}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{role}</span>
                      <span className="font-semibold text-white">{count ?? '—'}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all`}
                        style={{ width: count && stats?.total_students ? `${Math.min((count / (stats.total_students + stats.total_supervisors)) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
                {/* Recent users */}
                <div className="pt-3 border-t border-slate-700/50 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Recently registered</p>
                  {users.slice(0, 4).map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/30 transition">
                      <AvatarCircle name={u.name} index={i} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <Badge status={u.role} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-2">
              {[
                { label: 'Register Student',    sub: 'Add a new student account',        icon: Icon.plus,       to: '/admin/students/new',    color: 'text-indigo-400 bg-indigo-600/20'  },
                { label: 'Assign Placement',    sub: 'Create a new placement record',    icon: Icon.placements, to: '/admin/placements/new',  color: 'text-emerald-400 bg-emerald-500/20' },
                { label: 'Assign Supervisor',   sub: 'Link supervisor to a student',     icon: Icon.assign,     to: '/admin/supervisors',     color: 'text-amber-400 bg-amber-500/20'    },
                { label: 'View Evaluations',    sub: 'All scores across all students',   icon: Icon.eval,       to: '/admin/evaluations',     color: 'text-teal-400 bg-teal-500/20'      },
                { label: 'Manage Users',        sub: 'View and edit user accounts',      icon: Icon.users,      to: '/admin/users',           color: 'text-violet-400 bg-violet-500/20'  },
                { label: 'Generate Report',     sub: 'Export system-wide reports',       icon: Icon.report,     to: '/admin/reports',         color: 'text-rose-400 bg-rose-500/20'      },
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



