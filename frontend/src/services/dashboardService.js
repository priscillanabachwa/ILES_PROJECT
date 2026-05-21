import { fetchWithAuth } from './authService';

const BASE = '/api';
const PLACEMENTS = `${BASE}/placements/`;
const LOGBOOKS = `${BASE}/weeklylogs/logbooks/`;
const EVALUATIONS = `${BASE}/evaluations/evaluations/`;
const CRITERIA = `${BASE}/evaluations/criteria/`;
const USERS = `${BASE}/accounts/users/`;

// ????????? helpers ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

/** Capitalise every word in a name string */
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

// ????????? student dashboard ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

async function getStudentStats() {
  const [logbooks, evals] = await Promise.all([
    fetchWithAuth(LOGBOOKS),
    fetchWithAuth(EVALUATIONS).catch(() => []),
  ]);
  const submitted = logbooks.filter(l => ['submitted', 'reviewed', 'approved'].includes(l.status));
  const pending = logbooks.filter(l => ['draft', 'submitted'].includes(l.status));
  const withFeedback = logbooks.filter(l => l.supervisor_comment && l.status !== 'draft');
  const evalsArr = Array.isArray(evals) ? evals : [];
  const academicEval  = evalsArr.find(e => e.evaluator_role === 'academic_supervisor');
  const workplaceEval = evalsArr.find(e => e.evaluator_role === 'workplace_supervisor');
  const aScore = academicEval?.total_score  != null ? Number(academicEval.total_score)  : null;
  const wScore = workplaceEval?.total_score != null ? Number(workplaceEval.total_score) : null;
  const currentScore = aScore != null && wScore != null
    ? Number(((aScore * 0.6) + (wScore * 0.4)).toFixed(1))
    : aScore ?? wScore ?? null;
  return {
    data: {
      logs_submitted: submitted.length,
      pending_logs: pending.length,
      unread_feedback: withFeedback.length,
      current_score: currentScore,
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
  const [evals, logbooks] = await Promise.all([
    fetchWithAuth(EVALUATIONS).catch(() => []),
    fetchWithAuth(LOGBOOKS),
  ]);
  if (!Array.isArray(evals) || !evals.length) return { data: null };

  const academicEval   = evals.find(e => e.evaluator_role === 'academic_supervisor')
  const workplaceEval  = evals.find(e => e.evaluator_role === 'workplace_supervisor')

  const academicScore  = academicEval?.total_score  != null ? Number(academicEval.total_score)  : null
  const workplaceScore = workplaceEval?.total_score != null ? Number(workplaceEval.total_score) : null

  // Logbook score: find the logbook criterion score inside the academic evaluation
  const logbookItem    = academicEval?.items?.find(i =>
    i.criteria_name?.toLowerCase().includes('logbook')
  )
  const logbookScore   = logbookItem ? Number(logbookItem.score) : null

  // Final score: 40% workplace + 60% academic (if both exist, otherwise show whichever is available)
  let finalScore = null
  if (academicScore != null && workplaceScore != null) {
    finalScore = (academicScore * 0.6) + (workplaceScore * 0.4)
  } else if (academicScore != null) {
    finalScore = academicScore
  } else if (workplaceScore != null) {
    finalScore = workplaceScore
  }

  // Grade from final score
  const gradeFromScore = (s) => {
    if (s == null) return null
    if (s >= 80) return 'A'
    if (s >= 70) return 'B'
    if (s >= 60) return 'C'
    if (s >= 50) return 'D'
    return 'F'
  }

  const feedback = logbooks
    .filter(l => l.supervisor_comment)
    .slice(0, 3)
    .map(l => ({
      from: 'Supervisor',
      date: l.submitted_at || l.deadline,
      comment: l.supervisor_comment,
    }));

  return {
    data: {
      final_score:     finalScore != null ? Number(finalScore.toFixed(1)) : null,
      grade:           gradeFromScore(finalScore),
      academic_score:  academicScore,
      workplace_score: workplaceScore,
      logbook_score:   logbookScore,
      recent_feedback: feedback,
    },
  };
}

// ????????? workplace supervisor dashboard ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

async function getWorkplaceStats() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
  ]);
  return {
    data: {
      assigned_students: placements.filter(p => p.status === 'ACTIVE').length,
      pending_reviews: logbooks.filter(l => l.status === 'submitted').length,
      workplace_reviewed: logbooks.filter(l => l.status === 'workplace_reviewed').length,
      approved_logs: logbooks.filter(l => l.status === 'approved').length,
      average_score: null,
    },
  };
}

