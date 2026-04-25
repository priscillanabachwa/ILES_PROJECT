import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';


const NAV = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/logs', label: 'Internship Logs', icon: 'assignment' },
    { to: '/admin/evaluations', label: 'Evaluations', icon: 'rate_review' },
    { to: '/admin/profile', label: 'Profile', icon: 'person' },
  ],
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/student/logs', label: 'My Logs', icon: 'assignment' },
    { to: '/student/profile', label: 'Profile', icon: 'person' },
  ]
};

export default function AppLayout({ role = 'ADMIN' }) {
  const navigate = useNavigate();
  // const { logout, user } = useAuth(); // Uncomment when auth is ready
  
  // Placeholder user for development
  const user = { full_name: "User Name" }; 

  const handleLogout = async () => {
    // await logout();
    navigate('/login');
  };

  const items = NAV[role] || [];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-[#e4e1ed]">
      {/* SideNavBar - Merged Logic + Stitch Styles */}
      <aside className="w-64 h-screen sticky left-0 top-0 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col py-6">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white">school</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">ILES</h1>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Academic Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {items.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  isActive 
                    ? 'text-white bg-indigo-600/10 border-r-2 border-indigo-500 shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mt-auto border-t border-white/5 pt-4">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium truncate text-white">{user?.full_name}</p>
            <p className="text-xs text-indigo-400">{role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-40">
          <span className="text-white font-bold text-lg">Internship Management System</span>
          <div className="flex items-center gap-4">
             {/* Add search or profile icons here if needed */}
          </div>
        </header>

        {/* The Outlet is where Dashboard.jsx or other pages will render */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}