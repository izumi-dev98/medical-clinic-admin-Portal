const navigation = [
  { label: 'Hospital/Clinic Information', icon: 'building' },
  { label: 'Mission, Vision & Core', icon: 'target' },
  { label: 'Awards', icon: 'award' },
  { label: 'Services', icon: 'service' },
  { label: 'Doctors', icon: 'stethoscope' },
  { label: 'Management Team', icon: 'team' },
  { label: 'Medical Packages', icon: 'package' },
  { label: 'Promotions', icon: 'promotion' },
  { label: 'Blog', icon: 'blog' },
]

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-4A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" /></>,
    stethoscope: <><path d="M6 3v5a4 4 0 0 0 8 0V3M4 3h4M12 3h4" /><path d="M10 12v2a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="10" r="2" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" /></>,
    service: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="8" /></>,
    team: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0M15 14a5 5 0 0 1 6 5" /></>,
    package: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
    promotion: <><path d="m20 12-8 8-8-8 8-8 8 8Z" /><circle cx="9.5" cy="9.5" r="1" /><path d="m10 14 4-4" /></>,
    blog: <><path d="M5 4h14a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" /><path d="M5 18a2 2 0 0 0 2 2M9 8h8M9 12h8M9 16h5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-2v-.48a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.42-1.42.06.06A1.7 1.7 0 0 0 12.36 8.7 1.7 1.7 0 0 0 13.4 7.14V7h2v.14a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z" /></>,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Sidebar({ isOpen, onClose, onNavigate }) {
  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark">+</span>
          <span>NOSH</span>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">Workspace</p>
          {navigation.map((item) => <NavItem key={item.label} item={item} onClick={() => { onNavigate(item.label); onClose() }} />)}
        </nav>

      </aside>
    </>
  )
}

function NavItem({ item, onClick }) {
  return <button className={`nav-item ${item.active ? 'active' : ''}`} type="button" onClick={onClick}>
    <Icon name={item.icon} /><span>{item.label}</span>{item.badge && <small>{item.badge}</small>}
  </button>
}

export default Sidebar
export { Icon }
