const ESV_BASE = 'https://api.esv.org/v3/passage/html/';
const FALLBACK_BASE = 'https://bible-api.com';

export type BiblePassage = {
  reference: string;
  canonical: string;
  html: string;
  translation: 'ESV' | 'KJV';
};

export async function fetchPassage(reference: string): Promise<BiblePassage> {
  if (process.env.ESV_API_KEY) {
    try {
      return await fetchEsv(reference);
    } catch (err) {
      console.warn(`[bible] ESV failed for "${reference}", falling back to KJV:`, (err as Error).message);
    }
  }
  return fetchKjv(reference);
}

async function fetchEsv(reference: string): Promise<BiblePassage> {
  const params = new URLSearchParams({
    q: reference,
    'include-passage-references': 'false',
    'include-verse-numbers': 'true',
    'include-first-verse-numbers': 'true',
    'include-footnotes': 'false',
    'include-footnote-body': 'false',
    'include-headings': 'false',
    'include-short-copyright': 'false',
    'include-audio-link': 'false',
    'include-css-link': 'false',
  });

  const res = await fetch(`${ESV_BASE}?${params}`, {
    headers: { Authorization: `Token ${process.env.ESV_API_KEY}` },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ESV ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as { canonical?: string; passages?: string[] };
  const passages = Array.isArray(data.passages) ? data.passages : [];
  if (passages.length === 0) throw new Error(`ESV returned no passages for "${reference}"`);

  return {
    reference,
    canonical: (data.canonical ?? reference).trim(),
    html: passages.join('\n'),
    translation: 'ESV',
  };
}

type ApiVerse = { chapter: number; verse: number; text: string };

async function fetchKjv(reference: string): Promise<BiblePassage> {
  const slug = encodeURIComponent(reference.trim());
  let res = await fetch(`${FALLBACK_BASE}/${slug}?translation=kjv`);

  if (!res.ok && !/:/.test(reference)) {
    res = await fetch(`${FALLBACK_BASE}/${encodeURIComponent(reference.trim() + ':1')}?translation=kjv`);
  }

  if (!res.ok) throw new Error(`Bible API ${res.status} for "${reference}"`);

  const data = await res.json() as { reference?: string; verses?: ApiVerse[]; error?: string };
  if (data.error) throw new Error(`Bible API error: ${data.error}`);

  const verses = Array.isArray(data.verses) ? data.verses : [];
  if (verses.length === 0) throw new Error(`Bible API returned no verses for "${reference}"`);

  return {
    reference,
    canonical: (data.reference ?? reference).trim(),
    html: verses.map(v => {
      const safe = escapeHtml(String(v.text ?? '').trim());
      return `<p><sup class="verse-num">${v.verse}</sup>${safe}</p>`;
    }).join('\n'),
    translation: 'KJV',
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function isValidReference(ref: unknown): ref is string {
  if (typeof ref !== 'string' || ref.length > 60) return false;
  return /^\s*(?:[1-3]\s+)?[A-Z][A-Za-z]+(?:\s+(?:of\s+)?[A-Z][A-Za-z]+)?\s+\d{1,3}(?::\d{1,3}(?:-\d{1,3})?)?\s*$/.test(ref);
}

export function shortenCanonical(c: string): string {
  if (!c) return c;
  const m = c.match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)(?::(.+))?$/);
  if (!m) return c.toUpperCase();
  const abbr = abbrevBook(m[1].trim());
  return m[3] ? `${abbr} ${m[2]} · ${m[3]}` : `${abbr} ${m[2]}`;
}

const BOOK_ABBREV: Record<string, string> = {
  Psalm: 'PS.', Psalms: 'PS.', Proverbs: 'PROV.', Genesis: 'GEN.', Exodus: 'EX.',
  Leviticus: 'LEV.', Numbers: 'NUM.', Deuteronomy: 'DEUT.', Joshua: 'JOSH.',
  Judges: 'JUDG.', Ruth: 'RUTH', Isaiah: 'ISA.', Jeremiah: 'JER.',
  Lamentations: 'LAM.', Ezekiel: 'EZEK.', Daniel: 'DAN.', Hosea: 'HOS.',
  Joel: 'JOEL', Amos: 'AMOS', Obadiah: 'OBAD.', Jonah: 'JONAH', Micah: 'MIC.',
  Nahum: 'NAH.', Habakkuk: 'HAB.', Zephaniah: 'ZEPH.', Haggai: 'HAG.',
  Zechariah: 'ZECH.', Malachi: 'MAL.', Matthew: 'MATT.', Mark: 'MARK',
  Luke: 'LUKE', John: 'JOHN', Acts: 'ACTS', Romans: 'ROM.', Galatians: 'GAL.',
  Ephesians: 'EPH.', Philippians: 'PHIL.', Colossians: 'COL.', Titus: 'TITUS',
  Philemon: 'PHM.', Hebrews: 'HEB.', James: 'JAS.', Jude: 'JUDE',
  Revelation: 'REV.', Job: 'JOB', Ecclesiastes: 'ECCL.', 'Song of Solomon': 'SONG',
  '1 Samuel': '1 SAM.', '2 Samuel': '2 SAM.', '1 Kings': '1 KGS.', '2 Kings': '2 KGS.',
  '1 Chronicles': '1 CHR.', '2 Chronicles': '2 CHR.',
  '1 Corinthians': '1 COR.', '2 Corinthians': '2 COR.',
  '1 Thessalonians': '1 THESS.', '2 Thessalonians': '2 THESS.',
  '1 Timothy': '1 TIM.', '2 Timothy': '2 TIM.',
  '1 Peter': '1 PET.', '2 Peter': '2 PET.',
  '1 John': '1 JN.', '2 John': '2 JN.', '3 John': '3 JN.',
};

function abbrevBook(book: string): string {
  return BOOK_ABBREV[book] ?? book.toUpperCase();
}
