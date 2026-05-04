import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import AppLayout from './components/layout/AppLayout'
import AcademicSupervisorDashboard from './pages/dashboards/AcademicSupervisorDashboard.jsx'
import StudentDashboard from './pages/dashboards/StudentDashboard.jsx'
import WorkplaceSupervisorDashboard from './pages/dashboards/WorkplaceSupervisorDashboard.jsx'
import InternshipAdministratorDashboard from './pages/dashboards/InternshipAdministratorDashboard.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

function App() {
  return (
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

          <Route path="/login" element={<div>Login Page</div>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App