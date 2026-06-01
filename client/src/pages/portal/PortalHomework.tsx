import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Homework {
  id: string;
  title: string;
  scriptureRef: string | null;
  instructions: string;
  type: string;
  dueDate: string | null;
  completed: boolean;
  myResponse: { responseText: string; submittedAt: string } | null;
  assignedBy: { name: string };
}

export default function PortalHomework() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get<Homework[]>('/api/homework/my').then(setHomework).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (id: string) => {
    const text = responses[id];
    if (!text?.trim()) return;
    setSubmitting(id);
    try {
      await api.post(`/api/homework/${id}/respond`, { responseText: text });
      load();
      setExpanded(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  const pending = homework.filter(h => !h.completed);
  const done = homework.filter(h => h.completed);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-serif text-shepherd-navy px-1 mb-3">Assigned to You</h2>
        {pending.length === 0 && (
          <p className="text-gray-400 text-sm px-1">No pending assignments.</p>
        )}
        <div className="space-y-3">
          {pending.map(h => (
            <HomeworkCard
              key={h.id}
              hw={h}
              expanded={expanded === h.id}
              onExpand={() => setExpanded(expanded === h.id ? null : h.id)}
              response={responses[h.id] || ''}
              onResponse={text => setResponses(r => ({ ...r, [h.id]: text }))}
              onSubmit={() => submit(h.id)}
              submitting={submitting === h.id}
            />
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 px-1 mb-3">Completed</h3>
          <div className="space-y-2">
            {done.map(h => (
              <div key={h.id} className="bg-white rounded-xl border border-gray-100 p-4 opacity-60">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{h.title}</span>
                  {h.scriptureRef && <span className="text-xs text-shepherd-stone">{h.scriptureRef}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HomeworkCard({ hw, expanded, onExpand, response, onResponse, onSubmit, submitting }: {
  hw: Homework;
  expanded: boolean;
  onExpand: () => void;
  response: string;
  onResponse: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={onExpand} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-shepherd-gold mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm">{hw.title}</div>
            {hw.scriptureRef && <div className="text-xs text-shepherd-stone mt-0.5">{hw.scriptureRef}</div>}
            {hw.dueDate && <div className="text-xs text-gray-400 mt-0.5">Due {new Date(hw.dueDate).toLocaleDateString()}</div>}
          </div>
          <svg className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{hw.instructions}</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Your Response</label>
            <textarea
              value={response}
              onChange={e => onResponse(e.target.value)}
              placeholder="Write your response..."
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-shepherd-navy/30"
            />
          </div>
          <button
            onClick={onSubmit}
            disabled={submitting || !response.trim()}
            className="w-full bg-shepherd-navy text-white rounded-lg py-2.5 text-sm disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      )}
    </div>
  );
}
