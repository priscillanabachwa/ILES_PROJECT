import { useState } from 'react';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="header">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden p-2 rounded-lg hover:bg-accent-light"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 rounded-lg hover:bg-accent-light relative">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent-light"
          >
            <UserCircleIcon className="h-8 w-8" />
            <span className="text-sm font-medium hidden sm:inline">John Doe</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-primary border border-border rounded-lg shadow-lg py-1 z-20">
              <a href="/profile" className="block px-4 py-2 text-sm hover:bg-accent-light">Profile</a>
              <a href="/settings" className="block px-4 py-2 text-sm hover:bg-accent-light">Settings</a>
              <hr className="my-1 border-border" />
              <a href="/logout" className="block px-4 py-2 text-sm text-danger hover:bg-accent-light">Logout</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}