import { fetchWithAuth } from './authService';

const API_BASE_URL = 'http://localhost:8000/api';

// ==================== UTILITY FUNCTIONS ====================
/**
 * Calculate statistics from data arrays
 */
const calculateStats = (data, statusField = 'status') => {
  const stats = {};
  data.forEach(item => {
    const status = item[statusField];
    stats[status] = (stats[status] || 0) + 1;
  });
  return stats;
};

// ==================== PLACEMENTS ====================

/**
 * Get all placements (admin/supervisor view)
 */
export const getAllPlacements = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.student) queryParams.append('student', filters.student);
  if (filters.company) queryParams.append('company', filters.company);
  if (filters.search) queryParams.append('search', filters.search);

  const url = `${API_BASE_URL}/placements/?${queryParams.toString()}`;
  return fetchWithAuth(url);
};

/**
 * Get placements for a specific student
 */
export const getStudentPlacements = async (studentId) => {
  return fetchWithAuth(`${API_BASE_URL}/placements/?student=${studentId}`);
};

/**
 * Get active placement for current student
 */
export const getActivePlacement = async () => {
  return fetchWithAuth(`${API_BASE_URL}/placements/?status=ACTIVE`);
};

/**
 * Get placements supervised by a supervisor
 */
export const getSupervisedPlacements = async (supervisorId, supervisorType = 'academic') => {
  const field = supervisorType === 'academic' ? 'academic_supervisor' : 'workplace_supervisor';
  return fetchWithAuth(`${API_BASE_URL}/placements/?${field}=${supervisorId}`);
};

/**
 * Get placement details by ID
 */
export const getPlacementDetails = async (placementId) => {
  return fetchWithAuth(`${API_BASE_URL}/placements/${placementId}/`);
};

/**
 * Create a new placement (admin only)
 */
export const createPlacement = async (placementData) => {
  return fetchWithAuth(`${API_BASE_URL}/placements/`, {
    method: 'POST',
    body: JSON.stringify(placementData),
  });
};

/**
 * Update placement
 */
export const updatePlacement = async (placementId, placementData) => {
  return fetchWithAuth(`${API_BASE_URL}/placements/${placementId}/`, {
    method: 'PUT',
    body: JSON.stringify(placementData),
  });
};

/**
 * Delete placement (admin only)
 */
export const deletePlacement = async (placementId) => {
  return fetchWithAuth(`${API_BASE_URL}/placements/${placementId}/`, {
    method: 'DELETE',
  });
};

// ==================== WEEKLY LOGS ====================

/**
 * Get all weekly logs for a placement
 */
export const getWeeklyLogs = async (placementId, filters = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append('placement', placementId);
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.week_number) queryParams.append('week_number', filters.week_number);

  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/?${queryParams.toString()}`);
};

/**
 * Get weekly log details by ID
 */
export const getWeeklyLogDetails = async (logId) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/${logId}/`);
};

/**
 * Create a new weekly log
 */
export const createWeeklyLog = async (logData) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/`, {
    method: 'POST',
    body: JSON.stringify(logData),
  });
};

/**
 * Update weekly log
 */
export const updateWeeklyLog = async (logId, logData) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/${logId}/`, {
    method: 'PUT',
    body: JSON.stringify(logData),
  });
};

/**
 * Partially update weekly log (PATCH)
 */
export const patchWeeklyLog = async (logId, logData) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/${logId}/`, {
    method: 'PATCH',
    body: JSON.stringify(logData),
  });
};

/**
 * Submit weekly log for review
 */
export const submitWeeklyLog = async (logId) => {
  return patchWeeklyLog(logId, { status: 'submitted' });
};

/**
 * Approve weekly log (supervisor action)
 */
export const approveWeeklyLog = async (logId, comment = '') => {
  return patchWeeklyLog(logId, { 
    status: 'approved',
    supervisor_comment: comment,
  });
};

/**
 * Review weekly log (supervisor action)
 */
export const reviewWeeklyLog = async (logId, comment = '') => {
  return patchWeeklyLog(logId, { 
    status: 'reviewed',
    supervisor_comment: comment,
  });
};

/**
 * Delete weekly log
 */
export const deleteWeeklyLog = async (logId) => {
  return fetchWithAuth(`${API_BASE_URL}/weeklylogs/weekly-logs/${logId}/`, {
    method: 'DELETE',
  });
};

// ==================== EVALUATIONS ====================

/**
 * Get all evaluations with optional filters
 */
export const getAllEvaluations = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.placement) queryParams.append('placement', filters.placement);
  if (filters.evaluator) queryParams.append('evaluator', filters.evaluator);
  if (filters.status) queryParams.append('status', filters.status);

  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/?${queryParams.toString()}`);
};

