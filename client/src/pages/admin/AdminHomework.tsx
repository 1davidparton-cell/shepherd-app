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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-gray-900">Homework</h2>
          <p className="text-gray-500 text-sm">Assign scripture, journaling, and memory work</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-shepherd-navy text-white px-4 py-2 rounded-lg text-sm">
          Assign Homework
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-serif text-lg text-gray-900">Assign Homework</h3>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
              <option value="">Assign to...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Scripture reference (e.g. Romans 5:1-11)" value={form.scriptureRef} onChange={e => setForm(f => ({ ...f, scriptureRef: e.target.value }))} />
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Instructions / reflection questions" rows={4} required value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-shepherd-navy text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {saving ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {homework.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">No homework assigned yet.</div>}
        {homework.map(h => (
          <div key={h.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${h.completedAt ? 'bg-green-400' : 'bg-shepherd-gold'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-gray-900 text-sm">{h.title}</span>
                {h.scriptureRef && <span className="text-xs text-shepherd-stone">{h.scriptureRef}</span>}
              </div>
              <p className="text-xs text-gray-500 mb-1">Assigned to {h.assignedTo.name} · {h.completedAt ? 'Completed' : 'Pending'}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{h.instructions}</p>
            </div>
            <button onClick={() => remove(h.id)} className="text-gray-300 hover:text-red-400 text-sm shrink-0">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
