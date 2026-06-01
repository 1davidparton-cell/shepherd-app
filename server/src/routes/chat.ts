import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { route, Message } from '../services/modelRouter';
import { buildSystemPrompt } from '../services/systemPrompts';
import { prisma } from '../index';

const router = Router();

router.get('/sessions', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const sessions = await prisma.chatSession.findMany({
    where: { counselorId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  res.json(sessions.map(s => ({ ...s, messages: JSON.parse(s.messages) })));
});

router.get('/sessions/:id', requireAuth, async (req, res) => {
  const session = await prisma.chatSession.findUnique({ where: { id: req.params.id } });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  res.json({ ...session, messages: JSON.parse(session.messages) });
});

router.post('/sessions', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const { contextId } = req.body;
  const session = await prisma.chatSession.create({
    data: { counselorId: user.id, contextId },
  });
  res.status(201).json({ ...session, messages: [] });
});

router.post('/sessions/:id/message', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const { content, contextId } = req.body;

  const session = await prisma.chatSession.findUnique({ where: { id: req.params.id } });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  const messages: Message[] = JSON.parse(session.messages);
  messages.push({ role: 'user', content });

  let contextInfo = '';
  if (contextId) {
    const subject = await prisma.user.findUnique({
      where: { id: contextId },
      select: { name: true, role: true, notes: true },
    });
    if (subject) {
      contextInfo = `Disciple: ${subject.name} (${subject.role})`;
      if (subject.notes) contextInfo += `\nNotes: ${subject.notes}`;
    }

    const homework = await prisma.homework.findMany({
      where: { assignedToId: contextId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { responses: { orderBy: { submittedAt: 'asc' } } },
    });

    if (homework.length > 0) {
      const hwSummary = homework.map(h => {
        const responses = h.responses.map((r, i) =>
          `  Response ${i + 1} (${new Date(r.submittedAt).toLocaleDateString()}): ${r.responseText}`
        ).join('\n');
        return `Assignment: ${h.title}${h.scriptureRef ? ` [${h.scriptureRef}]` : ''}\n${h.instructions}\n${responses || '  (no responses yet)'}`;
      }).join('\n\n');
      contextInfo += `\n\nHomework history:\n${hwSummary}`;
    }
  }

  const systemPrompt = buildSystemPrompt('counselor', '', contextInfo);

  try {
    const result = await route('homework_builder', systemPrompt, messages, user.id);
    messages.push({ role: 'assistant', content: result.content });
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { messages: JSON.stringify(messages) },
    });
    res.json({ content: result.content, messages });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message || 'AI request failed' });
  }
});

router.delete('/sessions/:id', requireAuth, async (req, res) => {
  await prisma.chatSession.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
