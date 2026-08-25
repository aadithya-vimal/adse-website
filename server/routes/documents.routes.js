import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../db.js';
import { authenticate, requireAuth, requireRole } from '../auth.js';

// Documents (PDFs, images, slides…) uploaded by FACULTY for their own
// class/subjects. Public items are downloadable without login; private
// ones need any authenticated account.
const router = Router();
router.use(authenticate);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 12);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

const isStaff = (user) => ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

// GET /api/documents?subjectId=&mine=1 — public list shows only isPublic
// docs; any logged-in user sees everything.
router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.subjectId) where.subjectId = Number(req.query.subjectId);
    if (req.query.mine === '1' && req.user && req.user.role === 'FACULTY') {
      where.uploadedById = req.user.id;
    }
    if (!req.user || !req.user.isActive) {
      where.isPublic = true; // anonymous visitors
    }
    const documents = await prisma.document.findMany({
      where,
      include: {
        subject: { select: { id: true, title: true, code: true, classSection: { select: { name: true } } } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        isPublic: d.isPublic,
        createdAt: d.createdAt,
        downloadUrl: `/api/documents/${d.id}/download`,
        subject: {
          id: d.subject.id,
          title: d.subject.title,
          code: d.subject.code,
          className: d.subject.classSection?.name ?? null,
        },
        uploadedBy: { id: d.uploadedBy.id, name: d.uploadedBy.name },
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents — multipart/form-data
// Fields: file, title, subjectId, isPublic ("true"/"false")
// FACULTY may only upload to subjects assigned to them.
router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const { title, subjectId } = req.body;
    const isPublic = String(req.body.isPublic ?? 'true') === 'true';
    if (!title || !subjectId) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'title and subjectId are required' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: Number(subjectId) } });
    if (!subject) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Scope check: a faculty can only touch their own subjects.
    if (req.user.role === 'FACULTY' && subject.teacherId !== req.user.id) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'You can only manage documents for subjects you teach' });
    }
    if (req.user.role === 'STUDENT') {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Students cannot upload documents' });
    }

    const document = await prisma.document.create({
      data: {
        title: String(title).trim(),
        fileName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        isPublic,
        subjectId: Number(subjectId),
        uploadedById: req.user.id,
      },
      include: { subject: true },
    });
    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id/download — gated by visibility + auth
router.get('/:id/download', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: Number(req.params.id) },
      include: { subject: true },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const anonymous = !req.user;
    if (anonymous && !doc.isPublic) {
      return res.status(401).json({ error: 'Login required to access this document' });
    }

    const filePath = path.join(UPLOAD_DIR, doc.storedName);
    if (!fs.existsSync(filePath)) return res.status(410).json({ error: 'File missing on server' });

    // Inline-view PDFs/images in the browser, download everything else.
    const inlineTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain'];
    const disposition = inlineTypes.includes(doc.mimeType) ? 'inline' : 'attachment';
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`
    );
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id — the uploading faculty, or ADMIN/SUPER_ADMIN
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: Number(req.params.id) } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const ownsIt = req.user.role === 'FACULTY' && doc.uploadedById === req.user.id;
    if (!ownsIt && !isStaff(req.user)) {
      return res.status(403).json({ error: 'You can only delete your own documents' });
    }

    await prisma.document.delete({ where: { id: doc.id } });
    fs.unlink(path.join(UPLOAD_DIR, doc.storedName), () => {});
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/documents/:id — rename or toggle visibility (owner/staff)
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: Number(req.params.id) } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const ownsIt = req.user.role === 'FACULTY' && doc.uploadedById === req.user.id;
    if (!ownsIt && !isStaff(req.user)) {
      return res.status(403).json({ error: 'You can only edit your own documents' });
    }

    const data = {};
    if (req.body.title !== undefined) data.title = String(req.body.title).trim();
    if (req.body.isPublic !== undefined) data.isPublic = String(req.body.isPublic) === 'true';
    const updated = await prisma.document.update({ where: { id: doc.id }, data });
    res.json({ document: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
