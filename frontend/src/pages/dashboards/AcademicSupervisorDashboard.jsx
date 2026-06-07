import { useState, useEffect } from 'react'
import { useAuth } from "../../Context/AuthContext"
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import dashboardService from "../../services/dashboardService"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const daysAgo = (days) => {
  if (days == null) return null
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

const STATUS_STYLES = {
  'In Progress':      'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  ACTIVE:             'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED:          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PENDING:            'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  submitted: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  reviewed:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  approved:           'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  overdue:            'bg-red-500/20 text-red-300 border border-red-500/30',
  Overdue:            'bg-red-500/20 text-red-300 border border-red-500/30',
  draft:              'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const capWord = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s

function Badge({ status, overdue = false }) {
  const s = overdue ? 'Overdue' : status
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${STATUS_STYLES[s] || 'bg-slate-500/20 text-slate-400'}`}>
      {overdue ? 'Overdue' : capWord(status)}
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
  students: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  logbook:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  eval:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  report:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  search:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  chevron:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
}

function DisapproveModal({ log, onClose, onConfirm, loading }) {
  const [comment, setComment] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-white">Disapprove Log</h2>
            <p className="text-slate-400 text-sm mt-0.5">Week {log.week_number} — {log.student_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-300 text-sm">The log will be sent back to the student as a draft for revision.</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              Reason for disapproval <span className="text-red-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Explain what needs to be corrected..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!comment.trim()) { toast.error('A reason is required.'); return }
              onConfirm(log.id, comment.trim())
            }}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50">
            {loading ? 'Disapproving...' : 'Disapprove'}
          </button>
        </div>
      </div>
    </div>
  )
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
          ? <Link to={subLink} className={`text-xs font-medium mt-1 block hover:underline ${A.sub}`}>{sub}</Link>
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
              {actionLabel}
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
  const navigate = useNavigate()
  const [placements, setPlacements]     = useState([])
  const [logbooks,   setLogbooks]       = useState([])
  const [activity,   setRecentActivity] = useState([])
  const [loading,    setLoading]        = useState(true)
  const [error,      setError]          = useState('')
  const [search,     setSearch]         = useState('')
  const [approvingId,      setApprovingId]      = useState(null)
  const [disapproveTarget, setDisapproveTarget] = useState(null)
  const [disapproving,     setDisapproving]     = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, placementsRes, logbooksRes, activityRes] = await Promise.all([
          dashboardService.getAcademicStats(),
          dashboardService.getAcademicPlacements(),
          dashboardService.getPendingReviews(),
          dashboardService.getRecentActivity(),
        ])
        setStats(statsRes.data)
        setPlacements(placementsRes.data)
        setLogbooks(logbooksRes.data)
        setRecentActivity(activityRes.data)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).map(cap).join(' ') || 'Supervisor'

  const handleApprove = async (logId) => {
    setApprovingId(logId)
    try {
      const log = logbooks.find(l => l.id === logId)
      await dashboardService.approveLog(logId)
      setLogbooks(prev => prev.filter(l => l.id !== logId))
      setStats(prev => prev ? {
        ...prev,
        awaiting_approval: Math.max(0, (prev.awaiting_approval ?? 0) - 1),
      } : prev)
      toast.info(
        <div>
          <p className="font-semibold text-sm">Log approved!</p>
          <p className="text-xs mt-0.5 mb-2">
            Remember to award marks for <span className="font-semibold">{log?.student_name || 'this student'}</span>.
          </p>
          <button onClick={() => navigate('/academic/evaluations')} className="text-xs font-bold underline">
            Go to Evaluations →
          </button>
        </div>,
        { autoClose: 6000 }
      )
    } catch (err) {
      toast.error(err.message || 'Failed to approve log.')
    } finally { setApprovingId(null) }
  }

  const handleDisapprove = async (logId, comment) => {
    setDisapproving(true)
    try {
      await dashboardService.rejectLog(logId, comment)
      toast.success('Log sent back to student for revision.')
      setLogbooks(prev => prev.filter(l => l.id !== logId))
      setStats(prev => {
        if (!prev) return prev
        const wasReviewed = disapproveTarget?.status === 'reviewed'
        return {
          ...prev,
          pending_reviews:   wasReviewed ? prev.pending_reviews : Math.max(0, (prev.pending_reviews ?? 0) - 1),
          awaiting_approval: wasReviewed ? Math.max(0, (prev.awaiting_approval ?? 0) - 1) : prev.awaiting_approval,
        }
      })
      setDisapproveTarget(null)
    } catch (err) {
      toast.error(err.message || 'Failed to disapprove log.')
    } finally { setDisapproving(false) }
  }

  const filtered = placements.filter((p) =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {disapproveTarget && (
        <DisapproveModal
          log={disapproveTarget}
          onClose={() => setDisapproveTarget(null)}
          onConfirm={handleDisapprove}
          loading={disapproving}
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {fullName}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your assigned students, review internship logs, and track evaluations.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Students"     value={stats?.assigned_students}          sub="View all students"            subLink="/academic/logs"         accent="indigo"  icon={Icon.students} />
        <StatCard label="Action Required"        value={stats ? (stats.pending_reviews ?? 0) + (stats.awaiting_approval ?? 0) : null} sub="Pending review or approval"  subLink="/academic/logs"         accent="amber"   icon={Icon.logbook} />
        <StatCard label="Pending Evaluations"    value={stats?.pending_evaluations}        sub="Students not yet evaluated"   subLink="/academic/evaluations"  accent="rose"    icon={Icon.eval}     />
        <StatCard label="Completed Evaluations"  value={stats?.completed_evaluations}      sub="View summaries"               subLink="/academic/evaluations"  accent="emerald" icon={Icon.report}   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <div className="lg:col-span-3 space-y-5">

          {/* Assigned Students */}
          <Card
            title="Assigned Students"
            actionLabel="View All"
            actionLink="/academic/logs"
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
                      <p className="text-sm font-semibold text-white truncate capitalize">{p.student_name}</p>
                      <p className="text-xs text-slate-400">{p.company || 'No company assigned'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.pending_count > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {p.pending_count} pending
                        </span>
                      )}
                      <Badge status={p.status} />
                    </div>
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

          {/* Submission Progress (replaces flat Recent Activity) */}
          <Card title="Submission Progress" actionLabel="View All" actionLink="/academic/logs">
            {loading ? <ListSkeleton /> : (
              activity.length === 0
                ? <p className="text-xs text-slate-500">No students assigned yet.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-700/50">
                          <th className="text-left pb-3 font-semibold w-1/4">Student</th>
                          <th className="text-center pb-3 font-semibold w-1/6">Submitted</th>
                          <th className="text-center pb-3 font-semibold w-1/6">Approved</th>
                          <th className="text-center pb-3 font-semibold w-1/5">Pending</th>
                          <th className="text-left pb-3 font-semibold w-1/5">Last Log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {activity.map((a, i) => (
                          <tr key={a.id} className="hover:bg-slate-700/20 transition">
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <AvatarCircle name={a.student_name} index={i} size="sm" />
                                <span className="font-semibold text-white truncate capitalize">{a.student_name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-center">
                              <span className="text-slate-300 font-semibold">{a.total_submitted}</span>
                            </td>
                            <td className="py-3 pr-3 text-center">
                              <span className="text-emerald-400 font-semibold">{a.approved_count}</span>
                            </td>
                            <td className="py-3 pr-3 text-center">
                              {a.pending_count > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {a.pending_count} pending
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="py-3">
                              {a.last_week
                                ? <span className="text-slate-400">Week {a.last_week}</span>
                                : <span className="text-slate-600">No logs yet</span>
                              }
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

        <div className="lg:col-span-2 space-y-5">

          {/* Pending Reviews — sorted by urgency, shows days waiting */}
          <Card title="Pending Reviews" actionLabel="Review All" actionLink="/academic/logs">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-3">
                {logbooks.length === 0 && <p className="text-xs text-slate-500">No pending reviews.</p>}
                {logbooks.slice(0, 4).map((l, i) => {
                  const overdue = isOverdue(l.deadline)
                  const waiting = daysAgo(l.days_waiting)
                  return (
                    <div
                      key={l.id}
                      className={`p-2.5 rounded-xl border transition
                        ${overdue
                          ? 'border-red-500/30 bg-red-500/10'
                          : 'border-slate-700/50 hover:bg-slate-700/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        <AvatarCircle name={l.student_name} index={i} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white capitalize">
                            Week {l.week_number} — {l.student_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {waiting && (
                              <span className={`text-xs font-medium ${
                                overdue ? 'text-red-400' :
                                (l.days_waiting ?? 0) >= 7 ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                {overdue ? `Overdue · ${waiting} waiting` : `Waiting ${waiting}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge status={l.status} overdue={overdue} />
                      </div>
                      {l.status === 'submitted' && (
                        <div className="mt-2">
                          <Link
                            to="/academic/logs"
                            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center justify-center"
                          >
                            Review
                          </Link>
                        </div>
                      )}
                      {l.status === 'reviewed' && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleApprove(l.id)}
                            disabled={approvingId === l.id}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition disabled:opacity-50"
                          >
                            {approvingId === l.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setDisapproveTarget(l)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition"
                          >
                            Disapprove
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {stats?.pending_reviews > 4 && (
                  <Link to="/academic/logs" className="text-xs text-amber-400 font-semibold hover:underline block pt-1">
                    View all pending ({stats.pending_reviews})
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* Evaluation Overview */}
          <Card title="Evaluation Overview" actionLabel="Go to Evaluations" actionLink="/academic/evaluations">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-black text-white">{stats?.assigned_students ?? '—'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">students</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Done</p>
                    <p className="text-2xl font-black text-emerald-300">{stats?.completed_evaluations ?? '—'}</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">evaluated</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Pending</p>
                    <p className="text-2xl font-black text-amber-300">
                      {stats ? Math.max(0, stats.assigned_students - stats.completed_evaluations) : '—'}
                    </p>
                    <p className="text-[10px] text-amber-500 mt-0.5">remaining</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-indigo-400 font-medium">Average Score</p>
                    <p className="text-xs text-slate-500 mt-0.5">Across all submitted evaluations</p>
                  </div>
                  <p className="text-2xl font-black text-indigo-300">
                    {stats?.average_score != null
                      ? `${Number(stats.average_score) % 1 === 0 ? Number(stats.average_score).toFixed(0) : Number(stats.average_score).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>

                {stats && stats.assigned_students > stats.completed_evaluations && (
                  <Link
                    to="/academic/evaluations"
                    className="flex items-center justify-between w-full px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition group"
                  >
                    <p className="text-xs font-semibold text-amber-300">
                      {stats.assigned_students - stats.completed_evaluations} student{stats.assigned_students - stats.completed_evaluations !== 1 ? 's' : ''} still need an evaluation
                    </p>
                    <span className="text-amber-500 group-hover:text-amber-300 transition">{Icon.chevron}</span>
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-2">
              {[
                { label: 'View My Students',   sub: 'All assigned students',         icon: Icon.students, to: '/academic/logs',        color: 'text-indigo-400 bg-indigo-600/20' },
                { label: 'Review Submissions', sub: 'Pending internship logs',        icon: Icon.logbook,  to: '/academic/logs',        color: 'text-amber-400 bg-amber-500/20'   },
                { label: 'Submit Evaluation',  sub: 'Complete a student evaluation',  icon: Icon.eval,     to: '/academic/evaluations', color: 'text-teal-400 bg-teal-500/20'     },
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
