import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const groups = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: '▦', text: 'Dashboard' }],
  },
  {
    label: 'Care',
    items: [
      { to: '/members', icon: '◉', text: 'Members' },
      { to: '/medication', icon: '✚', text: 'Medication' },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { to: '/staff', icon: '♙', text: 'Staff' },
      { to: '/scheduling', icon: '◷', text: 'Scheduling' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/services', icon: '◇', text: 'Services' },
      { to: '/facilities', icon: '⌂', text: 'Facilities' },
      { to: '/inventory', icon: '▤', text: 'Inventory' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/reports', icon: '◔', text: 'Reports' },
      { to: '/settings', icon: '⚙', text: 'Settings' },
    ],
  },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-title">CareConnect</div>
            <div className="brand-subtitle">Aged Care Management</div>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">SB</div>
          <div className="sidebar-user-copy">
            <strong>Samith Buthgama</strong>
            <span>Prototype Administrator</span>
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button className="menu-button" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            ☰
          </button>
          <div>
            <strong>Team 2F</strong>
            <span className="topbar-subtitle">ICT30017 · React Prototype</span>
          </div>
          <div className="topbar-actions">
            <span className="prototype-pill">Prototype</span>
            <div className="topbar-avatar">SB</div>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