/**
 * Get evaluations for a specific placement
 */
export const getPlacementEvaluations = async (placementId) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/?placement=${placementId}`);
};

/**
 * Get evaluations by evaluator
 */
export const getEvaluationsByEvaluator = async (evaluatorId) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/?evaluator=${evaluatorId}`);
};

/**
 * Get evaluation details by ID
 */
export const getEvaluationDetails = async (evaluationId) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/${evaluationId}/`);
};

/**
 * Create a new evaluation
 */
export const createEvaluation = async (evaluationData) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/`, {
    method: 'POST',
    body: JSON.stringify(evaluationData),
  });
};

/**
 * Update evaluation
 */
export const updateEvaluation = async (evaluationId, evaluationData) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/${evaluationId}/`, {
    method: 'PUT',
    body: JSON.stringify(evaluationData),
  });
};

/**
 * Partially update evaluation (PATCH)
 */
export const patchEvaluation = async (evaluationId, evaluationData) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/${evaluationId}/`, {
    method: 'PATCH',
    body: JSON.stringify(evaluationData),
  });
};

/**
 * Submit evaluation
 */
export const submitEvaluation = async (evaluationId) => {
  return patchEvaluation(evaluationId, { status: 'SUBMITTED' });
};

/**
 * Delete evaluation
 */
export const deleteEvaluation = async (evaluationId) => {
  return fetchWithAuth(`${API_BASE_URL}/evaluations/scores/${evaluationId}/`, {
    method: 'DELETE',
  });
};

// ==================== STUDENT DASHBOARD ====================

/**
 * Get comprehensive student dashboard data
 */
export const getStudentDashboardData = async (studentId) => {
  try {
    const [placements, evaluations] = await Promise.all([
      getStudentPlacements(studentId),
      getAllEvaluations({ status: 'SUBMITTED' }),
    ]);

    let activeLogStats = {};
    let allLogs = [];

    // Get logs for active placement
    if (placements.length > 0) {
      const activePlacement = placements.find(p => p.status === 'ACTIVE') || placements[0];
      if (activePlacement) {
        allLogs = await getWeeklyLogs(activePlacement.id);
        activeLogStats = calculateStats(allLogs, 'status');
      }
    }

    return {
      placements,
      activePlacement: placements.find(p => p.status === 'ACTIVE') || null,
      totalPlacements: placements.length,
      weeklylogs: allLogs,
      logStats: activeLogStats,
      evaluations: evaluations.filter(e => e.placement?.student?.id === studentId),
      stats: {
        totalPlacements: placements.length,
        activePlacements: placements.filter(p => p.status === 'ACTIVE').length,
        completedPlacements: placements.filter(p => p.status === 'COMPLETED').length,
        draftLogs: allLogs.filter(l => l.status === 'draft').length,
        submittedLogs: allLogs.filter(l => l.status === 'submitted').length,
        reviewedLogs: allLogs.filter(l => l.status === 'reviewed').length,
        approvedLogs: allLogs.filter(l => l.status === 'approved').length,
      },
    };
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    throw error;
  }
};

// ==================== ACADEMIC SUPERVISOR DASHBOARD ====================

/**
 * Get comprehensive academic supervisor dashboard data
 */
