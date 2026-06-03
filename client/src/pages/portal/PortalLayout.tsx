import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShepherdMark } from '../../components/ShepherdMark';
import { RoleToggle } from '../../components/RoleToggle';
import { RefreshContext, useRefreshState } from '../../hooks/useRefresh';
import { useState, useRef } from 'react';

const NAV_ITEMS = [
  { to: '/portal', label: 'Home', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/portal/homework', label: 'Homework', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/portal/scripture', label: 'Scripture', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { to: '/portal/word', label: 'Word', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const PULL_THRESHOLD = 72;

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ctx = useRefreshState();
  const [spinning, setSpinning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const bodyRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const doRefresh = () => {
    setSpinning(true);
    ctx.refresh();
    setTimeout(() => setSpinning(false), 700);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (bodyRef.current && bodyRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && bodyRef.current?.scrollTop === 0) {
      setPullY(Math.min(dy * 0.45, PULL_THRESHOLD));
    }
  };

  const onTouchEnd = () => {
    if (pullY >= PULL_THRESHOLD - 4) doRefresh();
    setPullY(0);
    pulling.current = false;
  };

  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1);

  return (
    <RefreshContext.Provider value={ctx}>
      <div className="screen portal">
        <header className="p-head">
          {/* Left — empty, holds grid balance */}
          <div />

          {/* Center */}
          <span className="p-word" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ShepherdMark size={22} color="#c9a84c" stroke={9} />
            Shepherd
          </span>

          {/* Right — refresh + avatar menu */}
          <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <button
              onClick={doRefresh}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center' }}
              title="Refresh"
            >
              <svg
                width="16" height="16" fill="none" stroke="rgba(249,245,239,0.55)" strokeWidth={2}
                viewBox="0 0 24 24"
                style={{ transition: 'transform 0.7s ease', transform: spinning ? 'rotate(720deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ fontSize: 12, color: 'rgba(249,245,239,0.66)', fontFamily: 'var(--ui)', fontWeight: 500 }}>
                {user?.name?.split(' ')[0]}
              </span>
              <div className="dot">{user?.name?.[0]?.toUpperCase()}</div>
            </button>

            {menuOpen && (
              <>
                {/* backdrop to close */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 50,
                  background: '#fff', borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 8px 32px -8px rgba(20,25,40,.35)',
                  border: '1px solid #ece5d8', minWidth: 160,
                }}>
                  <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #ece5d8' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{user?.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--stone)', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <RoleToggle asMenuItem onSelect={() => setMenuOpen(false)} />
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13.5, color: '#b05050', fontFamily: 'var(--ui)', fontWeight: 500,
                      textAlign: 'left',
                    }}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Pull-to-refresh indicator */}
        {pullY > 4 && (
          <div style={{
            position: 'absolute', top: 54, left: 0, right: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: pullY, transition: 'none', background: 'transparent', pointerEvents: 'none',
          }}>
            <svg
              width="22" height="22" fill="none" stroke="var(--gold)" strokeWidth={2}
              viewBox="0 0 24 24"
              style={{ opacity: pullProgress, transform: `rotate(${pullProgress * 360}deg)` }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}

        <main
          ref={bodyRef}
          className="p-body"
          style={{ overflowY: 'auto', transform: pullY > 0 ? `translateY(${pullY}px)` : undefined, transition: pullY === 0 ? 'transform 0.2s ease' : 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Outlet key={ctx.key} />
        </main>

        <nav className="p-nav" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
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
    </RefreshContext.Provider>
  );
}
