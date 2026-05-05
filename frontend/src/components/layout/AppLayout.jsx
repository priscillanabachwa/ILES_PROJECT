import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'
import ILESLogo from '../../assets/ILES_LOGO.png'

const NAV = {
  ADMIN: [
    { to: '/admin/dashboard',       label: 'Dashboard'          },
    { to: '/admin/logs',            label: 'Internship Logs'   },
    { to: '/admin/evaluations',     label: 'Evaluations'      },
    { to: '/admin/profile',         label: 'Profile'               },
  ],
  STUDENT: [
    { to: '/student/dashboard',     label: 'Dashboard'         },
    { to: '/student/logs',          label: 'My Logs'           },
    { to: '/student/profile',       label: 'Profile'               },
  ],
  ACADEMIC_SUPERVISOR: [
    { to: '/academic/dashboard',    label: 'Dashboard'          },
    { to: '/academic/logs',         label: 'Internship Logs'   },
    { to: '/academic/evaluations',  label: 'Evaluations'      },
    { to: '/academic/profile',      label: 'Profile'               },
  ],
  WORKPLACE_SUPERVISOR: [
    { to: '/supervisor/dashboard',  label: 'Dashboard'          },
    { to: '/supervisor/reviews',    label: 'Reviews'          },
    { to: '/supervisor/scores',     label: 'Scores'                 },
    { to: '/supervisor/profile',    label: 'Profile'               },
  ],
}

export default function AppLayout({ role = 'ADMIN' }) {
  const navigate = useNavigate()
  // const { logout, user } = useAuth() // Uncomment when auth is ready

  // Placeholder user for development
  const user = { full_name: 'User Name' }

  const handleLogout = async () => {
    // await logout()
    navigate('/login')
  }

  const items = NAV[role] || []

  const PORTAL_LABELS = {
  INTERNSHIP_ADMINISTRATOR: 'Internship Administrator Portal',
  STUDENT:              'Student Portal',
  ACADEMIC_SUPERVISOR:  'Academic Supervisor Portal',
  WORKPLACE_SUPERVISOR: 'Workplace Supervisor Portal',
}

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-[#e4e1ed]">

      {/* ── Sidebar ── */}
      <aside className="w-64 h-screen sticky left-0 top-0 border-r border-white/10 bg-[#c5dff0] backdrop-blur-xl flex flex-col py-6 overflow-hidden">

        {/* Logo */}
<div className="px-4 mb-8 flex items-center gap-3">
  <img
    src={ILESLogo}
    alt="ILES Logo"
    className="w-24 h-24 object-contain rounded-lg flex-shrink-0"
  />
  <div>
    <p className="text-white font-bold text-base leading-tight">ILES</p>
    <p className="text-indigo-400 text-xs">{PORTAL_LABELS[role] || 'Portal'}</p>
  </div>
</div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {items.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
    isActive
      ? 'text-[#0f172a] bg-white/30 border-r-2 border-[#0f172a] shadow-md'
      : 'text-[#1a3a5c] hover:text-[#0f172a] hover:bg-white/20'
  }`
}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 mt-auto border-t border-white/5 pt-4">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium truncate text-[#0f172a]">{user?.full_name}</p>
            <p className="text-xs text-[#1a3a5c]">{role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#1a3a5c] hover:text-red-700 transition-colors"
          >
            <span className="material-symbols-outlined">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-40">
          <span className="text-white font-bold text-lg">Internship Management System</span>
          <div className="flex items-center gap-4">
            {/* Add search or profile icons here if needed */}
          </div>
        </header>

        {/* Dashboard or page content renders here */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
