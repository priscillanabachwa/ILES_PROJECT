import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id:1,  first_name:'Amara',  last_name:'Nkosi',    email:'a.nkosi@uni.ac.ug',        role:'student',              status:'active',   last_login:'2026-05-04', date_joined:'2025-08-15', student_id:'2500703348', department:'Computer Science'      },
  { id:2,  first_name:'Brian',  last_name:'Otim',     email:'b.otim@uni.ac.ug',         role:'student',              status:'active',   last_login:'2026-05-03', date_joined:'2025-08-15', student_id:'2500703349', department:'Software Engineering'   },
  { id:3,  first_name:'Cynthia',last_name:'Akello',   email:'c.akello@uni.ac.ug',       role:'student',              status:'active',   last_login:'2026-05-02', date_joined:'2025-08-15', student_id:'2500703350', department:'Information Systems'    },
  { id:4,  first_name:'Denis',  last_name:'Okello',   email:'d.okello@uni.ac.ug',       role:'student',              status:'inactive', last_login:'2026-03-10', date_joined:'2025-08-15', student_id:'2500703351', department:'Computer Science'      },
  { id:5,  first_name:'Eva',    last_name:'Namutebi', email:'e.namutebi@uni.ac.ug',     role:'student',              status:'active',   last_login:'2026-05-01', date_joined:'2025-08-20', student_id:'2500703352', department:'Computer Science'      },
  { id:6,  first_name:'Frank',  last_name:'Ssali',    email:'f.ssali@uni.ac.ug',        role:'student',              status:'active',   last_login:'2026-04-28', date_joined:'2025-08-20', student_id:'2500703353', department:'Networks'               },
  { id:7,  first_name:'Grace',  last_name:'Atim',     email:'g.atim@mak.ac.ug',         role:'academic_supervisor',  status:'active',   last_login:'2026-05-05', date_joined:'2025-07-01', staff_id:'STF001',       faculty:'SCIT'                     },
  { id:8,  first_name:'James',  last_name:'Okello',   email:'j.okello@mak.ac.ug',       role:'academic_supervisor',  status:'active',   last_login:'2026-05-04', date_joined:'2025-07-01', staff_id:'STF002',       faculty:'SCIT'                     },
  { id:9,  first_name:'David',  last_name:'Ochieng',  email:'d.ochieng@techcorp.co.ug', role:'workplace_supervisor', status:'active',   last_login:'2026-05-03', date_joined:'2025-08-10', organisation:'TechCorp Uganda', job_title:'Senior Engineer'   },
  { id:10, first_name:'Sarah',  last_name:'Nambi',    email:'s.nambi@mtn.co.ug',        role:'workplace_supervisor', status:'active',   last_login:'2026-04-30', date_joined:'2025-08-10', organisation:'MTN Uganda',      job_title:'IT Manager'        },
  { id:11, first_name:'Peter',  last_name:'Mugisha',  email:'p.mugisha@stanbic.com',    role:'workplace_supervisor', status:'inactive', last_login:'2026-02-15', date_joined:'2025-08-12', organisation:'Stanbic Bank',    job_title:'Data Analyst'      },
  { id:12, first_name:'Admin',  last_name:'User',     email:'admin@mak.ac.ug',          role:'admin',                status:'active',   last_login:'2026-05-06', date_joined:'2025-06-01', staff_id:'ADM001',       faculty:'Administration'           },
]

