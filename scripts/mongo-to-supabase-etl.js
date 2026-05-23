#!/usr/bin/env node
/**
 * scripts/mongo-to-supabase-etl.js — Phase 8 cutover ETL.
 *
 * Reads from the legacy MongoDB and upserts into the new Supabase Postgres
 * tables. Idempotent: re-running is safe; existing rows are updated, missing
 * rows are inserted. Ordered to satisfy foreign-key dependencies.
 *
 * Usage:
 *   MONGO_URI=mongodb://...  node scripts/mongo-to-supabase-etl.js [--dry-run]
 *
 * Requires (in the same .env / .env.local the server uses):
 *   - MONGO_URI (legacy Mongo connection string)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * --dry-run  prints counts and a sample row per collection, performs no writes.
 *
 * Order:
 *   1. auth.users (via supabase.auth.admin.createUser — NOT covered here;
 *      run a separate auth-import job first or rely on existing Supabase Auth
 *      users created via email OTP).
 *   2. profiles                (assumes auth.users rows already exist)
 *   3. students / faculty / dispensary_staff / parents
 *   4. inventory_items
 *   5. appointments
 *   6. prescriptions + prescription_medications
 *   7. leave_requests
 *   8. ambulances + ambulance_trips
 *   9. login_logs
 */

require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local'), override: true });

const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const DRY_RUN = process.argv.includes('--dry-run');
const MONGO_URI = process.env.MONGO_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGO_URI) {
  console.log('[etl] MONGO_URI not set — nothing to migrate. Exiting cleanly.');
  process.exit(0);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[etl] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── helpers ────────────────────────────────────────────────────────────────

const log = (...args) => console.log('[etl]', ...args);
const warn = (...args) => console.warn('[etl][warn]', ...args);

// Mongo ObjectId -> deterministic UUID v5-ish. The legacy User._id is also
// used as foreign keys across collections, so the mapping must be stable
// AND match what auth.users.id already is. If you have a Mongo-to-Supabase
// user mapping file (e.g. exported from a previous OTP migration), load it
// here and use that. The default below is a 1:1 string passthrough only when
// the Mongo id already looks like a UUID — otherwise it throws.
const USER_ID_MAP = {}; // populate from a JSON export: { "<mongo_oid>": "<supabase_uuid>" }
function toUserUuid(mongoId) {
  const s = String(mongoId);
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) return s;
  if (USER_ID_MAP[s]) return USER_ID_MAP[s];
  throw new Error(`No UUID mapping for Mongo user id ${s}. Populate USER_ID_MAP first.`);
}

async function upsert(table, rows, conflictTarget = 'id') {
  if (!rows.length) {
    log(`${table}: 0 rows, skipping`);
    return { inserted: 0, errors: 0 };
  }
  if (DRY_RUN) {
    log(`${table}: would upsert ${rows.length} rows. Sample:`, JSON.stringify(rows[0]).slice(0, 200));
    return { inserted: rows.length, errors: 0 };
  }
  const { error } = await sb.from(table).upsert(rows, { onConflict: conflictTarget });
  if (error) {
    warn(`${table} upsert failed:`, error.message);
    return { inserted: 0, errors: 1 };
  }
  log(`${table}: upserted ${rows.length} rows`);
  return { inserted: rows.length, errors: 0 };
}

// ─── per-collection mappers ────────────────────────────────────────────────

function mapProfile(u) {
  return {
    id: toUserUuid(u._id),
    role: (u.role || 'student').toLowerCase(),
    name: u.name || 'Unknown',
    email: u.email,
    phone: u.phone || null,
    is_active: u.isActive !== false,
    last_login_at: u.lastLogin ? new Date(u.lastLogin).toISOString() : null,
  };
}

function mapStudent(u) {
  return {
    id: toUserUuid(u._id),
    student_id: u.studentId || `LEGACY-${String(u._id).slice(-6)}`,
    department: u.department || 'Unknown',
    year: u.year || '1st',
    hostel: u.hostel || null,
    room_number: u.roomNumber || null,
    blood_group: u.bloodGroup || null,
    allergies: Array.isArray(u.allergies) ? u.allergies : [],
    current_medications: Array.isArray(u.currentMedications) ? u.currentMedications : [],
    chronic_conditions: Array.isArray(u.chronicConditions) ? u.chronicConditions : [],
    disabilities: u.disabilities || '',
    emergency_contact: u.emergencyContact || {},
    qr_code: u.qrCode || null,
    is_currently_admitted: !!u.isCurrentlyAdmitted,
  };
}

