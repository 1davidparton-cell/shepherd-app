import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface Message { role: 'user' | 'assistant'; content: string }
interface Session { id: string; contextId: string | null; messages: Message[]; updatedAt: string }
interface Relationship { type: string; person: { id: string; name: string } }
interface UserRecord { id: string; name: string; email: string; role: string; notes?: string; relationships?: Relationship[] }
interface HomeworkResponse { id: string; responseText: string; submittedAt: string }
interface HomeworkRecord {
  id: string;
  title: string;
  scriptureRef: string | null;
  instructions: string;
  createdAt: string;
  responses: HomeworkResponse[];
}

const ROLE_COLORS: Record<string, string> = {
  disciple:     '#3a3a5f',
  co_counselor: '#1e4a3a',
  counselor:    '#1a2744',
};

const ROLE_LABELS: Record<string, string> = {
  disciple:     'Disciple',
  co_counselor: 'Co-counselor',
  counselor:    'Counselor',
};

const REL_LABELS: Record<string, string> = {
  spouse: 'Spouse', sibling: 'Sibling', parent: 'Parent', child: 'Child',
};

const DISPLAY_ROLES = ['disciple', 'co_counselor', 'counselor'];

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminChat() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [homework, setHomework] = useState<HomeworkRecord[]>([]);
  const [expandedHw, setExpandedHw] = useState<string | null>(null);

  // Add disciple modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'disciple', notes: '', linkToId: '', linkType: 'spouse' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit disciple modal
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'disciple', notes: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [relForm, setRelForm] = useState({ toId: '', type: 'spouse' });
  const [relSaving, setRelSaving] = useState(false);

  // Send homework modal
  const [showSend, setShowSend] = useState(false);
  const [hwForm, setHwForm] = useState({ title: '', scriptureRef: '', instructions: '' });
  const [hwSaving, setHwSaving] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadUsers = () =>
    api.get<UserRecord[]>('/api/users').then(setUsers).catch(console.error);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openEdit = (u: UserRecord) => {
    setEditing(u);
    setEditForm({ name: u.name, email: u.email || '', role: u.role, notes: u.notes || '' });
    setRelForm({ toId: '', type: 'spouse' });
  };

  const selectUser = async (user: UserRecord) => {
    setSelectedUser(user);
    setMessages([]);
    setHomework([]);

    // Load or create AI builder session
    const sessions = await api.get<Session[]>('/api/chat/sessions');
    const existing = sessions.find(s => s.contextId === user.id);
    if (existing) {
      setSession(existing);
      setMessages(existing.messages);
    } else {
      const created = await api.post<Session>('/api/chat/sessions', { contextId: user.id });
      setSession(created);
    }

    // Load their homework + submissions
    if (user.role !== 'counselor') {
      api.get<HomeworkRecord[]>(`/api/homework/disciple/${user.id}`)
        .then(setHomework)
        .catch(console.error);
    }
  };

  const send = async () => {
    if (!input.trim() || !session || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const result = await api.post<{ content: string; messages: Message[] }>(
        `/api/chat/sessions/${session.id}/message`,
        { content: userMsg, contextId: selectedUser?.id }
      );
      setMessages(result.messages);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${(err as Error).message}` }]);
    } finally {
      setSending(false);
    }
  };

  const sendHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setHwSaving(true);
    try {
      await api.post('/api/homework', {
        ...hwForm,
        assignedToId: selectedUser.id,
      });
      setHwForm({ title: '', scriptureRef: '', instructions: '' });
      setShowSend(false);
      const fresh = await api.get<HomeworkRecord[]>(`/api/homework/disciple/${selectedUser.id}`);
      setHomework(fresh);
    } finally {
      setHwSaving(false);
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true); setAddError('');
    try {
      await api.post('/api/users', addForm);
      setAddForm({ name: '', email: '', role: 'disciple', notes: '', linkToId: '', linkType: 'spouse' });
      setShowAdd(false);
      loadUsers();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAddSaving(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    try {
      await api.put(`/api/users/${editing.id}`, editForm);
      const fresh = await api.get<UserRecord[]>('/api/users');
      setUsers(fresh);
      setEditing(fresh.find(u => u.id === editing.id)!);
    } finally {
      setEditSaving(false);
    }
  };

  const addRelationship = async () => {
    if (!editing || !relForm.toId) return;
    setRelSaving(true);
    try {
      await api.post(`/api/users/${editing.id}/relationships`, { toId: relForm.toId, type: relForm.type });
      setRelForm({ toId: '', type: 'spouse' });
      const fresh = await api.get<UserRecord[]>('/api/users');
      setUsers(fresh);
      setEditing(fresh.find(u => u.id === editing.id)!);
    } finally {
      setRelSaving(false);
    }
  };

  const removeRelationship = async (toId: string) => {
    if (!editing) return;
    await api.delete(`/api/users/${editing.id}/relationships/${toId}`);
    const fresh = await api.get<UserRecord[]>('/api/users');
    setUsers(fresh);
    setEditing(fresh.find(u => u.id === editing.id)!);
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  const relCandidates = editing
    ? users.filter(u => u.id !== editing.id && !editing.relationships?.some(r => r.person.id === u.id))
    : [];

  return (
    <div className="ac">
      {/* Left panel */}
      <div className="ac-list">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px 6px' }}>
          <div className="ac-search" style={{ flex: 1, margin: 0 }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 13, fontFamily: 'var(--ui)', color: 'var(--ink)' }}
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, flexShrink: 0 }}>
            + Add
          </button>
        </div>

        <div className="ac-people">
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, color: '#a89f8e', textAlign: 'center', padding: '2rem 12px', fontStyle: 'italic', fontFamily: 'var(--head)' }}>
              {users.length === 0 ? 'No disciples yet. Add one to begin.' : 'No results.'}
            </p>
          )}
          {filtered.map(u => (
            <div
              key={u.id}
              className={'ac-person' + (selectedUser?.id === u.id ? ' active' : '')}
              onClick={() => selectUser(u)}
            >
              <div className="av" style={{ background: ROLE_COLORS[u.role] ?? '#1e3a5f' }}>
                {initials(u.name)}
              </div>
              <div className="tx">
                <div className="r1"><span className="nm">{u.name}</span></div>
                <div className="sn">
                  {u.role === 'counselor'
                    ? 'Private counselor account'
                    : u.relationships && u.relationships.length > 0
                      ? u.relationships.map(r => `${REL_LABELS[r.type] ?? r.type} of ${r.person.name}`).join(' · ')
                      : 'Build homework'}
                </div>
                <div className="rl">{ROLE_LABELS[u.role] ?? u.role}</div>
              </div>
              <button
                className="ac-edit-btn"
                title="Edit"
                onClick={e => { e.stopPropagation(); openEdit(u); }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="ac-panel">
        {!selectedUser ? (
          <div className="ac-empty">
            <p>Select a disciple to build their homework.</p>
          </div>
        ) : selectedUser.role === 'counselor' ? (
          <div className="ac-empty" style={{ flexDirection: 'column', gap: 14 }}>
            <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c5bbaa' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--head)', fontSize: 16, color: 'var(--navy)', margin: '0 0 6px', fontWeight: 600 }}>{selectedUser.name}</p>
              <p style={{ fontSize: 13.5, color: 'var(--stone)', margin: 0, maxWidth: 260, lineHeight: 1.6 }}>
                This is a private counselor account. Their sessions and disciples are not visible to you.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="ac-phead">
              <div className="who">
                <b>{selectedUser.name}</b>
                <span>{ROLE_LABELS[selectedUser.role] ?? selectedUser.role}</span>
              </div>
              <button
                className="btn-primary"
                style={{ fontSize: 12.5, padding: '8px 16px', borderRadius: 8 }}
                onClick={() => setShowSend(true)}
              >
                Send Homework to {selectedUser.name.split(' ')[0]}
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 6, display: 'inline' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* AI Builder */}
            <div className="ac-msgs" style={{ flex: '1 1 0', minHeight: 0 }}>
              {messages.length === 0 && (
                <p style={{ color: 'var(--stone)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', lineHeight: 1.7 }}>
                  Paste their latest responses, describe what you want to address, or ask for homework ideas. When you're ready, hit <strong>Send Homework</strong>.
                </p>
              )}
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} className="ac-msg ac-user">{m.content}</div>
                ) : (
                  <div key={i} className="ac-msg ac-ai">
                    <p className="lbl">Shepherd</p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
                  </div>
                )
              ))}
              {sending && (
                <div className="ac-msg ac-ai">
                  <p className="lbl">Shepherd</p>
                  <div className="typing" style={{ padding: '2px 0' }}><i /><i /><i /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="ac-input">
              <textarea
                className="ac-field"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Paste responses, describe context, or ask for homework ideas for ${selectedUser.name.split(' ')[0]}…`}
                rows={2}
                style={{ resize: 'none' }}
              />
              <button className="btn-primary" onClick={send} disabled={sending || !input.trim()}>
                Ask AI
              </button>
            </div>

            {/* Submission history */}
            {homework.length > 0 && (
              <div style={{ borderTop: '1px solid #e9e2d6', padding: '16px 24px', background: '#fbf8f2', maxHeight: 280, overflowY: 'auto' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--stone)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  Submissions
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {homework.map(h => (
                    <div key={h.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e3dccd', overflow: 'hidden' }}>
                      <button
                        onClick={() => setExpandedHw(expandedHw === h.id ? null : h.id)}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{h.title}</span>
                        <span style={{ fontSize: 11.5, color: h.responses.length > 0 ? '#2d6a4f' : '#a89f8e', fontWeight: 600 }}>
                          {h.responses.length > 0 ? `${h.responses.length} response${h.responses.length !== 1 ? 's' : ''}` : 'No responses'}
                        </span>
                      </button>
                      {expandedHw === h.id && (
                        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #ede7da' }}>
                          {h.scriptureRef && <p style={{ fontSize: 11.5, color: 'var(--gold)', fontWeight: 600, margin: '8px 0 6px' }}>{h.scriptureRef}</p>}
                          <p style={{ fontSize: 12.5, color: 'var(--stone)', margin: '6px 0 10px', fontStyle: 'italic' }}>{h.instructions}</p>
                          {h.responses.length === 0 ? (
                            <p style={{ fontSize: 12.5, color: '#a89f8e' }}>No responses yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {h.responses.map((r, i) => (
                                <div key={r.id} style={{ background: '#f5f1ea', borderRadius: 8, padding: '8px 10px' }}>
                                  <p style={{ fontSize: 11, color: 'var(--stone)', margin: '0 0 4px', fontWeight: 600 }}>
                                    Response {i + 1} · {new Date(r.submittedAt).toLocaleDateString()}
                                  </p>
                                  <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>{r.responseText}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Send Homework modal */}
      {showSend && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowSend(false); }}>
          <form onSubmit={sendHomework} style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 460, boxShadow: '0 24px 60px -20px rgba(20,25,40,.5)' }}>
            <h3 style={{ fontFamily: 'var(--head)', fontSize: 20, color: 'var(--navy)', margin: '0 0 4px' }}>Send Homework</h3>
            <p style={{ fontSize: 12.5, color: 'var(--stone)', margin: '0 0 20px' }}>to {selectedUser.name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Title</label>
                <input className="inp" placeholder="e.g. Repentance and the Heart" value={hwForm.title}
                  onChange={e => setHwForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Scripture reference (optional)</label>
                <input className="inp" placeholder="e.g. James 1:14-15" value={hwForm.scriptureRef}
                  onChange={e => setHwForm(f => ({ ...f, scriptureRef: e.target.value }))} />
              </div>
              <div className="field">
                <label>Instructions</label>
                <textarea className="inp" placeholder="Reflection questions, tasks, or reading…" rows={5} value={hwForm.instructions}
                  onChange={e => setHwForm(f => ({ ...f, instructions: e.target.value }))} required style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowSend(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={hwSaving} className="btn-primary" style={{ flex: 2 }}>
                {hwSaving ? 'Sending…' : `Send to ${selectedUser.name.split(' ')[0]}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add disciple modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <form onSubmit={submitAdd} style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px -20px rgba(20,25,40,.5)' }}>
            <h3 style={{ fontFamily: 'var(--head)', fontSize: 20, color: 'var(--navy)', margin: '0 0 20px' }}>Add Disciple</h3>
            {addError && <p style={{ color: '#b05050', fontSize: 13, marginBottom: 12 }}>{addError}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Full name</label>
                <input className="inp" placeholder="Anthony Smith" value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Google email</label>
                <input className="inp" placeholder="anthony@gmail.com" type="email" value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Role</label>
                <select className="inp" value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                  {DISPLAY_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <textarea className="inp" placeholder="Background, context…" rows={2} value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {users.length > 0 && (
                <div style={{ borderTop: '1px solid #e8e2d6', paddingTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--stone)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                    Link to another disciple
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="field" style={{ flex: 1, margin: 0 }}>
                      <label>Person</label>
                      <select className="inp" value={addForm.linkToId} onChange={e => setAddForm(f => ({ ...f, linkToId: e.target.value }))}>
                        <option value="">None</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    {addForm.linkToId && (
                      <div className="field" style={{ flex: 1, margin: 0 }}>
                        <label>They are the</label>
                        <select className="inp" value={addForm.linkType} onChange={e => setAddForm(f => ({ ...f, linkType: e.target.value }))}>
                          <option value="spouse">Spouse</option>
                          <option value="sibling">Sibling</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={addSaving} className="btn-primary" style={{ flex: 1 }}>
                {addSaving ? 'Adding…' : 'Add Disciple'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit disciple modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 460, boxShadow: '0 24px 60px -20px rgba(20,25,40,.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--head)', fontSize: 20, color: 'var(--navy)', margin: '0 0 18px' }}>Edit Disciple</h3>
            <form onSubmit={submitEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label>Full name</label>
                  <input className="inp" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="inp" type="email" value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="their@email.com" />
                </div>
                <div className="field">
                  <label>Role</label>
                  <select className="inp" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    {DISPLAY_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Notes</label>
                  <textarea className="inp" placeholder="Background, context…" rows={2} value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={editSaving} className="btn-primary" style={{ width: '100%', marginTop: 14 }}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid #e8e2d6', marginTop: 24, paddingTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', margin: '0 0 12px' }}>Relationships</p>
              {editing.relationships && editing.relationships.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {editing.relationships.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#f5f1ea', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{REL_LABELS[r.type] ?? r.type}</span>{' of '}{r.person.name}
                      </span>
                      <button onClick={() => removeRelationship(r.person.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b05050', padding: '2px 6px', fontSize: 17, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#a89f8e', fontStyle: 'italic', marginBottom: 16 }}>No relationships linked yet.</p>
              )}
              {relCandidates.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 1, margin: 0 }}>
                    <label>Person</label>
                    <select className="inp" value={relForm.toId} onChange={e => setRelForm(f => ({ ...f, toId: e.target.value }))}>
                      <option value="">Select…</option>
                      {relCandidates.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="field" style={{ flex: 1, margin: 0 }}>
                    <label>They are the</label>
                    <select className="inp" value={relForm.type} onChange={e => setRelForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="spouse">Spouse</option>
                      <option value="sibling">Sibling</option>
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                    </select>
                  </div>
                  <button onClick={addRelationship} disabled={!relForm.toId || relSaving} className="btn-primary" style={{ padding: '9px 16px', flexShrink: 0 }}>
                    {relSaving ? '…' : 'Link'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              <button onClick={() => setEditing(null)} className="btn-ghost" style={{ width: '100%' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
