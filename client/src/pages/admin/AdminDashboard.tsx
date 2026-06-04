import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import ShareInvite from '../../components/ShareInvite';

interface DashboardData {
  userCount: number;
  pendingHomework: number;
  recentNotes: { id: string; content: string; createdAt: string; counselor: { name: string } }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    api.get<DashboardData>('/api/admin/dashboard').then(setData).catch(console.error);
  }, []);

  return (
    <>
      <div className="ad-head">
        <h1 className="ht">Dashboard</h1>
        <p className="hs">Biblical discipleship overview</p>
      </div>

      <div className="ad-body">
        <div className="ad-stats">
          <Link to="/admin/users" className={`stat${data?.userCount ? ' hot' : ''}`}>
            <div className="sl">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Active Disciples
            </div>
            <div className="sv">{data?.userCount ?? '—'}</div>
            <div className="sd">People in your flock</div>
          </Link>

          <Link to="/admin/homework" className={`stat${data?.pendingHomework ? ' hot' : ''}`}>
            <div className="sl">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Pending Homework
            </div>
            <div className="sv">{data?.pendingHomework ?? '—'}</div>
            <div className="sd">Assignments awaiting completion</div>
          </Link>

          <Link to="/admin/chat" className="stat">
            <div className="sl">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Flock
            </div>
            <div className="sv">View</div>
            <div className="sd">Manage your flock</div>
          </Link>
        </div>

        <button
          onClick={() => setShareOpen(true)}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px 18px', fontSize: 14 }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM19 8v6M22 11h-6" />
          </svg>
          Share Shepherd with a new disciple
        </button>

        <div className="ad-sub">Recent Session Notes</div>

        <div className="note-list">
          {data?.recentNotes.length === 0 && (
            <p style={{ color: 'var(--stone)', fontSize: '0.875rem', padding: '1rem 0' }}>No session notes yet.</p>
          )}
          {data?.recentNotes.map(note => (
            <div key={note.id} className="note">
              <div className="nh">
                <span className="who">{note.counselor.name} <em>Discipler</em></span>
                <span className="when">{new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="nq">{note.content}</p>
            </div>
          ))}
        </div>
      </div>

      <ShareInvite open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
