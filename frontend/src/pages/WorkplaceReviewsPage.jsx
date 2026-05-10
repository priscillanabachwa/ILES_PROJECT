import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

const STATUS_STYLES = {
  draft:     'bg-slate-500/15 text-slate-400 border-slate-500/25',
  submitted: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  reviewed:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  approved:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/25',
}

function ReviewModal({ log, onClose, onSuccess }) {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!comment.trim()) { toast.error('A supervisor comment is required to submit a review.'); return }
    setSubmitting(true)
    try {
      await fetchWithAuth(`${API}/weeklylogs/logbooks/${log.id}/review/`, {
        method: 'POST',
        body: JSON.stringify({ supervisor_comment: comment.trim() }),
      })
      toast.success('Review submitted successfully.')
      onSuccess(log.id, 'reviewed', comment.trim())
      onClose()
    } catch {
      toast.error('Failed to submit review.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-white">Submit Review — Week {log.week_number}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{log.student_name} x {log.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50 space-y-3 max-h-52 overflow-y-auto">
            <div>
              <p className="text-xs text-slate-500 mb-1">Activities</p>
              <p className="text-slate-300 text-sm">{log.activities || '—'}</p>
            </div>
            {log.challenges && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Challenges</p>
                <p className="text-slate-300 text-sm">{log.challenges}</p>
              </div>
            )}
            {log.lesson && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Lessons Learned</p>
                <p className="text-slate-300 text-sm">{log.lesson}</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              Your Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Provide detailed feedback on the intern's performance this week..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
            <p className="text-xs text-slate-600 mt-1">{comment.length} characters</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || !comment.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WorkplaceReviewsPage() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [tab,     setTab]     = useState('submitted')
  const [reviewLog, setReviewLog] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [logsData, placementsData] = await Promise.all([
          fetchWithAuth(`${API}/weeklylogs/logbooks/`).catch(() => []),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
        ])
        const pm = Object.fromEntries(
          (Array.isArray(placementsData) ? placementsData : []).map(p => [p.id, p])
        )
        setLogs(
          (Array.isArray(logsData) ? logsData : []).map(l => ({
            ...l,
            student_name: pm[l.placement]?.student_name || `Placement #${l.placement}`,
            company: pm[l.placement]?.company_name || '—',
          }))
        )
      } catch {
        toast.error('Failed to load logs.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const handleReviewSuccess = (id, newStatus, comment) => {
    setLogs(prev => prev.map(l =>
      l.id === id ? { ...l, status: newStatus, supervisor_comment: comment } : l
    ))
  }

  const pendingLogs  = logs.filter(l => l.status === 'submitted')
  const reviewedLogs = logs.filter(l => l.status === 'reviewed' || l.status === 'approved')

  const activeLogs = tab === 'submitted' ? pendingLogs : reviewedLogs

  const filtered = activeLogs.filter(l =>
    search === '' ||
    l.student_name.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {reviewLog && (
        <ReviewModal log={reviewLog} onClose={() => setReviewLog(null)} onSuccess={handleReviewSuccess} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-sm text-slate-400 mt-1">Review weekly internship logs submitted by your assigned students</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: pendingLogs.length,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
          { label: 'Reviewed',       value: logs.filter(l => l.status === 'reviewed').length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Approved',       value: logs.filter(l => l.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Search by student or company..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('submitted')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === 'submitted' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
            }`}>
            Pending {pendingLogs.length > 0 && <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5">{pendingLogs.length}</span>}
          </button>
          <button onClick={() => setTab('reviewed')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === 'reviewed' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
            }`}>
            Reviewed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            {tab === 'submitted' ? 'No logs pending review' : 'No reviewed logs yet'}
          </p>
          <p className="text-slate-600 text-xs mt-1">
            {tab === 'submitted' ? 'All submitted logs have been reviewed.' : 'Reviewed logs will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                    {log.student_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-semibold text-sm">{log.student_name}</p>
                      <span className="text-slate-500 text-xs">x</span>
                      <p className="text-slate-400 text-xs">{log.company}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[log.status] || STATUS_STYLES.draft}`}>
                        Week {log.week_number}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{log.activities || '—'}</p>
                    {log.supervisor_comment && (
                      <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-400 mb-0.5">Your review</p>
                        <p className="text-slate-300 text-xs">{log.supervisor_comment}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-slate-600 text-xs hidden sm:block">{formatDate(log.submitted_at)}</p>
                  {log.status === 'submitted' && (
                    <button onClick={() => setReviewLog(log)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">
                      Review
                    </button>
                  )}
                  {(log.status === 'reviewed' || log.status === 'approved') && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[log.status]}`}>
                      {log.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-slate-600 text-xs text-right">
        Showing {filtered.length} of {activeLogs.length} logs
      </div>
    </div>
  )
}