const MOCK_PLACEMENTS = [
  { id:1, student_name:'Amara Nkosi',    student_id:'2500703348', department:'Computer Science',     company:'TechCorp Uganda',          academic_supervisor:'Prof. Grace Atim',  workplace_supervisor:'David Ochieng', status:'ACTIVE',     start_date:'2025-09-01', end_date:'2025-11-30' },
  { id:2, student_name:'Brian Otim',     student_id:'2500703349', department:'Software Engineering', company:'MTN Uganda',               academic_supervisor:'Dr. James Okello',  workplace_supervisor:'Sarah Nambi',   status:'ACTIVE',     start_date:'2025-09-01', end_date:'2025-11-30' },
  { id:3, student_name:'Cynthia Akello', student_id:'2500703350', department:'Information Systems',  company:'Stanbic Bank',             academic_supervisor:'Prof. Grace Atim',  workplace_supervisor:'Peter Mugisha', status:'ACTIVE',     start_date:'2025-09-01', end_date:'2025-11-30' },
  { id:4, student_name:'Denis Okello',   student_id:'2500703351', department:'Computer Science',     company:'Uganda Revenue Authority', academic_supervisor:'Dr. James Okello',  workplace_supervisor:'Alice Tendo',   status:'COMPLETED',  start_date:'2025-06-01', end_date:'2025-08-30' },
  { id:5, student_name:'Eva Namutebi',   student_id:'2500703352', department:'Computer Science',     company:'Airtel Uganda',            academic_supervisor:'',                  workplace_supervisor:'',              status:'PENDING',    start_date:'2026-01-01', end_date:'2026-03-30' },
  { id:6, student_name:'Frank Ssali',    student_id:'2500703353', department:'Networks',             company:'',                         academic_supervisor:'',                  workplace_supervisor:'',              status:'UNASSIGNED', start_date:'',           end_date:''           },
]


const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' }) : '—'

const getInitials = (first, last) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?'

const getNameInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0,2).toUpperCase() || '?'

const ROLE_LABELS = {
  student:              'Student',
  academic_supervisor:  'Academic Supervisor',
  workplace_supervisor: 'Workplace Supervisor',
  admin:                'Administrator',
}

const ROLE_COLORS = {
  student:              'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  academic_supervisor:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  workplace_supervisor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  admin:                'bg-rose-500/20 text-rose-300 border border-rose-500/30',
}

const AVATAR_COLORS = {
  student:              'bg-indigo-600',
  academic_supervisor:  'bg-emerald-600',
  workplace_supervisor: 'bg-amber-500',
  admin:                'bg-rose-600',
}

const PLACEMENT_STATUS_STYLES = {
  ACTIVE:     'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PENDING:    'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  UNASSIGNED: 'bg-red-500/20 text-red-300 border border-red-500/30',
}

const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-700/50 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder-slate-500"


function PlacementBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${PLACEMENT_STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status?.toLowerCase()}
    </span>
  )
}

