export type VerseSuggestion = {
  reference: string;
  why: string;
};

export type FieldManualAiResponse = {
  acknowledgment: string;
  verses: VerseSuggestion[];
  practical_step?: string;
};

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return raw.slice(start, i + 1); }
  }
  return null;
}

function isValidReference(ref: unknown): ref is string {
  if (typeof ref !== 'string' || ref.length > 60) return false;
  return /^\s*(?:[1-3]\s+)?[A-Z][A-Za-z]+(?:\s+(?:of\s+)?[A-Z][A-Za-z]+)?\s+\d{1,3}(?::\d{1,3}(?:-\d{1,3})?)?\s*$/.test(ref);
}

export function parseFieldManualOutput(raw: string): FieldManualAiResponse {
  if (!raw?.trim()) throw new Error('AI returned empty content');
  const fenceless = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
  const jsonStr = extractJsonObject(fenceless) ?? fenceless.trim();

  let data: unknown;
  try { data = JSON.parse(jsonStr); } catch (e) { throw new Error(`AI output was not valid JSON: ${(e as Error).message}`); }
  if (!data || typeof data !== 'object') throw new Error('AI output was not a JSON object');

  const obj = data as Record<string, unknown>;
  const acknowledgment = typeof obj.acknowledgment === 'string' && obj.acknowledgment.trim() ? obj.acknowledgment.trim() : '';
  if (!acknowledgment) throw new Error('AI output missing acknowledgment');

  const versesRaw = Array.isArray(obj.verses) ? obj.verses : [];
  const verses: VerseSuggestion[] = [];
  for (const v of versesRaw) {
    if (!v || typeof v !== 'object') continue;
    const vobj = v as Record<string, unknown>;
    const ref = typeof vobj.reference === 'string' ? vobj.reference.trim() : '';
    if (!isValidReference(ref)) continue;
    const why = typeof vobj.why === 'string' && vobj.why.trim() ? vobj.why.trim() : 'Sit with this one.';
    verses.push({ reference: ref, why });
    if (verses.length === 3) break;
  }
  if (verses.length === 0) throw new Error('AI output contained no valid verse references');

  const practical_step = typeof obj.practical_step === 'string' && obj.practical_step.trim() ? obj.practical_step.trim() : undefined;
  return { acknowledgment, verses, practical_step };
}
