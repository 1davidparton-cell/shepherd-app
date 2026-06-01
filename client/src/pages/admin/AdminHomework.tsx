import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface HomeworkRecord {
  id: string;
  title: string;
  scriptureRef: string | null;
  instructions: string;
  type: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string; role: string };
}

interface UserRecord { id: string; name: string; role: string }

const TYPES = ['scripture_reading', 'journaling', 'memory_verse', 'custom'];

export default function AdminHomework() {
  const [homework, setHomework] = useState<HomeworkRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', scriptureRef: '', instructions: '', type: 'scripture_reading', assignedToId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    api.get<HomeworkRecord[]>('/api/homework').then(setHomework),
    api.get<UserRecord[]>('/api/users').then(u => setUsers(u.filter(x => x.role !== 'admin'))),
  ]).catch(console.error);

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/homework', { ...form, dueDate: form.dueDate || undefined });
      setForm({ title: '', scriptureRef: '', instructions: '', type: 'scripture_reading', assignedToId: '', dueDate: '' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
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
          <p className="hs">Assign scripture, journaling, and memory work</p>
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
            <div key={h.id} className={'ahw' + (h.completedAt ? ' done' : '')}>
              <div className="dot" />
              <div className="body">
                <div className="t">{h.title}</div>
                {h.scriptureRef && <div className="ref">{h.scriptureRef}</div>}
                <div className="meta">
                  Assigned to {h.assignedTo.name}
                  {h.dueDate && <> · Due {new Date(h.dueDate).toLocaleDateString()}</>}
                </div>
              </div>
              <span className="st">{h.completedAt ? 'Completed' : 'Pending'}</span>
              <button
                onClick={() => remove(h.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', marginLeft: 8 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-serif text-lg text-gray-900">Assign Homework</h3>
            <div className="field">
              <select className="inp" required value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
                <option value="">Assign to...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field">
              <select className="inp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="field">
              <input className="inp" placeholder="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="field">
              <input className="inp" placeholder="Scripture reference (e.g. Romans 5:1-11)" value={form.scriptureRef} onChange={e => setForm(f => ({ ...f, scriptureRef: e.target.value }))} />
            </div>
            <div className="field">
              <textarea className="inp" placeholder="Instructions / reflection questions" rows={4} required value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
            </div>
            <div className="field">
              <input type="date" className="inp" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
