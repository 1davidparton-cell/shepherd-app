import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROLE_GREETING: Record<string, string> = {
  disciple:     'Welcome back',
  co_counselor: 'Welcome back',
  counselor:    'Welcome back',
};

const CHEVRON = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default function PortalHome() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="ph-body">
      <p className="ph-greet">{ROLE_GREETING[user.role] || 'Welcome back'}</p>
      <h2 className="ph-name">{user.name.split(' ')[0]}</h2>

      <blockquote className="ph-verse">
        The Lord is my shepherd; I shall not want.
        <cite className="cite">Psalm 23:1</cite>
      </blockquote>

      <div className="ph-divider" />

      <p className="ph-label">In your care</p>

      <div className="ph-cards">
        <Link to="/portal/chat" className="ph-card" style={{ textDecoration: 'none' }}>
          <div className="ph-ic navy">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="tx">
            <b>Personal Chat</b>
            <span>Share what's on your heart</span>
          </div>
          <div className="chev">{CHEVRON}</div>
        </Link>

        <Link to="/portal/homework" className="ph-card" style={{ textDecoration: 'none' }}>
          <div className="ph-ic gold">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="tx">
            <b>Homework</b>
            <span>Scripture, reflection, and memory work</span>
          </div>
          <div className="chev">{CHEVRON}</div>
        </Link>

        <Link to="/portal/scripture" className="ph-card" style={{ textDecoration: 'none' }}>
          <div className="ph-ic stone">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="tx">
            <b>Scripture</b>
            <span>ESV Bible reader and audio</span>
          </div>
          <div className="chev">{CHEVRON}</div>
        </Link>

        <Link to="/portal/word" className="help-cta" style={{ textDecoration: 'none' }}>
          <div className="glow" />
          <div className="hi">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="tx">
            <b>The Word</b>
            <span>Bring what you are carrying</span>
          </div>
          <div className="chev">{CHEVRON}</div>
        </Link>
      </div>
    </div>
  );
}
