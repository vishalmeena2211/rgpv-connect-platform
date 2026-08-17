/**
 * Database seed: a minimal but realistic dataset for local development.
 *
 * Seeds a few RGPV colleges, the B.Tech academic catalogue down to a couple of
 * subjects, and a verified demo student. Idempotent — safe to run repeatedly.
 */
import { PrismaClient } from '@prisma/client';
import { parseEnrollment } from '@rgpv/shared/enrollment';

const prisma = new PrismaClient();

/** A handful of well-known RGPV-affiliated colleges in Bhopal. */
const COLLEGES = [
  { code: '0151', name: 'University Institute of Technology, RGPV', emailDomain: 'uit.rgpv.ac.in' },
  { code: '0247', name: 'Lakshmi Narain College of Technology', emailDomain: 'lnct.ac.in' },
  { code: '0701', name: 'Oriental Institute of Science & Technology', emailDomain: null },
  { code: '0751', name: 'Sagar Institute of Science & Technology', emailDomain: null },
];

async function seedColleges() {
  for (const college of COLLEGES) {
    await prisma.college.upsert({
      where: { code: college.code },
      update: { name: college.name, emailDomain: college.emailDomain },
      create: { ...college, city: 'Bhopal' },
    });
  }
  console.warn(`Seeded ${COLLEGES.length} colleges.`);
}

async function seedCatalogue() {
  const course = await prisma.course.upsert({
    where: { name: 'Bachelor of Technology' },
    update: {},
    create: { name: 'Bachelor of Technology' },
  });

  const year = await prisma.year.upsert({
    where: { courseId_number: { courseId: course.id, number: 1 } },
    update: {},
    create: { number: 1, courseId: course.id },
  });

  const branch = await prisma.branch.create({
    data: { name: 'Computer Science & Engineering', yearId: year.id },
  });

  const semester = await prisma.semester.upsert({
    where: { branchId_number: { branchId: branch.id, number: 1 } },
    update: {},
    create: { number: 1, branchId: branch.id },
  });

  await prisma.subject.createMany({
    data: [
      { name: 'Engineering Mathematics I', code: 'BT101', semesterId: semester.id },
      { name: 'Programming for Problem Solving', code: 'BT104', semesterId: semester.id },
    ],
  });

  console.warn('Seeded B.Tech catalogue (1 branch, 1 semester, 2 subjects).');
}

async function seedDemoUser() {
  const enrollment = '0151CS21001';
  const parsed = parseEnrollment(enrollment);
  if (!parsed) throw new Error(`Demo enrollment ${enrollment} failed to parse`);

  const college = await prisma.college.findUnique({ where: { code: parsed.collegeCode } });

  await prisma.user.upsert({
    where: { enrollmentNumber: enrollment },
    update: {},
    create: {
      name: 'Demo Student',
      email: 'demo@rgpvconnect.dev',
      enrollmentNumber: enrollment,
      verificationStatus: 'VERIFIED',
      collegeId: college?.id,
      branchCode: parsed.branchCode,
      admissionYear: parsed.admissionYear,
      graduatingBatch: parsed.graduatingBatch,
    },
  });

  console.warn(`Seeded demo user (${enrollment}).`);
}

async function main() {
  await seedColleges();
  await seedCatalogue();
  await seedDemoUser();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
