import { useState, useEffect } from 'react'
import axios from 'axios'

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-UG', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—'

const getGradeColor = (grade) => {
  if (!grade) return 'text-slate-400'
  const g = grade.toUpperCase()
  if (g.startsWith('A')) return 'text-emerald-300'
  if (g.startsWith('B')) return 'text-indigo-300'
  if (g.startsWith('C')) return 'text-amber-300'
  return 'text-rose-300'
}

const getScoreColor = (score) => {
  if (score == null) return 'text-slate-500'
  if (score >= 75) return 'text-emerald-400'
  if (score >= 60) return 'text-indigo-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

const getBarColor = (score) => {
  if (score == null) return 'bg-slate-600'
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 60) return 'bg-indigo-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-slate-700/50 animate-pulse rounded-lg ${className}`} />
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <p className="text-sm font-bold text-white">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatCard({ label, value, sub, accent, icon }) {
  const A = {
    indigo:  { bg: 'bg-indigo-600/10 border border-indigo-500/20',   icon: 'bg-indigo-600/20 text-indigo-400',   val: 'text-indigo-300',  sub: 'text-indigo-400'  },
    emerald: { bg: 'bg-emerald-500/10 border border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-400', val: 'text-emerald-300', sub: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10 border border-amber-500/20',     icon: 'bg-amber-500/20 text-amber-400',     val: 'text-amber-300',   sub: 'text-amber-400'   },
    rose:    { bg: 'bg-rose-500/10 border border-rose-500/20',       icon: 'bg-rose-500/20 text-rose-400',       val: 'text-rose-300',    sub: 'text-rose-400'    },
  }[accent] || {}
  return (
    <div className={`${A.bg} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${A.icon}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${A.val}`}>{value ?? '—'}</p>
        {sub && <p className={`text-xs font-medium mt-1 ${A.sub}`}>{sub}</p>}
      </div>
    </div>
  )
}

// Animated score bar
function ScoreBar({ label, weight, score, description }) {
  const weighted = score != null ? ((score * weight) / 100).toFixed(1) : null
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-bold ${getScoreColor(score)}`}>
            {score != null ? `${score}%` : 'Pending'}
          </p>
          <p className="text-xs text-slate-500">
            {weighted != null ? `${weighted} / ${weight} pts` : `Weight: ${weight}%`}
          </p>
        </div>
      </div>
      {/* Track */}
      <div className="w-full bg-slate-700/60 rounded-full h-3 overflow-hidden">
        <div
          className={`${getBarColor(score)} h-3 rounded-full transition-all duration-700`}
          style={{ width: score != null ? `${Math.min(score, 100)}%` : '0%' }}
        />
      </div>
      {/* Threshold markers */}
      <div className="flex justify-between text-xs text-slate-600 px-0.5">
        <span>0</span>
        <span className="ml-[49%]">50</span>
        <span className="ml-auto">100</span>
      </div>
    </div>
  )
}

// Grade scale reference
const GRADE_SCALE = [
  { range: '80 – 100', grade: 'A / A+', label: 'Distinction',    color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { range: '70 – 79',  grade: 'B / B+', label: 'Credit',         color: 'text-indigo-300',  bg: 'bg-indigo-500/10 border-indigo-500/20'   },
  { range: '60 – 69',  grade: 'C / C+', label: 'Pass',           color: 'text-amber-300',   bg: 'bg-amber-500/10 border-amber-500/20'     },
  { range: '50 – 59',  grade: 'D',      label: 'Borderline',     color: 'text-orange-300',  bg: 'bg-orange-500/10 border-orange-500/20'   },
  { range: '0 – 49',   grade: 'F',      label: 'Fail',           color: 'text-rose-300',    bg: 'bg-rose-500/10 border-rose-500/20'       },
]

// Criteria breakdown table
const CRITERIA = [
  {
    category: 'Workplace Supervisor (40%)',
    color: 'text-indigo-400',
    dot: 'bg-indigo-500',
    items: [
      { aspect: 'Punctuality & Attendance',     max: 10, description: 'Consistent attendance and time-keeping at the workplace'       },
      { aspect: 'Quality of Work',              max: 10, description: 'Accuracy, thoroughness, and professional quality of tasks'     },
      { aspect: 'Initiative & Problem Solving', max: 10, description: 'Ability to work independently and find solutions'              },
      { aspect: 'Teamwork & Communication',     max: 10, description: 'Collaboration with colleagues and effective communication'     },
    ],
  },
  {
    category: 'Academic Supervisor (30%)',
    color: 'text-emerald-400',
    dot: 'bg-emerald-500',
    items: [
      { aspect: 'Logbook Quality',              max: 10, description: 'Clarity, detail, and structure of weekly logbook entries'      },
      { aspect: 'Theory–Practice Link',         max: 10, description: 'How well academic knowledge is applied to workplace tasks'    },
      { aspect: 'Report / Presentation',        max: 10, description: 'Final internship report or presentation quality'              },
    ],
  },
  {
    category: 'Logbook Assessment (30%)',
    color: 'text-amber-400',
    dot: 'bg-amber-500',
    items: [
      { aspect: 'Regularity of Submission',     max: 10, description: 'Logs submitted on time each week'                            },
      { aspect: 'Content Depth',                max: 10, description: 'Depth and relevance of activities documented'                 },
      { aspect: 'Reflection & Challenges',      max: 10, description: 'Thoughtful reflection on challenges and learning outcomes'    },
    ],
  },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EvaluationPage() {
  const [scores,    setScores]    = useState(null)
  const [placement, setPlacement] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [scoresRes, placementRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/scores/',     { headers: { Authorization: 'Bearer ' + token } }),
          axios.get('http://127.0.0.1:8000/api/placement/',  { headers: { Authorization: 'Bearer ' + token } }),
        ])
        setScores(scoresRes.data)
        setPlacement(placementRes.data)
      } catch {
        // ── Mock data — remove when backend is connected ──────────────────
        setScores({
          workplace_score: 80,
          academic_score:  74,
          logbook_score:   74,
          final_score:     76.4,
          grade:           'B+',
          evaluated_at:    '2026-04-10',
          status:          'evaluated',   // 'pending' | 'partial' | 'evaluated'
        })
        setPlacement({
          company:              'TechCorp Uganda',
          start_date:           '2025-09-01',
          end_date:             '2025-11-30',
          duration_weeks:       12,
          current_week:         6,
          workplace_supervisor: 'David Ochieng',
          academic_supervisor:  'Prof. Grace Atim',
        })
        // ── End mock data ─────────────────────────────────────────────────
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // Derived
  const wpWeighted  = scores?.workplace_score != null ? ((scores.workplace_score * 40) / 100).toFixed(1) : null
  const acWeighted  = scores?.academic_score  != null ? ((scores.academic_score  * 30) / 100).toFixed(1) : null
  const lbWeighted  = scores?.logbook_score   != null ? ((scores.logbook_score   * 30) / 100).toFixed(1) : null
  const isPending   = !scores || scores.status === 'pending'
  const isPartial   = scores?.status === 'partial'

  // Current grade highlight
  const currentGrade = GRADE_SCALE.find(
    (g) => scores?.grade?.toUpperCase().startsWith(g.grade[0])
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Evaluation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Your internship assessment scores, grading criteria, and final result.
          </p>
        </div>
        {scores?.evaluated_at && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Last evaluated: {formatDate(scores.evaluated_at)}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Pending notice ── */}
      {!loading && isPending && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-5 py-4 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>
            Your evaluation is <strong>pending</strong>. Scores will appear once your supervisors have submitted their assessments.
          </span>
        </div>
      )}

      {!loading && isPartial && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm px-5 py-4 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>
            Some scores are <strong>still pending</strong>. Partial results are shown below.
          </span>
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? <PageSkeleton /> : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Final Score"
              value={scores?.final_score != null ? `${Number(scores.final_score).toFixed(1)}%` : null}
              sub="Weighted total"
              accent="indigo"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              }
            />
            <StatCard
              label="Grade"
              value={scores?.grade || '—'}
              sub={currentGrade?.label || 'Awaiting result'}
              accent="emerald"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              }
            />
            <StatCard
              label="Workplace"
              value={scores?.workplace_score != null ? `${scores.workplace_score}%` : null}
              sub={wpWeighted ? `${wpWeighted} / 40 pts` : 'Weight: 40%'}
              accent="amber"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              }
            />
            <StatCard
              label="Academic"
              value={scores?.academic_score != null ? `${scores.academic_score}%` : null}
              sub={acWeighted ? `${acWeighted} / 30 pts` : 'Weight: 30%'}
              accent="rose"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
                </svg>
              }
            />
          </div>

          {/* ── Main layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Left — 3/5 */}
            <div className="lg:col-span-3 space-y-5">

              {/* Score Breakdown */}
              <Card
                title="Score Breakdown"
                subtitle="How each component contributes to your final score"
              >
                <div className="space-y-6">
                  <ScoreBar
                    label="Workplace Supervisor"
                    weight={40}
                    score={scores?.workplace_score}
                    description="Assessment by your company supervisor"
                  />
                  <ScoreBar
                    label="Academic Supervisor"
                    weight={30}
                    score={scores?.academic_score}
                    description="Assessment by your university supervisor"
                  />
                  <ScoreBar
                    label="Logbook Assessment"
                    weight={30}
                    score={scores?.logbook_score}
                    description="Quality and regularity of your weekly logs"
                  />
                </div>

                {/* Weighted total */}
                <div className="mt-6 pt-5 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">Weighted Final Score</p>
                    <p className="text-2xl font-bold text-indigo-300">
                      {scores?.final_score != null ? `${Number(scores.final_score).toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {[
                      { label: `${wpWeighted ?? '?'} pts`, sub: 'Workplace (40%)', color: 'bg-indigo-500' },
                      { label: `${acWeighted ?? '?'} pts`, sub: 'Academic (30%)',  color: 'bg-emerald-500' },
                      { label: `${lbWeighted ?? '?'} pts`, sub: 'Logbook (30%)',   color: 'bg-amber-500'  },
                    ].map(({ label, sub, color }) => (
                      <div key={sub} className="flex-1 bg-slate-700/40 border border-slate-700/50 rounded-xl p-3 text-center">
                        <div className={`w-2 h-2 ${color} rounded-full mx-auto mb-1.5`} />
                        <p className="text-white font-bold text-sm">{label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Evaluation Criteria */}
              <Card
                title="Evaluation Criteria"
                subtitle="What each component of your assessment covers"
              >
                <div className="space-y-6">
                  {CRITERIA.map((section) => (
                    <div key={section.category}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${section.dot}`} />
                        <p className={`text-xs font-bold uppercase tracking-wide ${section.color}`}>
                          {section.category}
                        </p>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-slate-700/50">
                        {section.items.map((item) => (
                          <div
                            key={item.aspect}
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/20 border border-slate-700/40 hover:border-slate-600/60 transition"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">{item.aspect}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-slate-400">{item.max} pts</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right — 2/5 */}
            <div className="lg:col-span-2 space-y-5">

              {/* Grade result */}
              <Card title="Your Result">
                <div className="text-center py-4">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4
                    ${scores?.grade
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-slate-600 bg-slate-700/30'}`}
                  >
                    <span className={`text-4xl font-black ${scores?.grade ? getGradeColor(scores.grade) : 'text-slate-600'}`}>
                      {scores?.grade || '?'}
                    </span>
                  </div>
                  <p className="text-white font-bold text-lg">
                    {scores?.final_score != null
                      ? `${Number(scores.final_score).toFixed(1)}%`
                      : 'Awaiting evaluation'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {currentGrade?.label || 'Result pending'}
                  </p>
                </div>

                {/* Scoring formula */}
                <div className="mt-2 bg-slate-700/30 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Scoring Formula</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Workplace Supervisor', pct: '× 40%', color: 'text-indigo-400' },
                      { label: 'Academic Supervisor',  pct: '× 30%', color: 'text-emerald-400' },
                      { label: 'Logbook Assessment',   pct: '× 30%', color: 'text-amber-400' },
                    ].map(({ label, pct, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{label}</span>
                        <span className={`font-bold ${color}`}>{pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Grade scale */}
              <Card title="Grading Scale" subtitle="University grading reference">
                <div className="space-y-2">
                  {GRADE_SCALE.map((g) => (
                    <div
                      key={g.grade}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition
                        ${currentGrade?.grade === g.grade
                          ? `${g.bg} ring-2 ring-indigo-500/30`
                          : 'bg-slate-700/20 border-slate-700/40'}`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${currentGrade?.grade === g.grade ? g.color : 'text-slate-400'}`}>
                          {g.grade}
                        </p>
                        <p className="text-xs text-slate-500">{g.label}</p>
                      </div>
                      <p className={`text-xs font-semibold ${currentGrade?.grade === g.grade ? g.color : 'text-slate-500'}`}>
                        {g.range}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Placement summary */}
              {placement && (
                <Card title="Internship Details">
                  <div className="space-y-3">
                    {[
                      { label: 'Company',              value: placement.company              },
                      { label: 'Duration',             value: `${placement.duration_weeks} weeks` },
                      { label: 'Current Week',         value: `Week ${placement.current_week} of ${placement.duration_weeks}` },
                      { label: 'Start Date',           value: formatDate(placement.start_date) },
                      { label: 'End Date',             value: formatDate(placement.end_date)   },
                      { label: 'Workplace Supervisor', value: placement.workplace_supervisor  },
                      { label: 'Academic Supervisor',  value: placement.academic_supervisor   },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-2 text-xs border-b border-slate-700/30 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className="text-slate-300 font-semibold text-right">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  )
}
