import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* Seed script: creates the super admin, a demo HOD, a demo faculty user
 * linked to the first directory profile, a demo student with statuses,
 * sample classes/subjects and starter site content. Safe to re-run
 * (upserts by email/key/code). */
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // ---- Super admin (developers) ----
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@adse.local' },
    update: {},
    create: {
      email: 'superadmin@adse.local',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: await bcrypt.hash('SuperAdmin@123', 12),
    },
  });

  // ---- HOD (admin) ----
  const hod = await prisma.user.upsert({
    where: { email: 'hod@christ.example.com' },
    update: {},
    create: {
      email: 'hod@christ.example.com',
      name: 'Dr. Department HOD',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('Hod@12345', 12),
    },
  });

  // ---- Faculty directory from public/faculty.json ----
  const facultyJsonPath = path.join(__dirname, '..', 'public', 'faculty.json');
  let facultyData = [];
  if (fs.existsSync(facultyJsonPath)) {
    facultyData = JSON.parse(fs.readFileSync(facultyJsonPath, 'utf-8'));
    for (const f of facultyData) {
      await prisma.facultyProfile.upsert({
        where: { id: f.id },
        update: {
          name: f.name,
          department: f.department,
          specialization: f.specialization,
          image: f.image,
        },
        create: {
          id: f.id,
          name: f.name,
          department: f.department,
          specialization: f.specialization,
          image: f.image,
        },
      });
    }
    console.log(`  ✓ imported ${facultyData.length} faculty profiles`);
  }

  // ---- Demo faculty account linked to first profile ----
  const demoFacultyUser = await prisma.user.upsert({
    where: { email: 'faculty@christ.example.com' },
    update: {},
    create: {
      email: 'faculty@christ.example.com',
      name: facultyData[0]?.name || 'Demo Faculty',
      role: 'FACULTY',
      passwordHash: await bcrypt.hash('Faculty@123', 12),
    },
  });
  if (facultyData[0]) {
    await prisma.facultyProfile.update({
      where: { id: facultyData[0].id },
      data: { userId: demoFacultyUser.id },
    });
  }

  // ---- Classes & subjects ----
  const class3 = await prisma.classSection.upsert({
    where: { name: 'III Semester - Section A' },
    update: {},
    create: { name: 'III Semester - Section A' },
  });
  const class5 = await prisma.classSection.upsert({
    where: { name: 'V Semester - Section A' },
    update: {},
    create: { name: 'V Semester - Section A' },
  });

  await prisma.subject.upsert({
    where: { code: 'ADS201' },
    update: { teacherId: demoFacultyUser.id },
    create: {
      title: 'Data Structures & Algorithms',
      code: 'ADS201',
      classSectionId: class3.id,
      teacherId: demoFacultyUser.id,
    },
  });
  await prisma.subject.upsert({
    where: { code: 'AIML301' },
    update: { teacherId: demoFacultyUser.id },
    create: {
      title: 'Introduction to Machine Learning',
      code: 'AIML301',
      classSectionId: class5.id,
      teacherId: demoFacultyUser.id,
    },
  });
  await prisma.subject.upsert({
    where: { code: 'DSA202' },
    update: { teacherId: null },
    create: {
      title: 'Database Management Systems',
      code: 'DSA202',
      classSectionId: class3.id,
      teacherId: null, // unassigned — used to verify scoping rules
    },
  });

  // ---- Demo student with trackable statuses ----
  const student = await prisma.user.upsert({
    where: { email: 'student@christ.example.com' },
    update: {},
    create: {
      email: 'student@christ.example.com',
      name: 'Demo Student',
      role: 'STUDENT',
      passwordHash: await bcrypt.hash('Student@123', 12),
    },
  });
  const existingStatuses = await prisma.studentStatus.count({ where: { studentId: student.id } });
  if (existingStatuses === 0) {
    await prisma.studentStatus.createMany({
      data: [
        { studentId: student.id, title: 'Semester project proposal', status: 'APPROVED', remark: 'Proceed to Phase 1', updatedById: hod.id },
        { studentId: student.id, title: 'Fee reimbursement application', status: 'PENDING' },
      ],
    });
  }

  // ---- Starter site content (editable by super admin) ----
  const content = {
    'home.hero.title': 'Empowering Learning through AIML and Data Science',
    'home.hero.subtitle':
      'Our AIML and Data Science departments offer cutting-edge programs designed to equip students with the skills needed for the future.',
    'announcements': [
      { date: '2026-08-01', text: 'Odd semester classes begin.' },
      { date: '2026-08-20', text: 'Industrial visit registrations open.' },
    ],
    'contact.email': 'hod.ads@christ.example.com',
    'contact.phone': '+91-00000-00000',
  };
  for (const [key, value] of Object.entries(content)) {
    await prisma.siteContent.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value), updatedById: superAdmin.id },
    });
  }

  console.log('\nSeed complete. Demo accounts:');
  console.log('  SUPER_ADMIN  superadmin@adse.local            / SuperAdmin@123');
  console.log('  ADMIN (HOD)  hod@christ.example.com             / Hod@12345');
  console.log('  FACULTY      faculty@christ.example.com         / Faculty@123');
  console.log('  STUDENT      student@christ.example.com         / Student@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
