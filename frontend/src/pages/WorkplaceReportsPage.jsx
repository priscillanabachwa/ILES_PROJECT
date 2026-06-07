import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { fetchWithAuth } from '../services/authService'
import { capName } from '../services/dashboardService'

const API = '/api'

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

export default function WorkplaceReportsPage() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [placements, logbooks, evals] = await Promise.all([
          fetchWithAuth(`${API}/placements/`).catch(() => []),
          fetchWithAuth(`${API}/weeklylogs/logbooks/`).catch(() => []),
          fetchWithAuth(`${API}/evaluations/evaluations/`).catch(() => []),
        ])

        const pm = Object.fromEntries(
          (Array.isArray(placements) ? placements : []).map(p => [p.id, p])
        )
        // Only keep the placement-level report eval (not per-log or per-visit evals)
        const evalByPlacement = {}
        ;(Array.isArray(evals) ? evals : []).forEach(e => {
          if (e.log == null && e.visit_number == null)
            evalByPlacement[e.placement] = e
        })

        const logsByPlacement = {}
        ;(Array.isArray(logbooks) ? logbooks : []).forEach(l => {
          if (!logsByPlacement[l.placement]) logsByPlacement[l.placement] = []
          logsByPlacement[l.placement].push(l)
        })

        const built = (Array.isArray(placements) ? placements : []).map(p => {
          const logs   = logsByPlacement[p.id] || []
          const ev     = evalByPlacement[p.id] || null
          const submitted = logs.filter(l => l.status !== 'draft').length
          const approved  = logs.filter(l => l.status === 'approved').length
          return {
            id:           p.id,
            student_name: capName(p.student_name || `Student #${p.id}`),
            company:      p.company_name || '—',
            start_date:   p.start_date,
            end_date:     p.end_date,
            status:       p.status,
            total_logs:   submitted,
            approved_logs: approved,
            score:        ev?.total_score != null ? Number(ev.total_score).toFixed(1) : null,
            grade:        ev?.grade || null,
            eval_status:  ev?.status || null,
          }
        })
        setRows(built)
      } catch {
        toast.error('Failed to load report data.')
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const today = new Date().toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Intern Performance Report</h1>
          <p className="text-sm text-slate-400 mt-1">Summary of your assigned interns' progress and scores</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={loading || rows.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Print / Export PDF
        </button>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Interns',    value: rows.length,                                          color: 'text-white',       bg: 'bg-slate-800/50 border-slate-700/50'    },
            { label: 'Evaluated',        value: rows.filter(r => r.eval_status === 'SUBMITTED').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'},
            { label: 'Pending Eval',     value: rows.filter(r => r.eval_status !== 'SUBMITTED').length, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
            {
              label: 'Avg. Score',
              value: (() => {
                const scored = rows.filter(r => r.score != null)
                return scored.length
                  ? `${(scored.reduce((s, r) => s + Number(r.score), 0) / scored.length).toFixed(1)}%`
                  : '—'
              })(),
              color: 'text-indigo-400',
              bg: 'bg-indigo-600/10 border-indigo-500/20',
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{label}</p>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report table */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">

        {/* Print-only header (hidden on screen) */}
        <div className="hidden print:block p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white">Intern Performance Report</h2>
          <p className="text-xs text-slate-400 mt-1">Generated: {today}</p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No interns assigned yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Intern', 'Company', 'Placement Period', 'Logs Submitted', 'Logs Approved', 'Score', 'Grade', 'Eval Status'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-700/20 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                          {r.student_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="text-white text-sm font-medium capitalize">{r.student_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300 text-sm">{r.company}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-400 text-xs whitespace-nowrap">
                        {r.start_date ? `${fmt(r.start_date)} – ${fmt(r.end_date)}` : '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-slate-300 text-sm font-semibold">{r.total_logs}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-emerald-400 text-sm font-semibold">{r.approved_logs}</span>
                    </td>
                    <td className="px-5 py-4">
                      {r.score != null ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          Number(r.score) >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          Number(r.score) >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                  'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {r.score}%
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-sm ${
                        r.grade === 'A' ? 'text-emerald-400' :
                        r.grade === 'B' ? 'text-indigo-400' :
                        r.grade === 'C' ? 'text-amber-400' :
                        r.grade         ? 'text-red-400'   : 'text-slate-600'
                      }`}>
                        {r.grade || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        r.eval_status === 'SUBMITTED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : r.eval_status === 'DRAFT'
                          ? 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.eval_status === 'SUBMITTED' ? 'bg-emerald-400' :
                          r.eval_status === 'DRAFT'     ? 'bg-slate-400'   : 'bg-amber-400'
                        }`} />
                        {r.eval_status === 'SUBMITTED' ? 'Evaluated' :
                         r.eval_status === 'DRAFT'     ? 'Draft'     : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">
            {rows.length} {rows.length === 1 ? 'intern' : 'interns'} · Generated {today}
          </p>
          <p className="text-slate-500 text-xs">
            {rows.filter(r => r.eval_status === 'SUBMITTED').length} evaluated ·{' '}
            {rows.filter(r => r.eval_status !== 'SUBMITTED').length} pending
          </p>
        </div>
      </div>
    </div>
  )
}
