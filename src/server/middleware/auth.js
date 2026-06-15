const jwt = require('jsonwebtoken');
const { supabaseAdmin, supabaseForUser } = require('../db/supabase');
if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'development') {
  throw new Error('FATAL: Insecure development authentication bypass is enabled outside of local development environment.');
}

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

function verifySupabaseJwt(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET not configured');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const isDev = process.env.NODE_ENV === 'development';
    const isBypassEnabled = isDev && process.env.DEV_AUTH_BYPASS === 'true';

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    if (isBypassEnabled) {
      const user = await loadUserFromProfile(token);
      if (user) {
        if (user.inactive) return res.status(401).json({ message: 'Account deactivated' });
        req.user = user;
        req.accessToken = token;
        req.sb = supabaseAdmin;
        return next();
      }
    }

    const decoded = verifySupabaseJwt(token);
    const user = await loadUserFromProfile(decoded.sub);

    if (!user) return res.status(401).json({ message: 'Profile not found' });
    if (user.inactive) return res.status(401).json({ message: 'Account deactivated' });

    req.user = user;
    req.accessToken = token;
    req.sb = supabaseForUser(token);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
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
    const isDev = process.env.NODE_ENV === 'development';
    const isBypassEnabled = isDev && process.env.DEV_AUTH_BYPASS === 'true';

    if (token) {
      if (isBypassEnabled) {
        const user = await loadUserFromProfile(token);
        if (user && !user.inactive) {
          req.user = user;
          req.accessToken = token;
          req.sb = supabaseAdmin;
          return next();
        }
      }

      const decoded = verifySupabaseJwt(token);
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
