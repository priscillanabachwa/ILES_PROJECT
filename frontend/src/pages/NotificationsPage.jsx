import React, { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth, getAuthToken } from '../services/authService'

const API = '/api'

const TYPE_CONFIG = {
  log_submitted: { label: 'Log Submitted', bg: 'bg-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  log_reviewed:  { label: 'Log Reviewed',  bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  log_approved:  { label: 'Log Approved',  bg: 'bg-green-500/20',  text: 'text-green-400',  dot: 'bg-green-400'  },
  log_rejected:  { label: 'Log Rejected',  bg: 'bg-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400'    },
  evaluation:    { label: 'Evaluation',    bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  placement:     { label: 'Placement',     bg: 'bg-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  welcome:       { label: 'Welcome',       bg: 'bg-teal-500/20',   text: 'text-teal-400',   dot: 'bg-teal-400'   },
  general:       { label: 'General',       bg: 'bg-slate-500/20',  text: 'text-slate-400',  dot: 'bg-slate-500'  },
}

const TYPE_ICONS = {
  log_submitted: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  log_reviewed: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  log_approved: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  log_rejected: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  evaluation: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  placement: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  welcome: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  general: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diff = now - date
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  if (h < 48 && date.getDate() !== now.getDate()) return 'Yesterday'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getGroup(iso) {
  if (!iso) return 'Earlier'
  const date = new Date(iso)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart - 86400000)
  if (date >= todayStart) return 'Today'
  if (date >= yesterdayStart) return 'Yesterday'
  return 'Earlier'
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-700 rounded w-2/5" />
        <div className="h-3 bg-slate-700 rounded w-3/4" />
        <div className="h-2 bg-slate-700 rounded w-1/4" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [clearingAll, setClearingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab === 'unread') params.set('is_read', 'false')
      if (activeTab === 'read') params.set('is_read', 'true')
      if (typeFilter) params.set('type', typeFilter)
      if (search.trim()) params.set('search', search.trim())

      const data = await fetchWithAuth(`${API}/accounts/notifications/?${params}`)
      if (data && Array.isArray(data.results)) {
        setNotifications(data.results)
        setUnreadCount(data.unread_count ?? 0)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [activeTab, typeFilter, search])

  useEffect(() => {
    setLoading(true)
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = async (id, isRead) => {
    try {
      await fetchWithAuth(`${API}/accounts/notifications/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: isRead }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: isRead } : n))
      setUnreadCount(prev => isRead ? Math.max(0, prev - 1) : prev + 1)
    } catch {  }
  }

  const deleteNotif = async (id) => {
    setDeletingId(id)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/accounts/notifications/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok || res.status === 204) {
        const removed = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (removed && !removed.is_read) setUnreadCount(c => Math.max(0, c - 1))
      }
    } catch {  } finally {
      setDeletingId(null)
    }
  }

  const markAllRead = async () => {
    try {
      await fetchWithAuth(`${API}/accounts/notifications/mark-all-read/`, { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {  }
  }

  const clearAll = async () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return
    setClearingAll(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/accounts/notifications/clear-all/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok || res.status === 204) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch {  } finally {
      setClearingAll(false)
    }
  }

  const groups = notifications.reduce((acc, n) => {
    const g = getGroup(n.created_at)
    if (!acc[g]) acc[g] = []
    acc[g].push(n)
    return acc
  }, {})
  const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier']
  const visibleGroups = GROUP_ORDER.filter(g => groups[g]?.length > 0)

  const hasFilters = search || typeFilter || activeTab !== 'all'

  return (
    <div className="max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-600/10 transition"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={clearingAll}
              className="text-sm text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
            >
              {clearingAll ? 'Clearing...' : 'Clear all'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex bg-slate-800/60 rounded-xl p-1 gap-1 flex-shrink-0">
          {[
            { id: 'all',    label: 'All'    },
            { id: 'unread', label: 'Unread' },
            { id: 'read',   label: 'Read'   },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm rounded-xl pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex-shrink-0"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg mb-1">
            {hasFilters ? 'No matching notifications' : 'All caught up!'}
          </p>
          <p className="text-slate-500 text-sm max-w-xs">
            {hasFilters
              ? 'Try adjusting your filters or search query.'
              : 'You have no notifications right now. Check back later.'}
          </p>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setTypeFilter(''); setActiveTab('all') }}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map(group => (
            <div key={group}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                {group}
              </p>
              <div className="space-y-2">
                {groups[group].map(n => {
                  const cfg = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.general
                  const icon = TYPE_ICONS[n.notification_type] || TYPE_ICONS.general
                  return (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                        n.is_read
                          ? 'bg-slate-800/30 border-slate-700/20 hover:bg-slate-800/50'
                          : 'bg-slate-800/60 border-indigo-500/20 hover:bg-slate-800/80 shadow-sm shadow-indigo-900/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <p className={`text-sm font-semibold leading-snug ${n.is_read ? 'text-slate-300' : 'text-white'}`}>
                              {n.title}
                            </p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {!n.is_read && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[11px] text-slate-500 mt-1.5">{formatDate(n.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => markRead(n.id, !n.is_read)}
                          title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-600/10 transition"
                        >
                          {n.is_read ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => deleteNotif(n.id)}
                          disabled={deletingId === n.id}
                          title="Delete notification"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                        >
                          {deletingId === n.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
