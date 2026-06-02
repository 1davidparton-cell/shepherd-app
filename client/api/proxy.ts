import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND = 'https://shepherd-api.vercel.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = (req.query.p as string) || '/';
  const url = new URL(req.url || '/', 'http://x');
  url.searchParams.delete('p');
  const qs = url.search;

  const target = `${BACKEND}${rawPath}${qs}`;

  const headers: Record<string, string> = {
    'x-forwarded-for': (req.headers['x-forwarded-for'] as string) || '',
    'x-forwarded-host': 'myshepherd.vercel.app',
    'x-forwarded-proto': 'https',
  };
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'] as string;
  if (req.headers['cookie']) headers['cookie'] = req.headers['cookie'] as string;
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'] as string;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  const upstream = await fetch(target, {
    method: req.method!,
    headers,
    body,
    redirect: 'manual',
  });

  const SKIP = new Set(['transfer-encoding', 'connection', 'keep-alive', 'upgrade']);

  upstream.headers.forEach((value, key) => {
    if (SKIP.has(key.toLowerCase())) return;

    if (key.toLowerCase() === 'set-cookie') {
      // Strip Domain so cookie is scoped to myshepherd.vercel.app
      const cleaned = value
        .replace(/;\s*domain=[^;]+/gi, '')
        .replace(/;\s*samesite=none/gi, '; SameSite=Lax');
      res.setHeader('Set-Cookie', cleaned);
    } else {
      res.setHeader(key, value);
    }
  });

  res.status(upstream.status);

  if (upstream.status === 204 || upstream.status === 304) {
    res.end();
    return;
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.end(buf);
}
