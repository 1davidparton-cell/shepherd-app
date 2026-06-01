import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  notes: string | null;
  createdAt: string;
  homeworkStats: { total: number; completed: number };
}

const ROLES = ['husband', 'wife', 'male_disciple', 'female_disciple'];
const ROLE_LABELS: Record<string, string> = {
  husband: 'Husband', wife: 'Wife',
  male_disciple: 'Male Disciple', female_disciple: 'Female Disciple', admin: 'Admin',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'husband', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get<UserRecord[]>('/api/users').then(setUsers).catch(console.error);
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? users.filter(u => u.role !== 'admin') : users.filter(u => u.role === filter);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/api/users', form);
      setForm({ name: '', email: '', role: 'husband', notes: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-gray-900">People</h2>
          <p className="text-gray-500 text-sm">Manage counselees and disciples</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-shepherd-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-shepherd-navy-light transition-colors"
        >
          Add Person
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', ...ROLES].map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === r ? 'bg-shepherd-navy text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-shepherd-navy/30'
            }`}
          >
            {r === 'all' ? 'All' : ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-serif text-lg text-gray-900 mb-4">Add Person</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Google email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Notes (optional)" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-shepherd-navy text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Person'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No people found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Homework</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 bg-shepherd-navy/10 text-shepherd-navy rounded-full text-xs">{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.homeworkStats.completed}/{u.homeworkStats.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
