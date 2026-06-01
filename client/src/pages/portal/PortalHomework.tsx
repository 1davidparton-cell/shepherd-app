import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface HomeworkResponse {
  id: string;
  responseText: string;
  submittedAt: string;
}

interface Homework {
  id: string;
  title: string;
  scriptureRef: string | null;
  instructions: string;
  dueDate: string | null;
  createdAt: string;
  assignedBy: { name: string };
  responses: HomeworkResponse[];
}

export default function PortalHomework() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get<Homework[]>('/api/homework/my')
      .then(setHomework)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const submit = async (id: string) => {
    const text = drafts[id]?.trim();
    if (!text) return;
    setSubmitting(id);
    try {
      await api.post(`/api/homework/${id}/respond`, { responseText: text });
      setDrafts(d => ({ ...d, [id]: '' }));
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontSize: 14, color: 'var(--stone)' }}>
      Loading…
    </div>
  );

  return (
    <div className="phw-body">
      <p className="phw-label">Your Assignments</p>

      {homework.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--stone)', margin: '4px 2px', fontStyle: 'italic' }}>
          Nothing assigned yet.
        </p>
      )}

      {homework.map(h => {
        const isOpen = expanded === h.id;
        const hasResponses = h.responses.length > 0;
        return (
          <div key={h.id} className="phw-card" style={{ marginBottom: 12 }}>
            <button
              onClick={() => setExpanded(isOpen ? null : h.id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{h.title}</div>
                {h.scriptureRef && <div className="ref">{h.scriptureRef}</div>}
                {h.dueDate && <div className="due">Due {new Date(h.dueDate).toLocaleDateString()}</div>}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: hasResponses ? '#2d6a4f' : '#a89f8e', marginLeft: 12, flexShrink: 0, paddingTop: 2 }}>
                {hasResponses ? `${h.responses.length} submitted` : 'Not started'}
              </span>
            </button>

            {isOpen && (
              <div style={{ marginTop: 14 }}>
                <p className="phw-instr" style={{ whiteSpace: 'pre-wrap' }}>{h.instructions}</p>

                {hasResponses && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--stone)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      Your responses
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {h.responses.map((r, i) => (
                        <div key={r.id} style={{ background: '#f5f1ea', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ fontSize: 11, color: 'var(--stone)', fontWeight: 600, margin: '0 0 4px' }}>
                            {i === 0 ? 'First response' : `Update ${i}`} · {new Date(r.submittedAt).toLocaleDateString()}
                          </p>
                          <p style={{ fontSize: 13.5, color: 'var(--ink)', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{r.responseText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--stone)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  {hasResponses ? 'Add another response' : 'Your response'}
                </p>
                <textarea
                  value={drafts[h.id] || ''}
                  onChange={e => setDrafts(d => ({ ...d, [h.id]: e.target.value }))}
                  placeholder="Write your response…"
                  rows={5}
                  className="phw-write"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'none' }}
                />
                <button
                  onClick={() => submit(h.id)}
                  disabled={submitting === h.id || !drafts[h.id]?.trim()}
                  className="phw-submit"
                  style={{ opacity: submitting === h.id || !drafts[h.id]?.trim() ? 0.4 : 1 }}
                >
                  {submitting === h.id ? 'Submitting…' : hasResponses ? 'Submit Update' : 'Submit Response'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
