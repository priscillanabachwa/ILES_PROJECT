import { useState } from 'react'


import './layout.css'
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Header from './header';


const defaultItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Profile', href: '/profile' },
  { label: 'Submit Log', href: '/submit-log' },
  { label: 'Weekly Logs', href: '/weekly-logs' },
  { label: 'Evaluations', href: '/evaluations' },
];

function NavItem({ item, active = false }) {
  return (
    <Link
      to={item.href}
      className={`iles-nav-item${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span>{item.label}</span>
      {item.badge ? <small>{item.badge}</small> : <span aria-hidden="true">→</span>}
    </Link>
  );
}

NavItem.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    badge: PropTypes.node,
  }).isRequired,
  active: PropTypes.bool,
};

function Sidebar({ items = defaultItems, activePath = '/' }) {
  return (
    <aside className="iles-sidebar">
      <div className="iles-sidebar__hero">
        <p className="iles-sidebar__eyebrow">ILES</p>
        <h2 className="iles-sidebar__title">Internship Hub</h2>
        <p className="iles-sidebar__copy">
          Log progress, review supervision, and keep every internship workflow in one place.
        </p>
      </div>

      <nav className="iles-nav">
        {items.map((item) => (
          <NavItem key={item.href} item={item} active={item.href === activePath} />
        ))}
      </nav>

      <div className="iles-sidebar__note">
        <p>Need a quick action?</p>
        <span>
          Use the header actions to switch sections, check your profile, or open the next task.
        </span>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  items: PropTypes.array,
  activePath: PropTypes.string,
};

export default function AppLayout({
  title = 'ILES Project',
  subtitle = 'Internship logging and evaluation system',
  user,
  activePath = '/',
  sidebarItems,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="iles-shell">
      <Sidebar items={sidebarItems} activePath={activePath} />

      <div className="iles-shell__content">
        <Header
          title={title}
          subtitle={subtitle}
          user={user}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />

        {sidebarOpen ? (
          <div
            className="iles-mobile-drawer"
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="iles-mobile-drawer__panel" onClick={(event) => event.stopPropagation()}>
              <Sidebar items={sidebarItems} activePath={activePath} />
            </div>
          </div>
        ) : null}

        <main className="iles-main">{children}</main>
      </div>
    </div>
  );
}
