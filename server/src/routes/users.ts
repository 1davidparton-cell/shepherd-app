import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../index';
import { sendInviteEmail } from '../lib/mailer';

const router = Router();

const REL_MIRROR: Record<string, string> = {
  spouse: 'spouse',
  sibling: 'sibling',
  parent: 'child',
  child: 'parent',
};

router.get('/', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const users = await prisma.user.findMany({
    where: { counselorId: me.id },
    orderBy: { createdAt: 'desc' },
    include: {
      assignedHomework: { select: { id: true, completedAt: true } },
      _count: { select: { disciples: true } },
      relationsFrom: { include: { to: { select: { id: true, name: true } } } },
      relationsTo:   { include: { from: { select: { id: true, name: true } } } },
    },
  });
  res.json(users.map(u => ({
    ...u,
    homeworkStats: {
      total: u.assignedHomework.length,
      completed: u.assignedHomework.filter(h => h.completedAt).length,
    },
    relationships: [
      ...u.relationsFrom.map(r => ({ id: r.id, type: r.type, person: r.to })),
      ...u.relationsTo.map(r => ({ id: r.id, type: REL_MIRROR[r.type] ?? r.type, person: r.from })),
    ],
    assignedHomework: undefined,
    relationsFrom: undefined,
    relationsTo: undefined,
  })));
});

router.post('/', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { name, email, role, notes, linkToId, linkType } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    let userId: string;

    if (existing) {
      if (existing.counselorId) {
        res.status(409).json({ error: 'This person already has a counselor in Shepherd.' });
        return;
      }
      await prisma.user.update({
        where: { id: existing.id },
        data: { counselorId: me.id, role: role || existing.role, notes },
      });
      userId = existing.id;
    } else {
      const user = await prisma.user.create({
        data: { name, email, role: role || 'disciple', notes, counselorId: me.id },
      });
      userId = user.id;
    }

    if (linkToId && linkType && REL_MIRROR[linkType]) {
      const mirror = REL_MIRROR[linkType];
      await Promise.allSettled([
        prisma.userRelationship.upsert({
          where: { fromId_toId: { fromId: userId, toId: linkToId } },
          create: { fromId: userId, toId: linkToId, type: linkType },
          update: { type: linkType },
        }),
        prisma.userRelationship.upsert({
          where: { fromId_toId: { fromId: linkToId, toId: userId } },
          create: { fromId: linkToId, toId: userId, type: mirror },
          update: { type: mirror },
        }),
      ]);
    }

    const result = await prisma.user.findUnique({ where: { id: userId } });

    const counselor = await prisma.user.findUnique({ where: { id: me.id } });
    if (counselor) {
      sendInviteEmail({
        toEmail: email,
        toDiscipleName: name,
        fromName: counselor.name,
        fromEmail: counselor.email,
      }).catch(() => {});
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:id/relationships', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { toId, type } = req.body;
  const fromId = req.params.id;

  const subject = await prisma.user.findUnique({ where: { id: fromId } });
  if (!subject || subject.counselorId !== me.id) {
    res.status(403).json({ error: 'Not your disciple' });
    return;
  }
  const target = await prisma.user.findUnique({ where: { id: toId } });
  if (!target || target.counselorId !== me.id) {
    res.status(403).json({ error: 'Target is not your disciple' });
    return;
  }
  if (!REL_MIRROR[type]) {
    res.status(400).json({ error: 'Invalid relationship type' });
    return;
  }

  const mirror = REL_MIRROR[type];
  await Promise.allSettled([
    prisma.userRelationship.upsert({
      where: { fromId_toId: { fromId, toId } },
      create: { fromId, toId, type },
      update: { type },
    }),
    prisma.userRelationship.upsert({
      where: { fromId_toId: { fromId: toId, toId: fromId } },
      create: { fromId: toId, toId: fromId, type: mirror },
      update: { type: mirror },
    }),
  ]);

  res.json({ success: true });
});

router.delete('/:id/relationships/:toId', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { id: fromId, toId } = req.params;

  const subject = await prisma.user.findUnique({ where: { id: fromId } });
  if (!subject || subject.counselorId !== me.id) {
    res.status(403).json({ error: 'Not your disciple' });
    return;
  }

  await Promise.allSettled([
    prisma.userRelationship.deleteMany({ where: { fromId, toId } }),
    prisma.userRelationship.deleteMany({ where: { fromId: toId, toId: fromId } }),
  ]);

  res.json({ success: true });
});

router.put('/me', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { name, email } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { name, email },
    });
    res.json(updated);
  } catch (err: unknown) {
    const msg = (err as Error).message || '';
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      res.status(409).json({ error: 'That email is already in use.' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const { name, email, role, notes } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.counselorId !== me.id) {
    res.status(403).json({ error: 'Not your disciple' });
    return;
  }
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, role, notes },
    });
    res.json(updated);
  } catch (err: unknown) {
    const msg = (err as Error).message || '';
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      res.status(409).json({ error: 'That email is already in use by another user.' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const me = req.user as { id: string };
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.counselorId !== me.id) {
    res.status(403).json({ error: 'Not your disciple' });
    return;
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
