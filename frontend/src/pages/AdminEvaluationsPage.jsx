import { useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_EVALUATIONS = [
  {
    id: 1,
    student_name: 'Amara Nkosi',
    student_id: '2500703348',
    company: 'TechCorp Uganda',
    supervisor_name: 'Mr. James Opolot',
    supervisor_email: 'j.opolot@techcorp.ug',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: '2026-04-10',
    status: 'submitted',
    technical_skills: 4,
    communication: 5,
    teamwork: 4,
    punctuality: 5,
    initiative: 3,
    overall_score: 84,
    feedback: 'Amara demonstrated strong technical ability and was always punctual. She needs to show more initiative in proposing solutions independently.',
    recommendation: 'Pass',
  },
  {
    id: 2,
    student_name: 'Brian Otim',
    student_id: '2500703349',
    company: 'Innovate Solutions Ltd',
    supervisor_name: 'Ms. Ruth Akello',
    supervisor_email: 'r.akello@innovate.co.ug',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: '2026-04-08',
    status: 'submitted',
    technical_skills: 3,
    communication: 4,
    teamwork: 5,
    punctuality: 4,
    initiative: 4,
    overall_score: 78,
    feedback: 'Brian is a great team player and communicates well. His technical skills need improvement but he shows great willingness to learn.',
    recommendation: 'Pass',
  },
  {
    id: 3,
    student_name: 'Cynthia Akello',
    student_id: '2500703350',
    company: 'DataSoft Africa',
    supervisor_name: 'Dr. Peter Mugisha',
    supervisor_email: 'p.mugisha@datasoft.africa',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: null,
    status: 'pending',
    technical_skills: null,
    communication: null,
    teamwork: null,
    punctuality: null,
    initiative: null,
    overall_score: null,
    feedback: null,
    recommendation: null,
  },
  {
    id: 4,
    student_name: 'Denis Okello',
    student_id: '2500703351',
    company: 'Uganda Revenue Authority',
    supervisor_name: 'Mrs. Florence Nambi',
    supervisor_email: 'f.nambi@ura.go.ug',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: '2026-04-12',
    status: 'submitted',
    technical_skills: 5,
    communication: 5,
    teamwork: 5,
    punctuality: 5,
    initiative: 5,
    overall_score: 97,
    feedback: 'Denis exceeded all expectations. He is exceptionally talented, self-motivated, and a valuable asset to any team.',
    recommendation: 'Pass with Distinction',
  },
  {
    id: 5,
    student_name: 'Eva Namutebi',
    student_id: '2500703352',
    company: 'Stanbic Bank Uganda',
    supervisor_name: 'Mr. Collins Waiswa',
    supervisor_email: 'c.waiswa@stanbic.com',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: null,
    status: 'pending',
    technical_skills: null,
    communication: null,
    teamwork: null,
    punctuality: null,
    initiative: null,
    overall_score: null,
    feedback: null,
    recommendation: null,
  },
  {
    id: 6,
    student_name: 'Frank Ssali',
    student_id: '2500703353',
    company: 'MTN Uganda',
    supervisor_name: 'Eng. Sarah Tendo',
    supervisor_email: 's.tendo@mtn.co.ug',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: null,
    status: 'pending',
    technical_skills: null,
    communication: null,
    teamwork: null,
    punctuality: null,
    initiative: null,
    overall_score: null,
    feedback: null,
    recommendation: null,
  },
  {
    id: 7,
    student_name: 'Grace Auma',
    student_id: '2500703354',
    company: 'Airtel Uganda',
    supervisor_name: 'Mr. David Kakooza',
    supervisor_email: 'd.kakooza@airtel.ug',
    period: 'Jan 2026 – Apr 2026',
    submitted_at: '2026-04-09',
    status: 'submitted',
    technical_skills: 3,
    communication: 3,
    teamwork: 4,
    punctuality: 3,
    initiative: 2,
    overall_score: 62,
    feedback: 'Grace struggled with time management and showing initiative. She completed assigned tasks but rarely went beyond what was asked.',
    recommendation: 'Pass',
  },
]

// ── Star Rating Display ───────────────────────────────────────────────────────
function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= value ? 'text-yellow-400' : 'text-slate-600'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

// ── Score Badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color =
    score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    score >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}%
    </span>
  )
}

