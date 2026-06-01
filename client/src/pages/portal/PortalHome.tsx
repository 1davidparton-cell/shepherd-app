import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROLE_GREETING: Record<string, string> = {
  wife: 'Welcome back',
  husband: 'Welcome back',
  female_disciple: 'Welcome back',
  male_disciple: 'Welcome back',
};

export default function PortalHome() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="p-6">
      <div className="mb-8">
        <p className="text-shepherd-stone text-sm mb-1">{ROLE_GREETING[user.role] || 'Welcome back'}</p>
        <h2 className="text-3xl font-serif text-shepherd-navy">{user.name.split(' ')[0]}</h2>
      </div>

      <div className="space-y-3">
        <Link to="/portal/chat" className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-shepherd-navy/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-shepherd-navy/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-shepherd-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">Personal Chat</div>
            <div className="text-sm text-gray-500">Share what's on your heart</div>
          </div>
          <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link to="/portal/homework" className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-shepherd-navy/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-shepherd-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-shepherd-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">Homework</div>
            <div className="text-sm text-gray-500">Scripture, reflection, and memory work</div>
          </div>
          <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link to="/portal/scripture" className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-shepherd-navy/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-shepherd-stone/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-shepherd-stone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">Scripture</div>
            <div className="text-sm text-gray-500">ESV Bible reader and audio</div>
          </div>
          <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
