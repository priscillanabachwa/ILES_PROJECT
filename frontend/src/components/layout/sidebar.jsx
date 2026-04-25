const defaultItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Profile', href: '/profile' },
  { label: 'Submit Log', href: '/submit-log' },
  { label: 'Weekly Logs', href: '/weekly-logs' },
  { label: 'Evaluations', href: '/evaluations' },
]

function NavItem({ item, active = false }) {
  return (
    <a href={item.href} className={`iles-nav-item${active ? ' is-active' : ''}`}>
      <span>{item.label}</span>
      {item.badge ? <small>{item.badge}</small> : <span aria-hidden="true">→</span>}
    </a>
  )
}

export default function Sidebar({ items = defaultItems, activePath = '/' }) {
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
  )
}