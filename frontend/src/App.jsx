import React from 'react'
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AcademicSupervisorDashboard from './pages/dashboards/AcademicSupervisorDashboard.jsx'
import StudentDashboard from './pages/dashboards/StudentDashboard.jsx'
import WorkplaceSupervisorDashboard from './pages/dashboards/WorkplaceSupervisorDashboard.jsx'
import InternshipAdministratorDashboard from './pages/dashboards/InternshipAdministratorDashboard.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SubmitLogPage from './pages/SubmitLogPage.jsx'
import Login from './pages/login.jsx'

// Error Boundary Component for catching React errors
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
        <Navigate to="/login" replace className="text-indigo-400 underline">Return to Login</Navigate>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Default route - redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Academic Supervisor Routes */}
            <Route element={<AppLayout role="ACADEMIC_SUPERVISOR" />}>
              <Route path="/academic/dashboard" element={<AcademicSupervisorDashboard />} />
              <Route path="/academic/logs" element={<div className="p-6 text-white">Internship Logs</div>} />
              <Route path="/academic/evaluations" element={<div className="p-6 text-white">Evaluations Page</div>} />
              <Route path="/academic/profile" element={<ProfilePage />} />
            </Route>

            {/* Student Routes */}
            <Route element={<AppLayout role="STUDENT" />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/logs" element={<div className="p-6 text-white">My Logs</div>} />
              <Route path="/student/profile" element={<ProfilePage />} />
              <Route path="/student/logs/new" element={<SubmitLogPage />} />
            </Route>

            {/* Workplace Supervisor Routes */}
            <Route element={<AppLayout role="WORKPLACE_SUPERVISOR" />}>
              <Route path="/supervisor/dashboard" element={<WorkplaceSupervisorDashboard />} />
              <Route path="/supervisor/reviews" element={<div className="p-6 text-white">Reviews Page</div>} />
              <Route path="/supervisor/scores" element={<div className="p-6 text-white">Scores Page</div>} />
              <Route path="/supervisor/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AppLayout role="ADMIN" />}>
              <Route path="/admin/dashboard" element={<InternshipAdministratorDashboard />} />
              <Route path="/admin/logs" element={<div className="p-6 text-white">All Logs Table</div>} />
              <Route path="/admin/evaluations" element={<div className="p-6 text-white">Evaluations Page</div>} />
              <Route path="/admin/profile" element={<ProfilePage />} />
            </Route>

            {/* 404 - Not Found Route (must be last) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

