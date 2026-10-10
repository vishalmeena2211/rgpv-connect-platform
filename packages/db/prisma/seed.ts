/**
 * Database seed: a realistic, internally consistent demo world for local
 * development, so every screen has something to show without external
 * accounts.
 *
 * - Catalogue: the B.Tech CS scheme for semesters 1–8 with credits. Upserted,
 *   so re-running is safe.
 * - Demo world: students at UIT-RGPV (CS 2028 and CS 2027), their saved results,
 *   notes and papers, posts, jobs, listings, messages and notifications. Every
 *   demo account uses an @rgpvconnect.dev email; the seed deletes those
 *   accounts first and recreates them, so re-running gives a clean world and
 *   never touches real users.
 *
 * Sign in locally as any demo email (e.g. priyanshi@rgpvconnect.dev) with the
 * email link printed in the dev server's terminal. admin@rgpvconnect.dev is an
 * admin.
 */
import { type Prisma, PrismaClient, type User } from '@prisma/client';
import { cgpaFromSemesters, parseEnrollment, semesterSchedule } from '@rgpv/shared';

const prisma = new PrismaClient();

const DEMO_DOMAIN = '@rgpvconnect.dev';
const DAY = 86_400_000;
const now = new Date();
const daysFromNow = (days: number) => new Date(now.getTime() + days * DAY);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

/** Deterministic PRNG so the demo world is the same on every run. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

// ---------------------------------------------------------------------------
// Colleges
// ---------------------------------------------------------------------------

const COLLEGES = [
  { code: '0151', name: 'University Institute of Technology, RGPV', shortName: 'UIT-RGPV', emailDomain: 'uit.rgpv.ac.in', studentCount: 2500 },
  { code: '0247', name: 'Lakshmi Narain College of Technology', shortName: 'LNCT', emailDomain: 'lnct.ac.in', studentCount: 4200 },
  { code: '0701', name: 'Oriental Institute of Science & Technology', shortName: 'OIST', emailDomain: null, studentCount: 3000 },
  { code: '0751', name: 'Sagar Institute of Science & Technology', shortName: 'SISTec', emailDomain: null, studentCount: 2800 },
];

async function seedColleges() {
  for (const college of COLLEGES) {
    await prisma.college.upsert({
      where: { code: college.code },
      update: { name: college.name, shortName: college.shortName, emailDomain: college.emailDomain, studentCount: college.studentCount },
      create: { ...college, city: 'Bhopal' },
    });
  }
}

// ---------------------------------------------------------------------------
// Catalogue: B.Tech Computer Science & Engineering, semesters 1–8
// ---------------------------------------------------------------------------

type SubjectSeed = [code: string, name: string, credits: number];

const CS_SCHEME: Record<number, SubjectSeed[]> = {
  1: [['BT101', 'Engineering Chemistry', 4], ['BT102', 'Mathematics-I', 4], ['BT103', 'English for Communication', 3], ['BT104', 'Basic Electrical & Electronics Engineering', 4], ['BT105', 'Engineering Graphics', 3], ['BT106', 'Manufacturing Practices', 2]],
  2: [['BT201', 'Engineering Physics', 4], ['BT202', 'Mathematics-II', 4], ['BT203', 'Basic Mechanical Engineering', 4], ['BT204', 'Basic Civil Engineering & Mechanics', 4], ['BT205', 'Basic Computer Engineering', 4], ['BT206', 'Language Lab', 2]],
  3: [['ES301', 'Energy & Environmental Engineering', 3], ['CS302', 'Discrete Structure', 4], ['CS303', 'Data Structure', 4], ['CS304', 'Digital Systems', 3], ['CS305', 'Object Oriented Programming & Methodology', 3], ['CS306', 'Computer Workshop', 2]],
  4: [['CS401', 'Analysis & Design of Algorithms', 4], ['CS402', 'Software Engineering', 3], ['CS403', 'Computer Organisation & Architecture', 3], ['CS404', 'Operating Systems', 3], ['CS405', 'Java Programming', 2], ['CS406', 'Algorithms Lab', 2]],
  5: [['CS501', 'Theory of Computation', 4], ['CS502', 'Database Management Systems', 3], ['CS503', 'Computer Networks', 3], ['CS504', 'Machine Learning', 3], ['CS505', 'DBMS Lab', 2], ['CS506', 'Minor Project', 2]],
  6: [['CS601', 'Compiler Design', 4], ['CS602', 'Computer Graphics & Visualisation', 3], ['CS603', 'Cloud Computing', 3], ['CS604', 'Project Management', 3], ['CS605', 'Data Analytics Lab', 2], ['CS606', 'Skill Development Lab', 2]],
  7: [['CS701', 'Software Architectures', 4], ['CS702', 'Internet of Things', 3], ['CS703', 'Deep & Reinforcement Learning', 3], ['CS704', 'Major Project-I', 4], ['CS705', 'Industrial Training', 2]],
  8: [['CS801', 'Internet & Web Technology', 4], ['CS802', 'Cryptography & Information Security', 3], ['CS803', 'Big Data', 3], ['CS804', 'Major Project-II', 6]],
};

/** subjectId by subject code, filled while seeding the catalogue. */
const subjectIds = new Map<string, number>();