export const getAcademicSupervisorDashboardData = async (supervisorId) => {
  try {
    const [placements, evaluations] = await Promise.all([
      getSupervisedPlacements(supervisorId, 'academic'),
      getEvaluationsByEvaluator(supervisorId),
    ]);

    // Aggregate data from all placements
    let allLogs = [];
    for (const placement of placements) {
      const logs = await getWeeklyLogs(placement.id);
      allLogs = allLogs.concat(logs);
    }

    const pendingReview = allLogs.filter(l => l.status === 'submitted');
    const reviewedLogs = allLogs.filter(l => l.status === 'reviewed');

    return {
      placements,
      supervisedStudents: placements.map(p => p.student),
      totalStudents: placements.length,
      weeklylogs: allLogs,
      evaluations,
      pendingReviewLogs: pendingReview,
      reviewedLogs,
      stats: {
        totalStudents: placements.length,
        activePlacements: placements.filter(p => p.status === 'ACTIVE').length,
        pendingReviewCount: pendingReview.length,
        reviewedCount: reviewedLogs.length,
        totalEvaluations: evaluations.length,
        submittedEvaluations: evaluations.filter(e => e.status === 'SUBMITTED').length,
        draftEvaluations: evaluations.filter(e => e.status === 'DRAFT').length,
      },
    };
  } catch (error) {
    console.error('Error fetching academic supervisor dashboard data:', error);
    throw error;
  }
};

// ==================== WORKPLACE SUPERVISOR DASHBOARD ====================

/**
 * Get comprehensive workplace supervisor dashboard data
 */
export const getWorkplaceSupervisorDashboardData = async (supervisorId) => {
  try {
    const placements = await getSupervisedPlacements(supervisorId, 'workplace');

    // Aggregate data from all placements
    let allLogs = [];
    for (const placement of placements) {
      const logs = await getWeeklyLogs(placement.id);
      allLogs = allLogs.concat(logs);
    }

    const submittedLogs = allLogs.filter(l => l.status === 'submitted');
    const approvedLogs = allLogs.filter(l => l.status === 'approved');

    return {
      placements,
      students: placements.map(p => p.student),
      totalStudents: placements.length,
      weeklylogs: allLogs,
      submittedLogs,
      approvedLogs,
      stats: {
        totalStudents: placements.length,
        activePlacements: placements.filter(p => p.status === 'ACTIVE').length,
        submittedLogsCount: submittedLogs.length,
        approvedLogsCount: approvedLogs.length,
        pendingApprovalCount: submittedLogs.length,
        totalLogsReviewed: approvedLogs.length,
      },
    };
  } catch (error) {
    console.error('Error fetching workplace supervisor dashboard data:', error);
    throw error;
  }
};

// ==================== INTERNSHIP ADMINISTRATOR DASHBOARD ====================

/**
 * Get comprehensive admin dashboard data
 */
export const getAdminDashboardData = async () => {
  try {
    const [placements, allEvaluations] = await Promise.all([
      getAllPlacements(),
      getAllEvaluations(),
    ]);

    // Aggregate weekly logs from all placements
    let allLogs = [];
    for (const placement of placements) {
      const logs = await getWeeklyLogs(placement.id);
      allLogs = allLogs.concat(logs);
    }

    const placementStats = calculateStats(placements, 'status');
    const logStats = calculateStats(allLogs, 'status');
    const evaluationStats = calculateStats(allEvaluations, 'status');

    return {
      placements,
      weeklylogs: allLogs,
      evaluations: allEvaluations,
      stats: {
        // Placement Statistics
        totalPlacements: placements.length,
        activePlacements: placements.filter(p => p.status === 'ACTIVE').length,
        completedPlacements: placements.filter(p => p.status === 'COMPLETED').length,
        pendingPlacements: placements.filter(p => p.status === 'PENDING').length,
        cancelledPlacements: placements.filter(p => p.status === 'CANCELLED').length,

        // Weekly Log Statistics
        totalWeeklyLogs: allLogs.length,
        draftLogs: allLogs.filter(l => l.status === 'draft').length,
        submittedLogs: allLogs.filter(l => l.status === 'submitted').length,
        reviewedLogs: allLogs.filter(l => l.status === 'reviewed').length,
        approvedLogs: allLogs.filter(l => l.status === 'approved').length,

        // Evaluation Statistics
        totalEvaluations: allEvaluations.length,
        submittedEvaluations: allEvaluations.filter(e => e.status === 'SUBMITTED').length,
        draftEvaluations: allEvaluations.filter(e => e.status === 'DRAFT').length,

        // Detailed stats object
        placementStats,
        logStats,
        evaluationStats,
      },
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
};

// ==================== USER MANAGEMENT ====================

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.role) queryParams.append('role', filters.role);
  if (filters.search) queryParams.append('search', filters.search);

  return fetchWithAuth(`${API_BASE_URL}/accounts/users/?${queryParams.toString()}`);
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role) => {
  return getAllUsers({ role });
};