function RegisterStudentModal({ onClose, onRegister }) {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', student_id:'', institution:'Makerere University', department:'' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('First name, last name and email are required.')
      return
    }
    setSaving(true)
    try {
      const newUser = { id: Date.now(), ...form, role:'student', status:'active', last_login:'—', date_joined: new Date().toISOString().split('T')[0] }
      onRegister(newUser)
      toast.success(`✓ Student ${form.first_name} ${form.last_name} registered successfully!`)
      toast.info(`📧 Welcome email sent to ${form.email}`, { autoClose: 3000 })
      onClose()
    } catch { toast.error('Failed to register student. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <p className="text-sm font-bold text-white">Register New Student</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">First Name <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Amara" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Name <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Nkosi" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address <span className="text-red-400">*</span></label>
            <input className={inputCls} type="email" placeholder="student@university.ac.ug" value={form.email} onChange={set('email')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student ID</label>
            <input className={inputCls} placeholder="e.g. 2500703348" value={form.student_id} onChange={set('student_id')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Institution</label>
            <input className={inputCls} placeholder="e.g. Makerere University" value={form.institution} onChange={set('institution')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Department</label>
            <input className={inputCls} placeholder="e.g. Computer Science" value={form.department} onChange={set('department')} />
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
            <p className="text-xs text-indigo-300 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              A welcome notification will be sent to the student's email.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition">
              {saving ? 'Registering…' : 'Register Student'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssignPlacementModal({ onClose, onAssign, student = null }) {
  const [form, setForm] = useState({ student: student?.student_name || '', student_id: student?.student_id || '', company:'', department:'', start_date:'', end_date:'' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.student || !form.company || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      onAssign({ ...form, status:'ACTIVE', academic_supervisor:'', workplace_supervisor:'' })
      toast.success(`✓ Placement assigned to ${form.student} at ${form.company}!`)
      toast.info(`📧 Notification sent to ${form.student}`, { autoClose: 3000 })
      onClose()
    } catch { toast.error('Failed to assign placement. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <p className="text-sm font-bold text-white">Assign Placement</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student Name <span className="text-red-400">*</span></label>
            <input className={inputCls} placeholder="e.g. Amara Nkosi" value={form.student} onChange={set('student')} readOnly={!!student} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student ID</label>
            <input className={inputCls} placeholder="e.g. 2500703348" value={form.student_id} onChange={set('student_id')} readOnly={!!student} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Company / Organisation <span className="text-red-400">*</span></label>
            <input className={inputCls} placeholder="e.g. TechCorp Uganda" value={form.company} onChange={set('company')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Department at Company</label>
            <input className={inputCls} placeholder="e.g. Software Engineering" value={form.department} onChange={set('department')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Start Date <span className="text-red-400">*</span></label>
              <input className={inputCls} type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">End Date <span className="text-red-400">*</span></label>
              <input className={inputCls} type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-xs text-emerald-300 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              Student will be notified of their placement details.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition">
              {saving ? 'Assigning…' : 'Assign Placement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function AssignSupervisorModal({ onClose, placement, onAssign }) {
  const [form, setForm] = useState({
    academic_supervisor:  placement?.academic_supervisor || '',
    workplace_supervisor: placement?.workplace_supervisor || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.academic_supervisor && !form.workplace_supervisor) {
      toast.error('Please assign at least one supervisor.')
      return
    }
    setSaving(true)
    try {
      onAssign(placement.id, form)
      toast.success(`✓ Supervisor assigned to ${placement.student_name}!`)
      if (form.academic_supervisor) toast.info(`📧 Notification sent to ${form.academic_supervisor}`, { autoClose: 3000 })
      if (form.workplace_supervisor) toast.info(`📧 Notification sent to ${form.workplace_supervisor}`, { autoClose: 3000 })
      toast.info(`📧 Notification sent to ${placement.student_name}`, { autoClose: 3000 })
      onClose()
    } catch { toast.error('Failed to assign supervisor. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <p className="text-sm font-bold text-white">Assign Supervisor</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Assigning supervisors for <span className="text-white font-semibold">{placement?.student_name}</span> at <span className="text-white font-semibold">{placement?.company}</span></p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Academic Supervisor</label>
            <input className={inputCls} placeholder="e.g. Prof. Grace Atim" value={form.academic_supervisor} onChange={set('academic_supervisor')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Workplace Supervisor</label>
            <input className={inputCls} placeholder="e.g. David Ochieng" value={form.workplace_supervisor} onChange={set('workplace_supervisor')} />
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
            <p className="text-xs text-amber-300 font-medium">📧 Notifications will be sent to:</p>
            <p className="text-xs text-slate-400 ml-4">• The assigned academic supervisor</p>
            <p className="text-xs text-slate-400 ml-4">• The assigned workplace supervisor</p>
            <p className="text-xs text-slate-400 ml-4">• The student</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition">
              {saving ? 'Assigning…' : 'Assign & Notify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function UserDetailModal({ user, onClose, onToggleStatus, onResetPassword }) {
  if (!user) return null
  const extraFields = user.role === 'student'
    ? [{ label:'Student ID', value:user.student_id }, { label:'Department', value:user.department }]
    : user.role === 'academic_supervisor'
    ? [{ label:'Staff ID', value:user.staff_id }, { label:'Faculty', value:user.faculty }]
    : user.role === 'workplace_supervisor'
    ? [{ label:'Organisation', value:user.organisation }, { label:'Job Title', value:user.job_title }]
    : [{ label:'Staff ID', value:user.staff_id }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[user.role]} text-white flex items-center justify-center text-xl font-bold flex-shrink-0`}>
              {getInitials(user.first_name, user.last_name)}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{user.first_name} {user.last_name}</p>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
              {user.status === 'active' ? '● Active' : '○ Inactive'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Joined</p>
              <p className="text-sm text-white font-medium">{formatDate(user.date_joined)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Last Login</p>
              <p className="text-sm text-white font-medium">{formatDate(user.last_login)}</p>
            </div>
            {extraFields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm text-white font-medium">{value || <span className="text-slate-600 italic">Not set</span>}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {user.role !== 'admin' && (
              <button onClick={() => { onToggleStatus(user.id); onClose() }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition border ${user.status === 'active' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                {user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            )}
            <button onClick={() => { onResetPassword(user); onClose() }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition border border-slate-600 text-slate-400 hover:bg-slate-700/50">
              Send Password Reset
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-700/50 text-slate-500 hover:bg-slate-700/30 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function PlacementsTab({ placements, setPlacements }) {
  const [search,           setSearch]           = useState('')
  const [statusFilter,     setStatusFilter]     = useState('all')
  const [studentIdFilter,  setStudentIdFilter]  = useState('')
  const [assignPlacement,  setAssignPlacement]  = useState(null)
  const [assignSupervisor, setAssignSupervisor] = useState(null)

  const filtered = placements.filter((p) => {
    const matchStatus    = statusFilter === 'all' || p.status === statusFilter
    const matchSearch    = search === '' ||
      p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.company?.toLowerCase().includes(search.toLowerCase())
    const matchStudentId = studentIdFilter === '' ||
      p.student_id?.toLowerCase().includes(studentIdFilter.toLowerCase())
    return matchStatus && matchSearch && matchStudentId
  })

  const counts = {
    all:        placements.length,
    ACTIVE:     placements.filter((p) => p.status === 'ACTIVE').length,
    PENDING:    placements.filter((p) => p.status === 'PENDING').length,
    COMPLETED:  placements.filter((p) => p.status === 'COMPLETED').length,
    UNASSIGNED: placements.filter((p) => p.status === 'UNASSIGNED').length,
  }

  const handleMarkCompleted = (p) => {
    setPlacements((prev) => prev.map((pl) => pl.id === p.id ? { ...pl, status:'COMPLETED' } : pl))
    toast.success(`✓ ${p.student_name}'s placement marked as completed!`)
    toast.info(`📧 Notification sent to ${p.student_name}`, { autoClose: 3000 })
    // TODO: PATCH /api/placements/<id>/ { status: 'COMPLETED' }
  }

  const handleAssignSupervisor = (id, form) => {
    setPlacements((prev) => prev.map((pl) => pl.id === id ? { ...pl, ...form } : pl))
  }

  const handleAssignPlacement = (form) => {
    setPlacements((prev) => [{ id: Date.now(), ...form }, ...prev])
  }

  return (
    <div className="space-y-4">

      {/* Modals */}
      {assignPlacement === 'new' && (
        <AssignPlacementModal onClose={() => setAssignPlacement(null)} onAssign={handleAssignPlacement} />
      )}
      {assignPlacement && assignPlacement !== 'new' && (
        <AssignPlacementModal onClose={() => setAssignPlacement(null)} onAssign={handleAssignPlacement} student={assignPlacement} />
      )}
      {assignSupervisor && (
        <AssignSupervisorModal
          onClose={() => setAssignSupervisor(null)}
          placement={assignSupervisor}
          onAssign={handleAssignSupervisor}
        />
      )}

      {/* Unassigned alert */}
      {counts.UNASSIGNED > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {counts.UNASSIGNED} {counts.UNASSIGNED === 1 ? 'student has' : 'students have'} no placement assigned
          </div>
          <button onClick={() => setAssignPlacement('new')}
            className="text-xs font-semibold text-red-300 hover:underline whitespace-nowrap ml-4">
            Assign now →
          </button>
        </div>
      )}

      {/* Stat pills */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key:'all',        label:'Total',      color:'text-white'       },
          { key:'ACTIVE',     label:'Active',     color:'text-indigo-300'  },
          { key:'PENDING',    label:'Pending',    color:'text-amber-300'   },
          { key:'COMPLETED',  label:'Completed',  color:'text-emerald-300' },
          { key:'UNASSIGNED', label:'Unassigned', color:'text-red-300'     },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters + Assign Placement button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex-1">
          {['all','ACTIVE','PENDING','COMPLETED','UNASSIGNED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition flex-1
                ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setAssignPlacement('new')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Assign Placement
        </button>
      </div>

      {/* Search + Student ID */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex-1">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Search student or company…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 w-40">
          <input type="text" placeholder="Student ID…" value={studentIdFilter}
            onChange={(e) => setStudentIdFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
        </div>
      </div>

      {/* Placements table */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Student','Company','Department','Supervisors','Period','Status','Actions'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-sm">No placements match your filter.</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition">

                  {/* Student */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getNameInitials(p.student_name)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{p.student_name}</p>
                        <p className="text-slate-500 text-xs">{p.student_id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-4">
                    <p className="text-slate-300 text-sm">
                      {p.company || <span className="text-red-400 italic text-xs">Not assigned</span>}
                    </p>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-4">
                    <p className="text-slate-400 text-sm">{p.department || '—'}</p>
                  </td>

                  {/* Supervisors — FIXED */}
                  <td className="px-4 py-4">
                    {p.academic_supervisor
                      ? <p className="text-slate-400 text-xs truncate max-w-[110px]">{p.academic_supervisor}</p>
                      : <p className="text-red-400 text-xs italic">No academic sup.</p>
                    }
                    {p.workplace_supervisor
                      ? <p className="text-slate-500 text-xs truncate max-w-[110px]">{p.workplace_supervisor}</p>
                      : <p className="text-red-400 text-xs italic">No workplace sup.</p>
                    }
                  </td>

                  {/* Period */}
                  <td className="px-4 py-4">
                    <p className="text-slate-400 text-xs">{p.start_date ? formatDate(p.start_date) : '—'}</p>
                    <p className="text-slate-500 text-xs">{p.end_date ? formatDate(p.end_date) : '—'}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <PlacementBadge status={p.status} />
                  </td>

                  {/* Actions — FIXED */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {/* Assign — only when supervisors missing, not completed, not unassigned */}
                      {(!p.academic_supervisor || !p.workplace_supervisor) && p.status !== 'COMPLETED' && p.status !== 'UNASSIGNED' && (
                        <button onClick={() => setAssignSupervisor(p)}
                          className="text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                          Assign
                        </button>
                      )}
                      {/* Done — only for ACTIVE placements */}
                      {p.status === 'ACTIVE' && (
                        <button onClick={() => handleMarkCompleted(p)}
                          className="text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                          Done
                        </button>
                      )}
                      {/* Place — only for UNASSIGNED placements */}
                      {p.status === 'UNASSIGNED' && (
                        <button onClick={() => setAssignPlacement(p)}
                          className="text-xs font-semibold text-indigo-400 border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                          Place
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {counts.all} placements</p>
          <p className="text-slate-500 text-xs">{counts.ACTIVE} active · {counts.UNASSIGNED} unassigned</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [searchParams] = useSearchParams()
  const [users,        setUsers]        = useState(MOCK_USERS)
  const [placements,   setPlacements]   = useState(MOCK_PLACEMENTS)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState(searchParams.get('role') || 'all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  const counts = {
    total:    users.length,
    active:   users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    students: users.filter((u) => u.role === 'student').length,
    academic: users.filter((u) => u.role === 'academic_supervisor').length,
    workplace:users.filter((u) => u.role === 'workplace_supervisor').length,
  }

  const filtered = users.filter((u) => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    const matchSearch = search === '' ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      u.staff_id?.toLowerCase().includes(search.toLowerCase()) ||
      u.organisation?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchStatus && matchSearch
  })

  const handleRegister  = (newUser) => setUsers((prev) => [newUser, ...prev])

  const handleToggleStatus = (id) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u
      const newStatus = u.status === 'active' ? 'inactive' : 'active'
      toast.success(`✓ ${u.first_name} ${u.last_name}'s account ${newStatus === 'active' ? 'activated' : 'deactivated'}!`)
      toast.info(`📧 Notification sent to ${u.email}`, { autoClose: 3000 })
      // TODO: PATCH /api/accounts/<id>/ { is_active: newStatus === 'active' }
      return { ...u, status: newStatus }
    }))
  }

  const handleResetPassword = (user) => {
    toast.success(`✓ Password reset email sent to ${user.email}!`)
    toast.info(`📧 Notification sent to ${user.email}`, { autoClose: 3000 })
    // TODO: POST /api/accounts/password-reset/ { email: user.email }
  }

  const ROLE_FILTERS = [
    { key:'all',                  label:'All Roles'  },
    { key:'student',              label:'Students'   },
    { key:'academic_supervisor',  label:'Academic'   },
    { key:'workplace_supervisor', label:'Workplace'  },
    { key:'admin',                label:'Admin'      },
    { key:'placements',           label:'Placements' },
  ]

  const isPlacementsTab = roleFilter === 'placements'

  return (
    <div className="space-y-6">

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />

      {/* Modals */}
      {showRegister && (
        <RegisterStudentModal onClose={() => setShowRegister(false)} onRegister={handleRegister} />
      )}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Users</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage all user accounts and placements.</p>
        </div>
        {counts.inactive > 0 && !isPlacementsTab && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {counts.inactive} inactive {counts.inactive === 1 ? 'account' : 'accounts'}
          </div>
        )}
      </div>

      {/* Stat cards — only for users tabs */}
      {!isPlacementsTab && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label:'Total Users', value:counts.total,    color:'text-white'       },
            { label:'Active',      value:counts.active,   color:'text-emerald-300' },
            { label:'Inactive',    value:counts.inactive, color:'text-slate-400'   },
            { label:'Students',    value:counts.students, color:'text-indigo-300'  },
            { label:'Academic',    value:counts.academic, color:'text-emerald-300' },
            { label:'Workplace',   value:counts.workplace,color:'text-amber-300'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Role filter tabs + Register Student button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex-1">
          {ROLE_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setRoleFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1
                ${roleFilter === key
                  ? key === 'placements'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              {label}
            </button>
          ))}
        </div>
        {/* Register Student button — only on Students tab */}
        {roleFilter === 'student' && (
          <button onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm whitespace-nowrap">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Register Student
          </button>
        )}
      </div>

      {/* Placements Tab */}
      {isPlacementsTab && (
        <PlacementsTab placements={placements} setPlacements={setPlacements} />
      )}

      {/* Users Tab */}
      {!isPlacementsTab && (
        <>
          {/* Search + Status filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="Search by name, email, ID..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
            </div>
            <div className="flex gap-2">
              {['all','active','inactive'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition capitalize border ${
                    statusFilter === s
                      ? s === 'active'   ? 'bg-emerald-600 text-white border-emerald-600'
                      : s === 'inactive' ? 'bg-slate-600 text-white border-slate-600'
                      :                   'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'
                  }`}>
                  {s === 'all' ? 'All Status' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Users table */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['User','Role','Status','Last Login','Joined','Actions'].map((h) => (
                      <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No users match your filter.</td></tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/20 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[u.role]} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                            {getInitials(u.first_name, u.last_name)}
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{u.first_name} {u.last_name}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span className={u.status === 'active' ? 'text-emerald-300' : 'text-slate-500'}>
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4"><p className="text-slate-400 text-sm">{formatDate(u.last_login)}</p></td>
                      <td className="px-5 py-4"><p className="text-slate-400 text-sm">{formatDate(u.date_joined)}</p></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedUser(u)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                            View
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => handleToggleStatus(u.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                                u.status === 'active'
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}>
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-slate-500 text-xs">Showing {filtered.length} of {counts.total} users</p>
              <p className="text-slate-500 text-xs">{counts.active} active · {counts.inactive} inactive</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

