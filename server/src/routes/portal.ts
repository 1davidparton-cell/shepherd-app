import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { route, Message, ModelTask } from '../services/modelRouter';
import { buildSystemPrompt } from '../services/systemPrompts';
import { prisma } from '../index';

const router = Router();

router.get('/chat', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const session = await prisma.personalChatSession.findUnique({ where: { userId: user.id } });
  res.json({
    messages: session ? JSON.parse(session.messages) : [],
    sessionId: session?.id || null,
  });
});

router.post('/chat/message', requireAuth, async (req, res) => {
  const user = req.user as { id: string; role: string };
  const { content } = req.body;

  let session = await prisma.personalChatSession.findUnique({ where: { userId: user.id } });

  const messages: Message[] = session ? JSON.parse(session.messages) : [];
  messages.push({ role: 'user', content });

  const notes = await prisma.sessionNote.findMany({
    where: { subjectId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  const sessionNotes = notes.map(n => n.content).join('\n\n');

  const homeworkResponses = await prisma.homeworkResponse.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: 'desc' },
    take: 5,
    include: { homework: { select: { title: true, scriptureRef: true } } },
  });
  const recentResponses = homeworkResponses
    .map(r => `${r.homework.title}: ${r.responseText}`)
    .join('\n\n');

  const context = recentResponses ? `Recent homework responses:\n${recentResponses}` : '';
  const systemPrompt = buildSystemPrompt(user.role, sessionNotes, context);

  const task: ModelTask = 'personal_chat';

  const result = await route(task, systemPrompt, messages);
  messages.push({ role: 'assistant', content: result.content });

  if (session) {
    await prisma.personalChatSession.update({
      where: { userId: user.id },
      data: { messages: JSON.stringify(messages) },
    });
  } else {
    session = await prisma.personalChatSession.create({
      data: { userId: user.id, messages: JSON.stringify(messages) },
    });
  }

  res.json({ content: result.content, messages });
});

router.delete('/chat', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  await prisma.personalChatSession.deleteMany({ where: { userId: user.id } });
  res.json({ success: true });
});

router.get('/scripture', requireAuth, async (req, res) => {
  const { passage, include_headings = 'false', include_footnotes = 'false' } = req.query;
  if (!passage) { res.status(400).json({ error: 'passage is required' }); return; }

  const params = new URLSearchParams({
    q: passage as string,
    include_headings: include_headings as string,
    include_footnotes: include_footnotes as string,
    include_verse_numbers: 'true',
    include_short_copyright: 'true',
  });

  const response = await fetch(
    `https://api.esv.org/v3/passage/text/?${params}`,
    { headers: { Authorization: `Token ${process.env.ESV_API_KEY}` } }
  );
  const data = await response.json();
  res.json(data);
});

router.get('/scripture/audio', requireAuth, async (req, res) => {
  const { passage } = req.query;
  if (!passage) { res.status(400).json({ error: 'passage is required' }); return; }

  const params = new URLSearchParams({ q: passage as string });
  const esvRes = await fetch(
    `https://api.esv.org/v3/passage/audio/?${params}`,
    { headers: { Authorization: `Token ${process.env.ESV_API_KEY}` } }
  );

  if (!esvRes.ok) { res.status(502).json({ error: 'ESV audio fetch failed' }); return; }

  res.setHeader('Content-Type', 'audio/mpeg');
  const buffer = await esvRes.arrayBuffer();
  res.send(Buffer.from(buffer));
});

export default router;
