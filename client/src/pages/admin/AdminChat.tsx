import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface Message { role: 'user' | 'assistant'; content: string }
interface Session { id: string; contextId: string | null; messages: Message[]; updatedAt: string }
interface UserRecord { id: string; name: string; role: string }

const ROLE_COLORS: Record<string, string> = {
  husband: '#1e3a5f',
  wife: '#5f3a1e',
  male_disciple: '#1e4a3a',
  female_disciple: '#4a1e3a',
  admin: '#3a3a3a',
};

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<UserRecord[]>('/api/users').then(u => setUsers(u.filter(x => x.role !== 'admin'))).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async (user: UserRecord) => {
    setSelectedUser(user);
    const sessions = await api.get<Session[]>('/api/chat/sessions');
    const existing = sessions.find(s => s.contextId === user.id);
    if (existing) {
      setSession(existing);
      setMessages(existing.messages);
    } else {
      const created = await api.post<Session>('/api/chat/sessions', { contextId: user.id });
      setSession(created);
      setMessages([]);
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
        { content: userMsg, contextType: 'user', contextId: selectedUser?.id }
      );
      setMessages(result.messages);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${(err as Error).message}` }]);
    } finally {
      setSending(false);
    }
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ac">
      <div className="ac-list">
        <div className="ac-search">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search counselees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ac-people">
          {filtered.map(u => (
            <div
              key={u.id}
              className={'ac-person' + (selectedUser?.id === u.id ? ' active' : '')}
              onClick={() => startSession(u)}
            >
              <div className="av" style={{ background: ROLE_COLORS[u.role] ?? '#1e3a5f' }}>
                {initials(u.name)}
              </div>
              <div className="tx">
                <div className="r1">
                  <span>{u.name}</span>
                </div>
                <div className="sn">Start or continue session</div>
                <div className="rl">{u.role.replace('_', ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ac-panel">
        {!selectedUser ? (
          <div className="ac-empty">
            <p>Select a counselee to begin a session.</p>
          </div>
        ) : (
          <>
            <div className="ac-phead">
              <div className="who">
                <b>{selectedUser.name}</b>
                <span>{selectedUser.role.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ac-pill">View Homework</button>
                <button className="ac-pill">Responses</button>
              </div>
            </div>

            <div className="ac-msgs">
              {messages.length === 0 && (
                <p style={{ color: 'var(--col-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                  Start the counseling session. Ask about their progress, generate questions, or compare responses.
                </p>
              )}
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} className="ac-msg ac-user">{m.content}</div>
                ) : (
                  <div key={i} className="ac-msg ac-ai">
                    <p className="lbl">Shepherd</p>
                    <p>{m.content}</p>
                  </div>
                )
              ))}
              {sending && (
                <div className="ac-msg ac-ai">
                  <p className="lbl">Shepherd</p>
                  <p style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="ac-input">
              <textarea
                className="ac-field"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="What should we address next? Generate questions, compare responses..."
                rows={2}
              />
              <button
                className="btn-primary"
                onClick={send}
                disabled={sending || !input.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