async function getWorkplacePlacements() {
  const placements = await fetchWithAuth(PLACEMENTS);
  return {
    data: placements.map(p => ({
      id: p.id,
      student_name: capName(p.student_name || String(p.student || '')),
      student_id: String(p.student || ''),
      department: '',
      status: p.status,
    })),
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

// ????????? academic supervisor dashboard ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

async function getAcademicStats() {
  const [placements, logbooks, evals] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
    fetchWithAuth(EVALUATIONS).catch(() => []),
  ]);
  const completedEvals = Array.isArray(evals)
    ? evals.filter(e => e.status === 'SUBMITTED')
    : [];
  const avgScore = completedEvals.length
    ? completedEvals.reduce((s, e) => s + Number(e.total_score || 0), 0) / completedEvals.length
    : null;
  return {
    data: {
      assigned_students: placements.length,
      pending_reviews: logbooks.filter(l => l.status === 'workplace_reviewed').length,
      awaiting_approval: logbooks.filter(l => l.status === 'reviewed').length,
      completed_evaluations: completedEvals.length,
      average_score: avgScore,
    },
  };
}

async function getAcademicPlacements() {
  const placements = await fetchWithAuth(PLACEMENTS);
  return {
    data: placements.map(p => ({
      id: p.id,
      student_name: capName(p.student_name || String(p.student || '')),
      student_id: String(p.student || ''),
      company: p.company_name || String(p.company || ''),
      status: p.status,
    })),
  };
}

async function getPendingReviews() {
  const [placements, logbooks] = await Promise.all([
    fetchWithAuth(PLACEMENTS),
    fetchWithAuth(LOGBOOKS),
  ]);
  const pm = buildPlacementMap(placements);
  return {
    data: logbooks
      .filter(l => ['workplace_reviewed', 'reviewed'].includes(l.status))
      .map(l => ({
        ...l,
        student_name: capName(pm[l.placement]?.student_name || 'Unknown Student'),
      })),
  };
}

async function getRecentActivity() {
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
    })),
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

// ????????? admin dashboard ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

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

  // Group by placement → one row per student
  const byPlacement = {};
  for (const e of (Array.isArray(evals) ? evals : [])) {
    if (!byPlacement[e.placement]) byPlacement[e.placement] = { academic: null, workplace: null };
    if (e.evaluator_role === 'academic_supervisor')  byPlacement[e.placement].academic  = e;
    else if (e.evaluator_role === 'workplace_supervisor') byPlacement[e.placement].workplace = e;
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
      const aScore = academic?.total_score  != null ? Number(academic.total_score)  : null;
      const wScore = workplace?.total_score != null ? Number(workplace.total_score) : null;

      // Logbook score = the logbook criteria item inside the academic eval
      const logbookItem  = academic?.items?.find(i => i.criteria_name?.toLowerCase().includes('logbook'));
      const logbookScore = logbookItem ? Number(logbookItem.score) : null;

      let finalScore = null;
      if (aScore != null && wScore != null)      finalScore = Number(((aScore * 0.6) + (wScore * 0.4)).toFixed(1));
      else if (aScore != null)                   finalScore = aScore;
      else if (wScore != null)                   finalScore = wScore;

      const status = (academic?.status === 'SUBMITTED' || workplace?.status === 'SUBMITTED')
        ? 'SUBMITTED' : 'PENDING';

      return {
        id: Number(placementId),
        placement: Number(placementId),
        student_name: capName(pm[placementId]?.student_name || `Placement #${placementId}`),
        company:      pm[placementId]?.company_name || '—',
        academic_score:  aScore,
        workplace_score: wScore,
        logbook_score:   logbookScore,
        final_score:     finalScore,
        total_score:     finalScore,
        grade:           gradeFromScore(finalScore),
        status,
        items: [...(academic?.items || []), ...(workplace?.items || [])],
      };
    }),
  };
}

// ????????? action methods ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

async function reviewLog(logId, comment) {
  return fetchWithAuth(`${LOGBOOKS}${logId}/review/`, {
    method: 'POST',
    body: JSON.stringify({ supervisor_comment: comment }),
  });
}

async function reviewLogWorkplace(logId, comment) {
  return fetchWithAuth(`${LOGBOOKS}${logId}/review/`, {
    method: 'POST',
    body: JSON.stringify({ workplace_comment: comment }),
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

// ????????? export ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

const dashboardService = {
  // Student
  getStudentStats,
  getStudentPlacement,
  getStudentLogbooks,
  getNextDeadline,
  getStudentScores,

  // Workplace supervisor
  getWorkplaceStats,
  getWorkplacePlacements,
  getWorkplacePendingReviews,
  getWorkplaceScores,
  getWorkplaceActivity,

  // Academic supervisor
  getAcademicStats,
  getAcademicPlacements,
  getPendingReviews,
  getRecentActivity,
  getEvaluationScores,

  // Admin
  getAdminStats,
  getAdminPlacements,
  getAdminUsers,
  getAdminEvaluations,

  // Actions
  reviewLog,
  reviewLogWorkplace,
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

