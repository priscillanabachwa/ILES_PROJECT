import AppLayout from './components/layout/AppLayout'

function App() {
  const user = {
    first_name: 'ILES',
    last_name: 'Admin',
    role: 'admin',
  }

  const cards = [
    {
      title: 'Single shared shell',
      body: 'Every page can sit inside the same header and sidebar so the project keeps one consistent navigation structure.',
    },
    {
      title: 'Reusable component set',
      body: 'The layout accepts custom menu items and user data, so dashboards and forms can reuse it without duplication.',
    },
    {
      title: 'Responsive by default',
      body: 'The sidebar collapses into a mobile drawer while the desktop experience keeps a clean, persistent navigation rail.',
    },
  ]

  return (
    <AppLayout
      title="ILES"
      subtitle="Internship Logging and Evaluation System"
      user={user}
      activePath="/"
      sidebarItems={[
        { label: 'Dashboard', href: '/' },
        { label: 'Profile', href: '/profile' },
        { label: 'Weekly Logs', href: '/weekly-logs' },
        { label: 'Submit Log', href: '/submit-log' },
        { label: 'Logout', href: '/login' },
      ]}
    >
      <div className="iles-page">
        <section className="iles-panel">
          <div className="iles-panel__hero">
            <p className="iles-panel__eyebrow">Project Layout</p>
            <h2 className="iles-panel__title">A consistent header, sidebar, and content shell for the whole app.</h2>
            <p className="iles-panel__text">
              This shell is intended to wrap dashboards, profile screens, and forms so the user always lands in the same
              navigation system.
            </p>
          </div>

          <div className="iles-card-grid">
            {cards.map((card) => (
              <article key={card.title} className="iles-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

export default App
