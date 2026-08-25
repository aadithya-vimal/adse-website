import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { authenticate } from './auth.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import facultiesRoutes from './routes/faculties.routes.js';
import classesRoutes from './routes/classes.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import contentRoutes from './routes/content.routes.js';
import statusesRoutes from './routes/statuses.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Create a .env file (see .env.example).');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Minimal security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Tiny request logger
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Attach req.user when a valid Bearer token is present (never blocks GETs)
app.use('/api', authenticate);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/faculties', facultiesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/statuses', statusesRoutes);

// Unknown API routes -> JSON 404
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

// Static assets that ship with the repo (faculty.json fallback, images)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// Built React app (vite build -> dist/) takes precedence when present
const DIST_DIR = path.join(__dirname, '..', 'dist');
const hasDist = fs.existsSync(DIST_DIR);
if (hasDist) app.use(express.static(DIST_DIR));

// SPA history fallback for client-side routes like /login or /dashboard
app.get('*', (_req, res, next) => {
  if (!hasDist) return next();
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err && err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 25 MB limit' : `Upload error: ${err.message}`;
    return res.status(400).json({ error: msg });
  }
  if (err && err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this unique value already exists' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`ADSE website running at http://localhost:${PORT}${hasDist ? '' : ' (API + legacy static only — run "npm run build" for the React app)'}`);
});

export default app;
