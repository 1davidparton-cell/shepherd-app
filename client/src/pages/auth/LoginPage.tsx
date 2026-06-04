import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE } from '../../lib/api';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');
  const [loginType, setLoginType] = useState<'disciple' | 'counselor'>('disciple');

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="screen login">
      <div className="login-tex" />
      <div className="login-inner">
        <p className="login-eyebrow">The Lord is my</p>
        <h1 className="login-word">Shepherd</h1>
        <div className="login-rule" />

        <div className="login-divider" style={{ margin: '0 0 28px' }}>
          <div style={{
            display: 'flex',
            border: '1px solid rgba(201,168,76,.35)',
            borderRadius: 999,
            overflow: 'hidden',
          }}>
            {(['disciple', 'counselor'] as const).map(t => (
              <button
                key={t}
                onClick={() => setLoginType(t)}
                style={{
                  padding: '9px 26px',
                  fontFamily: 'var(--ui)',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  border: 'none',
                  cursor: 'pointer',
                  background: loginType === t ? 'rgba(201,168,76,.22)' : 'transparent',
                  color: loginType === t ? 'var(--gold)' : 'rgba(249,245,239,.45)',
                  transition: 'all .15s',
                }}
              >
                {t === 'counselor' ? 'Counselor' : 'Disciple'}
              </button>
            ))}
          </div>
        </div>

        <p className="login-verse">
          "He will tend his flock like a shepherd; he will gather the lambs in his arms."
          <cite className="login-cite">Isaiah 40:11</cite>
        </p>

        {error === 'account_not_found' && (
          <p style={{ fontSize: '0.875rem', color: '#fca5a5', textAlign: 'center', marginBottom: 12 }}>
            Your account hasn't been set up yet. Ask your counselor to add you to Shepherd.
          </p>
        )}
        {error === 'archived' && (
          <p style={{ fontSize: '0.875rem', color: '#fca5a5', textAlign: 'center', marginBottom: 12 }}>
            Your account has been archived. Contact your counselor for access.
          </p>
        )}

        <a href={`${API_BASE}/auth/google?type=${loginType}`} className="btn-google">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loginType === 'counselor' ? 'Continue as Counselor' : 'Continue as Disciple'}
        </a>

        <p className="login-invite">
          <b>Access is by invitation only.</b> A place of care, kept for the one walking through a hard season.
        </p>
      </div>
    </div>
  );
}
