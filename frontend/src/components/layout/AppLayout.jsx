import { useState } from 'react'

import './layout.css'

import Header from './header'
import Sidebar from './sidebar'

export default function AppLayout({
  title = 'ILES Project',
  subtitle = 'Internship logging and evaluation system',
  user,
  activePath = '/',
  sidebarItems,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  )
}
