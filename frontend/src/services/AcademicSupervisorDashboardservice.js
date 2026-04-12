import api from './api'

export const AcademicSupervisorDashboardService = {
    
    getSStats: async (semester) => {
        try {
            return await api.get(`/dashboard/AcademicSupervisor/stats/?semester=${semester}`)
        } catch (error) {
            console.error("Error fetching stats:", error)
            throw error
        }
    },

    getPlacements: async (semester) => {
        try {
            return await api.get(`/dashboard/AcademicSupervisor/placements/?semester=${semester}`)
        } catch (error) {
            console.error("Error fetching placements:", error)
            throw error
        }
    },

    getPendingReviews: async (semester) => {
        try {
            return await api.get(`/dashboard/AcademicSupervisor/pending-reviews/?semester=${semester}`)
        } catch (error) {
            console.error("Error fetching pending reviews:", error)
            throw error
        }
    },

    getRecentActivity: async () => {
        try {
            return await api.get(`/dashboard/AcademicSupervisor/activity/`)
        } catch (error) {
            console.error("Error fetching activity:", error)
            throw error
        }
    },

    getScores: async () => {
        try {
            return await api.get(`/dashboard/AcademicSupervisor/scores/`)
        } catch (error) {
            console.error("Error fetching scores:", error)
            throw error
        }
    },
}