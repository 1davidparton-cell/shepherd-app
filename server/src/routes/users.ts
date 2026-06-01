import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      coupleAsHusband: { include: { wife: true } },
      coupleAsWife: { include: { husband: true } },
      discipleRelationship: { include: { counselor: true } },
      assignedHomework: { select: { id: true, completedAt: true } },
    },
  });
  res.json(users.map(u => ({
    ...u,
    homeworkStats: {
      total: u.assignedHomework.length,
      completed: u.assignedHomework.filter(h => h.completedAt).length,
    },
    assignedHomework: undefined,
  })));
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, email, role, notes, couplePartnerId, counselorId } = req.body;

  if (!name || !email || !role) {
    res.status(400).json({ error: 'name, email, and role are required' });
    return;
  }

  const user = await prisma.user.create({
    data: { googleId: `pending-${Date.now()}`, name, email, role, notes },
  });

  if (role === 'husband' && couplePartnerId) {
    await prisma.couple.create({
      data: { husbandId: user.id, wifeId: couplePartnerId, counselorId: counselorId || req.user!['id' as keyof typeof req.user] as string },
    });
  } else if (role === 'wife' && couplePartnerId) {
    await prisma.couple.create({
      data: { husbandId: couplePartnerId, wifeId: user.id, counselorId: counselorId || req.user!['id' as keyof typeof req.user] as string },
    });
  } else if ((role === 'male_disciple' || role === 'female_disciple') && counselorId) {
    await prisma.discipleRelationship.create({
      data: { discipleId: user.id, counselorId },
    });
  }

  res.status(201).json(user);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, email, role, notes } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, role, notes },
  });
  res.json(user);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get('/profile', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      coupleAsHusband: { include: { wife: { select: { id: true, name: true } }, counselor: { select: { id: true, name: true } } } },
      coupleAsWife: { include: { husband: { select: { id: true, name: true } }, counselor: { select: { id: true, name: true } } } },
      discipleRelationship: { include: { counselor: { select: { id: true, name: true } } } },
    },
  });
  res.json(profile);
});

export default router;