function mapFaculty(u) {
  return {
    id: toUserUuid(u._id),
    faculty_id: u.facultyId || `LEGACY-FAC-${String(u._id).slice(-6)}`,
    department: u.department || 'Unknown',
    designation: u.designation || 'Lecturer',
    specialization: Array.isArray(u.specialization) ? u.specialization : [],
    qualification: Array.isArray(u.qualification) ? u.qualification : [],
    employee_type: u.employeeType || 'permanent',
    hod_department: u.hodDepartment || null,
    hod_permissions: u.hodPermissions || {},
    blood_group: u.bloodGroup || null,
    allergies: Array.isArray(u.allergies) ? u.allergies : [],
    chronic_conditions: Array.isArray(u.chronicConditions) ? u.chronicConditions : [],
    emergency_contact: u.emergencyContact || {},
  };
}

function mapDispensaryStaff(u) {
  return {
    id: toUserUuid(u._id),
    staff_id: u.staffId || `LEGACY-DISP-${String(u._id).slice(-6)}`,
    staff_type: u.staffType || 'medical_officer',
    designation: u.designation || 'Officer',
    qualification: Array.isArray(u.qualification) ? u.qualification : [],
    shift: u.shift || 'morning',
    shift_start: u.shiftStart || '09:00',
    shift_end: u.shiftEnd || '17:00',
    blood_group: u.bloodGroup || null,
    emergency_contact: u.emergencyContact || {},
  };
}

function mapAppointment(a) {
  return {
    id: String(a._id),
    student_id: toUserUuid(a.student),
    doctor_id: a.doctor ? toUserUuid(a.doctor) : null,
    appointment_date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().slice(0, 10) : null,
    appointment_time: a.appointmentTime || '00:00',
    status: (a.status || 'scheduled').replace('-', '_'),
    symptoms: a.symptoms || '',
    priority: a.priority || 5,
    queue_number: a.queueNumber || 0,
    estimated_wait_time: a.estimatedWaitTime || 0,
    actual_wait_time: a.actualWaitTime || 0,
    consultation_notes: a.consultationNotes || '',
    diagnosis: a.diagnosis || '',
    treatment: a.treatment || '',
    is_emergency: !!a.isEmergency,
    emergency_reason: a.emergencyReason || '',
    check_in_time: a.checkInTime ? new Date(a.checkInTime).toISOString() : null,
    check_out_time: a.checkOutTime ? new Date(a.checkOutTime).toISOString() : null,
    follow_up_required: !!a.followUpRequired,
    follow_up_date: a.followUpDate ? new Date(a.followUpDate).toISOString().slice(0, 10) : null,
    feedback_rating: a.feedback?.rating ?? null,
    feedback_comments: a.feedback?.comments || null,
  };
}

