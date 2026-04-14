import api from './api'

const dashboardService = {
  getAcademicStats: async (semester) => {
    try {
      const response = await api.get('/dashboard/Academic/stats', {
        params: { semester },
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching Academic stats:', error)
      throw error
    }
  },

  getAcademicPlacements: async (semester) => {
    try {
      const response = await api.get('/dashboard/Academic/placements', {
        params: { semester },
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching Academic placements:', error)
      throw error
    }
  },

  getPendingReviews: async (semester) => {
    try {
      const response = await api.get('/dashboard/Academic/pending-reviews', {
        params: { semester },
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
      throw error
    }
  },

  getRecentActivity: async () => {
    try {
      const response = await api.get('/dashboard/Academic/activity', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
  },

  getEvaluationScores: async () => {
    try {
      const response = await api.get('/dashboard/Academic/evaluation-scores', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching evaluation scores:', error)
      throw error
    }
  },

  getStudentStats: async () => {
    try {
      const response = await api.get('/dashboard/student/stats', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching student stats:', error)
      throw error
    }
  },

  getStudentPlacement: async () => {
    try {
      const response = await api.get('/dashboard/student/placement', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching student placement:', error)
      throw error
    }
  },

  getStudentLogbooks: async () => {
    try {
      const response = await api.get('/dashboard/student/logbooks', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching student logbooks:', error)
      throw error
    }
  },

  getNextDeadline: async () => {
    try {
      const response = await api.get('/dashboard/student/next-deadline', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching next deadline:', error)
      throw error
    }
  },

  getStudentScores: async () => {
    try {
      const response = await api.get('/dashboard/student/scores', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Error fetching student scores:', error)
      throw error
    }
  },
}

export default dashboardService