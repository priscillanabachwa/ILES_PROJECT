import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardService } from '../services'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

const isOverdue = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false

const daysUntil = (deadline) => {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-500',
  submitted: 'bg-amber-50 text-amber-700',
  reviewed:  'bg-blue-50 text-blue-700',
  approved:  'bg-emerald-50 text-emerald-700',
  ACTIVE:    'bg-indigo-50 text-indigo-700',
  PENDING:   'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-600',
}

function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      {status?.toLowerCase()}
    </span>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
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
  logbook:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  pending:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  score:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  feedback: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>,
  company:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  user:     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  plus:     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
  draft:    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  chevron:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
  bell:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
}

function Navbar({ user, notifications = 0, onLogout }) {
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">ILES</div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">ILES</p>
          <p className="text-gray-400 leading-tight" style={{ fontSize: '9px' }}>Internship Login & Evaluation System</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/dashboard"  className="text-indigo-600 text-xs font-semibold border-b-2 border-indigo-600 pb-0.5">Dashboard</Link>
        <Link to="/logbooks"   className="text-gray-400 text-xs hover:text-gray-700 transition font-medium">My Logbooks</Link>
        <Link to="/feedback"   className="text-gray-400 text-xs hover:text-gray-700 transition font-medium">Feedback</Link>
        <Link to="/evaluation" className="text-gray-400 text-xs hover:text-gray-700 transition font-medium">Evaluation</Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="text-gray-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-indigo-50">
            {Icon.bell}
          </button>
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: '9px' }}>
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

