import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Message { role: 'user' | 'assistant'; content: string }

export default function PortalChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get<{ messages: Message[] }>('/api/portal/chat')
      .then(d => setMessages(d.messages))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const result = await api.post<{ content: string; messages: Message[] }>('/api/portal/chat/message', { content: userMsg });
      setMessages(result.messages);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `I'm sorry, something went wrong. Please try again.` }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const isWife = user?.role === 'wife' || user?.role === 'female_disciple';

  const welcomeMessage = isWife
    ? `This is your personal space. Share what you're carrying — frustration, confusion, grief, questions. I'm here to listen first, and then to walk with you toward what the Lord says in the middle of it.`
    : `This is your space to be honest — about struggle, failure, or anything you're facing. I'll receive what you share without condemnation. And I'll be direct with you about what faithfulness looks like from here.`;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontSize: 14, color: 'var(--stone)' }}>Loading...</div>;
  }

  return (
    <div className="chat-body" style={{ height: '100%' }}>
      <div className="chat-scroll" style={{ overflowY: 'auto', flex: 1 }}>
        {messages.length === 0 && (
          <div className="chat-welcome">
            <p className="cw-label">Your counseling space</p>
            <p className="cw-text">{welcomeMessage}</p>
          </div>
        )}

        {messages.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className="msg msg-user">
              <p>{m.content}</p>
            </div>
          ) : (
            <div key={i} className="msg msg-ai">
              <div className="ai-text">
                <p>{m.content}</p>
              </div>
            </div>
          )
        ))}

        {sending && (
          <div className="typing">
            <i /><i /><i />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Share what's on your heart..."
          rows={2}
          className="ci-field"
          style={{ resize: 'none' }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="ci-send"
          style={{ opacity: sending || !input.trim() ? 0.4 : 1 }}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
