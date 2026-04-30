import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import AcademicSupervisorDashboard from "./pages/dashboards/AcademicSupervisorDashboard.jsx";


function App() {
  const user = {
    full_name: 'ILES Admin',
    role: 'ADMIN',
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route element={<AppLayout role={user.role} />}>
            <Route path="/" element={<div>Dashboard Content Here</div>} />
            <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
            <Route path="/admin/logs" element={<div>All Logs Table</div>} />
            <Route path="/admin/evaluations" element={<div>Evaluations Page</div>} />
            <Route path="/admin/profile" element={<div>User Profile</div>} />

            {/* Added academic dashboard here */}
            <Route path="/dashboard" element={<AcademicSupervisorDashboard />} />
            <Route path="/students" element={<div>Students Page</div>} />
            <Route path="/reviews" element={<div>Reviews Page</div>} />
            <Route path="/reports" element={<div>Reports Page</div>} />
          </Route>

          <Route path="/login" element={<div>Login Page</div>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App