function Card({ title, actionLabel, actionLink, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        {actionLabel && actionLink && (
          <Link to={actionLink} className="text-xs font-semibold text-indigo-600 hover:underline">{actionLabel} →</Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ScoreBreakdown({ scores }) {
  const segments = [
    { label: 'Workplace Supervisor', weight: 40, score: scores?.workplace_score, color: 'bg-indigo-500' },
    { label: 'Academic Supervisor',  weight: 30, score: scores?.academic_score,  color: 'bg-emerald-500' },
    { label: 'Logbook',              weight: 30, score: scores?.logbook_score,   color: 'bg-amber-500' },
  ]
  return (
    <div className="space-y-3">
      {segments.map(({ label, weight, score, color }) => {
        const weighted = score != null ? ((score * weight) / 100).toFixed(1) : null
        return (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{label} <span className="text-gray-300">({weight}%)</span></span>
              <span className="font-semibold text-gray-700">
                {score != null ? `${score} → ${weighted}` : 'Pending'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all`}
                style={{ width: score != null ? `${Math.min(score, 100)}%` : '0%' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WorkflowStep({ label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
        ${done  ? 'bg-indigo-600 border-indigo-600 text-white' :
          active ? 'bg-white border-indigo-600 text-indigo-600' :
                   'bg-white border-gray-200 text-gray-300'}`}>
        {done ? '✓' : ''}
      </div>
      <p className={`text-xs font-medium text-center ${active || done ? 'text-gray-700' : 'text-gray-300'}`}>{label}</p>
    </div>
  )
}

function WorkflowTracker({ status }) {
  const steps  = ['draft', 'submitted', 'reviewed', 'approved']
  const idx    = steps.indexOf(status?.toLowerCase()) ?? 0
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <WorkflowStep label={step.charAt(0).toUpperCase() + step.slice(1)} active={i === idx} done={i < idx} />
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mt-[-12px] ${i < idx ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [stats,     setStats]     = useState(null)
  const [placement, setPlacement] = useState(null)
  const [logbooks,  setLogbooks]  = useState([])
  const [deadline,  setDeadline]  = useState(null)
  const [scores,    setScores]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, placementRes, logbooksRes, deadlineRes, scoresRes] = await Promise.all([
          dashboardService.getStudentStats(),
          dashboardService.getStudentPlacement(),
          dashboardService.getStudentLogbooks(),
          dashboardService.getNextDeadline(),
          dashboardService.getStudentScores(),
        ])
        setStats(statsRes.data)
        setPlacement(placementRes.data)
        setLogbooks(logbooksRes.data)
        setDeadline(deadlineRes.data)
        setScores(scoresRes.data)
      } catch {
        setError('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const fullName      = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Student'
  const days          = daysUntil(deadline?.due_date)
  const deadlineUrgent = days != null && days <= 2

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} notifications={stats?.unread_feedback || 0} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {fullName} 👋</h1>
            <p className="text-sm text-gray-400 mt-1">
              Track your internship progress, submit logbooks, and view your evaluations.
            </p>
          </div>
          {/* Next deadline pill */}
          {deadline && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border shadow-sm
              ${deadlineUrgent
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-gray-200 text-gray-600'}`}>
              <span className="text-gray-400">{Icon.calendar}</span>
              {deadlineUrgent
                ? `Week ${deadline.week_number} due in ${days} day${days !== 1 ? 's' : ''}!`
                : `Next deadline: Week ${deadline.week_number} — ${formatDate(deadline.due_date)}`
              }
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Logs Submitted"  value={stats?.logs_submitted}  sub="View all logs"    subLink="/logbooks"   accent="indigo"  icon={Icon.logbook}  />
          <StatCard label="Pending / Draft" value={stats?.pending_logs}    sub="Continue writing" subLink="/logbooks"   accent="amber"   icon={Icon.pending}  />
          <StatCard label="Unread Feedback" value={stats?.unread_feedback} sub="View feedback"    subLink="/feedback"   accent="rose"    icon={Icon.feedback} />
          <StatCard label="Current Score"   value={stats?.current_score != null ? `${Number(stats.current_score).toFixed(1)}%` : null} sub="View breakdown" subLink="/evaluation" accent="emerald" icon={Icon.score} />
        </div>

        {/* ── Main content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left col — 3/5 */}
          <div className="lg:col-span-3 space-y-5">

            {/* Internship Placement */}
            <Card title="My Internship Placement">
              {loading ? <ListSkeleton /> : !placement
                ? <p className="text-xs text-gray-400">No placement assigned yet. Contact your administrator.</p>
                : (
                  <div className="space-y-4">
                    {/* Status + workflow */}
                    <div className="flex items-center justify-between">
                      <Badge status={placement.status} />
                      <div className="text-xs text-gray-400">
                        {formatDate(placement.start_date)} — {formatDate(placement.end_date)}
                      </div>
                    </div>

                    {/* Company + supervisors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">{Icon.company}<span className="text-xs font-semibold uppercase tracking-wide">Company</span></div>
                        <p className="text-sm font-semibold text-gray-800">{placement.company}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{placement.company_address}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">{Icon.user}<span className="text-xs font-semibold uppercase tracking-wide">Workplace Supervisor</span></div>
                        <p className="text-sm font-semibold text-gray-800">{placement.workplace_supervisor}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{placement.workplace_supervisor_email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">{Icon.user}<span className="text-xs font-semibold uppercase tracking-wide">Academic Supervisor</span></div>
                        <p className="text-sm font-semibold text-gray-800">{placement.academic_supervisor}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{placement.academic_supervisor_email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">{Icon.calendar}<span className="text-xs font-semibold uppercase tracking-wide">Duration</span></div>
                        <p className="text-sm font-semibold text-gray-800">{placement.duration_weeks} weeks</p>
                        <p className="text-xs text-gray-400 mt-0.5">Week {placement.current_week} of {placement.duration_weeks}</p>
                      </div>
                    </div>
                  </div>
                )
              }
            </Card>

            {/* Weekly Logbooks */}
            <Card title="My Weekly Logbooks" actionLabel="View All" actionLink="/logbooks">
              {loading ? <ListSkeleton /> : (
                <div className="space-y-2">
                  {logbooks.length === 0 && (
                    <p className="text-xs text-gray-400">No logbooks yet. Submit your first weekly log!</p>
                  )}
                  {logbooks.slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 transition group">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-indigo-100">
                        W{l.week_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">Week {l.week_number} — {l.activities?.slice(0, 40) || 'No activities recorded'}...</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {l.submitted_at ? `Submitted ${formatDate(l.submitted_at)}` : `Due ${formatDate(l.deadline)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={l.status} />
                        {l.status === 'draft' && (
                          <Link to={`/logbooks/${l.id}/edit`} className="text-xs text-indigo-600 font-semibold hover:underline">
                            Continue
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Workflow explainer */}
                  {logbooks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-3 font-medium">Latest log workflow status</p>
                      <WorkflowTracker status={logbooks[0]?.status} />
                    </div>
                  )}
                </div>
              )}
            </Card>

          </div>

          {/* Right col — 2/5 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Score Breakdown */}
            <Card title="Score Breakdown" actionLabel="Full Evaluation" actionLink="/evaluation">
              {loading ? <ListSkeleton /> : (
                <>
                  {!scores
                    ? <p className="text-xs text-gray-400">Scores will appear once evaluations are submitted.</p>
                    : <ScoreBreakdown scores={scores} />
                  }
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-indigo-400">Final Score</p>
                      <p className="text-xl font-bold text-indigo-700 mt-0.5">
                        {scores?.final_score != null ? `${Number(scores.final_score).toFixed(1)}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-400">Grade</p>
                      <p className="text-xl font-bold text-emerald-700 mt-0.5">
                        {scores?.grade || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium mb-1">Scoring formula</p>
                    <p className="text-xs text-gray-500">40% Workplace + 30% Academic + 30% Logbook</p>
                  </div>
                </>
              )}
            </Card>

            {/* Recent Feedback */}
            <Card title="Recent Feedback" actionLabel="View All" actionLink="/feedback">
              {loading ? <ListSkeleton /> : (
                <div className="space-y-3">
                  {(!scores?.recent_feedback || scores.recent_feedback.length === 0) && (
                    <p className="text-xs text-gray-400">No feedback received yet.</p>
                  )}
                  {scores?.recent_feedback?.slice(0, 3).map((f, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                            {getInitials(f.from)}
                          </div>
                          <p className="text-xs font-semibold text-gray-700">{f.from}</p>
                        </div>
                        <p className="text-xs text-gray-400">{formatDate(f.date)}</p>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{f.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="space-y-2">
                {[
                  { label: 'Submit New Log',   sub: 'Document this week\'s activities', icon: Icon.plus,    to: '/logbooks/new',  color: 'text-indigo-500 bg-indigo-50'  },
                  { label: 'Continue Draft',   sub: 'Resume your saved draft log',      icon: Icon.draft,   to: '/logbooks',      color: 'text-amber-500 bg-amber-50'    },
                  { label: 'View Feedback',    sub: 'Read supervisor comments',         icon: Icon.feedback, to: '/feedback',     color: 'text-rose-500 bg-rose-50'      },
                  { label: 'View Evaluation',  sub: 'Check your scores and grade',      icon: Icon.score,   to: '/evaluation',    color: 'text-emerald-500 bg-emerald-50'},
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
