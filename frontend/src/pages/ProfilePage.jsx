import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

const ROLE_CONFIG = {
  student: {
    label: 'Student Intern',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    subtitle: 'Your details are visible to your assigned supervisors',
    fields: [
      { key: 'first_name',   label: 'First Name',  type: 'text', maxLength: 150 },
      { key: 'last_name',    label: 'Last Name',   type: 'text', maxLength: 150 },
      { key: 'phone_number', label: 'Phone',        type: 'tel',  hint: 'e.g. +256 700 000 000' },
      { key: 'institution',  label: 'Institution',  type: 'text' },
      { key: 'department',   label: 'Department',   type: 'text' },
      { key: 'student_id',   label: 'Student ID',   type: 'text' },
    ],
  },
  workplace_supervisor: {
    label: 'Workplace Supervisor',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    subtitle: 'Your details are visible to the interns you supervise and academic supervisors',
    fields: [
      { key: 'first_name',   label: 'First Name',   type: 'text', maxLength: 150 },
      { key: 'last_name',    label: 'Last Name',    type: 'text', maxLength: 150 },
      { key: 'phone_number', label: 'Phone',         type: 'tel',  hint: 'e.g. +256 700 000 000' },
      { key: 'organisation', label: 'Organisation',  type: 'text' },
      { key: 'department',   label: 'Department',    type: 'text' },
      { key: 'job_title',    label: 'Job Title',     type: 'text' },
    ],
  },
  academic_supervisor: {
    label: 'Academic Supervisor',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    subtitle: 'Your details are visible to interns and workplace supervisors',
    fields: [
      { key: 'first_name',   label: 'First Name',  type: 'text', maxLength: 150 },
      { key: 'last_name',    label: 'Last Name',   type: 'text', maxLength: 150 },
      { key: 'phone_number', label: 'Phone',        type: 'tel',  hint: 'e.g. +256 700 000 000' },
      { key: 'institution',  label: 'Institution',  type: 'text' },
      { key: 'faculty',      label: 'Faculty',      type: 'text' },
      { key: 'staff_id',     label: 'Staff ID',     type: 'text' },
    ],
  },
  admin: {
    label: 'Internship Administrator',
    badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    subtitle: 'You have full administrative access to the internship system',
    fields: [
      { key: 'first_name',   label: 'First Name',  type: 'text', maxLength: 150 },
      { key: 'last_name',    label: 'Last Name',   type: 'text', maxLength: 150 },
      { key: 'phone_number', label: 'Phone',        type: 'tel',  hint: 'e.g. +256 700 000 000' },
    ],
  },
}

const validators = {
  phone_number: (v) => v && !/^\+?[0-9\s]{7,15}$/.test(v) ? 'Enter a valid phone number' : '',
}

const validateField = (key, value) => validators[key]?.(value) || ''

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getFullName = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'

const PencilIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const AVATAR_BG = {
  student:              'bg-indigo-600',
  workplace_supervisor: 'bg-emerald-600',
  academic_supervisor:  'bg-amber-500',
  admin:                'bg-rose-600',
}

function Avatar({ user, preview, onSelect, editMode }) {
  const inputRef = useRef()
  const bg  = AVATAR_BG[user?.role] || 'bg-slate-600'
  const src = preview || user?.profile_picture || null
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      {src
        ? <img src={src} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-700 shadow-md" />
        : <div className={`w-20 h-20 rounded-full ${bg} text-white flex items-center justify-center text-3xl font-bold select-none ring-4 ring-slate-700 shadow-md`}>
            {user?.first_name && user?.last_name
              ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
              : (user?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase()}
          </div>
      }
      {editMode && (
        <button onClick={() => inputRef.current.click()}
          className="absolute bottom-0 right-0 w-7 h-7 bg-slate-700 border-2 border-slate-600 rounded-full flex items-center justify-center shadow hover:bg-slate-600 hover:border-indigo-500 transition"
          title="Change photo">
          <PencilIcon className="w-3 h-3 text-indigo-400" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) onSelect(URL.createObjectURL(file)) }} />
    </div>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-white font-medium">
        {value || <span className="text-slate-600 italic font-normal">Not set</span>}
      </p>
    </div>
  )
}

function SectionDivider({ title, subtitle }) {
  return (
    <div className="pt-1 pb-1 border-b border-slate-700/50">
      <p className="text-sm font-semibold text-white">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student

  const buildInitial = () =>
    Object.fromEntries(config.fields.map(({ key }) => [key, user?.[key] || '']))

  const [form, setForm]               = useState(buildInitial)
  const [avatarPreview, setAvatar]    = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving]           = useState(false)
  const [editMode, setEditMode]       = useState(false)

  useEffect(() => { setForm(buildInitial()) }, [user])

  useEffect(() => {
    if (!editMode) return
    const errs = {}
    config.fields.forEach(({ key }) => {
      const err = validateField(key, form[key])
      if (err) errs[key] = err
    })
    setFieldErrors(errs)
  }, [form, editMode])

  const handleCancelEdit = () => {
    setForm(buildInitial())
    setAvatar(null)
    setFieldErrors({})
    setEditMode(false)
  }

  const handleSave = async () => {
    const errs = {}
    config.fields.forEach(({ key }) => {
      const err = validateField(key, form[key])
      if (err) errs[key] = err
    })
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setSaving(true)
    try {
      // TODO: connect to Django
      toast.success('Profile updated successfully.')
      setAvatar(null)
      setEditMode(false)
    } catch {
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const set       = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const hasErrors = Object.values(fieldErrors).some(Boolean)

  const inputCls = (err) =>
    `w-full rounded-lg px-3 py-2 text-sm outline-none transition text-white placeholder-slate-500 bg-slate-700/50 border
     ${err ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`

  const displayName = editMode
    ? [form.first_name, form.last_name].filter(Boolean).join(' ') || getFullName(user)
    : getFullName(user)

  return (
    <div className="max-w-lg mx-auto space-y-5">

      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-slate-400 mt-1">{config.subtitle}</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">

        {/* Identity strip */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-700/50">
          <Avatar user={user} preview={avatarPreview} onSelect={setAvatar} editMode={editMode} />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white truncate">{displayName}</p>
            <p className="text-slate-400 text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${config.badge}`}>{config.label}</span>
            </div>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-600/10 transition text-xs font-semibold flex-shrink-0">
              <PencilIcon /> Edit
            </button>
          )}
        </div>

        <SectionDivider title="Profile Details" subtitle={editMode ? 'Make your changes below then save' : undefined} />

        {/* VIEW MODE */}
        {!editMode && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {config.fields.map(({ key, label }) => (
              <InfoRow key={key} label={label} value={user?.[key]} />
            ))}
          </div>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <div className="space-y-4">
            {config.fields.map(({ key, label, type, hint, maxLength }) => (
              <Field key={key} label={label} error={fieldErrors[key]} hint={hint}>
                <input type={type || 'text'} className={inputCls(fieldErrors[key])}
                  value={form[key]} onChange={set(key)} maxLength={maxLength} />
                {maxLength && (
                  <p className="text-right text-xs text-slate-600 mt-0.5">{(form[key] || '').length}/{maxLength}</p>
                )}
              </Field>
            ))}

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-1">
              <button onClick={handleCancelEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || hasErrors}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm
                  ${!hasErrors ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}