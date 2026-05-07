import { useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const MOCK_USERS = [
  { id:1,  first_name:'Amara',    last_name:'Nkosi',    email:'a.nkosi@uni.ac.ug',           role:'student',              status:'active',   last_login:'2026-05-04', date_joined:'2025-08-15', student_id:'2500703348', department:'Computer Science'      },
  { id:2,  first_name:'Brian',    last_name:'Otim',     email:'b.otim@uni.ac.ug',            role:'student',              status:'active',   last_login:'2026-05-03', date_joined:'2025-08-15', student_id:'2500703349', department:'Software Engineering'   },
  { id:3,  first_name:'Cynthia',  last_name:'Akello',   email:'c.akello@uni.ac.ug',          role:'student',              status:'active',   last_login:'2026-05-02', date_joined:'2025-08-15', student_id:'2500703350', department:'Information Systems'    },
  { id:4,  first_name:'Denis',    last_name:'Okello',   email:'d.okello@uni.ac.ug',          role:'student',              status:'inactive', last_login:'2026-03-10', date_joined:'2025-08-15', student_id:'2500703351', department:'Computer Science'      },
  { id:5,  first_name:'Eva',      last_name:'Namutebi', email:'e.namutebi@uni.ac.ug',        role:'student',              status:'active',   last_login:'2026-05-01', date_joined:'2025-08-20', student_id:'2500703352', department:'Computer Science'      },
  { id:6,  first_name:'Frank',    last_name:'Ssali',    email:'f.ssali@uni.ac.ug',           role:'student',              status:'active',   last_login:'2026-04-28', date_joined:'2025-08-20', student_id:'2500703353', department:'Networks'               },
  { id:7,  first_name:'Grace',    last_name:'Atim',     email:'g.atim@mak.ac.ug',            role:'academic_supervisor',  status:'active',   last_login:'2026-05-05', date_joined:'2025-07-01', staff_id:'STF001',       faculty:'SCIT'                     },
  { id:8,  first_name:'James',    last_name:'Okello',   email:'j.okello@mak.ac.ug',          role:'academic_supervisor',  status:'active',   last_login:'2026-05-04', date_joined:'2025-07-01', staff_id:'STF002',       faculty:'SCIT'                     },
  { id:9,  first_name:'David',    last_name:'Ochieng',  email:'d.ochieng@techcorp.co.ug',    role:'workplace_supervisor', status:'active',   last_login:'2026-05-03', date_joined:'2025-08-10', organisation:'TechCorp Uganda',  job_title:'Senior Engineer'  },
  { id:10, first_name:'Sarah',    last_name:'Nambi',    email:'s.nambi@mtn.co.ug',           role:'workplace_supervisor', status:'active',   last_login:'2026-04-30', date_joined:'2025-08-10', organisation:'MTN Uganda',       job_title:'IT Manager'       },
  { id:11, first_name:'Peter',    last_name:'Mugisha',  email:'p.mugisha@stanbic.com',       role:'workplace_supervisor', status:'inactive', last_login:'2026-02-15', date_joined:'2025-08-12', organisation:'Stanbic Bank',     job_title:'Data Analyst'     },
  { id:12, first_name:'Admin',    last_name:'User',     email:'admin@mak.ac.ug',             role:'admin',                status:'active',   last_login:'2026-05-06', date_joined:'2025-06-01', staff_id:'ADM001',       faculty:'Administration'           },
]

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' }) : '—'

const getInitials = (first, last) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?'

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

        {/* Header */}
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Role + Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              user.status === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>
              {user.status === 'active' ? '● Active' : '○ Inactive'}
            </span>
          </div>

          {/* Details grid */}
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

          {/* Actions */}
          <div className="space-y-2">
            {/* Activate / Deactivate */}
            {user.role !== 'admin' && (
              <button
                onClick={() => { onToggleStatus(user.id); onClose() }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition border ${
                  user.status === 'active'
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                {user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            )}

            {/* Reset Password */}
            <button
              onClick={() => { onResetPassword(user); onClose() }}
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

export default function AdminUsersPage() {
  const [users,          setUsers]          = useState(MOCK_USERS)
  const [search,         setSearch]         = useState('')
  const [roleFilter,     setRoleFilter]     = useState('all')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [selectedUser,   setSelectedUser]   = useState(null)

  // Stats
  const counts = {
    total:    users.length,
    active:   users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    students: users.filter((u) => u.role === 'student').length,
    academic: users.filter((u) => u.role === 'academic_supervisor').length,
    workplace:users.filter((u) => u.role === 'workplace_supervisor').length,
  }

  // Filter
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

  // Toggle active/inactive
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

  // Send password reset
  const handleResetPassword = (user) => {
    toast.success(`✓ Password reset email sent to ${user.email}!`)
    toast.info(`📧 Notification sent to ${user.email}`, { autoClose: 3000 })
    // TODO: POST /api/accounts/password-reset/ { email: user.email }
  }

  const ROLE_FILTERS = [
    { key:'all',                  label:'All Roles'   },
    { key:'student',              label:'Students'    },
    { key:'academic_supervisor',  label:'Academic'    },
    { key:'workplace_supervisor', label:'Workplace'   },
    { key:'admin',                label:'Admin'       },
  ]

  return (
    <div className="space-y-6">

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />

      {/* User detail modal */}
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
          <p className="text-sm text-slate-400 mt-1">
            View and manage all user accounts — students, supervisors and administrators.
          </p>
        </div>
        {counts.inactive > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {counts.inactive} inactive {counts.inactive === 1 ? 'account' : 'accounts'}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label:'Total Users',  value:counts.total,    color:'text-white'        },
          { label:'Active',       value:counts.active,   color:'text-emerald-300'  },
          { label:'Inactive',     value:counts.inactive, color:'text-slate-400'    },
          { label:'Students',     value:counts.students, color:'text-indigo-300'   },
          { label:'Academic',     value:counts.academic, color:'text-emerald-300'  },
          { label:'Workplace',    value:counts.workplace,color:'text-amber-300'    },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">

        {/* Role filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex-wrap">
          {ROLE_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setRoleFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1
                ${roleFilter === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              {label}
            </button>
          ))}
        </div>

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
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                    No users match your filter.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-700/20 transition">

                  {/* User */}
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

                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium`}>
                      <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span className={u.status === 'active' ? 'text-emerald-300' : 'text-slate-500'}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="px-5 py-4">
                    <p className="text-slate-400 text-sm">{formatDate(u.last_login)}</p>
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-4">
                    <p className="text-slate-400 text-sm">{formatDate(u.date_joined)}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {/* View details */}
                      <button onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                        View
                      </button>

                      {/* Quick toggle — not for admin */}
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {counts.total} users</p>
          <p className="text-slate-500 text-xs">{counts.active} active · {counts.inactive} inactive</p>
        </div>
      </div>
    </div>
  )
}
