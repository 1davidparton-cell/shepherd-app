import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const [discipleCount, pendingHomework, recentNotes] = await Promise.all([
    prisma.user.count({ where: { counselorId: me.id } }),
    prisma.homework.count({ where: { assignedById: me.id, completedAt: null } }),
    prisma.sessionNote.findMany({
      where: { counselorId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { counselor: { select: { name: true } } },
    }),
  ]);
  res.json({ userCount: discipleCount, pendingHomework, recentNotes });
});

router.get('/responses', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const disciples = await prisma.user.findMany({
    where: { counselorId: me.id },
    select: { id: true },
  });
  const discipleIds = disciples.map(d => d.id);
  const responses = await prisma.homeworkResponse.findMany({
    where: { userId: { in: discipleIds } },
    orderBy: { submittedAt: 'desc' },
    include: {
      homework: { select: { title: true, scriptureRef: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });
  res.json(responses);
});

router.post('/responses/synthesize', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { userId } = req.body;

  const disciple = await prisma.user.findFirst({ where: { id: userId, counselorId: me.id } });
  if (!disciple) {
    res.status(403).json({ error: 'Not your disciple' });
    return;
  }

  const responses = await prisma.homeworkResponse.findMany({
    where: { userId },
    include: { homework: { select: { title: true, scriptureRef: true } } },
    orderBy: { submittedAt: 'desc' },
    take: 10,
  });

  if (!responses.length) {
    res.json({ synthesis: 'No responses to synthesize yet.' });
    return;
  }

  const { getAIService } = await import('../services/ai');
  const ai = await getAIService(me.id);
  const prompt = `You are a biblical counselor reviewing homework responses from ${disciple.name}. Synthesize the following responses into a brief pastoral summary (3-4 sentences) highlighting themes, growth areas, and prayer points:\n\n${responses.map(r => `Q: ${r.homework.title}\nA: ${r.responseText}`).join('\n\n')}`;
  const synthesis = await ai.complete(prompt);
  res.json({ synthesis });
});

router.get('/session-notes', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const notes = await prisma.sessionNote.findMany({
    where: { counselorId: me.id },
    orderBy: { createdAt: 'desc' },
    include: { counselor: { select: { name: true } } },
  });
  res.json(notes);
});

router.post('/session-notes', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { content, subjectId } = req.body;
  const note = await prisma.sessionNote.create({
    data: { counselorId: me.id, content, subjectId },
    include: { counselor: { select: { name: true } } },
  });
  res.status(201).json(note);
});

router.put('/session-notes/:id', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { content } = req.body;
  const note = await prisma.sessionNote.findUnique({ where: { id: req.params.id } });
  if (!note || note.counselorId !== me.id) {
    res.status(403).json({ error: 'Not your note' });
    return;
  }
  const updated = await prisma.sessionNote.update({ where: { id: req.params.id }, data: { content } });
  res.json(updated);
});

router.delete('/session-notes/:id', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const note = await prisma.sessionNote.findUnique({ where: { id: req.params.id } });
  if (!note || note.counselorId !== me.id) {
    res.status(403).json({ error: 'Not your note' });
    return;
  }
  await prisma.sessionNote.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
