const jwt = require('jsonwebtoken');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { supabaseAdmin, supabaseForUser } = require('../db/supabase');

// Newer Supabase projects sign access tokens with asymmetric keys (ES256/RS256)
// fetched from /auth/v1/.well-known/jwks.json, not the legacy HS256 secret.
// We try JWKS first and fall back to HS256 for projects still on the old key.
const JWKS_URL = process.env.SUPABASE_URL
  ? new URL('/auth/v1/.well-known/jwks.json', process.env.SUPABASE_URL)
  : null;
const jwks = JWKS_URL ? createRemoteJWKSet(JWKS_URL) : null;

const DEV_STUDENT_UUID = '00000000-0000-0000-0000-000000000001';
const DEV_HOD_UUID = '00000000-0000-0000-0000-000000000002';
const DEV_ADMIN_UUID = '00000000-0000-0000-0000-000000000003';

const devStudentUser = {
  id: DEV_STUDENT_UUID,
  _id: DEV_STUDENT_UUID,
  name: 'Test Student',
  email: 'dev-student@bitmesra.local',
  role: 'student',
  studentId: 'BIT123',
  department: 'Computer Science',
  bloodGroup: 'O+',
};

const devHodUser = {
  id: DEV_HOD_UUID,
  _id: DEV_HOD_UUID,
  name: 'Test HOD',
  email: 'dev-hod@bitmesra.local',
  role: 'hod',
  facultyId: 'BIT-FAC-HOD-001',
  department: 'Computer Science',
  hodDepartment: 'Computer Science',
  designation: 'HOD',
  hodPermissions: {
    canApproveLeave: true,
    canViewMedicalHistory: true,
    canExportReports: true,
  },
};

const devAdminUser = {
  id: DEV_ADMIN_UUID,
  _id: DEV_ADMIN_UUID,
  name: 'Test Admin',
  email: 'dev-admin@bitmesra.local',
  role: 'admin',
  staffId: 'BIT-DISP-ADMIN-001',
  staffType: 'admin_staff',
  designation: 'Admin',
};

// Pull the role-specific row alongside the profile so downstream routes see the
// fields they used to read off the Mongo User document. Phase 3 will replace
// these joins with per-route Supabase calls; this is the transition shim.
const ROLE_TABLES = {
  student: { table: 'students', select: 'student_id, department, year, hostel, room_number, blood_group, allergies, chronic_conditions, emergency_contact, qr_code, is_currently_admitted' },
  faculty: { table: 'faculty', select: 'faculty_id, department, designation, hod_department, hod_permissions, blood_group, emergency_contact' },
  hod: { table: 'faculty', select: 'faculty_id, department, designation, hod_department, hod_permissions, blood_group, emergency_contact' },
  dean: { table: 'faculty', select: 'faculty_id, department, designation, blood_group, emergency_contact' },
  admin: { table: 'dispensary_staff', select: 'staff_id, staff_type, designation, blood_group, emergency_contact' },
  doctor: { table: 'dispensary_staff', select: 'staff_id, staff_type, designation, license_number, specialization, blood_group, emergency_contact' },
  dispensary_staff: { table: 'dispensary_staff', select: 'staff_id, staff_type, designation, blood_group, emergency_contact' },
  parent: { table: 'parents', select: 'parent_id, relation_to_student, is_verified, alternate_phone' },
};

const snakeToCamel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toCamel = (row) => {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[snakeToCamel(k)] = v;
  return out;
};

async function loadUserFromProfile(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, name, email, phone, photo_url, is_active, last_login_at')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;
  if (!profile.is_active) return { inactive: true };

  const roleInfo = ROLE_TABLES[profile.role];
  let roleRow = null;
  if (roleInfo) {
    const { data } = await supabaseAdmin
      .from(roleInfo.table)
      .select(roleInfo.select)
      .eq('id', userId)
      .maybeSingle();
    roleRow = data;
  }

  return {
    id: profile.id,
    _id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    phone: profile.phone,
    photoUrl: profile.photo_url,
    isActive: profile.is_active,
    lastLoginAt: profile.last_login_at,
    ...toCamel(roleRow || {}),
  };
}

