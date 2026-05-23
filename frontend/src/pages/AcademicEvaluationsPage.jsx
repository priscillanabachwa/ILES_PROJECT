import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'
import { capName } from '../services/dashboardService'

const API = '/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-slate-600 text-sm">—</span>
  const color =
    score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    score >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {Number(score) % 1 === 0 ? Number(score).toFixed(0) : Number(score).toFixed(1)}%
    </span>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
    </svg>
  )
}

function EvaluateModal({ targetLog, placement, evaluation, criteria, studentName, onClose, onSuccess }) {
  const [scores,     setScores]     = useState({})
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLogEval  = !!targetLog
  const isCompleted = placement?.status === 'COMPLETED'

  const isCriteriaLocked = (c) => !isLogEval && c.evaluation_stage === 'final' && !isCompleted

  useEffect(() => {
    if (evaluation) {
      setComment(evaluation.overall_comment || '')
      const init = {}
      evaluation.items?.forEach(item => { init[item.criteria] = String(item.score) })
      setScores(init)
    }
  }, [evaluation])

  const activeCriteria = criteria.filter(c => !isCriteriaLocked(c))
  const allScored      = activeCriteria.length > 0 &&
    activeCriteria.every(c => scores[c.id] !== undefined && scores[c.id] !== '')
  const scoredCount    = activeCriteria.filter(c => scores[c.id] !== undefined && scores[c.id] !== '').length
  const hasFinalLocked = criteria.some(c => isCriteriaLocked(c))

  const handleSave = async (submit = false) => {
    if (submit && !allScored) {
      toast.error('Please enter scores for all available criteria before submitting.')
      return
    }
    setSubmitting(true)
    try {
      let evalId = evaluation?.id

      if (!evalId) {
        const payload = isLogEval
          ? { log: targetLog.id, placement: targetLog.placement, overall_comment: comment }
          : { placement: placement.id, overall_comment: comment }
        const newEval = await fetchWithAuth(`${API}/evaluations/evaluations/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        evalId = newEval.id
      } else {
        await fetchWithAuth(`${API}/evaluations/evaluations/${evalId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ overall_comment: comment }),
        })
      }

      const existingById = {}
      if (evaluation) {
        evaluation.items?.forEach(item => { existingById[item.criteria] = item.id })
      }

      await Promise.all(
        criteria
          .filter(c => !isCriteriaLocked(c) && scores[c.id] !== undefined && scores[c.id] !== '')
          .map(async (c) => {
            const scoreId = existingById[c.id]
            if (scoreId) {
              await fetchWithAuth(`${API}/evaluations/scores/${scoreId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ criteria: c.id, score: Number(scores[c.id]) }),
              })
            } else {
              await fetchWithAuth(`${API}/evaluations/scores/`, {
                method: 'POST',
                body: JSON.stringify({ evaluation: evalId, criteria: c.id, score: Number(scores[c.id]) }),
              })
            }
          })
      )

      if (submit) {
        await fetchWithAuth(`${API}/evaluations/evaluations/${evalId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ overall_comment: comment, status: 'SUBMITTED' }),
        })
        toast.success('Evaluation submitted.')
      } else {
        toast.success('Draft saved.')
      }

      const updated = await fetchWithAuth(`${API}/evaluations/evaluations/${evalId}/`)
      onSuccess(updated)
      onClose()
    } catch {
      toast.error('Failed to save evaluation.')
    } finally {
      setSubmitting(false)
    }
  }

  const title = isLogEval
    ? `Week ${targetLog.week_number} Log — ${studentName}`
    : `Placement Evaluation — ${studentName}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {isLogEval ? `Award logbook marks for Week ${targetLog.week_number}` : 'Score placement-level criteria'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {hasFinalLocked && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p className="text-amber-300 text-sm">
                <span className="font-semibold">Final Internship Report</span> score is locked until the internship is marked as completed.
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Criteria</p>
            <div className="space-y-3">
              {criteria.map((c) => {
                const locked = isCriteriaLocked(c)
                const val    = scores[c.id] !== undefined ? scores[c.id] : ''
                const maxNum = Number(c.max_score)
                return (
                  <div key={c.id} className={`rounded-xl p-4 border transition ${
                    locked ? 'bg-slate-800/40 border-slate-700/30 opacity-55' : 'bg-slate-700/30 border-slate-700/50'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${locked ? 'text-slate-500' : 'text-slate-200'}`}>{c.name}</p>
                          {locked && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-500/70 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                              </svg>
                              End of internship
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number" min={0} max={maxNum} step="0.01"
                          value={val} disabled={locked}
                          onChange={(e) => {
                            if (locked) return
                            const raw = e.target.value
                            const clamped = raw === '' ? '' : Math.min(Number(raw), maxNum)
                            setScores(prev => ({ ...prev, [c.id]: clamped }))
                          }}
                          className={`w-20 border rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none transition ${
                            locked
                              ? 'bg-slate-700/30 border-slate-700/30 text-slate-600 cursor-not-allowed'
                              : 'bg-slate-600/50 border-slate-500 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                          }`}
                          placeholder="0"
                        />
                        <span className={`text-xs w-14 ${locked ? 'text-slate-600' : 'text-slate-500'}`}>/ {c.max_score}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
              Comment <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              placeholder="Optional feedback..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="bg-slate-700/20 rounded-xl p-3 border border-slate-700/40 flex items-center justify-between">
            <p className="text-slate-400 text-xs">Criteria scored</p>
            <p className={`text-sm font-semibold ${allScored ? 'text-emerald-400' : 'text-slate-300'}`}>
              {scoredCount} / {activeCriteria.length}
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t border-slate-700/50 flex-shrink-0">
          <button onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
            Cancel
          </button>
          <button onClick={() => handleSave(false)} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={submitting || !allScored}
            title={!allScored ? 'Score all criteria first' : ''}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ title, evaluation, onClose }) {
  const ev = evaluation
  if (!ev) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1"><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Score</p>
              <p className="text-3xl font-black text-white">
                {ev.total_score != null ? `${Number(ev.total_score) % 1 === 0 ? Number(ev.total_score).toFixed(0) : Number(ev.total_score).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Grade</p>
              <span className={`text-3xl font-black ${
                ev.grade === 'A' ? 'text-emerald-400' : ev.grade === 'B' ? 'text-indigo-400' :
                ev.grade === 'C' ? 'text-amber-400'  : ev.grade ? 'text-red-400' : 'text-slate-600'
              }`}>{ev.grade || '—'}</span>
            </div>
          </div>
          {ev.items?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Scores</p>
              <div className="space-y-2">
                {ev.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-4 py-3">
                    <span className="text-slate-300 text-sm">{item.criteria_name || `Criteria ${item.criteria}`}</span>
                    <span className="text-white font-bold text-sm">{item.score} / {item.max_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ev.overall_comment && (
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">Comment</p>
              <p className="text-slate-300 text-sm">{ev.overall_comment}</p>
            </div>
          )}
        </div>
        <div className="p-6 pt-4 border-t border-slate-700/50 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AcademicEvaluationsPage() {
  const [logRows,       setLogRows]       = useState([])   
  const [placementRows, setPlacementRows] = useState([])   
  const [logCriteria,   setLogCriteria]   = useState([])   
  const [placeCriteria, setPlaceCriteria] = useState([])   
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState('logs')
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [modal,         setModal]         = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [evalsData, placementsData, criteriaData, logbooksData] = await Promise.all([
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
          fetchWithAuth(`${API}/evaluations/criteria/?type=academic`).catch(() => []),
          fetchWithAuth(`${API}/weeklylogs/logbooks/`).catch(() => []),
        ])

        const placements = Array.isArray(placementsData) ? placementsData : []
        const evals      = Array.isArray(evalsData)      ? evalsData      : []
        const criteria   = Array.isArray(criteriaData)   ? criteriaData   : []
        const logbooks   = Array.isArray(logbooksData)   ? logbooksData   : []

        const logCrit   = criteria.filter(c => c.evaluation_stage === 'log')
        const placeCrit = criteria.filter(c => c.evaluation_stage !== 'log')
        setLogCriteria(logCrit)
        setPlaceCriteria(placeCrit)

        const evalByLog       = {}   
        const evalByPlacement = {}   
        evals.forEach(e => {
          if (e.log != null) evalByLog[e.log]           = e
          else               evalByPlacement[e.placement] = e
        })

        const placementMap = Object.fromEntries(placements.map(p => [p.id, p]))

        const approvedLogs = logbooks.filter(l => l.status === 'approved')
        setLogRows(approvedLogs.map(l => ({
          log:          l,
          placement:    placementMap[l.placement] || { id: l.placement },
          evaluation:   evalByLog[l.id] || null,
          student_name: capName(placementMap[l.placement]?.student_name || `Student`),
          company:      placementMap[l.placement]?.company_name || '—',
        })))

        setPlacementRows(placements.map(p => ({
          placement:    p,
          evaluation:   evalByPlacement[p.id] || null,
          student_name: capName(p.student_name || `Student #${p.id}`),
          company:      p.company_name || '—',
        })))

      } catch {
        toast.error('Failed to load evaluations.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const handleLogEvalSuccess = (updatedEval) => {
    setLogRows(prev => prev.map(r =>
      r.log.id === updatedEval.log ? { ...r, evaluation: updatedEval } : r
    ))
  }

  const handlePlaceEvalSuccess = (updatedEval) => {
    setPlacementRows(prev => prev.map(r =>
      r.placement.id === updatedEval.placement ? { ...r, evaluation: updatedEval } : r
    ))
  }

  const logEvaluated = logRows.filter(r => r.evaluation?.status === 'SUBMITTED').length
  const logPending   = logRows.filter(r => !r.evaluation || r.evaluation.status !== 'SUBMITTED').length
  const scoredRows   = logRows.filter(r => r.evaluation?.total_score != null)
  const avgRaw       = scoredRows.length
    ? scoredRows.reduce((s, r) => s + Number(r.evaluation.total_score), 0) / scoredRows.length : null
  const avgScore     = avgRaw != null ? (avgRaw % 1 === 0 ? avgRaw.toFixed(0) : avgRaw.toFixed(1)) : null

  const filteredLogRows = logRows.filter(r => {
    if (statusFilter === 'SUBMITTED' && r.evaluation?.status !== 'SUBMITTED') return false
    if (statusFilter === 'PENDING'   && r.evaluation?.status === 'SUBMITTED') return false
    if (search && !r.student_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredPlaceRows = placementRows.filter(r => {
    if (search && !r.student_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {modal?.type === 'evaluate-log' && (
        <EvaluateModal
          targetLog={modal.row.log}
          placement={modal.row.placement}
          evaluation={modal.row.evaluation}
          criteria={logCriteria}
          studentName={modal.row.student_name}
          onClose={() => setModal(null)}
          onSuccess={handleLogEvalSuccess}
        />
      )}
      {modal?.type === 'evaluate-placement' && (
        <EvaluateModal
          targetLog={null}
          placement={modal.row.placement}
          evaluation={modal.row.evaluation}
          criteria={placeCriteria}
          studentName={modal.row.student_name}
          onClose={() => setModal(null)}
          onSuccess={handlePlaceEvalSuccess}
        />
      )}
      {modal?.type === 'view' && (
        <ViewModal
          title={modal.title}
          evaluation={modal.evaluation}
          onClose={() => setModal(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Evaluations</h1>
        <p className="text-sm text-slate-400 mt-1">Award marks for approved logs and placement-level criteria</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Approved Logs',  value: logRows.length, color: 'text-white',       bg: 'bg-slate-800/50 border-slate-700/50'    },
          { label: 'Evaluated',      value: logEvaluated,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pending Marks',  value: logPending,     color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20'       },
          { label: 'Avg. Log Score', value: avgScore != null ? `${avgScore}%` : '—', color: 'text-indigo-400', bg: 'bg-indigo-600/10 border-indigo-500/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 w-fit">
        {[
          { key: 'logs',       label: `Weekly Logs${logPending > 0 ? ` (${logPending} pending)` : ''}` },
          { key: 'placements', label: 'Placement Evaluations' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => { setActiveTab(key); setStatusFilter('all'); setSearch('') }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'logs' && (
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
            {[
              { key: 'all',       label: 'All'       },
              { key: 'PENDING',   label: 'Pending'   },
              { key: 'SUBMITTED', label: 'Evaluated' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  statusFilter === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Student', 'Company', 'Week', 'Approved', 'Score', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredLogRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                        {logRows.length === 0 ? 'No approved logs yet.' : 'No logs match your filter.'}
                      </td>
                    </tr>
                  )}
                  {filteredLogRows.map((row) => {
                    const ev      = row.evaluation
                    const pending = !ev || ev.status !== 'SUBMITTED'
                    return (
                      <tr key={row.log.id} className={`hover:bg-slate-700/20 transition ${pending ? 'bg-rose-500/5' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                              {row.student_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <p className="text-white text-sm font-medium capitalize">{row.student_name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4"><p className="text-slate-300 text-sm">{row.company}</p></td>
                        <td className="px-5 py-4">
                          <span className="text-indigo-300 text-sm font-semibold">Week {row.log.week_number}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-500 text-xs">{formatDate(row.log.updated_at || row.log.submitted_at)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <ScoreBadge score={ev?.total_score != null ? Number(ev.total_score) : null} />
                        </td>
                        <td className="px-5 py-4">
                          {pending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-500/15 text-rose-400 border-rose-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              {ev?.status === 'DRAFT' ? 'Draft' : 'Pending'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Evaluated
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {pending ? (
                              <button onClick={() => setModal({ type: 'evaluate-log', row })}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition">
                                {ev?.status === 'DRAFT' ? 'Continue' : 'Evaluate'}
                              </button>
                            ) : (
                              <>
                                <button onClick={() => setModal({ type: 'evaluate-log', row })}
                                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-medium transition">
                                  Edit
                                </button>
                                <button onClick={() => setModal({ type: 'view', evaluation: ev, title: `Week ${row.log.week_number} — ${row.student_name}` })}
                                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                                  View
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-slate-500 text-xs">Showing {filteredLogRows.length} of {logRows.length} logs</p>
            <p className="text-slate-500 text-xs">{logEvaluated} evaluated · {logPending} pending</p>
          </div>
        </div>
      )}

      {activeTab === 'placements' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="Search by student or company..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Student', 'Company', 'Score', 'Grade', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredPlaceRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No placements found.</td>
                    </tr>
                  )}
                  {filteredPlaceRows.map((row) => {
                    const ev = row.evaluation
                    return (
                      <tr key={row.placement.id} className="hover:bg-slate-700/20 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                              {row.student_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <p className="text-white text-sm font-medium capitalize">{row.student_name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4"><p className="text-slate-300 text-sm">{row.company}</p></td>
                        <td className="px-5 py-4">
                          <ScoreBadge score={ev?.total_score != null ? Number(ev.total_score) : null} />
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-bold text-sm ${
                            ev?.grade === 'A' ? 'text-emerald-400' : ev?.grade === 'B' ? 'text-indigo-400' :
                            ev?.grade === 'C' ? 'text-amber-400'  : ev?.grade ? 'text-red-400' : 'text-slate-600'
                          }`}>{ev?.grade || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            ev?.status === 'SUBMITTED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                            ev?.status === 'DRAFT'     ? 'bg-slate-500/15 text-slate-400 border-slate-500/25' :
                                                         'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              ev?.status === 'SUBMITTED' ? 'bg-emerald-400' :
                              ev?.status === 'DRAFT'     ? 'bg-slate-400'   : 'bg-amber-400'
                            }`} />
                            {ev?.status === 'SUBMITTED' ? 'Submitted' : ev?.status === 'DRAFT' ? 'Draft' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setModal({ type: 'evaluate-placement', row })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                ev?.status === 'SUBMITTED'
                                  ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}>
                              {ev?.status === 'SUBMITTED' ? 'Edit' : ev?.status === 'DRAFT' ? 'Continue' : 'Evaluate'}
                            </button>
                            {ev?.status === 'SUBMITTED' && (
                              <button onClick={() => setModal({ type: 'view', evaluation: ev, title: `Placement — ${row.student_name}` })}
                                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs">
              {placementRows.filter(r => r.evaluation?.status === 'SUBMITTED').length} submitted · {placementRows.filter(r => !r.evaluation || r.evaluation.status !== 'SUBMITTED').length} pending
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
