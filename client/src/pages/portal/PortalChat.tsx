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
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="bg-shepherd-navy/5 border border-shepherd-navy/10 rounded-xl p-5 mx-1">
            <p className="text-shepherd-navy text-sm leading-relaxed font-serif">{welcomeMessage}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-shepherd-navy text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-shepherd-stone rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-shepherd-stone rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-shepherd-stone rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Share what's on your heart..."
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-shepherd-navy/30"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="bg-shepherd-navy text-white rounded-xl p-2.5 disabled:opacity-40 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
