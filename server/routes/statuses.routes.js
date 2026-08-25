import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth, requireMinRole } from '../auth.js';

// Status tracking. STUDENT accounts read only their own statuses and can
// never mutate them; FACULTY/ADMIN/SUPER_ADMIN create & update.
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED'];
const isStaff = (user) => ['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(user.role);

const router = Router();

// GET /api/statuses?studentId= — students are force-scoped to themselves
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const where = {};
    if (!isStaff(req.user)) {
      if (req.user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      where.studentId = req.user.id; // own statuses only
    } else if (req.query.studentId) {
      where.studentId = Number(req.query.studentId);
    }
    const statuses = await prisma.studentStatus.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({
      statuses: statuses.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        remark: s.remark,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        student: s.student,
        reviewedBy: s.reviewer,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/statuses { studentId, title, status?, remark? } — staff only
router.post('/', requireMinRole('FACULTY'), async (req, res, next) => {
  try {
    const { studentId, title, status, remark } = req.body || {};
    if (!studentId || !title) return res.status(400).json({ error: 'studentId and title are required' });
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }
    const student = await prisma.user.findUnique({ where: { id: Number(studentId) } });
    if (!student || student.role !== 'STUDENT') {
      return res.status(400).json({ error: 'studentId must reference a STUDENT user' });
    }
    const entry = await prisma.studentStatus.create({
      data: {
        studentId: Number(studentId),
        title: String(title).trim(),
        status: status || 'PENDING',
        remark,
        updatedById: req.user.id,
      },
    });
    res.status(201).json({ statusEntry: entry });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/statuses/:id — staff only
router.patch('/:id', requireMinRole('FACULTY'), async (req, res, next) => {
  try {
    const existing = await prisma.studentStatus.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ error: 'Status entry not found' });

    const data = {};
    if (req.body.title !== undefined) data.title = String(req.body.title).trim();
    if (req.body.remark !== undefined) data.remark = req.body.remark;
    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
      }
      data.status = req.body.status;
    }
    data.updatedById = req.user.id;

    const updated = await prisma.studentStatus.update({
      where: { id: existing.id },
      data,
      include: { student: { select: { id: true, name: true, email: true } }, reviewer: { select: { id: true, name: true } } },
    });
    res.json({ statusEntry: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/statuses/:id — ADMIN / SUPER_ADMIN
router.delete('/:id', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.studentStatus.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Status entry deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Status entry not found' });
    next(err);
  }
});

export default router;