/**
 * Get all students
 */
export const getAllStudents = async () => {
  return getUsersByRole('student');
};

/**
 * Get all academic supervisors
 */
export const getAllAcademicSupervisors = async () => {
  return getUsersByRole('academic_supervisor');
};

/**
 * Get all workplace supervisors
 */
export const getAllWorkplaceSupervisors = async () => {
  return getUsersByRole('workplace_supervisor');
};

/**
 * Get all admins
 */
export const getAllAdmins = async () => {
  return getUsersByRole('admin');
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  return fetchWithAuth(`${API_BASE_URL}/accounts/users/${userId}/`);
};

// ==================== DASHBOARD STATISTICS ====================

/**
 * Get overall system statistics (admin only)
 */
export const getSystemStatistics = async () => {
  try {
    const [
      placements,
      students,
      academicSupervisors,
      workplaceSupervisors,
      logs,
      evaluations,
    ] = await Promise.all([
      getAllPlacements(),
      getAllStudents(),
      getAllAcademicSupervisors(),
      getAllWorkplaceSupervisors(),
      (async () => {
        const allPlacements = await getAllPlacements();
        let allLogs = [];
        for (const placement of allPlacements) {
          const logs = await getWeeklyLogs(placement.id);
          allLogs = allLogs.concat(logs);
        }
        return allLogs;
      })(),
      getAllEvaluations(),
    ]);

    return {
      users: {
        totalStudents: students.length,
        totalAcademicSupervisors: academicSupervisors.length,
        totalWorkplaceSupervisors: workplaceSupervisors.length,
      },
      placements: {
        total: placements.length,
        active: placements.filter(p => p.status === 'ACTIVE').length,
        completed: placements.filter(p => p.status === 'COMPLETED').length,
        pending: placements.filter(p => p.status === 'PENDING').length,
        cancelled: placements.filter(p => p.status === 'CANCELLED').length,
      },
      logs: {
        total: logs.length,
        draft: logs.filter(l => l.status === 'draft').length,
        submitted: logs.filter(l => l.status === 'submitted').length,
        reviewed: logs.filter(l => l.status === 'reviewed').length,
        approved: logs.filter(l => l.status === 'approved').length,
      },
      evaluations: {
        total: evaluations.length,
        submitted: evaluations.filter(e => e.status === 'SUBMITTED').length,
        draft: evaluations.filter(e => e.status === 'DRAFT').length,
      },
    };
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    throw error;
  }
};

// ==================== EXPORT DEFAULT ====================
export default {
  // Placements
  getAllPlacements,
  getStudentPlacements,
  getActivePlacement,
  getSupervisedPlacements,
  getPlacementDetails,
  createPlacement,
  updatePlacement,
  deletePlacement,

  // Weekly Logs
  getWeeklyLogs,
  getWeeklyLogDetails,
  createWeeklyLog,
  updateWeeklyLog,
  patchWeeklyLog,
  submitWeeklyLog,
  approveWeeklyLog,
  reviewWeeklyLog,
  deleteWeeklyLog,

  // Evaluations
  getAllEvaluations,
  getPlacementEvaluations,
  getEvaluationsByEvaluator,
  getEvaluationDetails,
  createEvaluation,
  updateEvaluation,
  patchEvaluation,
  submitEvaluation,
  deleteEvaluation,

  // Dashboard Data
  getStudentDashboardData,
  getAcademicSupervisorDashboardData,
  getWorkplaceSupervisorDashboardData,
  getAdminDashboardData,

  // Users
  getAllUsers,
  getUsersByRole,
  getAllStudents,
  getAllAcademicSupervisors,
  getAllWorkplaceSupervisors,
  getAllAdmins,
  getUserProfile,

  // Statistics
  getSystemStatistics,
};
