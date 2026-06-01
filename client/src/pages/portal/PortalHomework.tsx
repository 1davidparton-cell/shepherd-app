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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontSize: 14, color: 'var(--stone)' }}>
      Loading...
    </div>
  );

  return (
    <div className="phw-body">
      <p className="phw-label">Assigned to You</p>

      {pending.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--stone)', margin: '4px 2px' }}>No pending assignments.</p>
      )}

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

      {done.length > 0 && (
        <>
          <p className="phw-done-head">Completed</p>
          {done.map(h => (
            <div key={h.id} className="phw-done">
              <div className="ck">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{h.title}</div>
                {h.scriptureRef && <div className="ref">{h.scriptureRef}</div>}
              </div>
            </div>
          ))}
        </>
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
    <div className="phw-card">
      <button onClick={onExpand} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <div className="t">{hw.title}</div>
        {hw.scriptureRef && <div className="ref">{hw.scriptureRef}</div>}
        {hw.dueDate && <div className="due">Due {new Date(hw.dueDate).toLocaleDateString()}</div>}
      </button>

      {expanded && (
        <>
          <p className="phw-instr">{hw.instructions}</p>
          <textarea
            value={response}
            onChange={e => onResponse(e.target.value)}
            placeholder="Write your response..."
            rows={5}
            className="phw-write"
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none' }}
          />
          <button
            onClick={onSubmit}
            disabled={submitting || !response.trim()}
            className="phw-submit"
            style={{ opacity: submitting || !response.trim() ? 0.4 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </>
      )}
    </div>
  );
}
