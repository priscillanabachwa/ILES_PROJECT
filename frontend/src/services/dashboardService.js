import { fetchWithAuth } from './authService';

const BASE = '/api';
const PLACEMENTS = `${BASE}/placements/`;
const LOGBOOKS = `${BASE}/weeklylogs/logbooks/`;
const EVALUATIONS = `${BASE}/evaluations/evaluations/`;
const CRITERIA = `${BASE}/evaluations/criteria/`;
const USERS = `${BASE}/accounts/users/`;

export function capName(s) {
  if (!s) return s
  return String(s).replace(/\b\w/g, c => c.toUpperCase())
}

function weeksBetween(start, end) {
  if (!start || !end) return null;
  return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (7 * 86400000)));
}

function currentWeekOf(start) {
  if (!start) return 1;
  return Math.max(1, Math.ceil((Date.now() - new Date(start)) / (7 * 86400000)));
}

function transformPlacement(p) {
  const dur = weeksBetween(p.start_date, p.end_date);
  const cur = p.start_date ? Math.min(currentWeekOf(p.start_date), dur || 1) : 1;
  return {
    ...p,
    company: p.company_name || String(p.company || ''),
    company_address: p.company_address || '',
    workplace_supervisor: p.workplace_supervisor_name || '',
    workplace_supervisor_email: p.workplace_supervisor_email || '',
    academic_supervisor: p.academic_supervisor_name || '',
    academic_supervisor_email: p.academic_supervisor_email || '',
    duration_weeks: dur,
    current_week: cur,
  };
}

function buildPlacementMap(placements) {
  return Object.fromEntries(placements.map(p => [p.id, p]));
}

function gradeFromScore(s) {
  if (s == null) return null;
  if (s >= 80) return 'A';
  if (s >= 70) return 'B';
  if (s >= 60) return 'C';
  if (s >= 50) return 'D';
  return 'F';
}

// Formula: Workplace (40%) + Logbook (30%) + Report (20%) + Other Academic (10%)
// Each component comes from a separate evaluation record type — not keyword-matched criteria names.
function computeScoreComponents(evalsArr) {
  const arr = Array.isArray(evalsArr) ? evalsArr : [];

  const workplaceEval = arr.find(e => e.evaluator_role === 'workplace_supervisor');
  const academicEvals = arr.filter(e => e.evaluator_role === 'academic_supervisor');

  // Per-log academic evals → logbook component (30%)
  const logEvals   = academicEvals.filter(e => e.log != null && e.total_score != null);
  // Final placement-level academic eval → report component (20%)
  const reportEval = academicEvals.find(e => e.log == null && e.visit_number == null);
  // On-site visit evals → other academic component (10%)
  const visitEvals = academicEvals.filter(e => e.visit_number != null && e.total_score != null);

  const workplaceScore = workplaceEval?.total_score != null ? Number(workplaceEval.total_score) : null;

  const logbookScore = logEvals.length > 0
    ? Number((logEvals.reduce((s, e) => s + Number(e.total_score), 0) / logEvals.length).toFixed(1))
    : null;

  const reportScore = reportEval?.total_score != null ? Number(reportEval.total_score) : null;

  const otherAcademicScore = visitEvals.length > 0
    ? Number((visitEvals.reduce((s, e) => s + Number(e.total_score), 0) / visitEvals.length).toFixed(1))
    : null;

  const anyAvailable = workplaceScore != null || logbookScore != null ||
    reportScore != null || otherAcademicScore != null;

  // Running score: null components contribute 0 (partial until all evaluations are in)
  const finalScore = anyAvailable
    ? Number((
        (workplaceScore      ?? 0) * 0.4 +
        (logbookScore        ?? 0) * 0.3 +
        (reportScore         ?? 0) * 0.2 +
        (otherAcademicScore  ?? 0) * 0.1
      ).toFixed(1))
    : null;

  return {
    final_score:          finalScore,
    grade:                gradeFromScore(finalScore),
    workplace_score:      workplaceScore,
    logbook_score:        logbookScore,
    report_score:         reportScore,
    other_academic_score: otherAcademicScore,
  };
}

async function getStudentStats() {
  const [logbooks, evals] = await Promise.all([
    fetchWithAuth(LOGBOOKS),
    fetchWithAuth(EVALUATIONS).catch(() => []),
  ]);
  const submitted = logbooks.filter(l => ['submitted', 'reviewed', 'approved'].includes(l.status));
  const pending = logbooks.filter(l => l.status === 'draft');
  const { final_score: currentScore } = computeScoreComponents(Array.isArray(evals) ? evals : []);
  return {
    data: {
      logs_submitted: submitted.length,
      pending_logs:   pending.length,
      current_score:  currentScore,
    },
  };
}

