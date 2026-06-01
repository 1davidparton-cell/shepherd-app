import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  notes: string | null;
  createdAt: string;
  counselorId: string | null;
  _count: { disciples: number };
  homeworkStats: { total: number; completed: number };
}

const ROLE_LABELS: Record<string, string> = {
  disciple:     'Disciple',
  co_counselor: 'Co-counselor',
  counselor:    'Counselor',
};

const DISPLAY_ROLES = ['disciple', 'co_counselor', 'counselor'];

const AVATAR_COLORS: Record<string, string> = {
  disciple:     '#3a3a5f',
  co_counselor: '#1e4a3a',
  counselor:    '#1a2744',
};

function badgeClass(role: string) {
  if (role === 'counselor') return 'badge admin';
  if (role === 'co_counselor') return 'badge spouse';
  return 'badge disciple';
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'disciple', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get<UserRecord[]>('/api/users').then(setUsers).catch(console.error);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/api/users', form);
      setForm({ name: '', email: '', role: 'disciple', notes: '' });
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
          <p className="hs">Your disciples</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add Disciple
        </button>
      </div>

      <div className="ad-body">
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontFamily: 'var(--head)', fontSize: 18, color: 'var(--stone)', fontStyle: 'italic', margin: '0 0 8px' }}>
              No disciples yet.
            </p>
            <p style={{ fontSize: 13.5, color: '#a89f8e' }}>
              Add someone by their Google email and they'll be able to sign in as a Disciple.
            </p>
          </div>
        ) : (
          <div className="table">
            <div className="thead">
              <span>Name</span>
              <span>Role</span>
              <span>Email</span>
              <span>Homework</span>
              <span>Disciples</span>
            </div>
            {users.map(u => (
              <div key={u.id} className="trow">
                <div className="tname">
                  <div className="av" style={{ background: AVATAR_COLORS[u.role] ?? '#1e3a5f' }}>
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <b>{u.name}</b>
                </div>
                <span className={badgeClass(u.role)}>{ROLE_LABELS[u.role] ?? u.role}</span>
                <span className="temail">{u.email}</span>
                <div className="thw">
                  <span className="dotp" style={{ background: AVATAR_COLORS[u.role] ?? '#1e3a5f' }} />
                  {u.homeworkStats.completed}/{u.homeworkStats.total}
                </div>
                <span style={{ fontSize: 13, color: u._count.disciples > 0 ? 'var(--navy)' : '#c6bba7', fontWeight: u._count.disciples > 0 ? 600 : 400 }}>
                  {u._count.disciples > 0 ? `${u._count.disciples} disciple${u._count.disciples !== 1 ? 's' : ''}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 style={{ fontFamily: 'var(--head)', fontSize: 20, color: 'var(--navy)', margin: '0 0 18px' }}>Add Disciple</h3>
            {error && <p style={{ color: '#b05050', fontSize: 13.5, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Full name</label>
                <input className="inp" placeholder="Anthony Smith" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Google email</label>
                <input className="inp" placeholder="anthony@gmail.com" type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Display role</label>
                <select className="inp" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {DISPLAY_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <textarea className="inp" placeholder="Background, context..." rows={3} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                {saving ? 'Adding...' : 'Add Disciple'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
