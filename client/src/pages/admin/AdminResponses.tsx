import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Response {
  id: string;
  responseText: string;
  submittedAt: string;
  homework: { title: string; scriptureRef: string | null };
  user: { id: string; name: string; role: string };
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS: Record<string, string> = {
  husband: '#1e3a5f',
  wife: '#5f3a1e',
  male_disciple: '#1e4a3a',
  female_disciple: '#4a1e3a',
  admin: '#3a3a3a',
};

export default function AdminResponses() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [synthesis, setSynthesis] = useState<{ [userId: string]: string }>({});
  const [synthesizing, setSynthesizing] = useState<string | null>(null);

  useEffect(() => {
    api.get<Response[]>('/api/admin/responses').then(setResponses).catch(console.error);
  }, []);

  const synthesize = async (userId: string) => {
    setSynthesizing(userId);
    try {
      const result = await api.post<{ synthesis: string }>('/api/admin/responses/synthesize', { userId });
      setSynthesis(prev => ({ ...prev, [userId]: result.synthesis }));
    } catch (err) {
      console.error(err);
    } finally {
      setSynthesizing(null);
    }
  };

  const grouped = responses.reduce<Record<string, { name: string; role: string; responses: Response[] }>>((acc, r) => {
    if (!acc[r.user.id]) acc[r.user.id] = { name: r.user.name, role: r.user.role, responses: [] };
    acc[r.user.id].responses.push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="ad-head">
        <h1 className="ht">Responses</h1>
        <p className="hs">Review submitted homework and generate AI synthesis</p>
      </div>

      <div className="ad-body">
        {responses.length === 0 && (
          <p style={{ color: 'var(--col-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>
            No responses submitted yet.
          </p>
        )}

        {Object.entries(grouped).map(([userId, group]) => (
          <div key={userId} style={{ marginBottom: 24 }}>
            <div className="rp-gh">
              <div className="av" style={{ background: AVATAR_COLORS[group.role] ?? '#1e3a5f' }}>
                {initials(group.name)}
              </div>
              <b>{group.name}</b>
              <span>{group.role.replace('_', ' ')}</span>
              <button
                className={synthesizing === userId ? 'btn-ghost' : 'btn-primary'}
                onClick={() => synthesize(userId)}
                disabled={synthesizing === userId}
                style={{ marginLeft: 'auto' }}
              >
                {synthesizing === userId ? 'Synthesizing...' : 'AI Synthesis'}
              </button>
            </div>

            {synthesis[userId] && (
              <div className="rp-syn">
                <div className="sl">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={14} height={14}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Synthesis
                </div>
                <p>{synthesis[userId]}</p>
              </div>
            )}

            {group.responses.map(r => (
              <div key={r.id} className="rp-entry">
                <div className="q">
                  {r.homework.title}
                  {r.homework.scriptureRef && <span style={{ marginLeft: 8, fontWeight: 400, opacity: 0.6 }}>{r.homework.scriptureRef}</span>}
                </div>
                <p className="a">{r.responseText}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