// "View as" preview: a high-privilege user (admin/HOD) can preview another
// role's panel. The client sends the previewed role in the `X-View-As` header.
// We swap req.user to a representative active user of that role so role-scoped
// endpoints return real sample data, and force the service-role client so the
// reads bypass RLS (the JWT still belongs to the real admin). Previews are
// read-only — writes are rejected — so no data is mutated as another user.
const PREVIEW_TARGETS = {
  admin: new Set(['student', 'doctor', 'hod', 'parent']),
  hod: new Set(['student', 'doctor', 'parent']),
};

function canPreviewAs(realRole, targetRole) {
  return !!PREVIEW_TARGETS[realRole]?.has(targetRole);
}

async function loadRepresentativeUser(role) {
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', role)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);
  if (!profiles || !profiles.length) return null;
  return loadUserFromProfile(profiles[0].id);
}

async function verifySupabaseJwt(token) {
  // Asymmetric (ES256/RS256) — new Supabase default.
  if (jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        algorithms: ['ES256', 'RS256'],
      });
      return payload;
    } catch (err) {
      // Fall through to HS256 only if the failure looks like wrong-alg.
      if (err?.code !== 'ERR_JWS_INVALID' && err?.code !== 'ERR_JWKS_NO_MATCHING_KEY') {
        throw err;
      }
    }
  }
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET not configured');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const isDev = process.env.NODE_ENV === 'development';

    if (!token) {
      if (isDev) {
        req.user = devStudentUser;
        req.sb = supabaseAdmin;
        return next();
      }
      return res.status(401).json({ message: 'Access token required' });
    }

    if (isDev && token === 'dev_token') {
      req.user = devStudentUser;
      req.sb = supabaseAdmin;
      return next();
    }
    if (isDev && token === 'hod_dev_token') {
      req.user = devHodUser;
      req.sb = supabaseAdmin;
      return next();
    }
    if (isDev && token === 'admin_dev_token') {
      req.user = devAdminUser;
      req.sb = supabaseAdmin;
      return next();
    }

    const decoded = await verifySupabaseJwt(token);
    const user = await loadUserFromProfile(decoded.sub);

    if (!user) return res.status(401).json({ message: 'Profile not found' });
    if (user.inactive) return res.status(401).json({ message: 'Account deactivated' });

    // "View as" preview — impersonate a representative user of the previewed role.
    // Identity/account routes (/api/auth/*) are NEVER impersonated: the app must
    // always resolve the real signed-in user, or an admin previewing another role
    // would get locked out of their own identity (and the panel switcher).
    const viewAs = (req.headers['x-view-as'] || '').toLowerCase();
    const isIdentityRoute = (req.originalUrl || '').split('?')[0].startsWith('/api/auth/');
    if (viewAs && !isIdentityRoute && viewAs !== user.role && canPreviewAs(user.role, viewAs)) {
      const rep = await loadRepresentativeUser(viewAs);
      if (rep && !rep.inactive) {
        if (req.method !== 'GET') {
          return res.status(403).json({
            message: 'Preview mode is read-only. Exit preview to make changes.',
          });
        }
        req.realUser = user;
        req.user = rep;
        req.viewAs = viewAs;
        req.accessToken = token;
        req.sb = supabaseAdmin; // preview reads bypass RLS (JWT is the real admin's)
        return next();
      }
    }

    req.user = user;
    req.accessToken = token;
    req.sb = supabaseForUser(token);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError' || (error.code || '').startsWith('ERR_JW')) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Auth check failed' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access restricted to: ${roles.join(', ')}`,
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await verifySupabaseJwt(token);
      const user = await loadUserFromProfile(decoded.sub);
      if (user && !user.inactive) {
        req.user = user;
        req.accessToken = token;
        req.sb = supabaseForUser(token);
      }
    }
    next();
  } catch (error) {
    next();
  }
};

const sensitiveOperationLimit = (req, res, next) => {
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStudent,
  optionalAuth,
  sensitiveOperationLimit,
  verifySupabaseJwt,
  loadUserFromProfile,
};
