import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Placements from './pages/Placements';
import WeeklyLogs from './pages/WeeklyLogs';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="container py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/placements" element={<Placements />} />
              <Route path="/logs" element={<WeeklyLogs />} />
              <Route path="/reviews" element={<div>Reviews Page</div>} />
              <Route path="/supervisors" element={<div>Supervisors Page</div>} />
              <Route path="/reports" element={<div>Reports Page</div>} />
              <Route path="/settings" element={<div>Settings Page</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;