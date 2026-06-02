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

interface UserRecord { id: string; name: string; role: string }

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  sent:      { label: 'Sent',      color: '#92610a', bg: '#fef3c7' },
  viewed:    { label: 'Viewed',    color: '#1e4a8a', bg: '#dbeafe' },
  responded: { label: 'Responded', color: '#166534', bg: '#dcfce7' },
  rejected:  { label: 'Rejected',  color: '#6b7280', bg: '#f3f4f6' },
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

export default function AdminHomework() {
  const [homework, setHomework] = useState<HomeworkRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', scriptureRef: '', instructions: '', type: 'custom', assignedToId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  const load = () => Promise.all([
    api.get<HomeworkRecord[]>('/api/homework').then(setHomework),
    api.get<UserRecord[]>('/api/users').then(setUsers),
  ]).catch(console.error);

  useEffect(() => { load(); }, []);

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
    setResending(id);
    try {
      await api.post(`/api/homework/${id}/resend`, {});
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setResending(null);
    }
  };

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/api/homework/${id}/status`, { status });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/api/homework/${id}`);
    load();
  };

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
          <p style={{ color: 'var(--stone)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No homework assigned yet.</p>
        )}
        <div className="hw-list">
          {homework.map(h => (
            <div key={h.id} className="ahw" style={{ alignItems: 'flex-start', gap: 12 }}>
              <div className="body" style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{h.title}</div>
                {h.scriptureRef && <div className="ref">{h.scriptureRef}</div>}
                <div className="meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                  <span>→ {h.assignedTo.name}</span>
                  <span>Sent {new Date(h.createdAt).toLocaleDateString()}</span>
                  {h.dueDate && <span style={{ color: '#92610a', fontWeight: 600 }}>Due {new Date(h.dueDate).toLocaleDateString()}</span>}
                  {h.responses.length > 0 && <span style={{ color: '#166534' }}>{h.responses.length} response{h.responses.length !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusBadge status={h.status} />
                  {(h.status === 'sent' || h.status === 'failed') && (
                    <button
                      onClick={() => resend(h.id)}
                      disabled={resending === h.id}
                      title="Resend email"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: h.status === 'failed' ? '#991b1b' : '#92610a', display: 'flex', alignItems: 'center' }}
                    >
                      <svg
                        width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                        style={{ transition: 'transform 0.6s ease', transform: resending === h.id ? 'rotate(360deg)' : 'rotate(0deg)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
                {h.status !== 'rejected' && h.status !== 'responded' && (
                  <button
                    onClick={() => setStatus(h.id, 'rejected')}
                    style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Mark rejected
                  </button>
                )}
                {h.status === 'rejected' && (
                  <button
                    onClick={() => setStatus(h.id, 'sent')}
                    style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Restore
                  </button>
                )}
              </div>

              <button
                onClick={() => remove(h.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1c9bc', fontSize: 18, lineHeight: 1, flexShrink: 0, alignSelf: 'center' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
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
                {saving ? 'Sending…' : 'Assign & Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
