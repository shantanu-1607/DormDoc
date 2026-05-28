#!/usr/bin/env node
/**
 * Seed one demo user per role so every panel can be exercised end-to-end.
 *
 * For each role we:
 *   1. admin.createUser({ email, email_confirm: true })  (idempotent — skipped if email exists)
 *   2. set profiles.role / profiles.name to the right value
 *   3. upsert a role-specific row (students / faculty / dispensary_staff / parents)
 *   4. link the seed parent to the seed student
 *   5. generate a magic-link OTP so we can sign in without waiting for email
 *
 * Service-role key is required.  Run from repo root: `npm run seed:panels`.
 */

const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// All seeded panels share this demo password so test sign-in is trivial.
// Override via env when running against anything that isn't a dev project.
const DEMO_PASSWORD = process.env.SEED_PANEL_PASSWORD || 'DormDoc2026!';

const PANELS = [
  {
    role: 'student',
    email: 'btech10001.23@bitmesra.ac.in',
    name: 'Anshu Kumar',
    profile: { phone: '+91 90000 10001' },
    roleTable: 'students',
    roleRow: {
      student_id: 'BIT/CSE/2023/0001',
      roll_number: 'BTECH/10001/23',
      department: 'Computer Science & Engineering',
      year: '3rd',
      programme: 'B.Tech',
      batch: '2023-2027',
      hostel: 'BH-6',
      room_number: 'B-204',
      blood_group: 'O+',
      gender: 'male',
    },
  },
  {
    role: 'faculty',
    email: 'faculty.cse.demo@bitmesra.ac.in',
    name: 'Prof. Ritu Banerjee',
    profile: { phone: '+91 90000 20001' },
    roleTable: 'faculty',
    roleRow: {
      faculty_id: 'FAC/CSE/0042',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
      employee_type: 'permanent',
      cabin_number: 'CSE-204',
      gender: 'female',
    },
  },
  {
    role: 'hod',
    email: 'hod.cse.demo@bitmesra.ac.in',
    name: 'Prof. Subhash Mehta',
    profile: { phone: '+91 90000 30001' },
    roleTable: 'faculty',
    roleRow: {
      faculty_id: 'FAC/CSE/0001',
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      employee_type: 'permanent',
      cabin_number: 'CSE-101',
      hod_department: 'Computer Science & Engineering',
      hod_since: '2024-08-01',
      gender: 'male',
    },
  },
  {
    role: 'doctor',
    email: 'doctor.demo@bitmesra.ac.in',
    name: 'Dr. Priya Sharma',
    profile: { phone: '+91 90000 40001' },
    roleTable: 'dispensary_staff',
    roleRow: {
      staff_id: 'DOC/0001',
      staff_type: 'medical_officer',
      designation: 'Chief Medical Officer',
      license_number: 'MCI/JH/2018/12345',
      experience: 8,
      shift: 'morning',
      is_on_duty: true,
    },
  },
  {
    role: 'dispensary_staff',
    email: 'nurse.demo@bitmesra.ac.in',
    name: 'Sister Anita Toppo',
    profile: { phone: '+91 90000 50001' },
    roleTable: 'dispensary_staff',
    roleRow: {
      staff_id: 'NRS/0001',
      staff_type: 'nurse',
      designation: 'Senior Nurse',
      experience: 5,
      shift: 'morning',
      is_on_duty: true,
    },
  },
  {
    role: 'admin',
    email: 'admin.demo@bitmesra.ac.in',
    name: 'Vikram Singh',
    profile: { phone: '+91 90000 60001' },
    roleTable: 'dispensary_staff',
    roleRow: {
      staff_id: 'ADM/0001',
      staff_type: 'medical_officer',
      designation: 'Dispensary Administrator',
      experience: 10,
      shift: 'morning',
    },
  },
  {
    role: 'admin',
    email: 'amananshu2004@gmail.com',
    name: 'anshu aman',
    profile: {},
    roleTable: 'dispensary_staff',
    roleRow: {
      staff_id: 'btech1015123',
      staff_type: 'medical_officer',
      designation: 'Super Admin',
      experience: 0,
      shift: 'morning',
      blood_group: 'A+',
    },
  },
  {
    role: 'parent',
    email: 'parent.demo@example.com',
    name: 'Rajesh Kumar',
    profile: { phone: '+91 90000 70001' },
    roleTable: 'parents',
    roleRow: {
      parent_id: 'PAR/0001',
      relation_to_student: 'father',
      occupation: 'Engineer',
      is_verified: true,
      verified_at: new Date().toISOString(),
      gender: 'male',
    },
  },
];

