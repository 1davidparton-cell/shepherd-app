import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShepherdMark } from '../../components/ShepherdMark';
import { RoleToggle } from '../../components/RoleToggle';
import { RefreshContext, useRefreshState } from '../../hooks/useRefresh';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true },
  { to: '/admin/chat', label: 'Discipling', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to: '/admin/homework', label: 'Homework', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/admin/responses', label: 'Responses', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ctx = useRefreshState();
  const [spinning, setSpinning] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const doRefresh = () => {
    setSpinning(true);
    ctx.refresh();
    setTimeout(() => setSpinning(false), 700);
  };

  const firstName = user?.name?.split(' ')[0] ?? '';
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <RefreshContext.Provider value={ctx}>
      <div className="w-full flex" style={{ height: '100vh', background: '#f5f1ea' }}>
        <aside className="ad-side">
          <div className="ad-brand">
            <ShepherdMark size={36} color="#c9a84c" />
            <div className="bw">
              <b>Shepherd</b>
              <span>Admin Hub</span>
            </div>
          </div>

          <nav className="ad-nav">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => 'ad-navitem' + (isActive ? ' active' : '')}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ad-side-foot">
            <div className="av">{initial}</div>
            <div className="nm">
              <b>{firstName || user?.name}</b>
              <RoleToggle />
            </div>
            <button
              onClick={doRefresh}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              title="Refresh"
            >
              <svg
                width="16" height="16" fill="none" stroke="rgba(249,245,239,0.5)" strokeWidth={1.75}
                viewBox="0 0 24 24"
                style={{ display: 'block', transition: 'transform 0.7s ease', transform: spinning ? 'rotate(720deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="Sign out"
            >
              <svg className="out" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </aside>

        <main className="ad-main">
          <Outlet key={ctx.key} />
        </main>
      </div>
    </RefreshContext.Provider>
  );
}
