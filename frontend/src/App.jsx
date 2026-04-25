import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'

function App() {
  const user = {
    full_name: 'ILES Admin',
    role: 'ADMIN',
  }



  return (
    <BrowserRouter>
      <Routes>
        {/* The Layout wraps all internal pages */}
        <Route element={<AppLayout role={user.role} />}>
          <Route path="/" element={<div>Dashboard Content Here</div>} />
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
          <Route path="/admin/logs" element={<div>All Logs Table</div>} />
          <Route path="/admin/evaluations" element={<div>Evaluations Page</div>} />
          <Route path="/admin/profile" element={<div>User Profile</div>} />
        </Route>

        {/* Auth routes don't use the sidebar layout */}
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
