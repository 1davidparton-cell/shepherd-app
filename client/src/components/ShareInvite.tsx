import { useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

const SHARE_URL = 'https://myshepherd.vercel.app';
const SHARE_TITLE = 'Shepherd';
const SHARE_TEXT = 'Join me on Shepherd — a place for discipleship, Scripture, and growth.';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShareInvite({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing more we can do */
    }
  };

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(20,25,40,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, padding: '30px 28px 26px',
        width: '100%', maxWidth: 360, textAlign: 'center',
        boxShadow: '0 24px 60px -20px rgba(20,25,40,.5)',
      }}>
        <h3 style={{ fontFamily: 'var(--head)', fontSize: 22, color: 'var(--navy)', margin: '0 0 6px' }}>
          Share Shepherd
        </h3>
        <p style={{ fontFamily: 'var(--ui)', fontSize: 13.5, color: 'var(--stone)', margin: '0 0 22px', lineHeight: 1.55 }}>
          Invite someone to walk alongside you. Scan the code or send a link.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{ padding: 16, background: '#fff', border: '1px solid var(--card-line)', borderRadius: 16 }}>
            <QRCodeSVG value={SHARE_URL} size={184} fgColor="#1a2744" bgColor="#ffffff" level="M" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Close</button>
          <button onClick={handleShare} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? 'Link copied!' : 'Share link'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
