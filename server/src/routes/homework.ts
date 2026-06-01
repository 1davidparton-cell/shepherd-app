import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../index';

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

  const homework = await prisma.homework.create({
    data: {
      title,
      scriptureRef,
      instructions,
      type: type || 'custom',
      assignedToId,
      assignedById: me.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  res.status(201).json(homework);
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

  res.status(201).json(response);
});

export default router;
