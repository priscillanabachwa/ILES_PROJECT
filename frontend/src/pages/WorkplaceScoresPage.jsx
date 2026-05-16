import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'

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
      {Number(score).toFixed(0)}%
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

  useEffect(() => {
    if (evaluation) {
      setComment(evaluation.overall_comment || '')
      const init = {}
      evaluation.items?.forEach(item => { init[item.criteria] = String(item.score) })
      setScores(init)
    }
  }, [evaluation])

  const allScored   = criteria.length > 0 && criteria.every(c => scores[c.id] !== undefined && scores[c.id] !== '')
  const scoredCount = criteria.filter(c => scores[c.id] !== undefined && scores[c.id] !== '').length

  const handleSave = async (submit = false) => {
    if (submit && !allScored) {
      toast.error('Please enter scores for all criteria before submitting.')
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
          .filter(c => scores[c.id] !== undefined && scores[c.id] !== '')
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
          body: JSON.stringify({ status: 'SUBMITTED' }),
        })
        toast.success('Evaluation submitted successfully.')
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
              {evaluation ? 'Edit Evaluation' : 'Evaluate Intern'} — {row.student_name}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">{row.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Evaluation Criteria</p>
            <div className="space-y-3">
              {criteria.map((c) => {
                const val    = scores[c.id] !== undefined ? scores[c.id] : ''
                const numVal = Number(val)
                const maxNum = Number(c.max_score)
                const pct    = val !== '' && maxNum > 0 ? Math.min(100, (numVal / maxNum) * 100) : 0
                return (
                  <div key={c.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 text-sm font-medium">{c.name}</p>
                        {c.description && (
                          <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={maxNum}
                          step="0.5"
                          value={val}
                          onChange={(e) => {
                            const raw = e.target.value
                            const clamped = raw === '' ? '' : Math.min(Number(raw), maxNum)
                            setScores(prev => ({ ...prev, [c.id]: clamped }))
                          }}
                          className="w-20 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                          placeholder="0"
                        />
                        <span className="text-slate-500 text-xs w-14">/ {c.max_score}</span>
                      </div>
                    </div>
                    {val !== '' && (
                      <div className="h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
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
            <p className="text-slate-400 text-xs">Criteria scored</p>
            <p className={`text-sm font-semibold ${allScored ? 'text-emerald-400' : 'text-slate-300'}`}>
              {scoredCount} / {criteria.length}
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
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
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
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">{row.student_name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{row.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Score</p>
              <p className="text-3xl font-black text-white">
                {ev.total_score != null ? `${Number(ev.total_score).toFixed(0)}%` : '—'}
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
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Score Breakdown</p>
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
              <p className="text-xs text-slate-500 mb-2">Overall Comment</p>
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

export default function WorkplaceScoresPage() {
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
        const [evalsData, placementsData, criteriaData] = await Promise.all([
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
          fetchWithAuth(`${API}/evaluations/criteria/?type=workplace`).catch(() => []),
        ])

        const placements   = Array.isArray(placementsData) ? placementsData : []
        const evals        = Array.isArray(evalsData)      ? evalsData      : []
        const criteriaList = Array.isArray(criteriaData)   ? criteriaData   : []

        const evalByPlacement = {}
        evals.forEach(e => { evalByPlacement[e.placement] = e })

        setRows(placements.map(p => ({
          placement:    p,
          evaluation:   evalByPlacement[p.id] || null,
          student_name: p.student_name || `Student #${p.id}`,
          company:      p.company_name || '—',
        })))

        setCriteria(criteriaList)
      } catch {
        toast.error('Failed to load scores.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const handleEvalSuccess = (updatedEval, placementId) => {
    setRows(prev => prev.map(r =>
      r.placement.id === placementId ? { ...r, evaluation: updatedEval } : r
    ))
  }

  const total     = rows.length
  const submitted = rows.filter(r => r.evaluation?.status === 'SUBMITTED').length
  const pending   = rows.filter(r => !r.evaluation || r.evaluation.status !== 'SUBMITTED').length
  const scored    = rows.filter(r => r.evaluation?.total_score != null)
  const avgScore  = scored.length
    ? Math.round(scored.reduce((acc, r) => acc + Number(r.evaluation.total_score), 0) / scored.length)
    : null

  const filtered = rows.filter((r) => {
    if (statusFilter === 'SUBMITTED' && r.evaluation?.status !== 'SUBMITTED') return false
    if (statusFilter === 'PENDING'   && r.evaluation?.status === 'SUBMITTED') return false
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
        <h1 className="text-2xl font-bold text-white">Scores</h1>
        <p className="text-sm text-slate-400 mt-1">Evaluate and score your assigned interns — contributes 40% of the final grade</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Interns', value: total,                                   color: 'text-white',       bg: 'bg-slate-800/50 border-slate-700/50'    },
          { label: 'Evaluated',     value: submitted,                               color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pending',       value: pending,                                 color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
          { label: 'Avg. Score',    value: avgScore != null ? `${avgScore}%` : '—', color: 'text-indigo-400',  bg: 'bg-indigo-600/10 border-indigo-500/20'  },
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
          {[
            { key: 'all',       label: 'All'       },
            { key: 'SUBMITTED', label: 'Evaluated' },
            { key: 'PENDING',   label: 'Pending'   },
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
                    <tr key={row.placement.id} className="hover:bg-slate-700/20 transition">
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
                          {ev?.status === 'SUBMITTED' ? 'Evaluated' : ev?.status === 'DRAFT' ? 'Draft' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {ev?.status === 'SUBMITTED' ? (
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
          <p className="text-slate-500 text-xs">{submitted} evaluated · {pending} pending</p>
        </div>
      </div>
    </div>
  )
}
