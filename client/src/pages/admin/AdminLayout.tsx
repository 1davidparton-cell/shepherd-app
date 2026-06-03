import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShepherdMark } from '../../components/ShepherdMark';
import { RoleToggle } from '../../components/RoleToggle';
import { RefreshContext, useRefreshState } from '../../hooks/useRefresh';
import { api } from '../../lib/api';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true },
  { to: '/admin/chat', label: 'Flock', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/admin/homework', label: 'Homework', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function AdminLayout() {
  const { user, logout, refetch } = useAuth();
  const navigate = useNavigate();
  const ctx = useRefreshState();
  const [spinning, setSpinning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

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

  const openProfile = () => {
    setProfileForm({ name: user?.name || '', email: user?.email || '' });
    setProfileError('');
    setShowProfile(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      await api.put('/api/users/me', profileForm);
      await refetch();
      setShowProfile(false);
    } catch (err: unknown) {
      setProfileError((err as Error).message || 'Failed to save');
    } finally {
      setProfileSaving(false);
    }
  };

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
            <button
              onClick={openProfile}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 1, minWidth: 0 }}
              title="Edit profile"
            >
              <div className="av">{initial}</div>
              <div className="nm" style={{ textAlign: 'left' }}>
                <b style={{ display: 'block' }}>{firstName || user?.name}</b>
                <span style={{ fontSize: 10.5, color: 'rgba(249,245,239,0.45)', display: 'block', lineHeight: 1.4 }}>{user?.email}</span>
              </div>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <RoleToggle />
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
          </div>
        </aside>

        <main className="ad-main">
          <Outlet key={ctx.key} />
        </main>

        {showProfile && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowProfile(false); }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 400, boxShadow: '0 24px 60px -20px rgba(20,25,40,.5)' }}>
              <h3 style={{ fontFamily: 'var(--head)', fontSize: 20, color: 'var(--navy)', margin: '0 0 20px' }}>Your Profile</h3>
              <form onSubmit={saveProfile}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="field">
                    <label>Name</label>
                    <input className="inp" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input className="inp" type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  {profileError && <p style={{ fontSize: 13, color: '#b05050', margin: 0 }}>{profileError}</p>}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setShowProfile(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={profileSaving} className="btn-primary" style={{ flex: 2 }}>
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RefreshContext.Provider>
  );
}
