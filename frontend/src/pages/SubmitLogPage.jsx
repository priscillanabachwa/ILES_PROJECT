import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

// No AppLayout wrapper — renders inside AppLayout's <Outlet />
export default function SubmitLogPage() {
  const [weekNumber,  setWeekNumber]  = useState('')
  const [activities,  setActivities]  = useState('')
  const [challenges,  setChallenges]  = useState('')
  const [status,      setStatus]      = useState('draft')
  const [message,     setMessage]     = useState('')
  const [loading,     setLoading]     = useState(false)

  const token    = localStorage.getItem('access_token')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!weekNumber || !activities) {
      setMessage('error:Please fill in Week Number and Activities before saving.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      await axios.post(
        'http://127.0.0.1:8000/api/logs/',
        {
          week_number: weekNumber,
          activities:  activities,
          challenges:  challenges,
          status:      status,
          placement:   1,
          deadline:    '2026-12-31',
        },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      setMessage('success:Log saved successfully!')
      setTimeout(() => navigate('/student/logs'), 1500)
    } catch (error) {
      setMessage('error:' + (error.response?.data?.detail || 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const isError   = message.startsWith('error:')
  const isSuccess = message.startsWith('success:')
  const msgText   = message.replace(/^(error|success):/, '')

  const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500
    bg-slate-700/50 border border-slate-600 outline-none transition
    focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Link to="/student/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link>
          <span>›</span>
          <Link to="/student/logs" className="hover:text-indigo-400 transition">My Logs</Link>
          <span>›</span>
          <span className="text-slate-300">Submit Log</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Submit Weekly Log</h1>
        <p className="text-sm text-slate-400 mt-1">
          Fill in your internship activities for the week
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">

        {/* Card header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Weekly Logbook Entry</p>
            <p className="text-xs text-slate-400">Document your internship activities</p>
          </div>
        </div>

        {/* Form body */}
        <div className="p-6 space-y-5">

          {/* Week Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Week Number <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="52"
              placeholder="e.g. 6"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Activities */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Activities This Week <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe what you worked on this week..."
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              className={inputCls + ' resize-none'}
            />
            <p className="text-xs text-slate-500">{activities.length} characters</p>
          </div>

          {/* Challenges */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Challenges Faced
            </label>
            <textarea
              rows={3}
              placeholder="Any difficulties or blockers you encountered..."
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Save as */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Save as
            </label>
            <div className="flex gap-3">
              {[
                { value: 'draft',     label: 'Draft',       sub: 'Save for later',     color: 'border-slate-600 text-slate-300 bg-slate-700/30' },
                { value: 'submitted', label: 'Submit Now',  sub: 'Send to supervisor',  color: 'border-indigo-500 text-indigo-300 bg-indigo-600/10' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition
                    ${status === opt.value ? opt.color : 'border-slate-700/50 text-slate-500 hover:border-slate-600'}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs opacity-70">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border
              ${isSuccess
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
              <span>{isSuccess ? '✓' : '✕'}</span>
              <span>{msgText}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <Link
              to="/student/logs"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm
                ${loading
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : status === 'submitted'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'}`}
            >
              {loading
                ? 'Saving…'
                : status === 'submitted'
                  ? 'Submit Log'
                  : 'Save as Draft'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