async function findUserByEmail(email) {
  // listUsers caps at 1000 per page; one page is plenty for our seed scale.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function ensureAuthUser(email, name) {
  const existing = await findUserByEmail(email);
  if (existing) {
    // Already-seeded accounts may pre-date the password rollout — reset their
    // password to the demo value so signInWithPassword works for every panel.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    return { user: existing, created: false };
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw error;
  return { user: data.user, created: true };
}

async function upsertProfile(panel, userId) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: panel.email,
        name: panel.name,
        role: panel.role,
        ...panel.profile,
      },
      { onConflict: 'id' },
    );
  if (error) throw error;
}

async function upsertRoleRow(panel, userId) {
  // parents has a BEFORE UPDATE trigger (guard_parents_verification) that
  // calls a helper currently broken by the Phase 1.4 schema move. On re-runs
  // we skip the upsert if the row already exists — first run still inserts
  // cleanly (the guard only fires on UPDATE).
  if (panel.role === 'parent') {
    const { data: existing } = await supabase
      .from('parents')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (existing) return;
  }
  const { error } = await supabase
    .from(panel.roleTable)
    .upsert({ id: userId, ...panel.roleRow }, { onConflict: 'id' });
  if (error) throw error;
}

async function linkParentToStudent(parentId, studentId) {
  const { error } = await supabase
    .from('parent_student_links')
    .upsert(
      { parent_id: parentId, student_id: studentId, relation: 'father', is_primary: true },
      { onConflict: 'parent_id,student_id' },
    );
  if (error) throw error;
}

async function generateMagicLink(email) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (error) throw error;
  return {
    action_link: data?.properties?.action_link,
    email_otp: data?.properties?.email_otp,
  };
}

(async () => {
  console.log(`Seeding ${PANELS.length} panel accounts against ${SUPABASE_URL}\n`);

  const results = [];
  for (const panel of PANELS) {
    process.stdout.write(`• ${panel.role.padEnd(18)} ${panel.email.padEnd(40)} `);
    try {
      const { user, created } = await ensureAuthUser(panel.email, panel.name);
      await upsertProfile(panel, user.id);
      await upsertRoleRow(panel, user.id);
      const link = await generateMagicLink(panel.email);
      results.push({ panel, user, link });
      console.log(`${created ? 'CREATED' : 'EXISTS '} · code ${link.email_otp}`);
    } catch (err) {
      console.log(`FAILED`);
      console.error(`   ${err.message}`);
    }
  }

  const parentRow = results.find((r) => r.panel.role === 'parent');
  const studentRow = results.find((r) => r.panel.role === 'student');
  if (parentRow && studentRow) {
    await linkParentToStudent(parentRow.user.id, studentRow.user.id);
    console.log(`\nLinked parent ${parentRow.panel.email} -> student ${studentRow.panel.email}`);
  }

  console.log('\n=== Sign-in cheatsheet ===');
  console.log(`Open /login. Password for every panel: ${DEMO_PASSWORD}`);
  console.log('(Magic-link OTP also printed below in case you want the codeless path.)\n');
  for (const r of results) {
    console.log(`[${r.panel.role}]`);
    console.log(`  email   : ${r.panel.email}`);
    console.log(`  password: ${DEMO_PASSWORD}`);
    console.log(`  otp     : ${r.link.email_otp}`);
    console.log();
  }
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