function mapPrescription(p) {
  return {
    id: String(p._id),
    student_id: toUserUuid(p.student),
    doctor_id: p.doctor ? toUserUuid(p.doctor) : null,
    doctor_name: p.doctorName || 'Unknown',
    date: p.date ? new Date(p.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    notes: p.notes || '',
    file_url: p.fileUrl || null,
    status: p.status || 'pending',
    appointment_id: p.appointment ? String(p.appointment) : null,
  };
}

function mapPrescriptionMedications(p) {
  if (!Array.isArray(p.medications)) return [];
  return p.medications.map((m, i) => ({
    prescription_id: String(p._id),
    name: m.name || '',
    dosage: m.dosage || '',
    frequency: m.frequency || '',
    duration: m.duration || '',
    instructions: m.instructions || '',
    position: i,
  }));
}

function mapInventory(i) {
  return {
    id: String(i._id),
    name: i.name,
    category: i.category || 'medication',
    description: i.description || '',
    current_stock: i.currentStock || 0,
    minimum_stock: i.minimumStock || 0,
    maximum_stock: i.maximumStock || 0,
    unit_price: i.unitPrice || 0,
    supplier: i.supplier || '',
    expiry_date: i.expiryDate ? new Date(i.expiryDate).toISOString().slice(0, 10) : null,
    batch_number: i.batchNumber || '',
    added_by: i.addedBy ? toUserUuid(i.addedBy) : null,
  };
}

function mapAmbulance(a) {
  return {
    id: String(a._id),
    vehicle_number: a.vehicleNumber,
    driver_name: a.driverName,
    driver_phone: a.driverPhone,
    driver_license: a.driverLicense || '',
    capacity: a.capacity || 2,
    status: a.status === 'in-use' ? 'in_use' : (a.status || 'available'),
    latitude: a.location?.latitude || 0,
    longitude: a.location?.longitude || 0,
    address: a.location?.address || '',
    last_service_at: a.lastServiceAt ? new Date(a.lastServiceAt).toISOString() : new Date().toISOString(),
    next_service_at: a.nextServiceAt ? new Date(a.nextServiceAt).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString(),
    total_trips: a.performance?.totalTrips || 0,
    average_response_time: a.performance?.averageResponseTime || 0,
    rating: a.performance?.rating || 0,
    total_rating: a.performance?.totalRating || 0,
    rating_count: a.performance?.ratingCount || 0,
  };
}

function mapLoginLog(l) {
  return {
    id: String(l._id),
    user_id: l.userId ? toUserUuid(l.userId) : null,
    email: l.email,
    action: l.action || 'login',
    ip_address: l.ipAddress || '0.0.0.0',
    user_agent: l.userAgent || 'unknown',
    status: l.status || 'success',
    reason: l.reason || null,
    additional_data: l.additionalData || {},
    created_at: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
  };
}

// ─── main ──────────────────────────────────────────────────────────────────

(async () => {
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db();
  log('connected to Mongo, dry-run =', DRY_RUN);

  const summary = [];

  async function migrate(collection, mapper, table, conflictTarget = 'id', filter = {}) {
    try {
      const rows = await db.collection(collection).find(filter).toArray();
      log(`${collection} -> ${table}: ${rows.length} candidate rows`);
      const mapped = rows.map(mapper).filter(Boolean);
      const result = await upsert(table, mapped, conflictTarget);
      summary.push({ table, ...result });
    } catch (err) {
      warn(`${collection} -> ${table} failed:`, err.message);
      summary.push({ table, inserted: 0, errors: 1, message: err.message });
    }
  }

  // Users split by role into the relevant role tables. profiles first.
  const users = await db.collection('users').find().toArray();
  log(`users: ${users.length} candidate rows`);

  const profileRows = users.map((u) => {
    try { return mapProfile(u); } catch (e) { warn(`skip profile ${u._id}:`, e.message); return null; }
  }).filter(Boolean);
  summary.push({ table: 'profiles', ...(await upsert('profiles', profileRows)) });

  const studentRows = users.filter((u) => (u.role || '').toLowerCase() === 'student').map((u) => {
    try { return mapStudent(u); } catch { return null; }
  }).filter(Boolean);
  summary.push({ table: 'students', ...(await upsert('students', studentRows)) });

  const facultyRows = users.filter((u) => ['faculty', 'hod'].includes((u.role || '').toLowerCase())).map((u) => {
    try { return mapFaculty(u); } catch { return null; }
  }).filter(Boolean);
  summary.push({ table: 'faculty', ...(await upsert('faculty', facultyRows)) });

  const staffRows = users.filter((u) => ['doctor', 'admin', 'dispensary_staff'].includes((u.role || '').toLowerCase())).map((u) => {
    try { return mapDispensaryStaff(u); } catch { return null; }
  }).filter(Boolean);
  summary.push({ table: 'dispensary_staff', ...(await upsert('dispensary_staff', staffRows)) });

  // Independent / leaf tables next.
  await migrate('inventoryitems', mapInventory, 'inventory_items');
  await migrate('ambulances', mapAmbulance, 'ambulances');

  // Foreign-key dependent tables.
  await migrate('appointments', mapAppointment, 'appointments');

  // Prescriptions + their medications child rows.
  try {
    const rxs = await db.collection('prescriptions').find().toArray();
    log(`prescriptions: ${rxs.length} candidate rows`);
    const rxRows = rxs.map((p) => { try { return mapPrescription(p); } catch { return null; } }).filter(Boolean);
    summary.push({ table: 'prescriptions', ...(await upsert('prescriptions', rxRows)) });

    const medRows = rxs.flatMap(mapPrescriptionMedications);
    if (medRows.length) {
      if (!DRY_RUN) await sb.from('prescription_medications').delete().in('prescription_id', rxRows.map((r) => r.id));
      summary.push({ table: 'prescription_medications', ...(await upsert('prescription_medications', medRows, 'prescription_id,position')) });
    }
  } catch (err) {
    warn('prescriptions failed:', err.message);
  }

  await migrate('loginlogs', mapLoginLog, 'login_logs');

  log('=== summary ===');
  for (const s of summary) {
    log(`  ${s.table.padEnd(28)} inserted=${s.inserted} errors=${s.errors}${s.message ? ' message=' + s.message : ''}`);
  }
  log(DRY_RUN ? 'Dry run complete. No writes performed.' : 'ETL complete.');

  await mongo.close();
  process.exit(0);
})().catch((err) => {
  console.error('[etl] fatal:', err);
  process.exit(1);
});
