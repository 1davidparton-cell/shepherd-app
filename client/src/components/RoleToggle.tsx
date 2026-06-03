import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleToggleProps {
  asMenuItem?: boolean;
  onSelect?: () => void;
}

export function RoleToggle({ asMenuItem, onSelect }: RoleToggleProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || !user.counselorId || user._count.disciples === 0) return null;

  const isCounselor = location.pathname.startsWith('/admin');

  if (asMenuItem) {
    const targetPath = isCounselor ? '/portal' : '/admin';
    const label = isCounselor ? 'Switch to Disciple' : 'Switch to Counselor';
    return (
      <button
        onClick={() => { onSelect?.(); navigate(targetPath); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13.5, color: 'var(--navy)', fontFamily: 'var(--ui)', fontWeight: 500,
          textAlign: 'left', borderBottom: '1px solid #ece5d8',
        }}
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        {label}
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex',
      border: '1px solid rgba(201,168,76,.3)',
      borderRadius: 999,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {[
        { label: 'Counselor', path: '/admin' },
        { label: 'Disciple', path: '/portal' },
      ].map(({ label, path }) => {
        const active = label === 'Counselor' ? isCounselor : !isCounselor;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              padding: '5px 14px',
              fontFamily: 'var(--ui)',
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: '0.04em',
              border: 'none',
              cursor: 'pointer',
              background: active ? 'rgba(201,168,76,.18)' : 'transparent',
              color: active ? 'var(--gold)' : 'rgba(249,245,239,.4)',
              transition: 'all .15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
