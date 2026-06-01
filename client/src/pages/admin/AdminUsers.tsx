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

const AVATAR_COLORS: Record<string, string> = {
  husband: '#1e3a5f',
  wife: '#5f3a1e',
  male_disciple: '#1e4a3a',
  female_disciple: '#4a1e3a',
  admin: '#3a3a3a',
};

const ROLE_DOT_COLORS: Record<string, string> = {
  husband: '#1e3a5f',
  wife: '#5f3a1e',
  male_disciple: '#1e4a3a',
  female_disciple: '#4a1e3a',
  admin: '#3a3a3a',
};

function badgeClass(role: string) {
  if (role === 'husband' || role === 'wife') return 'badge spouse';
  if (role === 'admin') return 'badge admin';
  return 'badge disciple';
}

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
    <>
      <div className="ad-head">
        <div>
          <h1 className="ht">People</h1>
          <p className="hs">Manage counselees and disciples</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add Person
        </button>
      </div>

      <div className="ad-body">
        <div className="ad-filters">
          {['all', ...ROLES].map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={'fpill' + (filter === r ? ' on' : '')}
            >
              {r === 'all' ? 'All' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--stone)', fontSize: '0.875rem', padding: '2rem 0', textAlign: 'center' }}>No people found.</p>
        ) : (
          <div className="table">
            <div className="thead">
              <span>Name</span>
              <span>Role</span>
              <span>Email</span>
              <span>Homework</span>
              <span />
            </div>
            {filtered.map(u => (
              <div key={u.id} className="trow">
                <div className="tname">
                  <div className="av" style={{ background: AVATAR_COLORS[u.role] ?? '#1e3a5f' }}>
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <b>{u.name}</b>
                </div>
                <span className={badgeClass(u.role)}>{ROLE_LABELS[u.role]}</span>
                <span className="temail">{u.email}</span>
                <div className="thw">
                  <span className="dotp" style={{ background: ROLE_DOT_COLORS[u.role] ?? '#1e3a5f' }} />
                  {u.homeworkStats.completed}/{u.homeworkStats.total}
                </div>
                <span className="kebab">⋯</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-serif text-lg text-gray-900 mb-4">Add Person</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div className="field">
                <input className="inp" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="field">
                <input className="inp" placeholder="Google email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="field">
                <select className="inp" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="field">
                <textarea className="inp" placeholder="Notes (optional)" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Adding...' : 'Add Person'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