async function getStudentPlacement() {
  const placements = await fetchWithAuth(PLACEMENTS);
  const active = placements.find(p => p.status === 'ACTIVE') || placements[0] || null;
  return { data: active ? transformPlacement(active) : null };
}

async function getStudentLogbooks() {
  const logbooks = await fetchWithAuth(LOGBOOKS);
  return { data: logbooks };
}

async function getNextDeadline() {
  const logbooks = await fetchWithAuth(LOGBOOKS);
  const drafts = logbooks
    .filter(l => l.status === 'draft' && l.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  if (!drafts.length) return { data: null };
  return { data: { week_number: drafts[0].week_number, due_date: drafts[0].deadline } };
}

async function getStudentScores() {
  const evals = await fetchWithAuth(EVALUATIONS).catch(() => []);
  if (!Array.isArray(evals) || !evals.length) return { data: null };
  return { data: computeScoreComponents(evals) };
}

async function getWorkplaceStats() {
  const [placements, logbooks, evals] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
    fetchWithAuth(EVALUATIONS).catch(() => []),
  ]);
  const evalsArr = Array.isArray(evals) ? evals : [];
  const submittedEvals = evalsArr.filter(e => e.status === 'SUBMITTED');
  const avgScore = submittedEvals.length
    ? Number((submittedEvals.reduce((s, e) => s + Number(e.total_score || 0), 0) / submittedEvals.length).toFixed(1))
    : null;
  return {
    data: {
      assigned_students: placements.length,
      submitted_logs:    logbooks.filter(l => l.status !== 'draft').length,
      evaluated_count:   submittedEvals.length,
      average_score:     avgScore,
    },
  };
}

async function getWorkplacePlacements() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS).catch(() => []),
  ]);

  const logsByPlacement = {};
  for (const l of (Array.isArray(logbooks) ? logbooks : [])) {
    if (!logsByPlacement[l.placement]) logsByPlacement[l.placement] = [];
    logsByPlacement[l.placement].push(l);
  }

  return {
    data: placements.map(p => {
      const logs = logsByPlacement[p.id] || [];
      let status = p.status;
      if (logs.some(l => l.status === 'submitted'))     status = 'submitted';
      else if (logs.some(l => l.status === 'reviewed')) status = 'reviewed';
      else if (logs.some(l => l.status === 'approved')) status = 'approved';
      return {
        id: p.id,
        student_name: capName(p.student_name || String(p.student || '')),
        company: p.company_name || '',
        status,
      };
    }),
  };
}

async function getWorkplacePendingReviews() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
  ]);
  const pm = buildPlacementMap(placements);
  const pending = logbooks
    .filter(l => l.status === 'submitted')
    .map(l => ({
      ...l,
      student_name: capName(pm[l.placement]?.student_name || 'Unknown Student'),
      activities_preview: (l.activities || '').slice(0, 80),
    }));
  return { data: pending };
}

async function getWorkplaceScores() {
  const [evals, criteria] = await Promise.all([
    fetchWithAuth(EVALUATIONS).catch(() => []),
    fetchWithAuth(CRITERIA).catch(() => []),
  ]);
  if (!Array.isArray(evals) || !evals.length || !Array.isArray(criteria) || !criteria.length) {
    return { data: [] };
  }
  const totals = {};
  for (const ev of evals) {
    for (const item of ev.items || []) {
      if (!totals[item.criteria]) totals[item.criteria] = { sum: 0, n: 0 };
      totals[item.criteria].sum += Number(item.score);
      totals[item.criteria].n += 1;
    }
  }
  const criteriaMap = Object.fromEntries(criteria.map(c => [c.id, c.name]));
  return {
    data: Object.entries(totals).map(([id, { sum, n }]) => ({
      criteria: criteriaMap[id] || `Criteria ${id}`,
      score: Math.round(sum / n),
    })),
  };
}

async function getWorkplaceActivity() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
  ]);
  const pm = buildPlacementMap(placements);
  return {
    data: logbooks.slice(0, 10).map(l => ({
      id: l.id,
      student_name: capName(pm[l.placement]?.student_name || 'Unknown Student'),
      activity: `Weekly Log — Week ${l.week_number}`,
      date: l.submitted_at || l.deadline,
      status: l.status,
      deadline: l.deadline,
    })),
  };
}