// ── Evaluation Detail Modal ───────────────────────────────────────────────────
function EvaluationModal({ evaluation, onClose }) {
  if (!evaluation) return null
  const criteria = [
    { label:'Technical Skills', key:'technical_skills' },
    { label:'Communication',    key:'communication'    },
    { label:'Teamwork',         key:'teamwork'         },
    { label:'Punctuality',      key:'punctuality'      },
    { label:'Initiative',       key:'initiative'       },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50 sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">{evaluation.student_name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{evaluation.student_id} · {evaluation.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Supervisor Info */}
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Supervisor</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                {evaluation.supervisor_name.split(' ').pop()[0]}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{evaluation.supervisor_name}</p>
                <p className="text-slate-400 text-xs">{evaluation.supervisor_email}</p>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Overall Score</p>
              <p className="text-3xl font-black text-white">{evaluation.overall_score}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommendation</p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                evaluation.recommendation === 'Pass with Distinction'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : evaluation.recommendation === 'Pass'
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {evaluation.recommendation}
              </span>
            </div>
          </div>

          {/* Criteria Ratings */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Performance Criteria</p>
            <div className="space-y-3">
              {criteria.map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{label}</span>
                  <Stars value={evaluation[key]} />
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Supervisor Feedback</p>
            <p className="text-slate-300 text-sm leading-relaxed bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
              {evaluation.feedback}
            </p>
          </div>

          {/* Period & Date */}
          <div className="flex gap-4 text-sm">
            <div className="flex-1 bg-slate-700/30 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Internship Period</p>
              <p className="text-slate-300">{evaluation.period}</p>
            </div>
            <div className="flex-1 bg-slate-700/30 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Submitted On</p>
              <p className="text-slate-300">{evaluation.submitted_at}</p>
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

// ── Follow-up Modal ───────────────────────────────────────────────────────────
function FollowUpModal({ evaluation, onClose, onSend }) {
  const [message, setMessage] = useState(
    `Dear ${evaluation?.supervisor_name},\n\nThis is a reminder that the internship evaluation for ${evaluation?.student_name} (${evaluation?.student_id}) is still pending submission.\n\nKindly submit the evaluation at your earliest convenience.\n\nRegards,\nInternship Admin`
  )
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    setSent(true)
    toast.success(`✓ Reminder sent to ${evaluation?.supervisor_name}!`)
    toast.info(`📧 Notification sent to ${evaluation?.supervisor_email}`, { autoClose: 3000 })
    setTimeout(() => {
      onSend(evaluation.id)
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-white">Send Follow-up Reminder</h2>
            <p className="text-slate-400 text-sm mt-0.5">To: {evaluation?.supervisor_email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-4 text-slate-300 text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition">
              Cancel
            </button>
            <button onClick={handleSend} disabled={sent}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                sent
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}>
              {sent ? '✓ Reminder Sent!' : 'Send Reminder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
// No AppLayout wrapper — renders inside AppLayout's <Outlet />
export default function AdminEvaluationsPage() {
  const [evaluations,       setEvaluations]       = useState(MOCK_EVALUATIONS)
  const [search,            setSearch]            = useState('')
  const [statusFilter,      setStatusFilter]      = useState('all')
  const [selectedEvaluation,setSelectedEvaluation]= useState(null)
  const [followUpTarget,    setFollowUpTarget]    = useState(null)

  // Stats
  const total     = evaluations.length
  const submitted = evaluations.filter((e) => e.status === 'submitted').length
  const pending   = evaluations.filter((e) => e.status === 'pending').length
  const avgScore  = Math.round(
    evaluations.filter((e) => e.overall_score).reduce((acc, e) => acc + e.overall_score, 0) /
    evaluations.filter((e) => e.overall_score).length
  )

  // Filter
  const filtered = evaluations.filter((e) => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    const matchSearch = search === '' ||
      e.student_name.toLowerCase().includes(search.toLowerCase()) ||
      e.student_id.includes(search) ||
      e.company.toLowerCase().includes(search.toLowerCase()) ||
      e.supervisor_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const handleFollowUpSent = (id) => {
    setEvaluations((prev) => prev.map((e) => e.id === id ? { ...e, followUpSent: true } : e))
  }

  return (
    <div className="space-y-6">

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />

      {/* Modals */}
      {selectedEvaluation && (
        <EvaluationModal evaluation={selectedEvaluation} onClose={() => setSelectedEvaluation(null)} />
      )}
      {followUpTarget && (
        <FollowUpModal
          evaluation={followUpTarget}
          onClose={() => setFollowUpTarget(null)}
          onSend={handleFollowUpSent}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Evaluations</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor supervisor evaluations for all interns</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Interns', value:total,       color:'text-white',        bg:'bg-slate-800/50 border-slate-700/50'          },
          { label:'Evaluated',     value:submitted,   color:'text-emerald-400',  bg:'bg-emerald-500/10 border-emerald-500/20'       },
          { label:'Pending',       value:pending,     color:'text-amber-400',    bg:'bg-amber-500/10 border-amber-500/20'           },
          { label:'Avg. Score',    value:`${avgScore}%`, color:'text-indigo-400',bg:'bg-indigo-600/10 border-indigo-500/20'         },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, ID, company, supervisor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
        <div className="flex gap-2">
          {['all','submitted','pending'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition capitalize ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
              }`}>
              {s === 'all' ? 'All' : s === 'submitted' ? 'Evaluated' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Intern','Company','Supervisor','Status','Score','Submitted','Actions'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-700/20 transition">

                  {/* Intern */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                        {ev.student_name[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{ev.student_name}</p>
                        <p className="text-slate-500 text-xs">{ev.student_id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-5 py-4">
                    <p className="text-slate-300 text-sm">{ev.company}</p>
                  </td>

                  {/* Supervisor */}
                  <td className="px-5 py-4">
                    <p className="text-slate-300 text-sm">{ev.supervisor_name}</p>
                    <p className="text-slate-500 text-xs">{ev.supervisor_email}</p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      ev.status === 'submitted'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ev.status === 'submitted' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {ev.status === 'submitted' ? 'Evaluated' : 'Pending'}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-5 py-4">
                    {ev.overall_score
                      ? <ScoreBadge score={ev.overall_score} />
                      : <span className="text-slate-600 text-sm">—</span>
                    }
                  </td>

                  {/* Submitted At */}
                  <td className="px-5 py-4">
                    <p className="text-slate-400 text-sm">{ev.submitted_at ?? '—'}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    {ev.status === 'submitted' ? (
                      <button onClick={() => setSelectedEvaluation(ev)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition">
                        View
                      </button>
                    ) : (
                      <button
                        onClick={() => setFollowUpTarget(ev)}
                        disabled={ev.followUpSent}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                          ev.followUpSent
                            ? 'bg-slate-700/30 text-slate-500 border-slate-600/30 cursor-not-allowed'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30'
                        }`}>
                        {ev.followUpSent ? 'Reminder Sent' : 'Follow Up'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No evaluations match your search.</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Showing {filtered.length} of {total} interns</p>
          <p className="text-slate-500 text-xs">{submitted} evaluated · {pending} pending</p>
        </div>
      </div>
    </div>
  )
}
