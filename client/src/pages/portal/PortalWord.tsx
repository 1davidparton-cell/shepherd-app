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
    <div className="p-5 max-w-2xl mx-auto">
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
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-shepherd-navy mb-1">The Word</h2>
        <p className="text-sm text-shepherd-stone leading-relaxed">
          Bring what you are carrying. Scripture will meet you there.
        </p>
      </div>


      <div className="mb-7">
        <p className="text-xs text-shepherd-stone uppercase tracking-widest mb-3">What are you fighting</p>
        <div className="flex flex-wrap gap-2">
          {STRUGGLES.map(s => (
            <button
              key={s.label}
              onClick={() => { setInput(s.label); textareaRef.current?.focus(); }}
              className={`flex items-baseline gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                input === s.label
                  ? 'border-shepherd-navy bg-shepherd-navy text-white'
                  : 'border-gray-200 text-gray-700 hover:border-shepherd-navy/40'
              }`}
            >
              <span className="text-[10px] font-mono text-gray-400">{s.numeral}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-shepherd-stone uppercase tracking-widest mb-2">Or say it plainly</p>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 2000))}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onSeek(); }
          }}
          placeholder="What do you need?"
          rows={4}
          className="w-full bg-transparent border-b-2 border-gray-200 focus:border-shepherd-navy focus:outline-none text-gray-900 text-lg font-serif placeholder:text-gray-300 resize-none py-2 transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-300 font-mono">{input.length} / 2000</span>
          <button
            onClick={onSeek}
            disabled={!input.trim() || loading}
            className="text-shepherd-navy hover:text-shepherd-navy-light font-serif italic text-lg disabled:text-gray-300 transition-colors"
          >
            {loading ? 'Seeking...' : 'Receive the Word →'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <button
        onClick={onHistory}
        className="mt-8 text-xs text-gray-400 hover:text-shepherd-stone transition-colors uppercase tracking-widest font-mono"
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
    <div ref={resultRef}>
      <p className="font-serif text-xl text-shepherd-navy leading-snug mb-8">
        {result.acknowledgment}
      </p>

      <div className="space-y-8">
        {result.passages.map((p, i) => (
          <div key={i} className="border-l-2 border-shepherd-gold/40 pl-4">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-mono text-gray-400">{romanize(i + 1)}</span>
              <h3 className="font-serif text-lg text-shepherd-navy">{p.canonical}</h3>
              <span className="text-xs font-mono text-gray-300 ml-auto">{p.translation}</span>
            </div>
            <div
              className="text-gray-800 text-[16px] leading-relaxed font-serif mb-3 [&_.verse-num]:text-[11px] [&_.verse-num]:text-gray-400 [&_.verse-num]:align-super [&_.verse-num]:mr-0.5"
              dangerouslySetInnerHTML={{ __html: p.html || `<p>${p.reference}</p>` }}
            />
            <p className="text-sm text-shepherd-stone italic">{p.why}</p>
          </div>
        ))}
      </div>

      {result.practicalStep && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-2">The next step</p>
          <p className="text-gray-800 text-sm leading-relaxed">{result.practicalStep}</p>
        </div>
      )}

      <div className="flex items-center gap-6 mt-10">
        <button
          onClick={onReset}
          className="font-serif italic text-shepherd-navy text-lg hover:text-shepherd-navy-light transition-colors"
        >
          ← Bring something else
        </button>
        <button
          onClick={onHistory}
          className="text-xs text-gray-400 hover:text-shepherd-stone transition-colors uppercase tracking-widest font-mono"
        >
          Past words
        </button>
      </div>
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif text-shepherd-navy">Past Words</h2>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-shepherd-stone transition-colors uppercase tracking-widest font-mono">
          ← Back
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && entries.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="font-serif text-gray-400 italic">Nothing yet.</p>
          <p className="text-sm text-gray-400 mt-1">Every time you seek the Word here, it is kept.</p>
        </div>
      )}

      <div className="space-y-0 divide-y divide-gray-100">
        {entries.map(e => (
          <div key={e.id} className="py-5">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-xs font-mono text-shepherd-gold">{shortenCanonical(e.canonical)}</span>
              <span className="text-xs font-mono text-gray-300">{fmt(e.createdAt)}</span>
            </div>
            <p className="font-serif text-shepherd-navy text-[15px] leading-snug mb-1">{e.acknowledgment}</p>
            <p className="text-xs text-gray-400 italic truncate">{e.input}</p>
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