async function seedCatalogue() {
  const course = await prisma.course.upsert({
    where: { name: 'Bachelor of Technology' },
    update: {},
    create: { name: 'Bachelor of Technology' },
  });

  for (const [semesterKey, subjects] of Object.entries(CS_SCHEME)) {
    const semesterNumber = Number(semesterKey);
    const yearNumber = Math.ceil(semesterNumber / 2);
    const year = await prisma.year.upsert({
      where: { courseId_number: { courseId: course.id, number: yearNumber } },
      update: {},
      create: { courseId: course.id, number: yearNumber },
    });
    const branch = await prisma.branch.upsert({
      where: { yearId_code: { yearId: year.id, code: 'CS' } },
      update: { name: 'Computer Science & Engineering' },
      create: { yearId: year.id, code: 'CS', name: 'Computer Science & Engineering' },
    });
    const semester = await prisma.semester.upsert({
      where: { branchId_number: { branchId: branch.id, number: semesterNumber } },
      update: {},
      create: { branchId: branch.id, number: semesterNumber },
    });
    for (const [code, name, credits] of subjects) {
      const subject = await prisma.subject.upsert({
        where: { semesterId_code: { semesterId: semester.id, code } },
        update: { name, credits },
        create: { semesterId: semester.id, code, name, credits },
      });
      subjectIds.set(code, subject.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Demo world
// ---------------------------------------------------------------------------

const GRADE_FOR: [number, string][] = [[9.5, 'A+'], [8.5, 'A'], [7.5, 'B+'], [6.5, 'B'], [5.5, 'C+'], [4.5, 'C'], [4, 'D']];
const gradeFor = (points: number) => GRADE_FOR.find(([min]) => points >= min)?.[1] ?? 'F';

/** A SemesterResult payload whose subject grades come close to `sgpa`. */
function resultPayload(name: string, enrollment: string, admissionYear: number, semester: number, sgpa: number, cgpa: number, random: () => number) {
  const subjects = (CS_SCHEME[semester] ?? []).map(([code, subjectName, credits]) => {
    const points = Math.max(4, Math.min(10, Math.round(sgpa + (random() - 0.5) * 2.4)));
    return { name: `${code}- [${part(code)}]`, code, subjectName, credits, grade: gradeFor(points) };
  });
  const schedule = semesterSchedule(semester, admissionYear);
  return {
    name: name.toUpperCase(),
    enrollment,
    session: schedule.examWindow.replace(/^\w+ to /, ''),
    course: 'B.Tech',
    branch: 'CS',
    semester,
    status: 'PASS',
    subjects: subjects.map(({ code, grade }) => ({ name: `${code}- [${part(code)}]`, code, grade })),
    resultDescription: 'PASS',
    sgpa,
    cgpa,
  };
}

/** Labs, workshops and projects print as practical rows ("[P]") on RGPV results. */
const isPractical = (name: string) => /Lab|Workshop|Project|Practices|Training/.test(name);
const part = (code: string) => {
  const subject = Object.values(CS_SCHEME).flat().find(([c]) => c === code);
  return subject && isPractical(subject[1]) ? 'P' : 'T';
};

/** Fixed subject grades for the lead demo student's semester 4 (SGPA 8.41). */
const PRIYANSHI_SEM4 = [['CS401', 'A'], ['CS402', 'B+'], ['CS403', 'B+'], ['CS404', 'B'], ['CS405', 'A+'], ['CS406', 'A']] as const;

interface DemoStudent {
  name: string;
  email: string;
  enrollment: string;
  sgpas: number[];
  showOnBoard: boolean;
  bio?: string;
  role?: 'STUDENT' | 'ADMIN' | 'RECRUITER';
}

const FIRST = ['Aditya', 'Sneha', 'Kunal', 'Ananya', 'Harsh', 'Ishita', 'Rahul', 'Megha', 'Arjun', 'Pooja', 'Siddharth', 'Neha', 'Yash', 'Riya', 'Aman', 'Kritika', 'Vivek', 'Tanya', 'Nikhil', 'Shruti', 'Akash', 'Divya', 'Rohit', 'Simran', 'Manish', 'Aishwarya', 'Gaurav', 'Payal', 'Saurabh', 'Nidhi', 'Deepak', 'Kavya', 'Abhishek', 'Swati', 'Prateek', 'Muskan', 'Ravi'];
const LAST = ['Jain', 'Patel', 'Mishra', 'Soni', 'Tomar', 'Sharma', 'Verma', 'Dubey', 'Chouhan', 'Gupta', 'Saxena', 'Rajput', 'Yadav', 'Thakur', 'Pandey', 'Shrivastava', 'Agrawal', 'Tiwari', 'Malviya', 'Kushwaha'];

function batchStudents(): DemoStudent[] {
  const random = rng(2028);
  const students: DemoStudent[] = [
    {
      name: 'Priyanshi Rathore',
      email: `priyanshi${DEMO_DOMAIN}`,
      enrollment: '0151CS241042',
      sgpas: [7.42, 7.85, 8.1, 8.41],
      showOnBoard: true,
      bio: 'CS 2028 at UIT. Likes algorithms and badminton.',
    },
  ];
  FIRST.forEach((first, index) => {
    const last = LAST[index % LAST.length]!;
    const base = 6.2 + random() * 3.2;
    const sgpas = [0, 1, 2, 3].map(() => Math.round(Math.min(9.9, Math.max(5.2, base + (random() - 0.5) * 1.2)) * 100) / 100);
    students.push({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${DEMO_DOMAIN}`,
      enrollment: `0151CS24${String(1001 + index * 3).padStart(4, '0')}`,
      sgpas,
      showOnBoard: random() < 0.6,
    });
  });
  // The three batchmates the wireframes name get fixed, recognisable numbers.
  const fixed: Record<string, number[]> = {
    'Aditya Jain': [8.9, 9.1, 9.0, 9.24],
    'Sneha Patel': [8.6, 8.8, 8.7, 9.06],
    'Kunal Mishra': [7.9, 8.2, 8.3, 8.88],
  };
  for (const student of students) {
    const sgpas = fixed[student.name];
    if (sgpas) {
      student.sgpas = sgpas;
      student.showOnBoard = true;
    }
  }
  return students;
}

async function clearDemoWorld() {
  const demoUsers = await prisma.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN } }, select: { id: true } });
  const ids = demoUsers.map((user) => user.id);
  if (ids.length === 0) return;
  // Conversations are shared, so remove the demo ones explicitly before the users.
  await prisma.conversation.deleteMany({ where: { members: { some: { userId: { in: ids } } } } });
  await prisma.deletionRequest.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.group.deleteMany({ where: { slug: { in: ['college:0151', 'cohort:0151:CS:2028', 'cohort:0151:CS:2027'] } } });
}

async function createStudent(student: DemoStudent, collegeId: string) {
  const parsed = parseEnrollment(student.enrollment);
  if (!parsed) throw new Error(`Demo enrollment ${student.enrollment} failed to parse`);
  const random = rng(Number(parsed.serial));

  const user = await prisma.user.create({
    data: {
      name: student.name,
      email: student.email,
      emailVerified: hoursAgo(24 * 40),
      bio: student.bio,
      enrollmentNumber: parsed.raw,
      verificationStatus: 'VERIFIED',
      verifiedAt: hoursAgo(24 * 40),
      collegeId,
      branchCode: parsed.branchCode,
      admissionYear: parsed.admissionYear,
      graduatingBatch: parsed.graduatingBatch,
      showOnBoard: student.showOnBoard,
      role: student.role ?? 'STUDENT',
    },
  });

  const records: Prisma.ResultRecordCreateManyInput[] = student.sgpas.map((sgpa, index) => {
    const semester = index + 1;
    const cgpa = cgpaFromSemesters(student.sgpas.slice(0, semester).map((s) => ({ sgpa: s }))) ?? sgpa;
    const payload = resultPayload(student.name, parsed.raw, parsed.admissionYear, semester, sgpa, cgpa, random);
    if (student.enrollment === '0151CS241042' && semester === 4) {
      payload.subjects = PRIYANSHI_SEM4.map(([code, grade]) => ({ name: `${code}- [${part(code)}]`, code, grade }));
    }
    return { userId: user.id, semester, status: 'PASS', sgpa, cgpa, payload, fetchedAt: hoursAgo(24 * (60 - semester)) };
  });
  await prisma.resultRecord.createMany({ data: records });
  return user;
}

async function seedDemoWorld() {
  await clearDemoWorld();

  const uit = await prisma.college.findUniqueOrThrow({ where: { code: '0151' } });

  await prisma.cohortSize.upsert({
    where: { collegeCode_branchCode_graduatingBatch: { collegeCode: '0151', branchCode: 'CS', graduatingBatch: 2028 } },
    update: { size: 120 },
    create: { collegeCode: '0151', branchCode: 'CS', graduatingBatch: 2028, size: 120 },
  });
  await prisma.cohortSize.upsert({
    where: { collegeCode_branchCode_graduatingBatch: { collegeCode: '0151', branchCode: 'CS', graduatingBatch: 2027 } },
    update: { size: 118 },
    create: { collegeCode: '0151', branchCode: 'CS', graduatingBatch: 2027, size: 118 },
  });

  // Batch 2028 (admitted 2024): 38 verified students with semesters 1–4.
  const batch: User[] = [];
  for (const student of batchStudents()) batch.push(await createStudent(student, uit.id));
  const byName = (name: string) => batch.find((user) => user.name === name)!;
  const priyanshi = byName('Priyanshi Rathore');
  const aditya = byName('Aditya Jain');
  const sneha = byName('Sneha Patel');
  const kunal = byName('Kunal Mishra');
  const harsh = byName('Harsh Tomar');

  // Seniors (batch 2027, admitted 2023): semesters 1–6.
  const rohan = await createStudent(
    { name: 'Rohan Verma', email: `rohan.verma${DEMO_DOMAIN}`, enrollment: '0151CS231008', sgpas: [7.8, 8.1, 8.0, 8.4, 8.6, 8.7], showOnBoard: true, bio: 'Final year CSE. Shared DBMS and networks notes; happy to help juniors with placement prep.' },
    uit.id,
  );
  const meera = await createStudent(
    { name: 'Meera Joshi', email: `meera.joshi${DEMO_DOMAIN}`, enrollment: '0151CS231021', sgpas: [8.2, 8.4, 8.1, 8.6, 8.8, 8.9], showOnBoard: false },
    uit.id,
  );

  // The original demo student keeps working (README refers to it).
  const demo = await prisma.user.create({
    data: { name: 'Demo Student', email: `demo${DEMO_DOMAIN}`, emailVerified: now, enrollmentNumber: '0151CS21001', verificationStatus: 'VERIFIED', verifiedAt: now, collegeId: uit.id, branchCode: 'CS', admissionYear: 2021, graduatingBatch: 2025 },
  });

  const admin = await prisma.user.create({
    data: { name: 'RGPV Connect Admin', email: `admin${DEMO_DOMAIN}`, emailVerified: now, role: 'ADMIN' },
  });
  const recruiter = await prisma.user.create({
    data: { name: 'Zestify Hiring', email: `hiring.zestify${DEMO_DOMAIN}`, emailVerified: now, role: 'RECRUITER' },
  });
  const placement = await prisma.user.create({
    data: { name: 'UIT Placement Cell', email: `placement.uit${DEMO_DOMAIN}`, emailVerified: now, role: 'RECRUITER', collegeId: uit.id },
  });
  // Signed in, never verified: shows the verify prompts.
  await prisma.user.create({ data: { name: 'New Student', email: `new.student${DEMO_DOMAIN}`, emailVerified: now } });

  // Groups: the college and two cohorts, everyone auto-joined.
  const collegeGroup = await prisma.group.create({ data: { slug: 'college:0151', name: 'UIT-RGPV, Bhopal', type: 'COLLEGE', collegeId: uit.id } });
  const cohort2028 = await prisma.group.create({ data: { slug: 'cohort:0151:CS:2028', name: 'CS 2028 · UIT-RGPV', type: 'BRANCH', collegeId: uit.id, branchCode: 'CS', graduatingBatch: 2028 } });
  const cohort2027 = await prisma.group.create({ data: { slug: 'cohort:0151:CS:2027', name: 'CS 2027 · UIT-RGPV', type: 'BRANCH', collegeId: uit.id, branchCode: 'CS', graduatingBatch: 2027 } });
  const students = [...batch, rohan, meera, demo];
  await prisma.groupMember.createMany({ data: students.map((user) => ({ groupId: collegeGroup.id, userId: user.id })) });
  await prisma.groupMember.createMany({ data: batch.map((user) => ({ groupId: cohort2028.id, userId: user.id })) });
  await prisma.groupMember.createMany({ data: [rohan, meera].map((user) => ({ groupId: cohort2027.id, userId: user.id })) });

  // Follows.
  await prisma.connection.createMany({
    data: [
      { followerId: priyanshi.id, followingId: rohan.id },
      { followerId: priyanshi.id, followingId: aditya.id },
      { followerId: priyanshi.id, followingId: sneha.id },
      { followerId: aditya.id, followingId: priyanshi.id },
      { followerId: sneha.id, followingId: rohan.id },
      ...batch.slice(5, 30).map((user) => ({ followerId: user.id, followingId: rohan.id })),
    ],
  });

  // Notes and papers.
  const sample = '/samples/sample-notes.pdf';
  const note = (code: string, title: string, unitName: string | null, uploaderId: string, extra: Partial<Prisma.ResourceUncheckedCreateInput> = {}) =>
    prisma.resource.create({
      data: { type: 'NOTE', title, unitName, pdfUrl: sample, subjectId: subjectIds.get(code)!, uploaderId, declaredOwnWork: true, status: 'APPROVED', reviewedById: admin.id, reviewedAt: hoursAgo(24 * 9), ...extra },
    });
  const paper = (code: string, session: string, uploaderId: string, pageCount = 4) =>
    prisma.resource.create({
      data: { type: 'PAPER', title: `${code} · ${session} end semester`, session, pdfUrl: sample, subjectId: subjectIds.get(code)!, uploaderId, pageCount, fileSize: 240_000, status: 'APPROVED', reviewedById: admin.id, reviewedAt: hoursAgo(24 * 30) },
    });

  const dbmsNotes = await note('CS502', 'Unit 1 to 3 · ER model, normalisation, SQL', 'Units 1–3', rohan.id, { rating: 4.8, ratingCount: 64, downloadCount: 312, pageCount: 42, fileSize: 3_400_000 });
  await note('CS501', 'Full syllabus · automata, grammars, Turing machines', 'All units', aditya.id, { rating: 4.6, ratingCount: 38, downloadCount: 212, pageCount: 61, fileSize: 4_800_000 });
  await note('CS503', 'Unit 2 · data link layer, with solved numericals', 'Unit 2', sneha.id, { rating: 4.5, ratingCount: 21, downloadCount: 140, pageCount: 18, fileSize: 1_900_000 });
  await note('CS504', 'Unit 1 · regression and gradient descent, handwritten', 'Unit 1', kunal.id, { rating: 4.1, ratingCount: 12, downloadCount: 88, pageCount: 24, fileSize: 6_100_000 });
  await note('CS503', 'Full syllabus · computer networks', 'All units', rohan.id, { rating: 4.7, ratingCount: 41, downloadCount: 260, pageCount: 55, fileSize: 5_200_000 });
  await note('CS401', 'Unit 1 to 5 · algorithm design with worked examples', 'All units', rohan.id, { rating: 4.4, ratingCount: 30, downloadCount: 190, pageCount: 48, fileSize: 4_100_000 });
  await note('CS404', 'Process scheduling and deadlocks', 'Units 2–3', meera.id, { rating: 4.3, ratingCount: 17, downloadCount: 96, pageCount: 22, fileSize: 2_300_000 });

  // Priyanshi's uploads: one published, one waiting, one sent back.
  await note('CS404', 'Unit 4 · memory management, paging and segmentation', 'Unit 4', priyanshi.id, { rating: 4.5, ratingCount: 9, downloadCount: 54, pageCount: 16, fileSize: 1_800_000, reviewedAt: hoursAgo(24 * 7) });
  await prisma.resource.create({
    data: { type: 'NOTE', title: 'Unit 2 · classification, decision trees, k-NN', unitName: 'Unit 2', pdfUrl: sample, subjectId: subjectIds.get('CS504')!, uploaderId: priyanshi.id, declaredOwnWork: true, pageCount: 24, fileSize: 3_100_000, createdAt: hoursAgo(3) },
  });
  await prisma.resource.create({
    data: { type: 'PAPER', title: 'CS502 · Jun 2026 end semester', session: 'Jun 2026', pdfUrl: sample, subjectId: subjectIds.get('CS502')!, uploaderId: priyanshi.id, declaredOwnWork: true, pageCount: 4, fileSize: 900_000, status: 'REJECTED', reviewNote: 'This is the Dec 2025 paper, already on the site. Fix the exam session and send it again.', reviewedById: admin.id, reviewedAt: hoursAgo(20), createdAt: hoursAgo(30) },
  });
  await prisma.resource.create({
    data: { type: 'NOTE', title: 'Unit 4 · pushdown automata', unitName: 'Unit 4', pdfUrl: sample, subjectId: subjectIds.get('CS501')!, uploaderId: aditya.id, declaredOwnWork: true, pageCount: 14, fileSize: 1_200_000, createdAt: hoursAgo(50) },
  });

  for (const session of ['Jun 2026', 'Dec 2025', 'Jun 2025', 'Dec 2024', 'Jun 2024']) await paper('CS502', session, session === 'Jun 2025' ? sneha.id : session === 'Jun 2026' || session === 'Dec 2025' ? rohan.id : admin.id);
  for (const session of ['Jun 2026', 'Dec 2025', 'Jun 2025']) await paper('CS501', session, session === 'Jun 2026' ? aditya.id : admin.id);
  for (const session of ['Jun 2026', 'Dec 2025']) await paper('CS503', session, admin.id);
  for (const session of ['Jun 2026', 'Dec 2025', 'Jun 2025']) await paper('CS401', session, admin.id);

  await prisma.resourceRating.createMany({ data: [aditya, sneha, kunal].map((user, i) => ({ resourceId: dbmsNotes.id, userId: user.id, stars: 5 - (i % 2) })) });

  // Posts, including one reported enough times to be hidden.
  await prisma.post.create({ data: { authorId: rohan.id, body: 'Uploaded my full DBMS notes (units 1 to 5) under CS502. If something is unclear, DM me, I will add a page.', scope: 'COLLEGE', collegeId: uit.id, likeCount: 24, createdAt: hoursAgo(2) } });
  await prisma.post.create({ data: { authorId: sneha.id, body: 'Anyone from CS 2028 doing the TCS NQT this month? Looking for 2 people to practise with on Sundays.', scope: 'COLLEGE', collegeId: uit.id, likeCount: 11, createdAt: hoursAgo(5) } });
  await prisma.post.create({ data: { authorId: aditya.id, body: 'Semester 4 results are out. Fetched mine in 9 seconds here instead of fighting the portal for an hour.', scope: 'GROUP', groupId: cohort2028.id, collegeId: uit.id, likeCount: 18, createdAt: hoursAgo(30) } });
  const spam = await prisma.post.create({ data: { authorId: harsh.id, body: 'Selling exam answers, DM me before the paper.', scope: 'COLLEGE', collegeId: uit.id, hiddenAt: hoursAgo(20), createdAt: hoursAgo(26) } });
  await prisma.report.createMany({
    data: [aditya, sneha, kunal].map((user) => ({ reporterId: user.id, postId: spam.id, reason: 'SPAM' as const, createdAt: hoursAgo(22) })),
  });

  // Jobs, all open relative to today.
  await prisma.jobPost.create({ data: { title: 'Software engineer intern', company: 'Infosys Springboard', location: 'Bhopal', type: 'INTERNSHIP', source: 'PLACEMENT_CELL', pay: '₹15,000 a month', branches: ['CS', 'IT'], batches: [2027, 2028], description: 'Six-month internship on internal tools. Java or Python, basic SQL.', applyUrl: 'https://example.com/apply/infosys-intern', closesAt: daysFromNow(14), postedById: placement.id } });
  await prisma.jobPost.create({ data: { title: 'Junior backend developer', company: 'Zestify', location: 'Indore', type: 'FULL_TIME', source: 'RECRUITER', pay: '₹4.2 LPA', branches: ['CS', 'IT', 'EC'], batches: [2027], description: 'Node.js and PostgreSQL. Final-year students joining July 2027.', applyUrl: 'https://example.com/apply/zestify-backend', closesAt: daysFromNow(21), postedById: recruiter.id } });
  await prisma.jobPost.create({ data: { title: 'Data analyst trainee', company: 'Capital Trade', location: null, isRemote: true, type: 'PART_TIME', source: 'RECRUITER', pay: '₹8,000 a month', branches: [], batches: [], description: 'Excel and SQL, 15 hours a week.', applyUrl: 'https://example.com/apply/capital-trade', closesAt: daysFromNow(5), postedById: recruiter.id } });

  // Campus listings.
  const listings: [string, number, 'BOOKS' | 'ELECTRONICS' | 'HOSTEL', string, string][] = [
    ['Introduction to Algorithms (CLRS), 3rd ed.', 650, 'BOOKS', 'Hardcover, a few pencil marks in chapters 2 to 4. Used for CS401.', sneha.id],
    ['Casio fx-991EX calculator', 900, 'ELECTRONICS', 'Works perfectly, with cover.', kunal.id],
    ['Study table and chair', 1200, 'HOSTEL', 'Moving out of hostel, pick up this week.', byName('Ananya Soni').id],
    ['Arduino Uno kit with sensors', 1500, 'ELECTRONICS', 'Complete kit, used for one minor project.', harsh.id],
    ['Operating Systems (Galvin), 9th ed.', 400, 'BOOKS', 'Good condition.', aditya.id],
    ['Mattress, single, 6 months old', 700, 'HOSTEL', 'Clean, no stains.', rohan.id],
  ];
  for (const [title, rupees, category, description, sellerId] of listings) {
    await prisma.marketListing.create({ data: { title, priceCents: rupees * 100, category, description, sellerId, collegeId: uit.id, pickup: 'Hostel 4' } });
  }
  await prisma.marketListing.create({ data: { title: 'Engineering Graphics drafter', priceCents: 30000, category: 'OTHER', description: 'Sold', sellerId: sneha.id, collegeId: uit.id, status: 'SOLD', soldAt: hoursAgo(24 * 12) } });

  // A conversation.
  const conversation = await prisma.conversation.create({
    data: { lastMessageAt: hoursAgo(1), members: { create: [{ userId: priyanshi.id, lastReadAt: hoursAgo(2) }, { userId: rohan.id, lastReadAt: hoursAgo(1) }] } },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, senderId: priyanshi.id, body: 'Hi Rohan, your DBMS notes are great. Unit 4 on indexing is a bit thin though, do you have more?', createdAt: hoursAgo(2.3) },
      { conversationId: conversation.id, senderId: rohan.id, body: 'Hey! Yes, I skipped B+ trees because I ran out of time. Will add a page.', createdAt: hoursAgo(1.1) },
      { conversationId: conversation.id, senderId: rohan.id, body: 'Sure, I will add a page on indexing tonight.', createdAt: hoursAgo(1) },
    ],
  });

  // Notifications for the lead demo student.
  await prisma.notification.createMany({
    data: [
      { recipientId: priyanshi.id, type: 'RESULT_DECLARED', entityId: '4', data: { semester: 4, sgpa: 8.41 }, createdAt: hoursAgo(24 * 50) },
      { recipientId: priyanshi.id, actorId: rohan.id, type: 'MESSAGE', entityId: conversation.id, createdAt: hoursAgo(1) },
      { recipientId: priyanshi.id, actorId: admin.id, type: 'RESOURCE_REVIEWED', data: { title: 'Unit 4 · memory management, paging and segmentation', approved: true }, createdAt: hoursAgo(24 * 7), readAt: hoursAgo(24 * 6) },
      { recipientId: priyanshi.id, actorId: aditya.id, type: 'FOLLOW', createdAt: hoursAgo(24 * 3), readAt: hoursAgo(24 * 2) },
    ],
  });

  // A pending deletion request for the admin queue.
  const ishita = byName('Ishita Sharma');
  await prisma.deletionRequest.create({
    data: { userId: ishita.id, userLabel: `${ishita.name} · ${ishita.enrollmentNumber!.slice(0, 8)}••••`, reason: 'Delete my account and results', eligibleAt: daysFromNow(4), requestedAt: hoursAgo(24 * 3) },
  });

  console.warn(`Seeded demo world: ${batch.length} CS 2028 students, 2 seniors, admin, 2 recruiters.`);
}

async function main() {
  await seedColleges();
  await seedCatalogue();
  await seedDemoWorld();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
