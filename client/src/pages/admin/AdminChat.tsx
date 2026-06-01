import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface Message { role: 'user' | 'assistant'; content: string }
interface Session { id: string; contextId: string | null; messages: Message[]; updatedAt: string }
interface UserRecord { id: string; name: string; role: string }

export default function AdminChat() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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

  return (
    <div className="h-screen flex">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900 text-sm">Counselees</h3>
        </div>
        <div className="flex-1 overflow-auto">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => startSession(u)}
              className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                selectedUser?.id === u.id ? 'bg-shepherd-navy/5 border-l-2 border-l-shepherd-gold' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{u.name}</div>
              <div className="text-gray-400 text-xs capitalize">{u.role.replace('_', ' ')}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">✦</div>
              <p className="text-sm">Select a counselee to begin</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
              <p className="text-xs text-gray-400 capitalize">{selectedUser.role.replace('_', ' ')}</p>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  Start the counseling session. Ask about their progress, generate questions, or compare responses.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-shepherd-navy text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="What should we address next? Generate questions, compare responses..."
                  rows={2}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-shepherd-navy/40"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="bg-shepherd-navy text-white rounded-lg px-4 py-2 text-sm disabled:opacity-40 self-end"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
