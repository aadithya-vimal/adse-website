import { Router } from 'express';
import prisma from '../db.js';
import { requireMinRole } from '../auth.js';

// Public faculty directory (rendered on the website without login);
// writes restricted to ADMIN (HOD) and SUPER_ADMIN.
const router = Router();

// GET /api/faculties?search=&specialization= — PUBLIC
router.get('/', async (req, res, next) => {
  try {
    const { search, specialization } = req.query;
    const where = {};
    if (specialization && specialization !== 'All') {
      where.specialization = specialization;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { specialization: { contains: search } },
      ];
    }
    const faculties = await prisma.facultyProfile.findMany({
      where,
      include: { user: { select: { id: true, email: true, isActive: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({
      faculties: faculties.map((f) => ({
        id: f.id,
        name: f.name,
        department: f.department,
        specialization: f.specialization,
        image: f.image,
        hasAccount: !!f.userId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/faculties/specializations — PUBLIC
router.get('/specializations', async (req, res, next) => {
  try {
    const rows = await prisma.facultyProfile.findMany({
      select: { specialization: true },
      distinct: ['specialization'],
      orderBy: { specialization: 'asc' },
    });
    res.json({ specializations: rows.map((r) => r.specialization).filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

// POST /api/faculties — ADMIN / SUPER_ADMIN
router.post('/', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, department, specialization, image, userId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const faculty = await prisma.facultyProfile.create({
      data: {
        name: String(name).trim(),
        department: department || 'AI, ML AND DATA SCIENCE',
        specialization,
        image,
        ...(userId ? { userId: Number(userId) } : {}),
      },
    });
    res.status(201).json({ faculty });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'That user already has a faculty profile' });
    next(err);
  }
});

// PUT /api/faculties/:id — ADMIN / SUPER_ADMIN
router.put('/:id', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, department, specialization, image, userId } = req.body || {};
    const faculty = await prisma.facultyProfile.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(department !== undefined ? { department } : {}),
        ...(specialization !== undefined ? { specialization } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(userId !== undefined ? { userId: userId === null ? null : Number(userId) } : {}),
      },
    });
    res.json({ faculty });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Faculty not found' });
    next(err);
  }
});

// DELETE /api/faculties/:id — ADMIN / SUPER_ADMIN
router.delete('/:id', requireMinRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.facultyProfile.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Faculty removed from the directory' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Faculty not found' });
    next(err);
  }
});

export default router;
