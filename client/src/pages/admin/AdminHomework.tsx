import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface HomeworkRecord {
  id: string;
  title: string;
  scriptureRef: string | null;
  instructions: string;
  type: string;
  dueDate: string | null;
  status: string;
  createdAt: string;
  assignedTo: { id: string; name: string; role: string };
  responses: { id: string; submittedAt: string }[];
}

interface HomeworkDetail extends HomeworkRecord {
  responses: { id: string; responseText: string; submittedAt: string }[];
}

interface UserRecord { id: string; name: string; role: string }

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  sent:      { label: 'Sent',        color: '#92610a', bg: '#fef3c7' },
  viewed:    { label: 'Viewed',      color: '#1e4a8a', bg: '#dbeafe' },
  responded: { label: 'Responded',   color: '#166534', bg: '#dcfce7' },
  rejected:  { label: 'Rejected',    color: '#6b7280', bg: '#f3f4f6' },
  failed:    { label: 'Send Failed', color: '#991b1b', bg: '#fee2e2' },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
      padding: '3px 10px', borderRadius: 99,
      color: meta.color, background: meta.bg,
    }}>
      {meta.label}
    </span>
  );
}

function BackArrow() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default function AdminHomework() {
  const [homework, setHomework] = useState<HomeworkRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selected, setSelected] = useState<HomeworkDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', scriptureRef: '', instructions: '', type: 'custom', assignedToId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);

  const load = () => Promise.all([
    api.get<HomeworkRecord[]>('/api/homework').then(setHomework),
    api.get<UserRecord[]>('/api/users').then(setUsers),
  ]).catch(console.error);

  useEffect(() => { load(); }, []);

  const openDetail = async (h: HomeworkRecord) => {
    setLoadingDetail(true);
    setSynthesis(null);
    try {
      const detail = await api.get<HomeworkDetail>(`/api/homework/${h.id}`);
      setSelected(detail);
    } finally {
      setLoadingDetail(false);
    }
  };

  const back = () => { setSelected(null); setSynthesis(null); load(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/homework', { ...form, dueDate: form.dueDate || undefined });
      setForm({ title: '', scriptureRef: '', instructions: '', type: 'custom', assignedToId: '', dueDate: '' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const resend = async (id: string) => {
    setResending(true);
    try {
      await api.post(`/api/homework/${id}/resend`, {});
      const detail = await api.get<HomeworkDetail>(`/api/homework/${id}`);
      setSelected(detail);
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/api/homework/${id}/status`, { status });
    const detail = await api.get<HomeworkDetail>(`/api/homework/${id}`);
    setSelected(detail);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/api/homework/${id}`);
    back();
  };

  const synthesize = async (userId: string) => {
    setSynthesizing(true);
    try {
      const result = await api.post<{ synthesis: string }>('/api/admin/responses/synthesize', { userId });
      setSynthesis(result.synthesis);
    } finally {
      setSynthesizing(false);
    }
  };

  if (loadingDetail) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--stone)' }}>
        Loading…
      </div>
    );
  }

  if (selected) {
    const hasResponses = selected.responses.length > 0;
    return (
      <>
        <div className="ad-head" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={back}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 600, padding: 0 }}
            >
              <BackArrow />
              Homework
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={selected.status} />
            {(selected.status === 'sent' || selected.status === 'failed') && (
              <button
                onClick={() => resend(selected.id)}
                disabled={resending}
                className="btn-ghost"
                style={{ fontSize: 12, padding: '6px 14px' }}
              >
                {resending ? 'Sending…' : 'Resend Email'}
              </button>
            )}
            {selected.status !== 'rejected' && selected.status !== 'responded' && (
              <button onClick={() => setStatus(selected.id, 'rejected')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Mark rejected
              </button>
            )}
            {selected.status === 'rejected' && (
              <button onClick={() => setStatus(selected.id, 'sent')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Restore
              </button>
            )}
            <button
              onClick={() => remove(selected.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1c9bc', fontSize: 18, lineHeight: 1 }}
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="ad-body">
          <div style={{ maxWidth: 720 }}>
            <div className="ahw" style={{ gap: 0, flexDirection: 'column', display: 'flex', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div className="dot" style={{ marginTop: 6 }} />
                <div className="body" style={{ flex: 1 }}>
                  <div className="t">{selected.title}</div>
                  {selected.scriptureRef && <div className="ref">{selected.scriptureRef}</div>}
                  <div className="meta">
                    <span>→ {selected.assignedTo.name}</span>
                    <span>Sent {new Date(selected.createdAt).toLocaleDateString()}</span>
                    {selected.dueDate && <span style={{ color: '#92610a', fontWeight: 600 }}>Due {new Date(selected.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #ece5d8' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--stone)', fontWeight: 600, marginBottom: 10 }}>Instructions</div>
                <p style={{ fontFamily: 'var(--body)', fontSize: 15.5, lineHeight: 1.74, color: '#33373f', margin: 0, whiteSpace: 'pre-wrap' }}>{selected.instructions}</p>
              </div>
            </div>

            {hasResponses ? (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--stone)', fontWeight: 600 }}>
                    {selected.responses.length} Response{selected.responses.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    className={synthesizing ? 'btn-ghost' : 'btn-primary'}
                    onClick={() => synthesize(selected.assignedTo.id)}
                    disabled={synthesizing}
                    style={{ fontSize: 12, padding: '7px 16px' }}
                  >
                    {synthesizing ? 'Synthesizing…' : '✦ AI Synthesis'}
                  </button>
                </div>

                {synthesis && (
                  <div className="rp-syn" style={{ marginBottom: 20 }}>
                    <div className="sl">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={14} height={14}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Synthesis
                    </div>
                    <p>{synthesis}</p>
                  </div>
                )}

                {selected.responses.map((r, i) => (
                  <div key={r.id} className="rp-entry">
                    <div className="q">
                      Response {i + 1} · {new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <p className="a">{r.responseText}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 28, textAlign: 'center', padding: '2.5rem 0', color: 'var(--stone)', fontSize: 14, fontStyle: 'italic' }}>
                No response submitted yet.
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ad-head">
        <div>
          <h1 className="ht">Homework</h1>
          <p className="hs">All assignments and their current status</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Assign Homework
        </button>
      </div>

      <div className="ad-body">
        {homework.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--stone)' }}>
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ marginBottom: 12, opacity: 0.4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>No homework assigned yet.</p>
          </div>
        )}
        <div className="hw-list">
          {homework.map(h => {
            const hasResponse = h.responses.length > 0;
            return (
              <div
                key={h.id}
                className="ahw"
                style={{ alignItems: 'flex-start', gap: 12, cursor: 'pointer', transition: 'box-shadow .15s' }}
                onClick={() => openDetail(h)}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 14px -6px rgba(26,39,68,.18)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
              >
                <div className="body" style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{h.title}</div>
                  {h.scriptureRef && <div className="ref">{h.scriptureRef}</div>}
                  <div className="meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                    <span>→ {h.assignedTo.name}</span>
                    <span>Sent {new Date(h.createdAt).toLocaleDateString()}</span>
                    {h.dueDate && <span style={{ color: '#92610a', fontWeight: 600 }}>Due {new Date(h.dueDate).toLocaleDateString()}</span>}
                    {hasResponse && (
                      <span style={{ color: '#166534', fontWeight: 600 }}>
                        {h.responses.length} response{h.responses.length !== 1 ? 's' : ''} →
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                  <StatusBadge status={h.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form onSubmit={submit} style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 460, boxShadow: '0 24px 60px -20px rgba(20,25,40,.5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontFamily: 'var(--head)', fontSize: 20, color: 'var(--navy)', margin: 0 }}>Assign Homework</h3>
            <div className="field">
              <label>Assign to</label>
              <select className="inp" required value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
                <option value="">Select person…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Title</label>
              <input className="inp" placeholder="Assignment title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="field">
              <label>Scripture (optional)</label>
              <input className="inp" placeholder="e.g. Romans 5:1-11" value={form.scriptureRef} onChange={e => setForm(f => ({ ...f, scriptureRef: e.target.value }))} />
            </div>
            <div className="field">
              <label>Instructions</label>
              <textarea className="inp" placeholder="What should they do or reflect on?" rows={4} required value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
            </div>
            <div className="field">
              <label>Due date (optional)</label>
              <input type="date" className="inp" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 2 }}>
                {saving ? '✦ Sending…' : 'Assign & Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
