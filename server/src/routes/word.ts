import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { route } from '../services/modelRouter';
import { buildScriptureQueryPrompt } from '../services/systemPrompts';
import { parseFieldManualOutput } from '../lib/scriptureParser';
import { fetchPassage, isValidReference } from '../lib/bibleService';
import { prisma } from '../index';

const router = Router();

router.post('/seek', requireAuth, async (req, res) => {
  const user = req.user as { id: string; role: string };
  const { input, kind } = req.body as { input: string; kind?: string };

  if (!input?.trim()) {
    res.status(400).json({ error: 'input is required' });
    return;
  }

  const systemPrompt = buildScriptureQueryPrompt(user.role);
  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { counselorId: true } });
  const keyOwnerId = fullUser?.counselorId || user.id;
  const result = await route('scripture_query', systemPrompt, [
    { role: 'user', content: input.trim() },
  ], keyOwnerId);

  const parsed = parseFieldManualOutput(result.content);

  const passageResults = await Promise.allSettled(
    parsed.verses
      .filter(v => isValidReference(v.reference))
      .map(v => fetchPassage(v.reference))
  );

  const passages = parsed.verses.map((v, i) => {
    const result = passageResults[i];
    return {
      reference: v.reference,
      canonical: result.status === 'fulfilled' ? result.value.canonical : v.reference,
      html: result.status === 'fulfilled' ? result.value.html : '',
      translation: result.status === 'fulfilled' ? result.value.translation : 'ESV',
      why: v.why,
    };
  });

  const canonical = passages[0]?.canonical ?? parsed.verses[0]?.reference ?? '';

  const entry = await prisma.scriptureQuery.create({
    data: {
      userId: user.id,
      input: input.trim(),
      kind: kind || 'open',
      acknowledgment: parsed.acknowledgment,
      canonical,
      passages: JSON.stringify(passages),
      practicalStep: parsed.practical_step,
    },
  });

  res.json({
    id: entry.id,
    acknowledgment: parsed.acknowledgment,
    passages,
    practicalStep: parsed.practical_step,
    createdAt: entry.createdAt,
  });
});

router.get('/history', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const entries = await prisma.scriptureQuery.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(entries.map(e => ({
    ...e,
    passages: JSON.parse(e.passages),
  })));
});

router.delete('/history/:id', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const entry = await prisma.scriptureQuery.findFirst({
    where: { id: req.params.id, userId: user.id },
  });
  if (!entry) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.scriptureQuery.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get('/admin/:userId', requireAdmin, async (req, res) => {
  const entries = await prisma.scriptureQuery.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(entries.map(e => ({
    ...e,
    passages: JSON.parse(e.passages),
  })));
});

export default router;
