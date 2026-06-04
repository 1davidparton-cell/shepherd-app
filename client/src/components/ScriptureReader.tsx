const READER_URL = 'https://shepherd-reader.vercel.app';

export default function ScriptureReader() {
  return (
    <iframe
      src={READER_URL}
      title="Scripture — ESV Bible"
      allow="autoplay; clipboard-write; web-share"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        background: 'var(--paper)',
      }}
    />
  );
}
