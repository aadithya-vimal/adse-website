# AIML & DS Department Portal — React + Express + Prisma

React (Vite) frontend + **Express.js** backend with **Prisma (SQLite)** and **JWT role-based access control**. Public pages need no login; everything dynamic lives under `/api`.

## Roles & permissions

| Role | Who | Permissions |
|---|---|---|
| `SUPER_ADMIN` | Developers | Full control: mutate all backend data, edit site content keys shown on public pages, manage users of every role |
| `ADMIN` (HOD) | HODs | Add/remove faculties via email invitations, manage users, faculty directory, classes/subjects, delete any document |
| `FACULTY` | Teachers | Upload/delete/rename documents **only for subjects assigned to them** |
| `STUDENT` | Students | Register/login and **view their own statuses only** — cannot mutate anything |
| *(no login)* | Visitors | Full public site + public documents without authentication |

## Project layout

```
index.html            Vite entry
src/
  main.jsx            React root + BrowserRouter
  App.jsx             routes (public pages + /login /register /accept-invite /dashboard)
  components/Navbar   auth-aware navbar (active page, Login↔Dashboard swap)
  lib/api.js          fetch wrapper that attaches the JWT
  pages/              Home, AboutUs, … + Login/Register/AcceptInvite/Dashboard
server/
  server.js           Express app: /api + dist/ + public/ + SPA fallback
  auth.js             JWT sign/verify, authenticate, requireRole/requireMinRole
  db.js               Prisma client singleton
  mailer.js           invite-email stub (console) — plug nodemailer here
  routes/             auth, users, faculties, classes, documents, content, statuses
prisma/
  schema.prisma       DB schema (SQLite; switch provider to change DB)
  seed.js             demo accounts + faculty directory import
uploads/              uploaded files (never served statically — gated endpoint)
vite.config.js        dev proxy: /api → http://localhost:3000
```

## Quick start

```bash
npm install
cp .env.example .env      # set JWT_SECRET (any long random string)
npm run setup             # prisma migrate dev --name init  +  seed demo data
```

Development — two terminals:

```bash
npm run dev:server        # Express API on http://localhost:3000
npm run dev               # Vite dev server on http://localhost:5173 (proxies /api)
```

Production:

```bash
npm run build             # vite build → dist/
npm start                 # Express serves dist/ + API on http://localhost:3000
```

Demo accounts created by the seed (passwords: `SuperAdmin@123`, `Hod@12345`, `Faculty@123`, `Student@123`):

| Role | Email |
|---|---|
| SUPER_ADMIN | superadmin@adse.local |
| ADMIN (HOD) | hod@christ.example.com |
| FACULTY | faculty@christ.example.com |
| STUDENT | student@christ.example.com |

> Remove the "Demo accounts" block in `src/pages/Login.jsx` before going live.

## API overview

- **Public:** `/api/faculties`, `/api/classes`, `/api/content`, `/api/documents` (public items only), `/api/auth/login`, `/api/auth/register/student`, `/api/auth/invitations/:token(/accept)`
- **Authenticated:** `/api/auth/me`
- **ADMIN+:** `/api/users*` (list/invite/revoke/deactivate/remove), faculty-directory & class/subject writes
- **FACULTY+ (scoped):** document upload/edit/delete (`teacherId` ownership enforced server-side), statuses create/update
- **SUPER_ADMIN only:** `PUT/DELETE /api/content/:key`

## Database commands

```bash
npx prisma migrate dev --name <change>   # create+apply a migration (dev)
npx prisma migrate deploy                # apply migrations (prod/CI)
npx prisma db push                       # sync schema WITHOUT migration history
node prisma/seed.js                      # re-seed demo data — safe to re-run
```

**Switching databases** (e.g. PostgreSQL when hosting): set `provider = "postgresql"` in `prisma/schema.prisma`, update `DATABASE_URL`, run `npx prisma migrate dev --name init && node prisma/seed.js`.

## Hosting options

**Single Node host (Render/Railway/Fly.io/VPS):** deploy repo → `npm ci` → `npx prisma migrate deploy` → `npm run build` → `npm start`. Env vars: `JWT_SECRET`, `APP_URL=https://yourdomain`, `PORT`, `DATABASE_URL`. SQLite needs a persistent disk (free tiers wipe disk!); for multi-instance/serverless use Postgres.

**Split hosting:** static frontend on Netlify/Vercel/GH Pages + backend on a Node host — point the frontend at the backend URL and restrict CORS in `server/server.js`.

**Production hardening:** restrict CORS origins, HTTPS at the proxy, rotate `JWT_SECRET`, remove demo credentials, wire real SMTP in `mailer.js`.

## Manual RBAC test checklist

1. **Visitor:** browse every public page logged out; Home faculty grid loads from `/api/faculties`.
2. **Student** (`student@…`): dashboard shows own statuses read-only; any write attempt → 403.
3. **Faculty** (`faculty@…`): upload PDF to ADS201/AIML301 (own subjects) → success; to DSA202 (unassigned) → 403.
4. **HOD** (`hod@…`): invite a faculty by email → open returned link → accept + set password → new faculty can log in and appears in directory. Inviting an ADMIN as HOD → 403.
5. **Super admin** (`superadmin@…`): edit `home.hero.title` in Site Content → saved; inviting an ADMIN → allowed.
6. **Documents gating:** upload with “Visible to public” unchecked → anonymous download URL returns 401.
