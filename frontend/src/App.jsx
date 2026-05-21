import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import AppLayout from './components/layout/AppLayout'
import AcademicSupervisorDashboard from './pages/dashboards/AcademicSupervisorDashboard.jsx'
import StudentDashboard from './pages/dashboards/StudentDashboard.jsx'
import WorkplaceSupervisorDashboard from './pages/dashboards/WorkplaceSupervisorDashboard.jsx'
import InternshipAdministratorDashboard from './pages/dashboards/InternshipAdministratorDashboard.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

import Login from './pages/login.jsx'
import Register from './pages/Register.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AdminUsersPage from './pages/AdminUsersPage.jsx'

import MyLogsPage from './pages/MyLogsPage'
import AdminLogsPage from './pages/AdminLogsPage.jsx'
import AdminEvaluationsPage from './pages/AdminEvaluationsPage.jsx'
import AcademicLogsPage from './pages/AcademicLogsPage.jsx'
import AcademicEvaluationsPage from './pages/AcademicEvaluationsPage.jsx'
import WorkplaceReviewsPage from './pages/WorkplaceReviewsPage.jsx'
import WorkplaceScoresPage from './pages/WorkplaceScoresPage.jsx'
import WorkplaceLogsPage from './pages/WorkplaceLogsPage.jsx'
import StudentEvaluationPage from './pages/StudentEvaluationPage.jsx'
import StudentFeedbackPage from './pages/StudentFeedbackPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import { AuthProvider, useAuth } from './Context/AuthContext.jsx'

const ProtectedRoute = ({children, allowedRoles}) => {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <p>Loading ILES...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-slate-400 mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// 404 Not Found Component
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-6">
        <h1 className="text-6xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-slate-400 mb-8">The page you are looking for does not exist.</p>
        <a href="/login" className="text-indigo-400 underline hover:text-indigo-300 text-lg">Return to Login</a>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Default route - redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Login Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} /> 

            {/* Academic Supervisor Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['academic_supervisor']}>
                <AppLayout />
              </ProtectedRoute> 
            }>
              <Route path="/academic/dashboard" element={<AcademicSupervisorDashboard />} />
              <Route path="/academic/logs" element={<AcademicLogsPage />} />
              <Route path="/academic/evaluations" element={<AcademicEvaluationsPage />} />
<Route path="/academic/notifications" element={<NotificationsPage />} />
              <Route path="/academic/profile" element={<ProfilePage />} />
              <Route path="/academic/students" element={<Navigate to="/academic/logs" replace />} />
              <Route path="/academic/activity" element={<Navigate to="/academic/logs" replace />} />
            </Route>

            {/* Student Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/logs" element={<MyLogsPage />} />
              <Route path="/student/notifications" element={<NotificationsPage />} />
              <Route path="/student/profile" element={<ProfilePage />} />
              <Route path="/student/evaluation" element={<StudentEvaluationPage />} />
              <Route path="/student/feedback" element={<StudentFeedbackPage />} />

            </Route>

            {/* Workplace Supervisor Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['workplace_supervisor']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/supervisor/dashboard" element={<WorkplaceSupervisorDashboard />} />
              <Route path="/supervisor/logs" element={<WorkplaceLogsPage />} />
              <Route path="/supervisor/scores" element={<WorkplaceScoresPage />} />
              <Route path="/supervisor/notifications" element={<NotificationsPage />} />
              <Route path="/supervisor/profile" element={<ProfilePage />} />
              <Route path="/supervisor/students" element={<Navigate to="/supervisor/scores" replace />} />
              <Route path="/supervisor/activity" element={<Navigate to="/supervisor/scores" replace />} />
              <Route path="/supervisor/reports" element={<Navigate to="/supervisor/scores" replace />} />
              <Route path="/supervisor/reviews" element={<Navigate to="/supervisor/scores" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin/dashboard" element={<InternshipAdministratorDashboard />} />
              <Route path="/admin/logs" element={<AdminLogsPage />} />
              <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
            </Route>

            {/* 404 - Not Found Route (must be last) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
         <ToastContainer position="top-right" autoClose={3000} theme='dark'/>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App

