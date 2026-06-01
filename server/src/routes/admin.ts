import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { route } from '../services/modelRouter';
import { buildSystemPrompt } from '../services/systemPrompts';
import { prisma } from '../index';

const router = Router();

router.get('/dashboard', requireAdmin, async (_req, res) => {
  const [userCount, pendingHomework, recentNotes] = await Promise.all([
    prisma.user.count({ where: { role: { not: 'admin' } } }),
    prisma.homework.count({ where: { completedAt: null } }),
    prisma.sessionNote.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { counselor: { select: { name: true } } } }),
  ]);
  res.json({ userCount, pendingHomework, recentNotes });
});

router.get('/responses', requireAdmin, async (req, res) => {
  const { userId } = req.query;
  const where = userId ? { userId: userId as string } : {};
  const responses = await prisma.homeworkResponse.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: {
      homework: { select: { title: true, scriptureRef: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });
  res.json(responses);
});

router.post('/responses/synthesize', requireAdmin, async (req, res) => {
  const { userId } = req.body;

  const responses = await prisma.homeworkResponse.findMany({
    where: { userId },
    orderBy: { submittedAt: 'desc' },
    take: 10,
    include: { homework: { select: { title: true, scriptureRef: true } } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const responseText = responses
    .map(r => `Assignment: ${r.homework.title}\nResponse: ${r.responseText}`)
    .join('\n\n---\n\n');

  const systemPrompt = buildSystemPrompt('admin');
  const { content } = await route('homework_synthesis', systemPrompt, [{
    role: 'user',
    content: `Synthesize the following homework responses from ${user.name} (${user.role}). Identify key themes, areas of growth, concerning patterns, and suggested next steps for counseling.\n\n${responseText}`,
  }]);

  res.json({ synthesis: content });
});

router.post('/responses/compare-couple', requireAdmin, async (req, res) => {
  const { coupleId } = req.body;

  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
    include: {
      husband: { select: { id: true, name: true } },
      wife: { select: { id: true, name: true } },
    },
  });
  if (!couple) { res.status(404).json({ error: 'Couple not found' }); return; }

  const [husbandResponses, wifeResponses] = await Promise.all([
    prisma.homeworkResponse.findMany({
      where: { userId: couple.husbandId },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: { homework: { select: { title: true } } },
    }),
    prisma.homeworkResponse.findMany({
      where: { userId: couple.wifeId },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: { homework: { select: { title: true } } },
    }),
  ]);

  const prompt = `Compare these homework responses from a married couple and identify where they are agreeing, diverging, or showing patterns. Frame the marriage as a covenant worth fighting for.

HUSBAND (${couple.husband.name}):
${husbandResponses.map(r => `${r.homework.title}: ${r.responseText}`).join('\n\n')}

WIFE (${couple.wife.name}):
${wifeResponses.map(r => `${r.homework.title}: ${r.responseText}`).join('\n\n')}`;

  const systemPrompt = buildSystemPrompt('admin');
  const { content } = await route('couple_comparison', systemPrompt, [{ role: 'user', content: prompt }]);

  res.json({ comparison: content });
});

router.get('/session-notes', requireAdmin, async (req, res) => {
  const { subjectId, coupleId } = req.query;
  const where: Record<string, string> = {};
  if (subjectId) where.subjectId = subjectId as string;
  if (coupleId) where.coupleId = coupleId as string;

  const notes = await prisma.sessionNote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { counselor: { select: { name: true } } },
  });
  res.json(notes);
});

router.post('/session-notes', requireAdmin, async (req, res) => {
  const user = req.user as { id: string };
  const { content, subjectId, coupleId } = req.body;

  const note = await prisma.sessionNote.create({
    data: { counselorId: user.id, content, subjectId, coupleId },
    include: { counselor: { select: { name: true } } },
  });
  res.status(201).json(note);
});

router.put('/session-notes/:id', requireAdmin, async (req, res) => {
  const note = await prisma.sessionNote.update({
    where: { id: req.params.id },
    data: { content: req.body.content },
  });
  res.json(note);
});

router.delete('/session-notes/:id', requireAdmin, async (req, res) => {
  await prisma.sessionNote.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.post('/generate-questions', requireAdmin, async (req, res) => {
  const { context, subjectId } = req.body;

  let subjectInfo = '';
  if (subjectId) {
    const user = await prisma.user.findUnique({ where: { id: subjectId }, select: { name: true, role: true } });
    if (user) subjectInfo = `Subject: ${user.name} (${user.role})`;
  }

  const systemPrompt = buildSystemPrompt('admin');
  const { content } = await route('interview_question_generation', systemPrompt, [{
    role: 'user',
    content: `Generate 5 root-cause assessment questions for a biblical counseling session. ${subjectInfo} Context: ${context}`,
  }]);

  res.json({ questions: content });
});

export default router;
