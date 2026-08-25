import { Router } from 'express';
import prisma from '../db.js';
import { requireMinRole, requireRole } from '../auth.js';

// Site content key/value store — the mechanism the SUPER_ADMIN uses to
// mutate what is displayed on the public pages without a redeploy.
const router = Router();

// GET /api/content — PUBLIC: map of { key: parsedValue }
router.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.siteContent.findMany({ orderBy: { key: 'asc' } });
    const content = {};
    for (const row of rows) {
      try {
        content[row.key] = JSON.parse(row.value);
      } catch {
        content[row.key] = row.value;
      }
    }
    res.json({ content });
  } catch (err) {
    next(err);
  }
});

// GET /api/content/:key — PUBLIC
router.get('/:key', async (req, res, next) => {
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: req.params.key } });
    if (!row) return res.status(404).json({ error: 'Content key not found' });
    let value;
    try {
      value = JSON.parse(row.value);
    } catch {
      value = row.value;
    }
    res.json({ key: row.key, value, updatedAt: row.updatedAt });
  } catch (err) {
    next(err);
  }
});

// PUT /api/content/:key { value } — SUPER_ADMIN only
router.put('/:key', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { value } = req.body || {};
    if (value === undefined) return res.status(400).json({ error: 'value is required' });
    const stored = JSON.stringify(value);
    const row = await prisma.siteContent.upsert({
      where: { key: req.params.key },
      update: { value: stored, updatedById: req.user.id },
      create: { key: req.params.key, value: stored, updatedById: req.user.id },
    });
    res.json({ key: row.key, value: JSON.parse(row.value), updatedAt: row.updatedAt });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/content/:key — SUPER_ADMIN only
router.delete('/:key', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await prisma.siteContent.delete({ where: { key: req.params.key } });
    res.json({ message: 'Content key deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Content key not found' });
    next(err);
  }
});

export default router;
