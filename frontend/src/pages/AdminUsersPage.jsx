import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'
import dashboardService from '../services/dashboardService'
import { useAuth } from '../Context/AuthContext'

const API = '/api'

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
}

const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-700/50 border border-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder-slate-500"

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function TableSkeleton({ cols = 6 }) {
  return (
    <div className="p-4 space-y-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <Skeleton className="h-3 flex-1" />
          {Array.from({length: cols - 2}).map((_, j) => <Skeleton key={j} className="h-3 w-20" />)}
        </div>
      ))}
    </div>
  )
}

function PlacementBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${PLACEMENT_STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status?.toLowerCase()}
    </span>
  )
}

function RegisterStudentModal({ onClose, onRegister }) {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', password:'', role:'student' })
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
      const result = await dashboardService.registerStudent(form)
      onRegister(result.user || { ...form, id: Date.now(), is_active: true })
      toast.success(`Student ${form.first_name} ${form.last_name} registered successfully!`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to register student.')
    } finally { setSaving(false) }
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
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Password <span className="text-red-400">*</span></label>
            <input className={inputCls} type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50">
              {saving ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserDetailModal({ user, onClose, onResetPassword }) {
  if (!user) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[user.role] || 'bg-slate-600'} text-white flex items-center justify-center text-xl font-bold flex-shrink-0`}>
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
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role] || ''}`}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              user.is_active !== false
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>
              {user.is_active !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Email</p>
              <p className="text-sm text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Role</p>
              <p className="text-sm text-white">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
            {user.phone_number && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Phone</p>
                <p className="text-sm text-white">{user.phone_number}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <button onClick={() => { onResetPassword(user); onClose() }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition border border-slate-600 text-slate-400 hover:bg-slate-700/50">
              Send Password Reset Email
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

function PlacementsTab({ placements, setPlacements, loadingPlacements }) {
  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [actioningId,     setActioningId]     = useState(null)

  const filtered = placements.filter((p) => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchSearch = search === '' ||
      p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = {
    all:       placements.length,
    ACTIVE:    placements.filter((p) => p.status === 'ACTIVE').length,
    PENDING:   placements.filter((p) => p.status === 'PENDING').length,
    COMPLETED: placements.filter((p) => p.status === 'COMPLETED').length,
  }

  const handleMarkCompleted = async (p) => {
    if (actioningId) return
    setActioningId(p.id)
    try {
      await fetchWithAuth(`${API}/placements/${p.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      setPlacements(prev => prev.map(pl => pl.id === p.id ? { ...pl, status: 'COMPLETED' } : pl))
      toast.success(`${p.student_name}'s placement marked as completed!`)
    } catch (err) {
      toast.error(err.message || 'Failed to mark completed.')
    } finally { setActioningId(null) }
  }

  return (
    <div className="space-y-4">
      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key:'all',       label:'Total',     color:'text-white'       },
          { key:'ACTIVE',    label:'Active',    color:'text-indigo-300'  },
          { key:'PENDING',   label:'Pending',   color:'text-amber-300'   },
          { key:'COMPLETED', label:'Completed', color:'text-emerald-300' },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex-1">
          {['all','ACTIVE','PENDING','COMPLETED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition flex-1
                ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex-1 min-w-[200px] cursor-text">
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Search student or company..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
        </label>
      </div>

      {/* Table */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loadingPlacements ? <TableSkeleton cols={6} /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Student','Company','Academic Sup.','Workplace Sup.','Status','Actions'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No placements found.</td></tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/20 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getNameInitials(p.student_name)}
                        </div>
                        <p className="text-white text-sm font-semibold">{p.student_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4"><p className="text-slate-300 text-sm">{p.company_name || '—'}</p></td>
                    <td className="px-4 py-4">
                      <p className="text-slate-400 text-xs truncate max-w-[100px]">
                        {p.academic_supervisor_name || <span className="text-red-400 italic">None</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-400 text-xs truncate max-w-[100px]">
                        {p.workplace_supervisor_name || <span className="text-red-400 italic">None</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4"><PlacementBadge status={p.status} /></td>
                    <td className="px-4 py-4">
                      {p.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleMarkCompleted(p)}
                          disabled={actioningId === p.id}
                          className="text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {actioningId === p.id ? '...' : 'Mark Done'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {counts.all} placements</p>
          <p className="text-slate-500 text-xs">{counts.ACTIVE} active x {counts.COMPLETED} completed</p>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ user, onClose, onConfirm, deleting }) {
  if (!user) return null
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          {/* Text */}
          <div className="text-center">
            <p className="text-white font-bold text-lg">Delete User</p>
            <p className="text-slate-400 text-sm mt-1">
              Are you sure you want to permanently delete <span className="text-white font-semibold">{fullName}</span>?
            </p>
            <p className="text-slate-500 text-xs mt-2">This action cannot be undone.</p>
          </div>
          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()

  const [users,            setUsers]            = useState([])
  const [placements,       setPlacements]       = useState([])
  const [loadingUsers,     setLoadingUsers]     = useState(true)
  const [loadingPlacements,setLoadingPlacements]= useState(true)
  const [search,           setSearch]           = useState('')
  const [roleFilter,       setRoleFilter]       = useState(searchParams.get('role') || 'all')
  const [statusFilter,     setStatusFilter]     = useState('all')
  const [selectedUser,     setSelectedUser]     = useState(null)
  const [showRegister,     setShowRegister]     = useState(false)
  const [userToDelete,     setUserToDelete]     = useState(null)
  const [deleting,         setDeleting]         = useState(false)

  useEffect(() => {
    // Fetch users
    fetchWithAuth(`${API}/accounts/users/`)
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoadingUsers(false))
    // Fetch placements
    fetchWithAuth(`${API}/placements/`)
      .then(data => setPlacements(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingPlacements(false))
  }, [])

  const counts = {
    total:    users.length,
    active:   users.filter((u) => u.is_active !== false).length,
    inactive: users.filter((u) => u.is_active === false).length,
    students: users.filter((u) => u.role === 'student').length,
    academic: users.filter((u) => u.role === 'academic_supervisor').length,
    workplace:users.filter((u) => u.role === 'workplace_supervisor').length,
  }

  const filtered = users.filter((u) => {
    const matchRole   = roleFilter === 'all' || roleFilter === 'placements' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active'   && u.is_active !== false) ||
      (statusFilter === 'inactive' && u.is_active === false)
    const matchSearch = search === '' ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchStatus && matchSearch
  })

  const handleRegister  = (newUser) => setUsers((prev) => [newUser, ...prev])

  const handleResetPassword = async (user) => {
    try {
      await fetch(`${API}/accounts/password-reset-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      toast.success(`Password reset email sent to ${user.email}!`)
    } catch {
      toast.error('Failed to send password reset email.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await fetchWithAuth(`${API}/accounts/users/${userToDelete.id}/`, { method: 'DELETE' })
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
      const name = `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim() || userToDelete.email
      toast.success(`${name} has been deleted.`)
      setUserToDelete(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.')
    } finally {
      setDeleting(false)
    }
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

      {showRegister && (
        <RegisterStudentModal onClose={() => setShowRegister(false)} onRegister={handleRegister} />
      )}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onResetPassword={handleResetPassword}
        />
      )}
      {userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Users</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage all user accounts and placements.</p>
        </div>
      </div>

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

      {isPlacementsTab && (
        <PlacementsTab
          placements={placements}
          setPlacements={setPlacements}
          loadingPlacements={loadingPlacements}
        />
      )}

      {!isPlacementsTab && (
        <>
          <div className="flex gap-3 flex-wrap">
            <label className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex-1 min-w-[200px] cursor-text">
              <svg className="w-4 h-4 text-slate-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="Search by name or email..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-600 w-full" />
            </label>
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

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
            {loadingUsers ? <TableSkeleton cols={6} /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {['User','Role','Status','Phone','Actions'].map((h) => (
                        <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-sm">No users match your filter.</td></tr>
                    )}
                    {filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-700/20 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[u.role] || 'bg-slate-600'} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                              {getInitials(u.first_name, u.last_name)}
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">{u.first_name} {u.last_name}</p>
                              <p className="text-slate-500 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.role] || 'bg-slate-500/20 text-slate-400'}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span className={u.is_active !== false ? 'text-emerald-300' : 'text-slate-500'}>
                              {u.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-400 text-sm">{u.phone_number || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedUser(u)}
                              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                              View
                            </button>
                            {u.id !== currentUser?.id && (
                              <button onClick={() => setUserToDelete(u)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition">
                                Delete
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
            <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-slate-500 text-xs">Showing {filtered.length} of {counts.total} users</p>
              <p className="text-slate-500 text-xs">{counts.active} active x {counts.inactive} inactive</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

