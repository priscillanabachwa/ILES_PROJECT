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

function EvaluationModal({ evaluation, onClose }) {
  if (!evaluation) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">{evaluation.student_name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{evaluation.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Score</p>
              <p className="text-3xl font-black text-white">
                {evaluation.total_score != null ? `${Number(evaluation.total_score).toFixed(0)}%` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Grade</p>
              <span className={`text-3xl font-black ${
                evaluation.grade === 'A' ? 'text-emerald-400' :
                evaluation.grade === 'B' ? 'text-indigo-400' :
                evaluation.grade === 'C' ? 'text-amber-400' :
                evaluation.grade ? 'text-red-400' : 'text-slate-600'
              }`}>
                {evaluation.grade || '—'}
              </span>
            </div>
          </div>

          {evaluation.items && evaluation.items.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Evaluation Criteria</p>
              <div className="space-y-2">
                {evaluation.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-4 py-3">
                    <span className="text-slate-300 text-sm">{item.criteria_name || `Criteria ${item.criteria}`}</span>
                    <span className="text-white font-bold text-sm">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className="text-slate-300">{evaluation.status}</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Placement</p>
              <p className="text-slate-300">#{evaluation.placement}</p>
            </div>
          </div>

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
  const [evaluations,        setEvaluations]        = useState([])
  const [loading,            setLoading]            = useState(true)
  const [search,             setSearch]             = useState('')
  const [statusFilter,       setStatusFilter]       = useState('all')
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [evalsData, placementsData] = await Promise.all([
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
          fetchWithAuth(`${API}/placements/`).catch(() => []),
        ])
        const pm = Object.fromEntries(
          (Array.isArray(placementsData) ? placementsData : []).map(p => [p.id, p])
        )
        setEvaluations(
          (Array.isArray(evalsData) ? evalsData : []).map(e => ({
            ...e,
            student_name: pm[e.placement]?.student_name || `Placement #${e.placement}`,
            company:      pm[e.placement]?.company_name || '—',
          }))
        )
      } catch {
        toast.error('Failed to load evaluations.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const total     = evaluations.length
  const submitted = evaluations.filter(e => e.status === 'SUBMITTED').length
  const pending   = evaluations.filter(e => e.status !== 'SUBMITTED').length
  const avgScore  = evaluations.filter(e => e.total_score != null).length
    ? Math.round(
        evaluations.filter(e => e.total_score != null).reduce((acc, e) => acc + Number(e.total_score), 0) /
        evaluations.filter(e => e.total_score != null).length
      )
    : null

  const filtered = evaluations.filter((e) => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    const matchSearch = search === '' ||
      e.student_name.toLowerCase().includes(search.toLowerCase()) ||
      e.company.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {selectedEvaluation && (
        <EvaluationModal evaluation={selectedEvaluation} onClose={() => setSelectedEvaluation(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Evaluations</h1>
        <p className="text-sm text-slate-400 mt-1">View evaluation results for your assigned interns</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Interns', value: total,                                 color: 'text-white',       bg: 'bg-slate-800/50 border-slate-700/50'    },
          { label: 'Evaluated',     value: submitted,                              color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pending',       value: pending,                                color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
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
          <input type="text" placeholder="Search by student name or company..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all',       label: 'All'       },
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
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No evaluations found.</td>
                  </tr>
                )}
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-700/20 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                          {ev.student_name?.[0] || '?'}
                        </div>
                        <p className="text-white text-sm font-medium">{ev.student_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300 text-sm">{ev.company}</p>
                    </td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={ev.total_score != null ? Number(ev.total_score) : null} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-sm ${
                        ev.grade === 'A' ? 'text-emerald-400' :
                        ev.grade === 'B' ? 'text-indigo-400' :
                        ev.grade === 'C' ? 'text-amber-400' :
                        ev.grade ? 'text-red-400' : 'text-slate-600'
                      }`}>
                        {ev.grade || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        ev.status === 'SUBMITTED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ev.status === 'SUBMITTED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {ev.status === 'SUBMITTED' ? 'Evaluated' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {ev.status === 'SUBMITTED' ? (
                        <button onClick={() => setSelectedEvaluation(ev)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                          View
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">No evaluation yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {total} interns</p>
          <p className="text-slate-500 text-xs">{submitted} evaluated x {pending} pending</p>
        </div>
      </div>
    </div>
  )
}

