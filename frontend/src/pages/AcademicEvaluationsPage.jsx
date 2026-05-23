import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'
import { capName } from '../services/dashboardService'

const API = '/api'

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

function EvaluateModal({ row, criteria, onClose, onSuccess }) {
  const { placement, evaluation } = row
  const [scores,     setScores]     = useState({})
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isCompleted = placement?.status === 'COMPLETED'
  // "Update mode" = supervisor is refreshing marks on an already-submitted evaluation
  const isUpdate = evaluation?.status === 'SUBMITTED'

  // Criteria locked when placement is not yet completed (end-of-internship criteria)
  // Exception: never lock when updating an already-submitted evaluation
  const isCriteriaLocked = (c) => c.evaluation_stage === 'final' && !isCompleted && !isUpdate

  useEffect(() => {
    if (evaluation) {
      setComment(evaluation.overall_comment || '')
      const init = {}
      evaluation.items?.forEach(item => { init[item.criteria] = String(item.score) })
      setScores(init)
    }
  }, [evaluation])

  // Only count unlocked criteria toward scored progress
  const activeCriteria  = criteria.filter(c => !isCriteriaLocked(c))
  const allScored       = activeCriteria.length > 0 && activeCriteria.every(c => scores[c.id] !== undefined && scores[c.id] !== '')
  const scoredCount     = activeCriteria.filter(c => scores[c.id] !== undefined && scores[c.id] !== '').length
  const hasFinalLocked  = criteria.some(c => isCriteriaLocked(c))

  const handleSave = async (submit = false) => {
    // For a brand-new evaluation, placement must be COMPLETED before final submission.
    // When updating an already-submitted evaluation mid-internship, skip that check.
    if (submit && !isUpdate && !isCompleted) {
      toast.error('The internship must be completed before submitting the final evaluation.')
      return
    }
    if (submit && !allScored) {
      toast.error('Please enter scores for all available criteria before submitting.')
      return
    }
    setSubmitting(true)
    try {
      let evalId = evaluation?.id

      if (!evalId) {
        const newEval = await fetchWithAuth(`${API}/evaluations/evaluations/`, {
          method: 'POST',
          body: JSON.stringify({ placement: placement.id, overall_comment: comment }),
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
        toast.success(isUpdate ? 'Marks updated successfully.' : 'Evaluation submitted successfully.')
      } else {
        toast.success('Draft saved.')
      }

      const updated = await fetchWithAuth(`${API}/evaluations/evaluations/${evalId}/`)
      onSuccess(updated, placement.id)
      onClose()
    } catch {
      toast.error('Failed to save evaluation.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white capitalize">
              {isUpdate ? 'Update Marks' : evaluation ? 'Edit Evaluation' : 'Evaluate Intern'} — {row.student_name}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">{row.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* End-of-internship notice */}
          {hasFinalLocked && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p className="text-amber-300 text-sm">
                <span className="font-semibold">Final Internship Report</span> score is locked — it will unlock once the internship is marked as completed.
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Evaluation Criteria</p>
            {criteria.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6 bg-slate-700/20 rounded-xl border border-slate-700/40">
                No evaluation criteria available. Please contact an administrator.
              </p>
            ) : null}
            <div className="space-y-3">
              {criteria.map((c) => {
                const locked = isCriteriaLocked(c)
                const val    = scores[c.id] !== undefined ? scores[c.id] : ''
                const maxNum = Number(c.max_score)
                return (
                  <div key={c.id} className={`rounded-xl p-4 border transition ${
                    locked
                      ? 'bg-slate-800/40 border-slate-700/30 opacity-55'
                      : 'bg-slate-700/30 border-slate-700/50'
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
                          type="number"
                          min={0}
                          max={maxNum}
                          step="0.01"
                          value={val}
                          disabled={locked}
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
              Overall Comment <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Optional overall feedback for the intern..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="bg-slate-700/20 rounded-xl p-3 border border-slate-700/40 flex items-center justify-between">
            <p className="text-slate-400 text-xs">
              {hasFinalLocked ? 'Available criteria scored' : 'Criteria scored'}
            </p>
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
          {/* Hide "Save Draft" when updating a submitted evaluation — it would be confusing */}
          {!isUpdate && (
            <button onClick={() => handleSave(false)} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button
            onClick={() => handleSave(true)}
            disabled={submitting || (!isUpdate && !isCompleted) || !allScored}
            title={
              !isUpdate && !isCompleted ? 'Internship must be completed before submitting' :
              !allScored ? 'Score all criteria first' : ''
            }
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting
              ? (isUpdate ? 'Updating...' : 'Submitting...')
              : (isUpdate ? 'Update Marks' : 'Submit Evaluation')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ row, onClose }) {
  const ev = row.evaluation
  if (!ev) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">{row.student_name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{row.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Score</p>
              <p className="text-3xl font-black text-white">
                {ev.total_score != null
                  ? `${Number(ev.total_score) % 1 === 0 ? Number(ev.total_score).toFixed(0) : Number(ev.total_score).toFixed(1)}%`
                  : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Grade</p>
              <span className={`text-3xl font-black ${
                ev.grade === 'A' ? 'text-emerald-400' :
                ev.grade === 'B' ? 'text-indigo-400' :
                ev.grade === 'C' ? 'text-amber-400' :
                ev.grade ? 'text-red-400' : 'text-slate-600'
              }`}>
                {ev.grade || '—'}
              </span>
            </div>
          </div>

          {ev.items?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Criteria Scores</p>
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

          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">Overall Comment</p>
            {ev.overall_comment
              ? <p className="text-slate-300 text-sm">{ev.overall_comment}</p>
              : <p className="text-slate-500 text-sm italic">No comment was left for this evaluation.</p>
            }
          </div>
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
  const [rows,         setRows]         = useState([])
  const [criteria,     setCriteria]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal,        setModal]        = useState(null)

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

        const placements   = Array.isArray(placementsData) ? placementsData : []
        const evals        = Array.isArray(evalsData)      ? evalsData      : []
        const criteriaList = Array.isArray(criteriaData)   ? criteriaData   : []
        const logbooks     = Array.isArray(logbooksData)   ? logbooksData   : []

        const evalByPlacement = {}
        evals.forEach(e => { evalByPlacement[e.placement] = e })

        // Group approved logs by placement for "needs update" detection
        const approvedLogsByPlacement = {}
        logbooks.filter(l => l.status === 'approved').forEach(l => {
          if (!approvedLogsByPlacement[l.placement]) approvedLogsByPlacement[l.placement] = []
          approvedLogsByPlacement[l.placement].push(l)
        })

        setRows(placements.map(p => {
          const ev            = evalByPlacement[p.id] || null
          const approvedLogs  = approvedLogsByPlacement[p.id] || []

          // needsUpdate = there are approved logs that post-date the last evaluation update
          let needsUpdate = false
          if (approvedLogs.length > 0) {
            if (!ev || ev.status !== 'SUBMITTED') {
              needsUpdate = true
            } else {
              const latestApproval = Math.max(...approvedLogs.map(l => +new Date(l.updated_at || l.submitted_at)))
              const evalUpdated    = +new Date(ev.updated_at || ev.submitted_at)
              needsUpdate = latestApproval > evalUpdated
            }
          }

          return {
            placement:    p,
            evaluation:   ev,
            student_name: capName(p.student_name || `Student #${p.id}`),
            company:      p.company_name || '—',
            needsUpdate,
            _approvedLogs: approvedLogs,   // kept for needsUpdate recomputation after save
          }
        }))

        setCriteria(criteriaList)
      } catch {
        toast.error('Failed to load evaluations.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const handleEvalSuccess = (updatedEval, placementId) => {
    setRows(prev => prev.map(r => {
      if (r.placement.id !== placementId) return r
      // Recompute needsUpdate: after saving marks the eval's updated_at is now fresh,
      // so any previously "pending" logs should now be considered covered.
      const approvedLogs = (r._approvedLogs || [])
      let needsUpdate = false
      if (approvedLogs.length > 0 && updatedEval?.status === 'SUBMITTED') {
        const latestApproval = Math.max(...approvedLogs.map(l => +new Date(l.updated_at || l.submitted_at)))
        const evalUpdated    = +new Date(updatedEval.updated_at || updatedEval.submitted_at)
        needsUpdate = latestApproval > evalUpdated
      } else if (approvedLogs.length > 0 && (!updatedEval || updatedEval.status !== 'SUBMITTED')) {
        needsUpdate = true
      }
      return { ...r, evaluation: updatedEval, needsUpdate }
    }))
  }

  const total     = rows.length
  const submitted = rows.filter(r => r.evaluation?.status === 'SUBMITTED' && !r.needsUpdate).length
  const pending   = rows.filter(r => r.needsUpdate).length
  const scored    = rows.filter(r => r.evaluation?.total_score != null)
  const avgScoreRaw = scored.length
    ? scored.reduce((acc, r) => acc + Number(r.evaluation.total_score), 0) / scored.length
    : null
  const avgScore = avgScoreRaw != null
    ? (avgScoreRaw % 1 === 0 ? avgScoreRaw.toFixed(0) : avgScoreRaw.toFixed(1))
    : null

  const filtered = rows.filter((r) => {
    if (statusFilter === 'SUBMITTED' && (r.needsUpdate || r.evaluation?.status !== 'SUBMITTED')) return false
    if (statusFilter === 'PENDING'   && !r.needsUpdate) return false
    if (search && !r.student_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {modal?.type === 'evaluate' && (
        <EvaluateModal
          row={modal.row}
          criteria={criteria}
          onClose={() => setModal(null)}
          onSuccess={handleEvalSuccess}
        />
      )}
      {modal?.type === 'view' && (
        <ViewModal row={modal.row} onClose={() => setModal(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Evaluations</h1>
        <p className="text-sm text-slate-400 mt-1">Score and evaluate your assigned interns</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Interns', value: total,                                  color: 'text-white',       bg: 'bg-slate-800/50 border-slate-700/50'    },
          { label: 'Up to Date',    value: submitted,                              color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Marks Needed',  value: pending,                                color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20'      },
          { label: 'Avg. Score',    value: avgScore != null ? `${avgScore}%` : '—',  color: 'text-indigo-400',  bg: 'bg-indigo-600/10 border-indigo-500/20'  },
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
          <input type="text" placeholder="Search by student name or company..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all',       label: 'All'         },
            { key: 'SUBMITTED', label: 'Up to Date'  },
            { key: 'PENDING',   label: 'Needs Marks' },
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
                  {['Intern', 'Company', 'Score', 'Grade', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No interns found.</td>
                  </tr>
                )}
                {filtered.map((row) => {
                  const ev = row.evaluation
                  return (
                    <tr key={row.placement.id} className={`hover:bg-slate-700/20 transition ${row.needsUpdate ? 'bg-rose-500/5' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                            {row.student_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <p className="text-white text-sm font-medium capitalize">{row.student_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-300 text-sm">{row.company}</p>
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBadge score={ev?.total_score != null ? Number(ev.total_score) : null} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold text-sm ${
                          ev?.grade === 'A' ? 'text-emerald-400' :
                          ev?.grade === 'B' ? 'text-indigo-400' :
                          ev?.grade === 'C' ? 'text-amber-400' :
                          ev?.grade ? 'text-red-400' : 'text-slate-600'
                        }`}>
                          {ev?.grade || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {row.needsUpdate ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-500/15 text-rose-400 border-rose-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Marks Needed
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            ev?.status === 'SUBMITTED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                              : ev?.status === 'DRAFT'
                              ? 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              ev?.status === 'SUBMITTED' ? 'bg-emerald-400' :
                              ev?.status === 'DRAFT'     ? 'bg-slate-400'   : 'bg-amber-400'
                            }`} />
                            {ev?.status === 'SUBMITTED' ? 'Up to Date' : ev?.status === 'DRAFT' ? 'Draft' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {row.needsUpdate ? (
                          // Primary action: update marks; secondary: view existing scores
                          <div className="flex items-center gap-2">
                            <button onClick={() => setModal({ type: 'evaluate', row })}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition">
                              Update Marks
                            </button>
                            {ev && (
                              <button onClick={() => setModal({ type: 'view', row })}
                                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-medium transition">
                                View
                              </button>
                            )}
                          </div>
                        ) : ev?.status === 'SUBMITTED' ? (
                          <button onClick={() => setModal({ type: 'view', row })}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                            View
                          </button>
                        ) : ev?.status === 'DRAFT' ? (
                          <button onClick={() => setModal({ type: 'evaluate', row })}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition">
                            Edit
                          </button>
                        ) : (
                          <button onClick={() => setModal({ type: 'evaluate', row })}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition">
                            Evaluate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {total} interns</p>
          <p className="text-slate-500 text-xs">{submitted} up to date · {pending} need marks</p>
        </div>
      </div>
    </div>
  )
}
