import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

type Passage = {
  reference: string;
  canonical: string;
  html: string;
  translation: 'ESV' | 'KJV';
  why: string;
};

type WordResponse = {
  id: string;
  acknowledgment: string;
  passages: Passage[];
  practicalStep?: string;
  createdAt: string;
};

type HistoryEntry = WordResponse & {
  input: string;
  kind: string;
  canonical: string;
};

const STRUGGLES: { numeral: string; label: string; kind: string }[] = [
  { numeral: 'I',    label: 'lust',        kind: 'challenge' },
  { numeral: 'II',   label: 'rage',        kind: 'challenge' },
  { numeral: 'III',  label: 'shame',       kind: 'open' },
  { numeral: 'IV',   label: 'fear',        kind: 'open' },
  { numeral: 'V',    label: 'anxiety',     kind: 'open' },
  { numeral: 'VI',   label: 'comparison',  kind: 'open' },
  { numeral: 'VII',  label: 'identity',    kind: 'memory' },
  { numeral: 'VIII', label: 'former self', kind: 'memory' },
];

export default function PortalWord() {
  const [view, setView] = useState<'seek' | 'history'>('seek');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const entries = await api.get<HistoryEntry[]>('/api/word/history');
      setHistory(entries);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const switchToHistory = () => {
    setView('history');
    loadHistory();
  };

  const seek = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const matched = STRUGGLES.find(s => s.label === input.trim().toLowerCase());
    try {
      const data = await api.post<WordResponse>('/api/word/seek', {
        input: input.trim(),
        kind: matched?.kind ?? 'open',
      });
      setResult(data);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setInput('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {view === 'seek' && !result && (
        <SeekView
          input={input}
          setInput={setInput}
          loading={loading}
          error={error}
          onSeek={seek}
          onHistory={switchToHistory}
          textareaRef={textareaRef}
        />
      )}

      {view === 'seek' && result && (
        <ResultView
          result={result}
          resultRef={resultRef}
          onReset={reset}
          onHistory={switchToHistory}
        />
      )}

      {view === 'history' && (
        <HistoryView
          entries={history}
          loading={historyLoading}
          onBack={() => setView('seek')}
        />
      )}
    </div>
  );
}

