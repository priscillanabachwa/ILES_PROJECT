import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Placements', href: '/placements', icon: BriefcaseIcon },
  { name: 'Weekly Logs', href: '/logs', icon: CalendarIcon },
  { name: 'Reviews', href: '/reviews', icon: DocumentTextIcon },
  { name: 'Supervisors', href: '/supervisors', icon: UserGroupIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ILES
        </h1>
        <p className="text-xs text-text-muted mt-1">Internship Logging System</p>
      </div>
      
      <nav className="space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-accent-light hover:text-accent'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}