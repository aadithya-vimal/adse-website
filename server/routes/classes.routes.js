import { Router } from 'express';
import prisma from '../db.js';
import { requireMinRole } from '../auth.js';

// Class sections & subjects. Public read (site displays them without
// login); writes restricted to ADMIN / SUPER_ADMIN.
const router = Router();

// GET /api/classes — PUBLIC, includes nested subjects + assigned teacher
router.get('/', async (req, res, next) => {
  try {
    const classes = await prisma.classSection.findMany({
      include: {
        subjects: {
          include: { teacher: { select: { id: true, name: true } }, _count: { select: { documents: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        subjects: c.subjects.map((s) => ({
          id: s.id,
          title: s.title,
          code: s.code,
          teacher: s.teacher ? { id: s.teacher.id, name: s.teacher.name } : null,
          documentCount: s._count.documents,
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/classes — ADMIN+
router.post('/', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const cls = await prisma.classSection.create({ data: { name: String(name).trim() } });
    res.status(201).json({ class: cls });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A class with this name already exists' });
    next(err);
  }
});

// DELETE /api/classes/:id — ADMIN+ (cascades to its subjects/documents)
router.delete('/:id', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.classSection.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Class removed' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Class not found' });
    next(err);
  }
});

// POST /api/subjects { title, code, classSectionId, teacherId? } — ADMIN+
router.post('/subjects', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    const { title, code, classSectionId, teacherId } = req.body || {};
    if (!title || !code || !classSectionId) {
      return res.status(400).json({ error: 'title, code and classSectionId are required' });
    }
    if (teacherId) {
      const teacher = await prisma.user.findUnique({ where: { id: Number(teacherId) } });
      if (!teacher || teacher.role !== 'FACULTY') {
        return res.status(400).json({ error: 'teacherId must reference an active FACULTY user' });
      }
    }
    const subject = await prisma.subject.create({
      data: {
        title: String(title).trim(),
        code: String(code).trim().toUpperCase(),
        classSectionId: Number(classSectionId),
        ...(teacherId ? { teacherId: Number(teacherId) } : {}),
      },
      include: { teacher: { select: { id: true, name: true } }, classSection: true },
    });
    res.status(201).json({ subject });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A subject with this code already exists' });
    next(err);
  }
});

// PATCH /api/subjects/:id — ADMIN+ (rename / reassign teacher)
router.patch('/subjects/:id', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, teacherId } = req.body || {};
    if (teacherId !== undefined && teacherId !== null) {
      const teacher = await prisma.user.findUnique({ where: { id: Number(teacherId) } });
      if (!teacher || teacher.role !== 'FACULTY') {
        return res.status(400).json({ error: 'teacherId must reference a FACULTY user' });
      }
    }
    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(teacherId !== undefined
          ? { teacherId: teacherId === null ? null : Number(teacherId) }
          : {}),
      },
      include: { teacher: { select: { id: true, name: true } }, classSection: true },
    });
    res.json({ subject });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Subject not found' });
    next(err);
  }
});

// DELETE /api/subjects/:id — ADMIN+ (cascades documents)
router.delete('/subjects/:id', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Subject removed' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Subject not found' });
    next(err);
  }
});

export default router;
