import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface PassageResult {
  passages: string[];
  query: string;
}

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
  'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
  'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function PortalScripture() {
  const [query, setQuery] = useState('');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState('1');
  const [passage, setPassage] = useState<PassageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchPassage = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      const result = await api.get<PassageResult>(`/api/portal/scripture?passage=${encodeURIComponent(q)}`);
      setPassage(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudio = async () => {
    const q = query || `${book} ${chapter}`;
    try {
      const res = await fetch(`/api/portal/scripture/audio?passage=${encodeURIComponent(q)}`, { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        setAudioUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const handleNavigate = () => {
    const q = `${book} ${chapter}`;
    setQuery(q);
    fetchPassage(q);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-serif text-shepherd-navy px-1">Scripture</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2">
          <select
            value={book}
            onChange={e => setBook(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm"
          >
            {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input
            type="number"
            value={chapter}
            onChange={e => setChapter(e.target.value)}
            min={1}
            className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center"
            placeholder="Ch"
          />
          <button
            onClick={handleNavigate}
            className="bg-shepherd-navy text-white rounded-lg px-4 py-2 text-sm"
          >
            Go
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPassage(query)}
            placeholder="Or search a passage (e.g. Romans 5:1-11)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-shepherd-navy/30"
          />
          <button
            onClick={() => fetchPassage(query)}
            className="border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            Search
          </button>
        </div>
      </div>

      {passage && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-serif text-shepherd-navy text-sm">{passage.query}</h3>
              <button
                onClick={fetchAudio}
                className="flex items-center gap-1.5 text-xs text-shepherd-stone hover:text-shepherd-navy transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                </svg>
                Listen
              </button>
            </div>

            <div className="px-5 py-4 max-h-96 overflow-auto">
              <p className="text-sm text-gray-800 leading-7 font-serif whitespace-pre-wrap">
                {passage.passages[0]}
              </p>
            </div>
          </div>

          {audioUrl && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <audio ref={audioRef} controls src={audioUrl} className="w-full" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Speed:</span>
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      speed === s ? 'bg-shepherd-navy text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="flex justify-center py-8 text-gray-400 text-sm">Loading passage...</div>
      )}
    </div>
  );
}
