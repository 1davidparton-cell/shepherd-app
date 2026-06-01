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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scr-selector" style={{ flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <button className="scr-pick" style={{ padding: 0, cursor: 'default', flex: 1 }}>
            <select
              value={book}
              onChange={e => setBook(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--navy)', cursor: 'pointer', width: '100%' }}
            >
              {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14, color: 'var(--stone)', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="scr-pick chap" style={{ padding: '11px 10px', gap: 0 }}>
            <input
              type="number"
              value={chapter}
              onChange={e => setChapter(e.target.value)}
              min={1}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--navy)', textAlign: 'center' }}
              placeholder="Ch"
            />
          </button>
          <button
            onClick={handleNavigate}
            style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 11, padding: '11px 16px', fontFamily: 'var(--ui)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Go
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPassage(query)}
            placeholder="Or search a passage (e.g. Romans 5:1-11)"
            style={{ flex: 1, border: '1px solid var(--card-line)', borderRadius: 11, padding: '11px 14px', fontFamily: 'var(--ui)', fontSize: 13.5, outline: 'none', background: '#fff', color: 'var(--ink)' }}
          />
          <button
            onClick={() => fetchPassage(query)}
            style={{ border: '1px solid var(--card-line)', borderRadius: 11, padding: '11px 14px', fontFamily: 'var(--ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--stone)', background: '#fff', cursor: 'pointer' }}
          >
            Search
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', fontSize: 14, color: 'var(--stone)' }}>
          Loading passage...
        </div>
      )}

      {passage && !loading && (
        <>
          <div className="scr-page" style={{ overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 className="scr-title" style={{ fontSize: 22, margin: 0 }}>{passage.query}</h3>
              <button
                onClick={fetchAudio}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--stone)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ui)', fontWeight: 600 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                </svg>
                Listen
              </button>
            </div>
            <div className="scr-passage">
              <p style={{ whiteSpace: 'pre-wrap' }}>{passage.passages[0]}</p>
            </div>
          </div>

          {audioUrl && (
            <div className="scr-player">
              <button className="scr-play" onClick={() => audioRef.current?.paused ? audioRef.current?.play() : audioRef.current?.pause()}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="scr-track">
                <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
                <div className="scr-bar">
                  <div className="fill" />
                  <div className="knob" />
                </div>
                <div className="scr-time">
                  <span>{passage.query}</span>
                </div>
              </div>
            </div>
          )}

          {audioUrl && (
            <div className="scr-speeds">
              <span className="lbl">Speed</span>
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={'spd' + (speed === s ? ' on' : '')}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
