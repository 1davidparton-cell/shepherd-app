import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { route, Message } from '../services/modelRouter';
import { buildSystemPrompt } from '../services/systemPrompts';
import { prisma } from '../index';

const router = Router();

router.get('/sessions', requireAdmin, async (req, res) => {
  const user = req.user as { id: string };
  const sessions = await prisma.chatSession.findMany({
    where: { counselorId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  res.json(sessions.map(s => ({ ...s, messages: JSON.parse(s.messages) })));
});

router.get('/sessions/:id', requireAdmin, async (req, res) => {
  const session = await prisma.chatSession.findUnique({ where: { id: req.params.id } });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  res.json({ ...session, messages: JSON.parse(session.messages) });
});

router.post('/sessions', requireAdmin, async (req, res) => {
  const user = req.user as { id: string };
  const { contextId } = req.body;
  const session = await prisma.chatSession.create({
    data: { counselorId: user.id, contextId },
  });
  res.status(201).json({ ...session, messages: [] });
});

router.post('/sessions/:id/message', requireAdmin, async (req, res) => {
  const { content, contextType, contextId } = req.body;

  const session = await prisma.chatSession.findUnique({ where: { id: req.params.id } });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  const messages: Message[] = JSON.parse(session.messages);
  messages.push({ role: 'user', content });

  let sessionNotes = '';
  let contextInfo = '';

  if (contextId) {
    const notes = await prisma.sessionNote.findMany({
      where: contextType === 'couple'
        ? { coupleId: contextId }
        : { subjectId: contextId },
      orderBy: { createdAt: 'desc' },
    });
    sessionNotes = notes.map(n => n.content).join('\n\n');
  }

  if (contextType === 'couple' && contextId) {
    const couple = await prisma.couple.findUnique({
      where: { id: contextId },
      include: {
        husband: { select: { name: true } },
        wife: { select: { name: true } },
      },
    });
    if (couple) {
      contextInfo = `Couple: ${couple.husband.name} (husband) and ${couple.wife.name} (wife)`;
    }
  } else if (contextId) {
    const subject = await prisma.user.findUnique({
      where: { id: contextId },
      select: { name: true, role: true },
    });
    if (subject) contextInfo = `Counselee: ${subject.name} (${subject.role})`;
  }

  const systemPrompt = buildSystemPrompt('admin', sessionNotes, contextInfo);
  const result = await route('admin_counselor_chat', systemPrompt, messages);

  messages.push({ role: 'assistant', content: result.content });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { messages: JSON.stringify(messages) },
  });

  res.json({ content: result.content, messages });
});

router.delete('/sessions/:id', requireAdmin, async (req, res) => {
  await prisma.chatSession.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
