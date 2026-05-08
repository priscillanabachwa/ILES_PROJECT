import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'
import { fetchWithAuth } from '../../services/authService'
import ILESLogo from '../../assets/ILES_LOGO.png'

const API = '/api'

const NAV = {
  admin: [
    { to: '/admin/dashboard',       label: 'Dashboard'       },
    { to: '/admin/logs',            label: 'Internship Logs' },
    { to: '/admin/evaluations',     label: 'Evaluations'     },
    { to: '/admin/users',           label: 'Manage Users'    },
    { to: '/admin/notifications',   label: 'Notifications'   },
    { to: '/admin/profile',         label: 'Profile'         },
  ],
  student: [
    { to: '/student/dashboard',     label: 'Dashboard'     },
    { to: '/student/logs',          label: 'My Logs'       },
    { to: '/student/notifications', label: 'Notifications' },
    { to: '/student/profile',       label: 'Profile'       },
  ],
  academic_supervisor: [
    { to: '/academic/dashboard',       label: 'Dashboard'       },
    { to: '/academic/logs',            label: 'Internship Logs' },
    { to: '/academic/evaluations',     label: 'Evaluations'     },
    { to: '/academic/notifications',   label: 'Notifications'   },
    { to: '/academic/profile',         label: 'Profile'         },
  ],
  workplace_supervisor: [
    { to: '/supervisor/dashboard',     label: 'Dashboard'     },
    { to: '/supervisor/reviews',       label: 'Reviews'       },
    { to: '/supervisor/scores',        label: 'Scores'        },
    { to: '/supervisor/notifications', label: 'Notifications' },
    { to: '/supervisor/profile',       label: 'Profile'       },
  ],
}

const NOTIF_PATH = {
  admin:                '/admin/notifications',
  student:              '/student/notifications',
  academic_supervisor:  '/academic/notifications',
  workplace_supervisor: '/supervisor/notifications',
}

const PORTAL_LABELS = {
  admin:                'Admin Portal',
  student:              'Student Portal',
  academic_supervisor:  'Academic Supervisor Portal',
  workplace_supervisor: 'Workplace Supervisor Portal',
}

const TYPE_ICONS = {
  log_submitted: '[Log]',
  log_reviewed:  '[Rev]',
  log_approved:  '[OK]',
  log_rejected:  '[!]',
  evaluation:    '[Eval]',
  placement:     '[Place]',
  welcome:       '[Hi]',
  general:       '[Info]',
}

function formatTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotificationBell() {
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const [open,          setOpen]    = useState(false)
  const [notifications, setNotifs]  = useState([])
  const [unreadCount,   setUnread]  = useState(0)
  const dropdownRef = useRef(null)
  const notifPath = NOTIF_PATH[user?.role] || '/student/notifications'

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API}/accounts/notifications/`)
      if (data && Array.isArray(data.results)) {
        setNotifs(data.results)
        setUnread(data.unread_count ?? 0)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id) => {
    try {
      await fetchWithAuth(`${API}/accounts/notifications/${id}/`, { method: 'PATCH' })
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      await fetchWithAuth(`${API}/accounts/notifications/mark-all-read/`, { method: 'POST' })
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } catch { /* silent */ }
  }

  const recent = notifications.slice(0, 8)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/30">
            {recent.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              recent.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 transition cursor-pointer ${
                    n.is_read ? 'hover:bg-slate-700/20' : 'bg-indigo-600/5 hover:bg-indigo-600/10'
                  }`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[n.notification_type] || '[Info]'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold leading-snug ${n.is_read ? 'text-slate-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-700/50 text-center">
            <button
              onClick={() => { setOpen(false); navigate(notifPath) }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              View all notifications
              {notifications.length > 8 && ` (${notifications.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

export default function AppLayout() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const role     = user?.role || 'student'
  const items    = NAV[role] || []
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).map(cap).join(' ') || user?.email || 'User'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-[#e4e1ed]">

      {/* "" Sidebar "" */}
      <aside className="w-64 h-screen sticky left-0 top-0 border-r border-white/10 bg-[#1e3a5f] backdrop-blur-xl flex flex-col py-6 overflow-hidden">

        {/* Logo */}
        <div className="px-4 mb-6 flex flex-col items-center gap-3 text-center">
          <img src={ILESLogo} alt="ILES Logo" className="w-20 h-20 object-contain rounded-xl" />
          <p className="text-white font-extrabold text-[10px] tracking-widest leading-snug uppercase px-2">
            Internship Logging<br />and Evaluation System
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'text-white bg-white/20 border-r-2 border-white shadow-md'
                    : 'text-[#93c5fd] hover:text-white hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 mt-auto border-t border-white/5 pt-4">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium truncate text-white">{fullName}</p>
            <p className="text-xs text-[#93c5fd] capitalize">{role.replace(/_/g, ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#93c5fd] hover:text-red-400 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* "" Main content "" */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-40">
          <span className="text-white font-bold text-lg">Internship Management System</span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