function SeekView({
  input, setInput, loading, error, onSeek, onHistory, textareaRef,
}: {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSeek: () => void;
  onHistory: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div className="h-body">
      <blockquote className="h-epi">
        Your word is a lamp to my feet and a light to my path.
        <cite className="cite">Psalm 119:105</cite>
      </blockquote>

      <h2 className="h-prompt">What are you carrying?</h2>

      <p className="h-label">What are you fighting</p>
      <div className="h-chips">
        {STRUGGLES.map(s => (
          <button
            key={s.label}
            onClick={() => { setInput(s.label); textareaRef.current?.focus(); }}
            className={'h-chip' + (input === s.label ? ' sel' : '')}
          >
            <span className="gd" />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a89f8e' }}>{s.numeral}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <p className="h-label" style={{ marginTop: 20 }}>Or say it plainly</p>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value.slice(0, 2000))}
        onKeyDown={e => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onSeek(); }
        }}
        placeholder="What do you need?"
        rows={4}
        className={'h-field' + (!input.trim() ? ' empty' : '')}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#c6bba7', fontFamily: 'monospace' }}>{input.length} / 2000</span>
      </div>

      {error && <p style={{ color: '#b05050', fontSize: 14, marginTop: 12 }}>{error}</p>}

      <button
        onClick={onSeek}
        disabled={!input.trim() || loading}
        className="h-submit"
        style={{ marginTop: 14, opacity: !input.trim() || loading ? 0.4 : 1 }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        {loading ? 'Seeking...' : 'Receive the Word'}
      </button>

      <button
        onClick={onHistory}
        style={{ marginTop: 24, fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a89f8e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Past words →
      </button>
    </div>
  );
}

function ResultView({
  result, resultRef, onReset, onHistory,
}: {
  result: WordResponse;
  resultRef: React.RefObject<HTMLDivElement>;
  onReset: () => void;
  onHistory: () => void;
}) {
  return (
    <div ref={resultRef} className="h-body">
      <p className="h-ack">{result.acknowledgment}</p>

      {result.passages.map((p, i) => (
        <div key={i} className="h-passage">
          <div className="h-ref">
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#a89f8e', marginRight: 4 }}>{romanize(i + 1)}</span>
            {p.canonical}
            <span style={{ fontFamily: 'var(--ui)', fontSize: 10, color: '#c6bba7', marginLeft: 'auto' }}>{p.translation}</span>
          </div>
          <div
            className="h-text"
            dangerouslySetInnerHTML={{ __html: p.html || `<p>${p.reference}</p>` }}
          />
          <p className="h-why">{p.why}</p>
        </div>
      ))}

      {result.practicalStep && (
        <div className="h-step">
          <p className="sl">The next step</p>
          <p>{result.practicalStep}</p>
        </div>
      )}

      <div className="h-foot">
        <button onClick={onReset} className="h-again">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Seek again
        </button>
        <div className="h-saved">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </div>
      </div>

      <button
        onClick={onHistory}
        style={{ marginTop: 16, fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a89f8e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Past words
      </button>
    </div>
  );
}

function HistoryView({ entries, loading, onBack }: {
  entries: HistoryEntry[];
  loading: boolean;
  onBack: () => void;
}) {
  const fmt = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase();

  return (
    <div className="h-body">
      <button onClick={onBack} className="h-back">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="h-prompt" style={{ marginTop: 8 }}>Past Words</h2>

      {loading && <p style={{ fontSize: 14, color: 'var(--stone)', marginTop: 12 }}>Loading...</p>}

      {!loading && entries.length === 0 && (
        <div style={{ border: '1px dashed var(--card-line)', borderRadius: 14, padding: '40px 24px', textAlign: 'center', marginTop: 16 }}>
          <p style={{ fontFamily: 'var(--head)', color: 'var(--stone)', fontStyle: 'italic', margin: 0 }}>Nothing yet.</p>
          <p style={{ fontSize: 13, color: 'var(--stone)', marginTop: 6 }}>Every time you seek the Word here, it is kept.</p>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {entries.map(e => (
          <div key={e.id} className="h-passage">
            <div className="h-ref">
              <span style={{ color: 'var(--gold)' }}>{shortenCanonical(e.canonical)}</span>
              <span style={{ fontFamily: 'var(--ui)', fontSize: 10, color: '#c6bba7', marginLeft: 8 }}>{fmt(e.createdAt)}</span>
            </div>
            <p className="h-ack" style={{ fontSize: 15, margin: '0 0 4px' }}>{e.acknowledgment}</p>
            <p style={{ fontSize: 12, color: '#a89f8e', fontStyle: 'italic', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.input}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function romanize(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n - 1] ?? String(n);
}

function shortenCanonical(c: string): string {
  if (!c) return c;
  const m = c.match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)(?::(.+))?$/);
  if (!m) return c.toUpperCase();
  const abbrs: Record<string, string> = {
    Psalm: 'PS.', Psalms: 'PS.', Romans: 'ROM.', Ephesians: 'EPH.', Hebrews: 'HEB.',
    Matthew: 'MATT.', John: 'JOHN', Proverbs: 'PROV.',
    '1 Corinthians': '1 COR.', '2 Corinthians': '2 COR.', Galatians: 'GAL.',
    Philippians: 'PHIL.', Colossians: 'COL.', James: 'JAS.', '1 Peter': '1 PET.',
    '1 John': '1 JN.', Isaiah: 'ISA.', Jeremiah: 'JER.', Lamentations: 'LAM.',
  };
  const abbr = abbrs[m[1].trim()] ?? m[1].trim().toUpperCase();
  return m[3] ? `${abbr} ${m[2]}:${m[3]}` : `${abbr} ${m[2]}`;
}
