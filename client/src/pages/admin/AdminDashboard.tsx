import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface DashboardData {
  userCount: number;
  pendingHomework: number;
  recentNotes: { id: string; content: string; createdAt: string; counselor: { name: string } }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/api/admin/dashboard').then(setData).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-serif text-gray-900 mb-1">Admin Hub</h2>
      <p className="text-gray-500 text-sm mb-8">Biblical counseling dashboard</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Counselees" value={data?.userCount ?? '—'} href="/admin/users" />
        <StatCard label="Pending Homework" value={data?.pendingHomework ?? '—'} href="/admin/homework" />
        <StatCard label="Counseling Sessions" value="Chat" href="/admin/chat" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Recent Session Notes</h3>
        {data?.recentNotes.length === 0 && (
          <p className="text-gray-400 text-sm">No session notes yet.</p>
        )}
        <div className="space-y-3">
          {data?.recentNotes.map(note => (
            <div key={note.id} className="border-l-2 border-shepherd-gold pl-3">
              <p className="text-sm text-gray-700 line-clamp-2">{note.content}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link to={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-shepherd-gold/40 transition-colors">
      <div className="text-2xl font-serif text-shepherd-navy mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Link>
  );
}
