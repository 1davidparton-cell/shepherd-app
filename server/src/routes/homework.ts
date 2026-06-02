import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../index';
import { sendHomeworkEmail } from '../lib/mailer';

const router = Router();

// Admin: list all homework they've assigned
router.get('/', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const homework = await prisma.homework.findMany({
    where: { assignedById: me.id },
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: { select: { id: true, name: true, role: true } },
      responses: { select: { id: true, submittedAt: true } },
    },
  });
  res.json(homework);
});

// Admin: create homework for a disciple
router.post('/', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { title, scriptureRef, instructions, type, assignedToId, dueDate } = req.body;

  const disciple = await prisma.user.findFirst({ where: { id: assignedToId, counselorId: me.id } });
  if (!disciple) {
    res.status(403).json({ error: 'Not your disciple' });
    return;
  }

  const admin = await prisma.user.findUnique({ where: { id: me.id }, select: { name: true, email: true } });

  const homework = await prisma.homework.create({
    data: {
      title,
      scriptureRef,
      instructions,
      type: type || 'custom',
      assignedToId,
      assignedById: me.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'sent',
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  if (admin && disciple.email) {
    const { ok } = await sendHomeworkEmail({
      toEmail: disciple.email,
      toDiscipleName: disciple.name.split(' ')[0],
      fromName: admin.name,
      fromEmail: admin.email,
      title,
      scriptureRef: scriptureRef || null,
      instructions,
    });
    if (!ok) {
      await prisma.homework.update({ where: { id: homework.id }, data: { status: 'failed' } });
    }
  }

  res.status(201).json(homework);
});

// Admin: resend homework email
router.post('/:id/resend', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const hw = await prisma.homework.findUnique({
    where: { id: req.params.id },
    include: { assignedTo: { select: { name: true, email: true } } },
  });
  if (!hw || hw.assignedById !== me.id) {
    res.status(403).json({ error: 'Not your homework' });
    return;
  }
  if (!hw.assignedTo.email) {
    res.status(400).json({ error: 'Disciple has no email address' });
    return;
  }
  const admin = await prisma.user.findUnique({ where: { id: me.id }, select: { name: true, email: true } });
  if (!admin) { res.status(400).json({ error: 'Admin not found' }); return; }

  const { ok, error: mailError } = await sendHomeworkEmail({
    toEmail: hw.assignedTo.email,
    toDiscipleName: hw.assignedTo.name.split(' ')[0],
    fromName: admin.name,
    fromEmail: admin.email,
    title: hw.title,
    scriptureRef: hw.scriptureRef,
    instructions: hw.instructions,
  });

  const newStatus = ok ? (hw.status === 'failed' ? 'sent' : hw.status) : 'failed';
  await prisma.homework.update({ where: { id: hw.id }, data: { status: newStatus } });

  if (!ok) {
    res.status(502).json({ error: mailError || 'Email failed to send' });
    return;
  }
  res.json({ success: true });
});

// Admin: update homework status (rejected, etc.)
router.patch('/:id/status', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { status } = req.body;
  const VALID = ['sent', 'viewed', 'responded', 'rejected', 'failed'];
  if (!VALID.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
  if (!hw || hw.assignedById !== me.id) {
    res.status(403).json({ error: 'Not your homework' });
    return;
  }
  const updated = await prisma.homework.update({ where: { id: req.params.id }, data: { status } });
  res.json(updated);
});

// Admin: delete homework
router.delete('/:id', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
  if (!hw || hw.assignedById !== me.id) {
    res.status(403).json({ error: 'Not your homework' });
    return;
  }
  await prisma.homework.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Admin: get all homework + full response history for a specific disciple
router.get('/disciple/:discipleId', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const disciple = await prisma.user.findFirst({ where: { id: req.params.discipleId, counselorId: me.id } });
  if (!disciple) { res.status(403).json({ error: 'Not your disciple' }); return; }

  const homework = await prisma.homework.findMany({
    where: { assignedToId: req.params.discipleId, assignedById: me.id },
    orderBy: { createdAt: 'desc' },
    include: {
      responses: { orderBy: { submittedAt: 'asc' } },
    },
  });
  res.json(homework);
});

// Disciple: list their own homework with all responses
router.get('/my', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const homework = await prisma.homework.findMany({
    where: { assignedToId: me.id },
    orderBy: { createdAt: 'desc' },
    include: {
      responses: {
        where: { userId: me.id },
        orderBy: { submittedAt: 'asc' },
      },
      assignedBy: { select: { name: true } },
    },
  });
  res.json(homework);
});

// Disciple: mark homework as viewed (called when they open it)
router.post('/:id/view', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
  if (!hw || hw.assignedToId !== me.id) {
    res.status(403).json({ error: 'Not your homework' });
    return;
  }
  if (hw.status === 'sent' || hw.status === 'failed') {
    await prisma.homework.update({ where: { id: hw.id }, data: { status: 'viewed' } });
  }
  res.json({ success: true });
});

// Disciple: submit a response (can submit multiple times)
router.post('/:id/respond', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { responseText } = req.body;

  const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
  if (!hw || hw.assignedToId !== me.id) {
    res.status(403).json({ error: 'Not your homework' });
    return;
  }

  const response = await prisma.homeworkResponse.create({
    data: { homeworkId: hw.id, userId: me.id, responseText },
  });

  await prisma.homework.update({ where: { id: hw.id }, data: { status: 'responded' } });

  res.status(201).json(response);
});

export default router;
