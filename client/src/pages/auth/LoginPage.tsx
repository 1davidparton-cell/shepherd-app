import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-shepherd-navy flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-shepherd-gold/20 mb-6">
            <svg className="w-10 h-10 text-shepherd-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 4.5C10.5 4.5 7.5 6 7.5 10.5c0 3 1.5 5.25 3 6.75M12 4.5c1.5 0 4.5 1.5 4.5 6 0 3-1.5 5.25-3 6.75M12 4.5V3m0 14.25V21M8.25 8.25H4.5m15 0H15.75" />
            </svg>
          </div>
          <h1 className="text-4xl font-serif text-white mb-2">Shepherd</h1>
          <p className="text-shepherd-gold/70 text-sm tracking-wide uppercase">
            Biblical Counseling
          </p>
        </div>

        {error === 'account_not_found' && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm text-center">
            Your account hasn't been set up yet. Contact your counselor to be added to the system.
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
          <p className="text-shepherd-cream/70 text-sm text-center mb-6">
            Sign in with the Google account your counselor registered for you.
          </p>
          <a
            href="/auth/google"
            className="flex items-center justify-center gap-3 w-full bg-white text-gray-800 font-medium rounded-lg px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>
        </div>

        <p className="mt-6 text-center text-shepherd-cream/40 text-xs">
          Access is by invitation only. Your counselor will create your account.
        </p>
      </div>
    </div>
  );
}
