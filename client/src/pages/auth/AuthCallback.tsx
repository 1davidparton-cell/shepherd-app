import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../lib/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) setAuthToken(token);
    navigate('/', { replace: true });
  }, [navigate]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a2744', color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
      Signing in…
    </div>
  );
}
