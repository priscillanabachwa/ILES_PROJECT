<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
=======

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './Context/AuthContext.jsx'
>>>>>>> 770474a25454539ae2f307ff0a29d293fe28c8ce
import AppLayout from './components/layout/AppLayout'
import AcademicSupervisorDashboard from './pages/dashboards/AcademicSupervisorDashboard.jsx'
import StudentDashboard from './pages/dashboards/StudentDashboard.jsx'
import WorkplaceSupervisorDashboard from './pages/dashboards/WorkplaceSupervisorDashboard.jsx'
import InternshipAdministratorDashboard from './pages/dashboards/InternshipAdministratorDashboard.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SubmitLogPage from './pages/SubmitLogPage.jsx'
<<<<<<< HEAD
import Login from './pages/login.jsx'
=======
import Login from './pages/Login.jsx'
>>>>>>> 770474a25454539ae2f307ff0a29d293fe28c8ce

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
<<<<<<< HEAD
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Academic Supervisor ── */}
          <Route element={<AppLayout role="ACADEMIC_SUPERVISOR" />}>
            <Route path="/academic/dashboard"    element={<AcademicSupervisorDashboard />} />
            <Route path="/academic/logs"         element={<div>Internship Logs</div>} />
            <Route path="/academic/evaluations"  element={<div>Evaluations Page</div>} />
            <Route path="/academic/profile"      element={<ProfilePage />} />
          </Route>

          {/* ── Student ── */}
          <Route element={<AppLayout role="STUDENT" />}>
            <Route path="/student/dashboard"     element={<StudentDashboard />} />
            <Route path="/student/logs"          element={<div>My Logs</div>} />
            <Route path="/student/profile"       element={<ProfilePage />} />
            <Route path="/student/logs/new" element={<SubmitLogPage />} />
          </Route>

          {/* ── Workplace Supervisor ── */}
          <Route element={<AppLayout role="WORKPLACE_SUPERVISOR" />}>
            <Route path="/supervisor/dashboard"  element={<WorkplaceSupervisorDashboard />} />
            <Route path="/supervisor/reviews"    element={<div>Reviews Page</div>} />
            <Route path="/supervisor/scores"     element={<div>Scores Page</div>} />
            <Route path="/supervisor/profile"    element={<ProfilePage />} />
          </Route>

          {/* ── Admin ── */}
          <Route element={<AppLayout role="ADMIN" />}>
            <Route path="/admin/dashboard"       element={<InternshipAdministratorDashboard />} />
            <Route path="/admin/logs"            element={<div>All Logs Table</div>} />
            <Route path="/admin/evaluations"     element={<div>Evaluations Page</div>} />
            <Route path="/admin/profile"         element={<ProfilePage />} />
          </Route>
          
          {/* Redirect root to login */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
=======
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-indigo-400">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
        >
          Back to Login
        </a>
      </div>
    </div>
>>>>>>> 770474a25454539ae2f307ff0a29d293fe28c8ce
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
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
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

