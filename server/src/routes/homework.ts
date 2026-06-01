import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const homework = await prisma.homework.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: { select: { id: true, name: true, role: true } },
      assignedBy: { select: { id: true, name: true } },
      responses: { select: { id: true, submittedAt: true } },
    },
  });
  res.json(homework);
});

router.get('/user/:userId', requireAdmin, async (req, res) => {
  const homework = await prisma.homework.findMany({
    where: { assignedToId: req.params.userId },
    orderBy: { createdAt: 'desc' },
    include: { responses: true },
  });
  res.json(homework);
});

router.post('/', requireAdmin, async (req, res) => {
  const user = req.user as { id: string };
  const { title, scriptureRef, instructions, type, assignedToId, dueDate } = req.body;

  const homework = await prisma.homework.create({
    data: {
      title,
      scriptureRef,
      instructions,
      type: type || 'custom',
      assignedToId,
      assignedById: user.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  res.status(201).json(homework);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.homework.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get('/my', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const homework = await prisma.homework.findMany({
    where: { assignedToId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      responses: { where: { userId: user.id } },
      assignedBy: { select: { name: true } },
    },
  });
  res.json(homework.map(h => ({
    ...h,
    completed: !!h.completedAt,
    myResponse: h.responses[0] || null,
  })));
});

router.post('/:id/respond', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const { responseText } = req.body;

  const homework = await prisma.homework.findFirst({
    where: { id: req.params.id, assignedToId: user.id },
  });

  if (!homework) {
    res.status(404).json({ error: 'Homework not found' });
    return;
  }

  const response = await prisma.homeworkResponse.create({
    data: { homeworkId: homework.id, userId: user.id, responseText },
  });

  await prisma.homework.update({
    where: { id: homework.id },
    data: { completedAt: new Date() },
  });

  res.status(201).json(response);
});

export default router;
