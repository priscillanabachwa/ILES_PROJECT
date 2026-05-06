import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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
  students:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  placements: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  supervisors:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  score:      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  report:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  plus:       <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
  assign:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
  eval:       <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  users:      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  chevron:    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
  close:      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
  search:     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  bell:       <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <p className="text-sm font-bold text-white">{title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">{Icon.close}</button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-700/50 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder-slate-500"
const selectCls = "w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-700/50 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"

// ─── Notification helper ──────────────────────────────────────────────────────
// Simulates sending a notification and shows a toast confirmation
const sendNotification = (recipient, message) => {
  // TODO: connect to Django — POST /api/notifications/
  // await axios.post('http://127.0.0.1:8000/api/notifications/', { recipient, message })
  console.log(`Notification sent to ${recipient}: ${message}`)
  toast.info(`📧 Notification sent to ${recipient}`, { position: 'top-right', autoClose: 3000 })
}

function RegisterStudentModal({ onClose }) {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', student_id:'', department:'', institution:'' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('First name, last name and email are required.')
      return
    }
    setSaving(true)
    try {
      // TODO: POST /api/accounts/register/ { ...form, role: 'student' }
      toast.success(`✓ Student ${form.first_name} ${form.last_name} registered successfully!`)
      // Send welcome notification to student
      sendNotification(form.email, `Welcome to ILES! Your student account has been created.`)
      onClose()
    } catch {
      toast.error('Failed to register student. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Register New Student" onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required>
          <input className={inputCls} placeholder="e.g. Amara" value={form.first_name} onChange={set('first_name')} />
        </FormField>
        <FormField label="Last Name" required>
          <input className={inputCls} placeholder="e.g. Nkosi" value={form.last_name} onChange={set('last_name')} />
        </FormField>
      </div>
      <FormField label="Email Address" required>
        <input className={inputCls} type="email" placeholder="student@university.ac.ug" value={form.email} onChange={set('email')} />
      </FormField>
      <FormField label="Student ID">
        <input className={inputCls} placeholder="e.g. 2500703348" value={form.student_id} onChange={set('student_id')} />
      </FormField>
      <FormField label="Institution">
        <input className={inputCls} placeholder="e.g. Makerere University" value={form.institution} onChange={set('institution')} />
      </FormField>
      <FormField label="Department">
        <input className={inputCls} placeholder="e.g. Computer Science" value={form.department} onChange={set('department')} />
      </FormField>
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
        <p className="text-xs text-indigo-300 flex items-center gap-2">{Icon.bell} A welcome notification will be sent to the student's email.</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition">
          {saving ? 'Registering…' : 'Register Student'}
        </button>
      </div>
    </Modal>
  )
}

function AssignPlacementModal({ onClose }) {
  const [form, setForm] = useState({ student:'', student_id:'', company:'', department:'', start_date:'', end_date:'' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.student || !form.company || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      // TODO: POST /api/placements/ { ...form }
      toast.success(`✓ Placement assigned to ${form.student} at ${form.company}!`)
      sendNotification(form.student, `Your internship placement at ${form.company} has been set up.`)
      onClose()
    } catch {
      toast.error('Failed to assign placement. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Assign Placement" onClose={onClose}>
      <FormField label="Student Name" required>
        <input className={inputCls} placeholder="e.g. Amara Nkosi" value={form.student} onChange={set('student')} />
      </FormField>
      <FormField label="Student ID">
        <input className={inputCls} placeholder="e.g. 2500703348" value={form.student_id} onChange={set('student_id')} />
      </FormField>
      <FormField label="Company / Organisation" required>
        <input className={inputCls} placeholder="e.g. TechCorp Uganda" value={form.company} onChange={set('company')} />
      </FormField>
      <FormField label="Department at Company">
        <input className={inputCls} placeholder="e.g. Software Engineering" value={form.department} onChange={set('department')} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start Date" required>
          <input className={inputCls} type="date" value={form.start_date} onChange={set('start_date')} />
        </FormField>
        <FormField label="End Date" required>
          <input className={inputCls} type="date" value={form.end_date} onChange={set('end_date')} />
        </FormField>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
        <p className="text-xs text-emerald-300 flex items-center gap-2">{Icon.bell} Student will be notified of their placement details.</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition">
          {saving ? 'Assigning…' : 'Assign Placement'}
        </button>
      </div>
    </Modal>
  )
}

function AssignSupervisorModal({ onClose, placement = null }) {
  const [form, setForm] = useState({
    student:              placement?.student_name || '',
    academic_supervisor:  placement?.academic_supervisor || '',
    workplace_supervisor: placement?.workplace_supervisor || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.student) { toast.error('Please enter a student name.'); return }
    if (!form.academic_supervisor && !form.workplace_supervisor) {
      toast.error('Please assign at least one supervisor.')
      return
    }
    setSaving(true)
    try {
      // TODO: PATCH /api/placements/<id>/ { academic_supervisor, workplace_supervisor }
      toast.success(`✓ Supervisor assigned to ${form.student}!`)

      // Notify both supervisors
      if (form.academic_supervisor) {
        sendNotification(form.academic_supervisor, `You have been assigned as academic supervisor for ${form.student}.`)
      }
      if (form.workplace_supervisor) {
        sendNotification(form.workplace_supervisor, `You have been assigned as workplace supervisor for ${form.student}.`)
      }
      // Notify student
      sendNotification(form.student, `Your supervisors have been assigned. Academic: ${form.academic_supervisor || 'TBD'}, Workplace: ${form.workplace_supervisor || 'TBD'}.`)

      onClose()
    } catch {
      toast.error('Failed to assign supervisor. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Assign Supervisor to Student" onClose={onClose}>
      <FormField label="Student Name" required>
        <input className={inputCls} placeholder="e.g. Amara Nkosi"
          value={form.student} onChange={set('student')}
          readOnly={!!placement} />
      </FormField>
      <FormField label="Academic Supervisor">
        <input className={inputCls} placeholder="e.g. Prof. Grace Atim" value={form.academic_supervisor} onChange={set('academic_supervisor')} />
      </FormField>
      <FormField label="Workplace Supervisor">
        <input className={inputCls} placeholder="e.g. David Ochieng" value={form.workplace_supervisor} onChange={set('workplace_supervisor')} />
      </FormField>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
        <p className="text-xs text-amber-300 font-medium flex items-center gap-2">{Icon.bell} Notifications will be sent to:</p>
        <p className="text-xs text-slate-400 ml-6">• The assigned academic supervisor</p>
        <p className="text-xs text-slate-400 ml-6">• The assigned workplace supervisor</p>
        <p className="text-xs text-slate-400 ml-6">• The student</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition">
          {saving ? 'Assigning…' : 'Assign & Notify'}
        </button>
      </div>
    </Modal>
  )
}

function ReportModal({ onClose }) {
  const [reportType, setReportType] = useState('placements')
  const [format, setFormat]         = useState('pdf')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // TODO: GET /api/reports/?type=placements&format=pdf
      setTimeout(() => {
        toast.success(`✓ ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated as ${format.toUpperCase()}!`)
        setGenerating(false)
        onClose()
      }, 1500)
    } catch {
      toast.error('Failed to generate report. Please try again.')
      setGenerating(false)
    }
  }

  return (
    <Modal title="Generate System Report" onClose={onClose}>
      <FormField label="Report Type">
        <select className={selectCls} value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="placements">Placement Summary Report</option>
          <option value="evaluations">Evaluation Scores Report</option>
          <option value="students">Student Progress Report</option>
          <option value="supervisors">Supervisor Activity Report</option>
          <option value="full">Full System Report</option>
        </select>
      </FormField>
      <FormField label="Export Format">
        <div className="flex gap-3">
          {['pdf','excel','csv'].map((f) => (
            <label key={f} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition
              ${format === f ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
              <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="hidden" />
              {f.toUpperCase()}
            </label>
          ))}
        </div>
      </FormField>
      <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-3">
        <p className="text-xs text-slate-400">The report will include data from the current semester. Generated reports support institutional decision-making as per US20.</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
        <button onClick={handleGenerate} disabled={generating}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition">
          {generating ? 'Generating…' : 'Generate Report'}
        </button>
      </div>
    </Modal>
  )
}

function StatCard({ label, value, sub, subLink, icon, accent }) {
  const A = {
    indigo:  { bg:'bg-indigo-600/10 border border-indigo-500/20',   icon:'bg-indigo-600/20 text-indigo-400',   val:'text-indigo-300',  sub:'text-indigo-400'  },
    amber:   { bg:'bg-amber-500/10 border border-amber-500/20',     icon:'bg-amber-500/20 text-amber-400',     val:'text-amber-300',   sub:'text-amber-400'   },
    emerald: { bg:'bg-emerald-500/10 border border-emerald-500/20', icon:'bg-emerald-500/20 text-emerald-400', val:'text-emerald-300', sub:'text-emerald-400' },
    rose:    { bg:'bg-rose-500/10 border border-rose-500/20',       icon:'bg-rose-500/20 text-rose-400',       val:'text-rose-300',    sub:'text-rose-400'    },
    teal:    { bg:'bg-teal-500/10 border border-teal-500/20',       icon:'bg-teal-500/20 text-teal-400',       val:'text-teal-300',    sub:'text-teal-400'    },
  }[accent] || {}
  return (
    <div className={`${A.bg} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${A.icon}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${A.val}`}>{value ?? '—'}</p>
        {sub && subLink
          ? <Link to={subLink} className={`text-xs font-medium mt-1 block hover:underline ${A.sub}`}>{sub} →</Link>
          : sub && <p className={`text-xs font-medium mt-1 ${A.sub}`}>{sub}</p>}
      </div>
    </div>
  )
}

function Card({ title, actionLabel, actionLink, onAction, children }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <p className="text-sm font-bold text-white">{title}</p>
        {actionLabel && (actionLink
          ? <Link to={actionLink} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">{actionLabel} →</Link>
          : onAction && <button onClick={onAction} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">{actionLabel} →</button>
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

  // Modal state
  const [modal,            setModal]           = useState(null) 
  const [selectedPlacement, setSelectedPlacement] = useState(null) 

  // Filter state
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [studentIdFilter, setStudentIdFilter] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError('')
      try {
        const [statsRes, placementsRes, usersRes, evaluationsRes] = await Promise.all([
          dashboardService.getAdminStats(),
          dashboardService.getAdminPlacements(),
          dashboardService.getAdminUsers(),
          dashboardService.getAdminEvaluations(),
        ])
        setStats(statsRes.data); setPlacements(placementsRes.data)
        setUsers(usersRes.data); setEvaluations(evaluationsRes.data)
      } catch {
        // Mock data — remove when backend is connected
        setStats({ total_students:42, total_placements:38, total_supervisors:12, average_score:74.8, active_placements:30, pending_placements:4, unassigned_students:4, evaluations_complete:28 })
        setPlacements([
          { id:1, student_name:'Amara Nkosi',    student_id:'2500703348', company:'TechCorp Uganda',          academic_supervisor:'Prof. Grace Atim',  workplace_supervisor:'David Ochieng', status:'ACTIVE',    start_date:'2025-09-01', end_date:'2025-11-30' },
          { id:2, student_name:'Brian Otim',     student_id:'2500703349', company:'MTN Uganda',               academic_supervisor:'Dr. James Okello',  workplace_supervisor:'Sarah Nambi',   status:'ACTIVE',    start_date:'2025-09-01', end_date:'2025-11-30' },
          { id:3, student_name:'Cynthia Akello', student_id:'2500703350', company:'Stanbic Bank',             academic_supervisor:'Prof. Grace Atim',  workplace_supervisor:'Peter Mugisha', status:'ACTIVE',    start_date:'2025-09-01', end_date:'2025-11-30' },
          { id:4, student_name:'Denis Okello',   student_id:'2500703351', company:'Uganda Revenue Authority', academic_supervisor:'Dr. James Okello',  workplace_supervisor:'Alice Tendo',   status:'COMPLETED', start_date:'2025-06-01', end_date:'2025-08-30' },
          { id:5, student_name:'Eva Namutebi',   student_id:'2500703352', company:'Airtel Uganda',            academic_supervisor:'',                  workplace_supervisor:'',              status:'PENDING',   start_date:'2026-01-01', end_date:'2026-03-30' },
        ])
        setUsers([
          { id:1, name:'Amara Nkosi',      email:'a.nkosi@uni.ac.ug',        role:'student',             joined:'2025-08-15' },
          { id:2, name:'Brian Otim',       email:'b.otim@uni.ac.ug',         role:'student',             joined:'2025-08-15' },
          { id:3, name:'Prof. Grace Atim', email:'g.atim@mak.ac.ug',         role:'academic_supervisor', joined:'2025-07-01' },
          { id:4, name:'David Ochieng',    email:'d.ochieng@techcorp.co.ug', role:'workplace_supervisor',joined:'2025-08-10' },
          { id:5, name:'Dr. James Okello', email:'j.okello@mak.ac.ug',       role:'academic_supervisor', joined:'2025-07-01' },
        ])
        setEvaluations([
          { id:1, student_name:'Amara Nkosi',    workplace_score:80, academic_score:74, logbook_score:74, final_score:76.4, grade:'B+' },
          { id:2, student_name:'Brian Otim',     workplace_score:75, academic_score:70, logbook_score:72, final_score:72.4, grade:'B'  },
          { id:3, student_name:'Cynthia Akello', workplace_score:88, academic_score:82, logbook_score:80, final_score:83.8, grade:'A'  },
          { id:4, student_name:'Denis Okello',   workplace_score:65, academic_score:60, logbook_score:68, final_score:64.4, grade:'C+' },
        ])
        setAlerts([
          { id:1, message:'4 students have no placement assigned', type:'warning', link:'/admin/students' },
          { id:2, message:'6 logbooks are overdue for review',     type:'warning', link:'/admin/logs'     },
          { id:3, message:'2 placements ending within 2 weeks',    type:'info',    link:'/admin/placements'},
        ])
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Administrator'

  // Filter placements by status, name/company search AND student ID
  const filteredPlacements = placements.filter((p) => {
    const matchStatus    = statusFilter === 'all' || p.status === statusFilter
    const matchSearch    = search === '' ||
      p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.company?.toLowerCase().includes(search.toLowerCase())
    const matchStudentId = studentIdFilter === '' ||
      p.student_id?.toLowerCase().includes(studentIdFilter.toLowerCase())
    return matchStatus && matchSearch && matchStudentId
  })

  // Mark placement as completed + notify
  const handleMarkCompleted = (p) => {
    setPlacements((prev) => prev.map((pl) => pl.id === p.id ? { ...pl, status:'COMPLETED' } : pl))
    toast.success(`✓ ${p.student_name}'s placement marked as completed!`)
    sendNotification(p.student_name, `Your internship at ${p.company} has been marked as completed.`)
    // TODO: PATCH /api/placements/<id>/ { status: 'COMPLETED' }
  }

  // Open assign supervisor modal from a placement row
  const handleInlineAssign = (p) => {
    setSelectedPlacement(p)
    setModal('supervisor')
  }

  const roleBreakdown = [
    { role:'Students',              count:stats?.total_students,   color:'bg-indigo-500' },
    { role:'Academic Supervisors',  count:stats?.total_supervisors ? Math.round(stats.total_supervisors * 0.5) : null, color:'bg-emerald-500' },
    { role:'Workplace Supervisors', count:stats?.total_supervisors ? Math.round(stats.total_supervisors * 0.5) : null, color:'bg-amber-500'   },
  ]

  return (
    <div className="space-y-6">

      {/* ToastContainer — required for react-toastify */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="dark"
      />

      {/* Modals */}
      {modal === 'register'   && <RegisterStudentModal  onClose={() => setModal(null)} />}
      {modal === 'placement'  && <AssignPlacementModal  onClose={() => setModal(null)} />}
      {modal === 'supervisor' && (
        <AssignSupervisorModal
          onClose={() => { setModal(null); setSelectedPlacement(null) }}
          placement={selectedPlacement}
        />
      )}
      {modal === 'report' && <ReportModal onClose={() => setModal(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {fullName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Manage students, placements, supervisors, and system-wide reports.</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-400 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Semester 2024 — Semester II
        </div>
      </div>

      {/* System Alerts */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium
              ${a.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'}`}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                {a.message}
              </div>
              <Link to={a.link} className="text-xs font-semibold hover:underline ml-4 whitespace-nowrap">Fix now →</Link>
            </div>
          ))}
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"    value={stats?.total_students}    sub="View all students"    subLink="/admin/students"    accent="indigo"  icon={Icon.students}   />
        <StatCard label="Active Placements" value={stats?.active_placements} sub="View all placements"  subLink="/admin/placements"  accent="emerald" icon={Icon.placements} />
        <StatCard label="Total Supervisors" value={stats?.total_supervisors} sub="View all supervisors" subLink="/admin/supervisors" accent="amber"   icon={Icon.supervisors}/>
        <StatCard label="Average Score"     value={stats ? `${Number(stats.average_score).toFixed(1)}%` : null} sub="View all evaluations" subLink="/admin/evaluations" accent="rose" icon={Icon.score} />
      </div>

      {/* Stat cards row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Pending Placements',   value:stats?.pending_placements,   color:'text-amber-300',   link:'/admin/placements', linkText:'Assign now'  },
          { label:'Unassigned Students',  value:stats?.unassigned_students,  color:'text-rose-300',    link:'/admin/students',   linkText:'Assign now'  },
          { label:'Evaluations Complete', value:stats?.evaluations_complete, color:'text-emerald-300', link:'/admin/evaluations',linkText:'View reports' },
          { label:'Total Placements',     value:stats?.total_placements,     color:'text-indigo-300',  link:'/admin/placements', linkText:'View all'    },
        ].map(({ label, value, color, link, linkText }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
            <Link to={link} className={`text-xs hover:underline mt-1 block ${color}`}>{linkText} →</Link>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left col — 3/5 */}
        <div className="lg:col-span-3 space-y-5">

          {/* Placements with filter, search, student ID filter */}
          <Card title="Recent Placements" actionLabel="View All" actionLink="/admin/placements">
            {/* Filters */}
            <div className="space-y-3 mb-4">
              {/* Status filter tabs */}
              <div className="flex items-center gap-1 bg-slate-700/30 border border-slate-700/50 rounded-xl p-1">
                {['all','ACTIVE','PENDING','COMPLETED'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex-1
                      ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {/* Search + Student ID filter */}
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-700/50 rounded-xl px-3 py-1.5 flex-1">
                  {Icon.search}
                  <input type="text" placeholder="Search student or company…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-xs text-slate-300 placeholder-slate-600 w-full" />
                </div>
                <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-700/50 rounded-xl px-3 py-1.5 w-36">
                  <input type="text" placeholder="Student ID…" value={studentIdFilter}
                    onChange={(e) => setStudentIdFilter(e.target.value)}
                    className="bg-transparent outline-none text-xs text-slate-300 placeholder-slate-600 w-full" />
                </div>
              </div>
            </div>

            {loading ? <ListSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <th className="text-left pb-3 font-semibold">Student</th>
                      <th className="text-left pb-3 font-semibold">Company</th>
                      <th className="text-left pb-3 font-semibold">Supervisors</th>
                      <th className="text-left pb-3 font-semibold">Status</th>
                      <th className="text-left pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredPlacements.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No placements match your filter.</td></tr>
                    )}
                    {filteredPlacements.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-700/20 transition">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2">
                            <AvatarCircle name={p.student_name} index={i} size="sm" />
                            <div>
                              <p className="font-semibold text-white">{p.student_name}</p>
                              {p.student_id && <p className="text-slate-500" style={{fontSize:'10px'}}>{p.student_id}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-2 text-slate-400">{p.company}</td>
                        <td className="py-3 pr-2">
                          {p.academic_supervisor
                            ? <p className="text-slate-400 truncate max-w-[100px]">{p.academic_supervisor}</p>
                            : <p className="text-rose-400 italic" style={{fontSize:'10px'}}>No academic supervisor</p>
                          }
                          {p.workplace_supervisor
                            ? <p className="text-slate-500 truncate max-w-[100px]">{p.workplace_supervisor}</p>
                            : <p className="text-rose-400 italic" style={{fontSize:'10px'}}>No workplace supervisor</p>
                          }
                        </td>
                        <td className="py-3 pr-2"><Badge status={p.status} /></td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1">
                            {/* Inline assign supervisor button */}
                            <button onClick={() => handleInlineAssign(p)}
                              className="text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                              Assign Sup.
                            </button>
                            {/* Mark done button — only for ACTIVE */}
                            {p.status === 'ACTIVE' && (
                              <button onClick={() => handleMarkCompleted(p)}
                                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                                Mark Done
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Evaluation Overview — US18 */}
          <Card title="Evaluation Overview" actionLabel="View All" actionLink="/admin/evaluations">
            {loading ? <ListSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <th className="text-left pb-3 font-semibold">Student</th>
                      <th className="text-center pb-3 font-semibold">Workplace</th>
                      <th className="text-center pb-3 font-semibold">Academic</th>
                      <th className="text-center pb-3 font-semibold">Logbook</th>
                      <th className="text-center pb-3 font-semibold">Final</th>
                      <th className="text-center pb-3 font-semibold">Grade</th>
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

          {/* User Overview — US19 */}
          <Card title="User Overview" actionLabel="Manage Users" actionLink="/admin/users">
            {loading ? <ListSkeleton /> : (
              <div className="space-y-4">
                {roleBreakdown.map(({ role, count, color }) => (
                  <div key={role}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{role}</span>
                      <span className="font-semibold text-white">{count ?? '—'}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full transition-all`}
                        style={{ width: count && stats?.total_students ? `${Math.min((count / (stats.total_students + stats.total_supervisors)) * 100, 100)}%` : '0%' }} />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-700/50 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Recently registered</p>
                  {users.slice(0,4).map((u, i) => (
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
                { label:'Register Student',  sub:'Add a new student account',      icon:Icon.plus,       onClick:() => setModal('register'),   color:'text-indigo-400 bg-indigo-600/20'  },
                { label:'Assign Placement',  sub:'Create a new placement record',   icon:Icon.placements, onClick:() => setModal('placement'),  color:'text-emerald-400 bg-emerald-500/20' },
                { label:'Assign Supervisor', sub:'Link supervisor to a student',    icon:Icon.assign,     onClick:() => { setSelectedPlacement(null); setModal('supervisor') }, color:'text-amber-400 bg-amber-500/20' },
                { label:'View Evaluations',  sub:'All scores across all students',  icon:Icon.eval,       to:'/admin/evaluations',              color:'text-teal-400 bg-teal-500/20'      },
                { label:'Manage Users',      sub:'View and edit user accounts',     icon:Icon.users,      to:'/admin/users',                    color:'text-violet-400 bg-violet-500/20'  },
                { label:'Generate Report',   sub:'Export system-wide reports',      icon:Icon.report,     onClick:() => setModal('report'),     color:'text-rose-400 bg-rose-500/20'      },
              ].map(({ label, sub, icon, onClick, to, color }) => {
                const cls = "flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/40 hover:bg-indigo-600/10 transition group w-full text-left"
                const inner = (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-indigo-300">{label}</p>
                      <p className="text-xs text-slate-500">{sub}</p>
                    </div>
                    <span className="text-slate-600 group-hover:text-indigo-400">{Icon.chevron}</span>
                  </>
                )
                return onClick
                  ? <button key={label} onClick={onClick} className={cls}>{inner}</button>
                  : <Link key={label} to={to} className={cls}>{inner}</Link>
              })}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}