import { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import dashboardService from "../../services/dashboardService"


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
const selectCls = "w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-800 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition appearance-none cursor-pointer"

function RegisterStudentModal({ onClose, onSuccess }) {
 
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
 
  const [saving, setSaving] = useState(false)
  
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast.error('All fields are required.')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      await dashboardService.registerStudent({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      })
      toast.success(` Student ${form.first_name} ${form.last_name} registered successfully!`)
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to register student. Please try again.')
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
      <FormField label="Temporary Password" required>
        <input className={inputCls} type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
      </FormField>
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
        <p className="text-xs text-indigo-300 flex items-center gap-2">{Icon.bell} A welcome email will be sent to the student automatically.</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50">
          {saving ? 'Registering...' : 'Register Student'}
        </button>
      </div>
    </Modal>
  )
}

function AssignPlacementModal({ onClose, onSuccess }) {
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [loadingOpts, setLoadingOpts] = useState(true)
  const [form, setForm] = useState({ student: '', company_name: '', start_date: '', end_date: '' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const load = async () => {
      setLoadingOpts(true)
      try {
        const [studs, comps] = await Promise.all([
          dashboardService.getStudentsList(),
          dashboardService.getCompaniesList(),
        ])
        setStudents(Array.isArray(studs) ? studs : [])
        setCompanies(Array.isArray(comps) ? comps : [])
      } catch {  } finally { setLoadingOpts(false) }
    }
    load()
  }, [])

  const handleSubmit = async () => {
    if (!form.student || !form.company_name.trim() || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      const payload = { student: form.student, start_date: form.start_date, end_date: form.end_date }
      const match = companies.find(c => c.company_name.toLowerCase() === form.company_name.trim().toLowerCase())
      if (match) { payload.company = match.id } else { payload.company_name_input = form.company_name.trim() }
      await dashboardService.createPlacement(payload)
      toast.success('Placement created successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to create placement. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Assign Placement" onClose={onClose}>
      {loadingOpts ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <>
          <FormField label="Student" required>
            <select className={selectCls} value={form.student} onChange={set('student')}>
              <option value="" className="bg-slate-800">Select student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Company / Organisation" required>
            <input
              className={inputCls}
              list="company-suggestions"
              placeholder="Type or select a company..."
              value={form.company_name}
              onChange={set('company_name')}
              autoComplete="off"
            />
            <datalist id="company-suggestions">
              {companies.map(c => (
                <option key={c.id} value={c.company_name} />
              ))}
            </datalist>
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
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50">
              {saving ? 'Assigning...' : 'Assign Placement'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}


function AssignSupervisorModal({ onClose, placement = null, allPlacements = [], onSuccess }) {
  
  const [academicSups, setAcademicSups] = useState([])
 
  const [workplaceSups, setWorkplaceSups] = useState([])
  
  const [loadingOpts, setLoadingOpts] = useState(true)
  
  const [form, setForm] = useState({
    placement_id:         placement?.id ? String(placement.id) : '',
    academic_supervisor:  placement?._academic_supervisor_id ? String(placement._academic_supervisor_id) : '',
    workplace_supervisor: placement?._workplace_supervisor_id ? String(placement._workplace_supervisor_id) : '',
  })
 
  const [saving, setSaving] = useState(false)
 
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const load = async () => {
      setLoadingOpts(true)
      try {
        const [acad, work] = await Promise.all([
          dashboardService.getSupervisorsList('academic_supervisor'),
          dashboardService.getSupervisorsList('workplace_supervisor'),
        ])
        setAcademicSups(Array.isArray(acad) ? acad : [])
        setWorkplaceSups(Array.isArray(work) ? work : [])
      } catch {  } finally { setLoadingOpts(false) }
    }
    load()
  }, [])


  const activePlacement = placement || allPlacements.find(p => String(p.id) === form.placement_id)
 
  const studentLabel = activePlacement?.student_name || ''

  const handleSubmit = async () => {
    const pid = placement?.id || form.placement_id
    if (!pid) { toast.error('Please select a placement.'); return }
    if (!form.academic_supervisor && !form.workplace_supervisor) {
      toast.error('Please assign at least one supervisor.')
      return
    }
    setSaving(true)
    try {
      const data = {}
      if (form.academic_supervisor) data.academic_supervisor = form.academic_supervisor
      if (form.workplace_supervisor) data.workplace_supervisor = form.workplace_supervisor
      await dashboardService.updatePlacementSupervisors(pid, data)
      toast.success(`Supervisors assigned to ${studentLabel || 'student'} successfully!`)
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to assign supervisors. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Assign Supervisor to Student" onClose={onClose}>
      {loadingOpts ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <>
          {!placement ? (
            <FormField label="Placement / Student" required>
              <select className={selectCls} value={form.placement_id} onChange={set('placement_id')}>
                <option value="" className="bg-slate-800">Select placement</option>
                {allPlacements
                  .filter(p => !p._academic_supervisor_id || !p._workplace_supervisor_id)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.student_name} — {p.company}</option>
                  ))}
              </select>
            </FormField>
          ) : (
            <FormField label="Student">
              <div className={`${inputCls} opacity-60 cursor-not-allowed`}>{studentLabel}</div>
            </FormField>
          )}
          <FormField label="Academic Supervisor">
            <select className={selectCls} value={form.academic_supervisor} onChange={set('academic_supervisor')}>
              <option value="" className="bg-slate-800">None / Keep existing</option>
              {academicSups.map(s => (
                <option key={s.id} value={s.id}>
                  {`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Workplace Supervisor">
            <select className={selectCls} value={form.workplace_supervisor} onChange={set('workplace_supervisor')}>
              <option value="" className="bg-slate-800">None / Keep existing</option>
              {workplaceSups.map(s => (
                <option key={s.id} value={s.id}>
                  {`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email}
                </option>
              ))}
            </select>
          </FormField>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
            <p className="text-xs text-amber-300 font-medium flex items-center gap-2">{Icon.bell} Notifications will be sent to assigned supervisors.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-50">
              {saving ? 'Assigning...' : 'Assign & Notify'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

function ReportModal({ onClose, placements = [], users = [], evaluations = [] }) {
  const [reportType, setReportType] = useState('placements')
  const [format, setFormat]         = useState('csv')
  const [generating, setGenerating] = useState(false)

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const makeCSV = (headers, rows) =>
    [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const openPrint = (title, headers, rows) => {
    const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`
    const tbody = rows.map(r =>
      `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`
    ).join('')
    const w = window.open('', '_blank')
    if (!w) { toast.error('Pop-up blocked — please allow pop-ups for this site.'); return }
    w.document.write(`<!DOCTYPE html><html><head><title>ILES – ${title}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;color:#0f172a}
      h1{font-size:20px;margin:0 0 4px}p.sub{color:#64748b;font-size:12px;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
      td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
      tr:nth-child(even) td{background:#f8fafc}
      .footer{margin-top:24px;font-size:10px;color:#94a3b8}
      .hint{display:flex;align-items:center;gap:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#1e40af;font-size:13px}
      .hint strong{font-weight:700}
      .hint-btn{margin-left:auto;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
      .hint-btn:hover{background:#1d4ed8}
      @media print{.hint{display:none}}
    </style></head><body>
      <div class="hint">
        💡 To <strong>download as PDF</strong>: in the print dialog change <strong>Destination</strong> to <strong>"Save as PDF"</strong>
        <button class="hint-btn" onclick="window.print()">⬇ Save as PDF</button>
      </div>
      <h1>ILES — ${title}</h1>
      <p class="sub">Generated on ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</p>
      <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
      <div class="footer">ILES – Internship Log &amp; Evaluation System</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }

  const getReportData = () => {
    switch (reportType) {
      case 'placements': {
        const headers = ['Student','Company','Status','Academic Supervisor','Workplace Supervisor','Start Date','End Date']
        const rows = placements.map(p => [
          p.student_name, p.company, p.status,
          p.academic_supervisor  || 'Not assigned',
          p.workplace_supervisor || 'Not assigned',
          p.start_date || '—', p.end_date || '—',
        ])
        return { title:'Placement Summary Report', headers, rows }
      }
      case 'evaluations': {
        const headers = ['Student','Academic Score','Workplace Score','Logbook Score','Final Score','Grade']
        const rows = evaluations.map(e => [
          e.student_name,
          e.academic_score  ?? '—', e.workplace_score ?? '—', e.logbook_score ?? '—',
          e.final_score != null ? `${e.final_score}%` : '—',
          e.grade || '—',
        ])
        return { title:'Evaluation Scores Report', headers, rows }
      }
      case 'students': {
        const headers = ['Name','Email','Company','Placement Status']
        const pm = Object.fromEntries(placements.map(p => [p.student_id, p]))
        const rows = users.filter(u => u.role === 'student').map(u => {
          const pl = pm[String(u.id)] || {}
          return [u.name, u.email, pl.company || 'No placement', pl.status || '—']
        })
        return { title:'Student Progress Report', headers, rows }
      }
      case 'supervisors': {
        const headers = ['Name','Email','Role']
        const rows = users
          .filter(u => ['academic_supervisor','workplace_supervisor'].includes(u.role))
          .map(u => [u.name, u.email, u.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())])
        return { title:'Supervisor Activity Report', headers, rows }
      }
      default: { 
        const headers = ['Type','Name','Detail','Status / Score']
        const rows = [
          ...users.filter(u=>u.role==='student').map(u => ['Student', u.name, u.email, '—']),
          ...placements.map(p => ['Placement', p.student_name, p.company, p.status]),
          ...evaluations.map(e => ['Evaluation', e.student_name, `Final: ${e.final_score ?? '—'}%`, e.grade || '—']),
        ]
        return { title:'Full System Report', headers, rows }
      }
    }
  }

  const handlePrint = () => {
    try {
      const { title, headers, rows } = getReportData()
      if (rows.length === 0) { toast.warn('No data available for this report yet.'); return }
      openPrint(title, headers, rows)
      toast.success(`${title} opened for printing.`)
      setTimeout(() => onClose(), 400)
    } catch {
      toast.error('Failed to open print preview. Please try again.')
    }
  }

  const handleDownload = () => {
    try {
      const { title, headers, rows } = getReportData()
      if (rows.length === 0) { toast.warn('No data available for this report yet.'); return }

      if (format === 'pdf') {
        openPrint(title, headers, rows)
        toast.success(`${title} opened for printing / save as PDF.`)
        setTimeout(() => onClose(), 400)
        return
      }

      setGenerating(true)
      const stamp    = new Date().toISOString().slice(0, 10)
      const filename = `ILES_${title.replace(/\s+/g, '_')}_${stamp}`
      const mime     = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv'
      const ext      = format === 'excel' ? '.xls' : '.csv'
      downloadFile(makeCSV(headers, rows), filename + ext, mime)
      toast.success(`${title} downloaded as ${format.toUpperCase()}.`)
      setTimeout(() => { setGenerating(false); onClose() }, 400)
    } catch {
      toast.error('Failed to download report. Please try again.')
      setGenerating(false)
    }
  }

  return (
    <Modal title="Generate System Report" onClose={onClose}>
      <FormField label="Report Type">
        <div className="relative">
          <select className={selectCls + ' pr-8'} value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="placements">Placement Summary Report</option>
            <option value="evaluations">Evaluation Scores Report</option>
            <option value="students">Student Progress Report</option>
            <option value="supervisors">Supervisor Activity Report</option>
            <option value="full">Full System Report</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </FormField>

      <FormField label="Download Format">
        <div className="flex gap-3">
          {['pdf','csv','excel'].map((f) => (
            <label key={f} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition
              ${format === f ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
              <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="hidden" />
              {f.toUpperCase()}
            </label>
          ))}
        </div>
      </FormField>

      <div className="flex gap-3 pt-2">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
          Cancel
        </button>
        <button onClick={handlePrint}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-600 hover:bg-slate-500 text-white transition flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Print
        </button>
        <button onClick={handleDownload} disabled={generating}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          {generating ? 'Downloading...' : 'Download'}
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
          ? <Link to={subLink} className={`text-xs font-medium mt-1 block hover:underline ${A.sub}`}>{sub} </Link>
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
          ? <Link to={actionLink} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">{actionLabel} </Link>
          : onAction && <button onClick={onAction} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">{actionLabel} </button>
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
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const [modal,             setModal]            = useState(null)
  const [selectedPlacement, setSelectedPlacement] = useState(null)

  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
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
        setStats(statsRes.data)
        setPlacements(placementsRes.data)
        setUsers(usersRes.data)
        setEvaluations(evaluationsRes.data)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data. Please refresh.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).map(cap).join(' ') || 'Administrator'

  const filteredPlacements = placements.filter((p) => {
    const matchStatus    = statusFilter === 'all' || p.status === statusFilter
    const matchSearch    = search === '' ||
      p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.company?.toLowerCase().includes(search.toLowerCase())
    const matchStudentId = studentIdFilter === '' ||
      p.student_id?.toLowerCase().includes(studentIdFilter.toLowerCase())
    return matchStatus && matchSearch && matchStudentId
  })

  const handleMarkCompleted = async (p) => {
    try {
      await dashboardService.markPlacementCompleted(p.id)
      setPlacements((prev) => prev.map((pl) => pl.id === p.id ? { ...pl, status: 'COMPLETED' } : pl))
      toast.success(` ${p.student_name}'s placement marked as completed!`)
    } catch (err) {
      toast.error(err.message || 'Failed to update placement status.')
    }
  }

  const handleInlineAssign = (p) => {
    setSelectedPlacement(p)
    setModal('supervisor')
  }

  const roleBreakdown = [
    { role:'Students',              count: loading ? null : stats?.total_students,                                              color:'bg-indigo-500' },
    { role:'Academic Supervisors',  count: loading ? null : users.filter(u => u.role === 'academic_supervisor').length,          color:'bg-emerald-500' },
    { role:'Workplace Supervisors', count: loading ? null : users.filter(u => u.role === 'workplace_supervisor').length,         color:'bg-amber-500' },
  ]

  return (
    <div className="space-y-6">

      {modal === 'register' && (
        <RegisterStudentModal
          onClose={() => setModal(null)}
          onSuccess={() => dashboardService.getAdminUsers().then(r => setUsers(r.data)).catch(() => {})}
        />
      )}
      {modal === 'placement'  && (
        <AssignPlacementModal
          onClose={() => setModal(null)}
          onSuccess={() => dashboardService.getAdminPlacements().then(r => setPlacements(r.data)).catch(() => {})}
        />
      )}
      {modal === 'supervisor' && (
        <AssignSupervisorModal
          onClose={() => { setModal(null); setSelectedPlacement(null) }}
          placement={selectedPlacement}
          allPlacements={placements}
          onSuccess={() => {
            dashboardService.getAdminPlacements().then(r => setPlacements(r.data)).catch(() => {})
            dashboardService.getAdminStats().then(r => setStats(r.data)).catch(() => {})
          }}
        />
      )}
      {modal === 'report' && (
        <ReportModal
          onClose={() => setModal(null)}
          placements={placements}
          users={users}
          evaluations={evaluations}
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome , {fullName} </h1>
          <p className="text-sm text-slate-400 mt-1">Manage students, placements, supervisors, and access system-wide reports.</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-400 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Year 2026 — Semester II
        </div>

      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"    value={stats?.total_students}    sub="View all students"    subLink="/admin/users?role=student"              accent="indigo"  icon={Icon.students}   />
        <StatCard label="Active Placements" value={stats?.active_placements} sub="View all placements"  subLink="/admin/users?role=placements"           accent="emerald" icon={Icon.placements} />
        <StatCard label="Total Supervisors" value={stats?.total_supervisors} sub="View all supervisors" subLink="/admin/users?role=workplace_supervisor"  accent="amber"   icon={Icon.supervisors}/>
        <StatCard label="Average Score"     value={stats ? `${Number(stats.average_score).toFixed(1)}%` : null} sub="View all evaluations" subLink="/admin/evaluations" accent="rose" icon={Icon.score} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Pending Placements',   value:stats?.pending_placements,   color:'text-amber-300',   link:'/admin/users?role=placements', linkText:'Assign now'  },
          { label:'Unassigned Students',  value:stats?.unassigned_students,  color:'text-rose-300',    onClick:() => { setSelectedPlacement(null); setModal('supervisor') }, linkText:'Assign now'  },
          { label:'Evaluations Complete', value:stats?.evaluations_complete, color:'text-emerald-300', link:'/admin/evaluations',           linkText:'View reports'},
          { label:'Logs Overdue',         value:stats?.logs_overdue ?? 0,    color:'text-red-300',     link:'/admin/logs',                  linkText:'Review now'  },
        ].map(({ label, value, color, link, linkText, onClick }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
            {onClick
              ? <button onClick={onClick} className={`text-xs hover:underline mt-1 block w-full ${color}`}>{linkText}</button>
              : <Link to={link} className={`text-xs hover:underline mt-1 block ${color}`}>{linkText} </Link>
            }
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <div className="lg:col-span-3 space-y-5">

          <Card title="Recent Placements" actionLabel="View All" actionLink="/admin/users?role=placements">
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-1 bg-slate-700/30 border border-slate-700/50 rounded-xl p-1">
                {['all','ACTIVE','PENDING','COMPLETED'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex-1
                      ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-700/50 rounded-xl px-3 py-1.5 flex-1">
                  {Icon.search}
                  <input type="text" placeholder="Search student or company..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-xs text-slate-300 placeholder-slate-600 w-full" />
                </div>
                <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-700/50 rounded-xl px-3 py-1.5 w-36">
                  <input type="text" placeholder="Student ID..." value={studentIdFilter}
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
                              {p.start_date && <p className="text-slate-500" style={{fontSize:'10px'}}>From {p.start_date}</p>}
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
                          <div className="flex items-center gap-1">
                            {(!p.academic_supervisor || !p.workplace_supervisor) && p.status !== 'COMPLETED' && (
                              <button onClick={() => handleInlineAssign(p)}
                                className="text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                                Assign
                              </button>
                            )}
                            {p.status === 'ACTIVE' && (
                              <button onClick={() => handleMarkCompleted(p)}
                                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition whitespace-nowrap">
                                Done
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

          <Card title="Quick Actions">
            <div className="space-y-2">
              {[
                { label:'Assign Placement',  sub:'Create a new placement record',  icon:Icon.placements, onClick:() => setModal('placement'),                                color:'text-emerald-400 bg-emerald-500/20' },
                { label:'Assign Supervisor', sub:'Link supervisor and student',   icon:Icon.assign,     onClick:() => { setSelectedPlacement(null); setModal('supervisor') },color:'text-amber-400 bg-amber-500/20'     },
                { label:'View Evaluations',  sub:'All scores for  all students', icon:Icon.eval,       to:'/admin/evaluations',                                             color:'text-teal-400 bg-teal-500/20'       },
                { label:'Manage Users',      sub:'View and edit user accounts',    icon:Icon.users,      to:'/admin/users',                                                   color:'text-violet-400 bg-violet-500/20'   },
                { label:'Generate Report',   sub:'Export system-wide reports',     icon:Icon.report,     onClick:() => setModal('report'),                                    color:'text-rose-400 bg-rose-500/20'       },
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