async function getAcademicStats() {
  const [placements, logbooks, evals] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
    fetchWithAuth(EVALUATIONS).catch(() => []),
  ]);

  const evalsArr    = Array.isArray(evals)    ? evals    : []
  const logbooks_arr = Array.isArray(logbooks) ? logbooks : []

  const submittedLogEvals = evalsArr.filter(e => e.status === 'SUBMITTED' && e.log != null)
  const evaluatedLogIds   = new Set(submittedLogEvals.map(e => e.log))

  const approvedLogs  = logbooks_arr.filter(l => l.status === 'approved')
  const pendingEvals  = approvedLogs.filter(l => !evaluatedLogIds.has(l.id)).length
  const completedEvals = submittedLogEvals.length

  const avgScore = submittedLogEvals.length
    ? submittedLogEvals.reduce((s, e) => s + Number(e.total_score || 0), 0) / submittedLogEvals.length
    : null

  return {
    data: {
      assigned_students:     placements.length,
      pending_reviews:       logbooks_arr.filter(l => l.status === 'submitted').length,
      awaiting_approval:     logbooks_arr.filter(l => l.status === 'reviewed').length,
      pending_evaluations:   pendingEvals,
      completed_evaluations: completedEvals,
      average_score:         avgScore,
    },
  };
}

async function getAcademicPlacements() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS).catch(() => []),
  ]);

  const logsByPlacement = {};
  for (const l of (Array.isArray(logbooks) ? logbooks : [])) {
    if (!logsByPlacement[l.placement]) logsByPlacement[l.placement] = [];
    logsByPlacement[l.placement].push(l);
  }

  return {
    data: placements.map(p => {
      const logs = logsByPlacement[p.id] || [];
      const submittedCount = logs.filter(l => l.status === 'submitted').length;
      const reviewedCount  = logs.filter(l => l.status === 'reviewed').length;
      const approvedCount  = logs.filter(l => l.status === 'approved').length;
      const pendingCount   = submittedCount + reviewedCount;

      let status = p.status;
      if (logs.some(l => l.status === 'submitted'))      status = 'submitted';
      else if (logs.some(l => l.status === 'reviewed'))  status = 'reviewed';
      else if (logs.some(l => l.status === 'approved'))  status = 'approved';

      return {
        id: p.id,
        student_name: capName(p.student_name || String(p.student || '')),
        student_id: String(p.student || ''),
        company: p.company_name || String(p.company || ''),
        status,
        submitted_count: submittedCount,
        reviewed_count:  reviewedCount,
        approved_count:  approvedCount,
        pending_count:   pendingCount,
      };
    }),
  };
}

async function getPendingReviews() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
  ]);
  const pm  = buildPlacementMap(placements);
  const now = Date.now();
  return {
    data: logbooks
      .filter(l => ['submitted', 'reviewed'].includes(l.status))
      .map(l => ({
        ...l,
        student_name: capName(pm[l.placement]?.student_name || 'Unknown Student'),
        days_waiting: l.submitted_at
          ? Math.floor((now - new Date(l.submitted_at)) / 86400000)
          : null,
      }))
      .sort((a, b) => {
        const aOverdue = a.deadline && new Date(a.deadline) < new Date();
        const bOverdue = b.deadline && new Date(b.deadline) < new Date();
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return (b.days_waiting ?? 0) - (a.days_waiting ?? 0);
      }),
  };
}

// Returns per-student submission progress (replaces flat recent-activity list).
// Sorted: students with pending action first, then by last submission date.
async function getRecentActivity() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
  ]);
  const logsByPlacement = {};
  for (const l of (Array.isArray(logbooks) ? logbooks : [])) {
    if (!logsByPlacement[l.placement]) logsByPlacement[l.placement] = [];
    logsByPlacement[l.placement].push(l);
  }
  return {
    data: (Array.isArray(placements) ? placements : []).map(p => {
      const logs         = logsByPlacement[p.id] || [];
      const pendingCount = logs.filter(l => ['submitted', 'reviewed'].includes(l.status)).length;
      const approvedCount = logs.filter(l => l.status === 'approved').length;
      const totalSubmitted = logs.filter(l => l.status !== 'draft').length;
      const lastLog = logs
        .filter(l => l.submitted_at)
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
      return {
        id:              p.id,
        student_name:    capName(p.student_name || String(p.student || '')),
        company:         p.company_name || '',
        total_submitted: totalSubmitted,
        approved_count:  approvedCount,
        pending_count:   pendingCount,
        last_submission: lastLog?.submitted_at || null,
        last_week:       lastLog?.week_number  || null,
        last_status:     lastLog?.status       || null,
      };
    }).sort((a, b) => b.pending_count - a.pending_count),
  };
}

