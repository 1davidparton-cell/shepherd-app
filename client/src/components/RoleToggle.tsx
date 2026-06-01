import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RoleToggle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || !user.counselorId || user._count.disciples === 0) return null;

  const isCounselor = location.pathname.startsWith('/admin');

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
