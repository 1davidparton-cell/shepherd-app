import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShepherdMark } from '../../components/ShepherdMark';

const NAV_ITEMS = [
  { to: '/portal', label: 'Home', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/portal/chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to: '/portal/homework', label: 'Homework', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/portal/scripture', label: 'Scripture', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { to: '/portal/word', label: 'Word', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="screen portal">
      <header className="p-head">
        <div />
        <span className="p-word" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShepherdMark size={22} color="#c9a84c" stroke={9} />
          Shepherd
        </span>
        <div className="p-name">
          {user?.name && (
            <>
              <span>{user.name.split(' ')[0]}</span>
              <div className="dot">{user.name[0]}</div>
            </>
          )}
          <button
            onClick={handleLogout}
            style={{ fontSize: 10, color: 'rgba(249,245,239,0.38)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, letterSpacing: '0.06em' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-body" style={{ overflowY: 'auto' }}>
        <Outlet />
      </main>

      <nav className="p-nav" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? (item as { end?: boolean }).end : false}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <div className="nav-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
              </svg>
            </div>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