async function getEvaluationScores() {
  const [evals, criteria] = await Promise.all([
    fetchWithAuth(EVALUATIONS).catch(() => []),
    fetchWithAuth(CRITERIA).catch(() => []),
  ]);
  if (!Array.isArray(evals) || !evals.length || !Array.isArray(criteria) || !criteria.length) {
    return { data: [] };
  }
  const totals = {};
  for (const ev of evals) {
    for (const item of ev.items || []) {
      if (!totals[item.criteria]) totals[item.criteria] = { sum: 0, n: 0 };
      totals[item.criteria].sum += Number(item.score);
      totals[item.criteria].n += 1;
    }
  }
  const criteriaMap = Object.fromEntries(criteria.map(c => [c.id, c.name]));
  return {
    data: Object.entries(totals).map(([id, { sum, n }]) => ({
      criteria: criteriaMap[id] || `Criteria ${id}`,
      score: Math.round(sum / n),
    })),
  };
}

async function getAdminStats() {
  const [placements, users, logbooks, evals] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(USERS),
    fetchWithAuth(LOGBOOKS),
    fetchWithAuth(EVALUATIONS).catch(() => []),
  ]);
  const completedEvals = Array.isArray(evals) ? evals.filter(e => e.status === 'SUBMITTED') : [];
  const avgScore = completedEvals.length
    ? completedEvals.reduce((s, e) => s + Number(e.total_score || 0), 0) / completedEvals.length
    : 0;
  return {
    data: {
      total_students: users.filter(u => u.role === 'student').length,
      total_supervisors: users.filter(u =>
        ['workplace_supervisor', 'academic_supervisor'].includes(u.role)
      ).length,
      average_score: avgScore,
      active_placements: placements.filter(p => p.status === 'ACTIVE').length,
      pending_placements: placements.filter(p => p.status === 'PENDING').length,
      unassigned_students: placements.filter(
        p => !p.workplace_supervisor || !p.academic_supervisor
      ).length,
      evaluations_complete: completedEvals.length,
      logs_overdue: logbooks.filter(
        l => l.status === 'draft' && l.deadline && new Date(l.deadline) < new Date()
      ).length,
    },
  };
}

async function getAdminPlacements() {
  const placements = await fetchWithAuth(PLACEMENTS);
  return {
    data: placements.map(p => ({
      id: p.id,
      student_name: capName(p.student_name || String(p.student || '')),
      student_id: String(p.student || ''),
      company: p.company_name || String(p.company || ''),
      academic_supervisor: p.academic_supervisor_name || '',
      workplace_supervisor: p.workplace_supervisor_name || '',
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
      _academic_supervisor_id: p.academic_supervisor,
      _workplace_supervisor_id: p.workplace_supervisor,
    })),
  };
}

async function getAdminUsers() {
  const users = await fetchWithAuth(USERS);
  return {
    data: users.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      email: u.email,
      role: u.role,
      joined: u.date_joined || '',
    })),
  };
}

