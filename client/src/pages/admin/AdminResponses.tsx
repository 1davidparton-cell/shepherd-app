import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Response {
  id: string;
  responseText: string;
  submittedAt: string;
  homework: { title: string; scriptureRef: string | null };
  user: { id: string; name: string; role: string };
}

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
    <div className="p-8">
      <h2 className="text-2xl font-serif text-gray-900 mb-1">Responses</h2>
      <p className="text-gray-500 text-sm mb-8">Review submitted homework and generate AI synthesis</p>

      <div className="space-y-6">
        {Object.entries(grouped).map(([userId, group]) => (
          <div key={userId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <span className="font-medium text-gray-900">{group.name}</span>
                <span className="ml-2 text-xs text-gray-400 capitalize">{group.role.replace('_', ' ')}</span>
              </div>
              <button
                onClick={() => synthesize(userId)}
                disabled={synthesizing === userId}
                className="text-xs bg-shepherd-navy/10 text-shepherd-navy px-3 py-1.5 rounded-full hover:bg-shepherd-navy/20 disabled:opacity-50"
              >
                {synthesizing === userId ? 'Synthesizing...' : 'AI Synthesis'}
              </button>
            </div>

            {synthesis[userId] && (
              <div className="px-5 py-4 bg-shepherd-cream border-b border-gray-100">
                <p className="text-xs font-medium text-shepherd-stone uppercase tracking-wide mb-2">AI Synthesis</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{synthesis[userId]}</p>
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {group.responses.map(r => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-900">{r.homework.title}</span>
                    {r.homework.scriptureRef && <span className="text-xs text-shepherd-stone">{r.homework.scriptureRef}</span>}
                    <span className="ml-auto text-xs text-gray-400">{new Date(r.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.responseText}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {responses.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">No responses submitted yet.</div>
        )}
      </div>
    </div>
  );
}