async function getAdminEvaluations() {
  const [evals, placements] = await Promise.all([
    fetchWithAuth(EVALUATIONS).catch(() => []),
    fetchWithAuth(PLACEMENTS),
  ]);
  const pm = buildPlacementMap(placements);

  const byPlacement = {};
  for (const e of (Array.isArray(evals) ? evals : [])) {
    if (!byPlacement[e.placement]) byPlacement[e.placement] = { academic: null, workplace: null };
    // Academic: use the placement-level report eval only (not per-log or per-visit evals)
    if (e.evaluator_role === 'academic_supervisor' && e.log == null && e.visit_number == null)
      byPlacement[e.placement].academic = e;
    else if (e.evaluator_role === 'workplace_supervisor')
      byPlacement[e.placement].workplace = e;
  }

  const gradeFromScore = (s) => {
    if (s == null) return null;
    if (s >= 80) return 'A';
    if (s >= 70) return 'B';
    if (s >= 60) return 'C';
    if (s >= 50) return 'D';
    return 'F';
  };

  return {
    data: Object.entries(byPlacement).map(([placementId, { academic, workplace }]) => {
      const wScore      = workplace?.total_score != null ? Number(workplace.total_score) : null;
      const acItems     = academic?.items || [];
      const logbookItem = acItems.find(i => i.criteria_name?.toLowerCase().includes('logbook'));
      const reportItem  = acItems.find(i => i.criteria_name?.toLowerCase().includes('report'));
      const otherItems  = acItems.filter(i =>
        !i.criteria_name?.toLowerCase().includes('logbook') &&
        !i.criteria_name?.toLowerCase().includes('report')
      );
      const logbookScore = logbookItem ? Number(logbookItem.score) : null;
      const reportScore  = reportItem  ? Number(reportItem.score)  : null;
      const otherScore   = otherItems.length > 0
        ? Number((otherItems.reduce((s, i) => s + Number(i.score), 0) / otherItems.length).toFixed(1))
        : null;
      const aTotal = academic?.total_score != null ? Number(academic.total_score) : null;

      let finalScore = null;
      if (wScore != null && logbookScore != null && reportScore != null && otherScore != null)
        finalScore = Number(((wScore * 0.4) + (logbookScore * 0.3) + (reportScore * 0.2) + (otherScore * 0.1)).toFixed(1));
      else if (wScore != null && aTotal != null)
        finalScore = Number(((wScore * 0.4) + (aTotal * 0.6)).toFixed(1));
      else if (aTotal != null)  finalScore = aTotal;
      else if (wScore != null)  finalScore = wScore;

      const status = (academic?.status === 'SUBMITTED' || workplace?.status === 'SUBMITTED')
        ? 'SUBMITTED' : 'PENDING';

      return {
        id: Number(placementId),
        placement: Number(placementId),
        student_name: capName(pm[placementId]?.student_name || `Placement #${placementId}`),
        company:      pm[placementId]?.company_name || '—',
        workplace_score:      wScore,
        logbook_score:        logbookScore,
        report_score:         reportScore,
        other_academic_score: otherScore,
        academic_total:       aTotal,
        final_score:     finalScore,
        total_score:     finalScore,
        grade:           gradeFromScore(finalScore),
        status,
        items: [...(academic?.items || []), ...(workplace?.items || [])],
      };
    }),
  };
}

async function reviewLog(logId, comment) {
  return fetchWithAuth(`${LOGBOOKS}${logId}/review/`, {
    method: 'POST',
    body: JSON.stringify({ supervisor_comment: comment }),
  });
}

async function approveLog(logId) {
  return fetchWithAuth(`${LOGBOOKS}${logId}/approve/`, { method: 'POST' });
}

async function rejectLog(logId, comment) {
  return fetchWithAuth(`${LOGBOOKS}${logId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ supervisor_comment: comment }),
  });
}

async function markPlacementCompleted(placementId) {
  return fetchWithAuth(`${BASE}/placements/${placementId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
}

async function registerStudent(userData) {
  const response = await fetch(`${BASE}/accounts/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, role: 'student' }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || Object.values(err)?.[0]?.[0] || 'Registration failed');
  }
  return response.json();
}

async function createPlacement(data) {
  return fetchWithAuth(PLACEMENTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function updatePlacementSupervisors(placementId, data) {
  return fetchWithAuth(`${BASE}/placements/${placementId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function getStudentsList() {
  return fetchWithAuth(`${USERS}?role=student`);
}

async function getSupervisorsList(type) {
  return fetchWithAuth(`${USERS}?role=${type}`);
}

async function getCompaniesList() {
  return fetchWithAuth(`${BASE}/placements/companies/`).catch(() => []);
}

const dashboardService = {
  getStudentStats,
  getStudentPlacement,
  getStudentLogbooks,
  getNextDeadline,
  getStudentScores,

  getWorkplaceStats,
  getWorkplacePlacements,
  getWorkplacePendingReviews,
  getWorkplaceScores,
  getWorkplaceActivity,

  getAcademicStats,
  getAcademicPlacements,
  getPendingReviews,
  getRecentActivity,
  getEvaluationScores,

  getAdminStats,
  getAdminPlacements,
  getAdminUsers,
  getAdminEvaluations,

  reviewLog,
  approveLog,
  rejectLog,
  markPlacementCompleted,
  registerStudent,
  createPlacement,
  updatePlacementSupervisors,
  getStudentsList,
  getSupervisorsList,
  getCompaniesList,
};

export default dashboardService;

