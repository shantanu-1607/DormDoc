const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../db/supabase');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

// ─── helpers ────────────────────────────────────────────────────────────────

const PROFILE_FIELDS = 'id, role, name, email, phone, is_active, last_login_at, created_at';
const ROLE_VALUES = new Set(['student', 'doctor', 'hod', 'admin', 'parent', 'dispensary_staff', 'faculty']);

const escapeLike = (s) => String(s || '').replace(/([%_\\,()])/g, '\\$1');

const normalizeIp = (ip) => {
  if (!ip) return '0.0.0.0';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  if (ip === '::1') return '127.0.0.1';
  return ip;
};

const toClientLog = (log, userMap = {}) => ({
  _id: log.id,
  userId: log.user_id,
  email: log.email,
  action: log.action,
  ipAddress: log.ip_address,
  userAgent: log.user_agent,
  status: log.status,
  reason: log.reason,
  timestamp: log.created_at,
  user: log.user_id ? userMap[log.user_id] || null : null,
});

const toClientUser = (profile, studentRow, facultyRow, staffRow) => ({
  _id: profile.id,
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  phone: profile.phone,
  isActive: profile.is_active,
  lastLogin: profile.last_login_at,
  createdAt: profile.created_at,
  studentId: studentRow?.student_id || facultyRow?.faculty_id || staffRow?.staff_id || null,
  department: studentRow?.department || facultyRow?.department || null,
  year: studentRow?.year || null,
  bloodGroup: studentRow?.blood_group || facultyRow?.blood_group || staffRow?.blood_group || null,
  emergencyContact:
    studentRow?.emergency_contact || facultyRow?.emergency_contact || staffRow?.emergency_contact || null,
});

async function hydrateUsers(sb, userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return {};

  const [{ data: profiles }, { data: students }, { data: faculty }, { data: staff }] = await Promise.all([
    sb.from('profiles').select(PROFILE_FIELDS).in('id', unique),
    sb.from('students').select('id, student_id, department, year, blood_group, emergency_contact').in('id', unique),
    sb.from('faculty').select('id, faculty_id, department, blood_group, emergency_contact').in('id', unique),
    sb.from('dispensary_staff').select('id, staff_id, blood_group, emergency_contact').in('id', unique),
  ]);

  const studentMap = Object.fromEntries((students || []).map((r) => [r.id, r]));
  const facultyMap = Object.fromEntries((faculty || []).map((r) => [r.id, r]));
  const staffMap = Object.fromEntries((staff || []).map((r) => [r.id, r]));

  return Object.fromEntries(
    (profiles || []).map((p) => [p.id, toClientUser(p, studentMap[p.id], facultyMap[p.id], staffMap[p.id])])
  );
}

async function resolveUserIdsForSearch(sb, { search, role }) {
  let restrict = null;

  if (role && role !== 'all' && ROLE_VALUES.has(role)) {
    const { data } = await sb.from('profiles').select('id').eq('role', role);
    restrict = new Set((data || []).map((r) => r.id));
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    const [{ data: matchedProfiles }, { data: matchedStudents }, { data: matchedFaculty }, { data: matchedStaff }] =
      await Promise.all([
        sb.from('profiles').select('id').or(`name.ilike.${term},email.ilike.${term}`),
        sb.from('students').select('id').ilike('student_id', term),
        sb.from('faculty').select('id').ilike('faculty_id', term),
        sb.from('dispensary_staff').select('id').ilike('staff_id', term),
      ]);
    const searchIds = new Set([
      ...(matchedProfiles || []).map((r) => r.id),
      ...(matchedStudents || []).map((r) => r.id),
      ...(matchedFaculty || []).map((r) => r.id),
      ...(matchedStaff || []).map((r) => r.id),
    ]);
    restrict = restrict ? new Set([...restrict].filter((id) => searchIds.has(id))) : searchIds;
  }

  return restrict; // null = no restriction; Set of UUIDs otherwise
}

async function logAuditEvent(sb, { userId, email, action, status = 'success', reason, req }) {
  const { error } = await sb.from('login_logs').insert({
    user_id: userId || null,
    email,
    action,
    ip_address: normalizeIp(req.ip),
    user_agent: req.get('User-Agent') || 'unknown',
    status,
    reason: reason || null,
  });
  if (error) console.error('Audit log write failed:', error);
}

// ─── routes ─────────────────────────────────────────────────────────────────

// Aggregated payload for the AdminDashboard component. Everything is best-effort
// — a fresh DB with no appointments / no ambulances still renders an empty
// dashboard instead of erroring out.
router.get('/dashboard', async (req, res) => {
  try {
    const sb = supabaseAdmin;
    const today = new Date().toISOString().slice(0, 10);

    const [
      studentsCnt,
      doctorsCnt,
      ambulancesCnt,
      activeApptsCnt,
      todayApptsCnt,
      doctorRows,
      ambulanceRows,
      queueRows,
      todayStatusRows,
      emergencyRows,
    ] = await Promise.all([
      sb.from('students').select('id', { count: 'exact', head: true }),
      sb.from('dispensary_staff').select('id', { count: 'exact', head: true }).eq('staff_type', 'medical_officer'),
      sb.from('ambulances').select('id', { count: 'exact', head: true }),
      sb.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['scheduled', 'confirmed', 'in_progress']),
      sb.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
      sb.from('dispensary_staff').select('id, staff_id, designation, is_on_duty').eq('staff_type', 'medical_officer').limit(10),
      sb.from('ambulances').select('*').limit(10),
      sb.from('appointments').select('id, queue_number, status, student_id, doctor_id').eq('appointment_date', today).in('status', ['scheduled', 'in_progress']).order('queue_number', { ascending: true }).limit(10),
      sb.from('appointments').select('status').eq('appointment_date', today),
      sb.from('appointments').select('id, symptoms, emergency_reason, student_id').eq('appointment_date', today).eq('is_emergency', true).limit(10),
    ]);

    const userIds = [
      ...(doctorRows.data || []).map((d) => d.id),
      ...(queueRows.data || []).map((a) => a.student_id),
      ...(emergencyRows.data || []).map((a) => a.student_id),
    ];
    const profileMap = {};
    if (userIds.length) {
      const { data: profs } = await sb
        .from('profiles')
        .select('id, name, email, phone')
        .in('id', [...new Set(userIds.filter(Boolean))]);
      (profs || []).forEach((p) => { profileMap[p.id] = p; });
    }

    const counts = {};
    (todayStatusRows.data || []).forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    const normStatus = (s) => (s === 'in_progress' ? 'in-progress' : s);
    const todayStats = Object.entries(counts).map(([status, count]) => ({
      _id: normStatus(status),
      count,
    }));

    const doctors = (doctorRows.data || []).map((d) => {
      const p = profileMap[d.id] || {};
      return {
        _id: d.id,
        name: p.name || 'Unknown',
        email: p.email,
        phone: p.phone,
        designation: d.designation,
        isOnDuty: d.is_on_duty,
        staffId: d.staff_id,
      };
    });

    const ambulances = (ambulanceRows.data || []).map((a) => ({
      ...a,
      _id: a.id,
    }));

    const studentQueue = (queueRows.data || []).map((a) => ({
      _id: a.id,
      queueNumber: a.queue_number,
      status: normStatus(a.status),
      student: { name: profileMap[a.student_id]?.name || 'Unknown' },
    }));

    const emergencyAlerts = (emergencyRows.data || []).map((a) => ({
      _id: a.id,
      reason: a.emergency_reason || a.symptoms,
      student: { name: profileMap[a.student_id]?.name || 'Unknown' },
    }));

    res.json({
      doctors,
      ambulances,
      studentQueue,
      todayStats,
      emergencyAlerts,
      systemMetrics: {
        totalStudents: studentsCnt.count || 0,
        totalDoctors: doctorsCnt.count || 0,
        totalAmbulances: ambulancesCnt.count || 0,
        activeAppointments: activeApptsCnt.count || 0,
        todayAppointments: todayApptsCnt.count || 0,
      },
    });
  } catch (err) {
    console.error('admin/dashboard failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/login-info', async (req, res) => {
  try {
    const sb = req.sb;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    const restrictUserIds = await resolveUserIdsForSearch(sb, { search, role });
    if (restrictUserIds && restrictUserIds.size === 0 && !search) {
      return res.json({ loginInfo: [], totalCount: 0, currentPage: page, totalPages: 0 });
    }

    let query = sb.from('login_logs').select('*', { count: 'exact' });
    if (status && status !== 'all') query = query.eq('status', status);

    if (restrictUserIds !== null) {
      const idList = [...restrictUserIds];
      if (search) {
        // Match by user_id OR by raw email on the log row (covers failed-login attempts where user_id is null)
        const term = `%${escapeLike(search)}%`;
        if (idList.length) {
          query = query.or(`user_id.in.(${idList.join(',')}),email.ilike.${term}`);
        } else {
          query = query.ilike('email', term);
        }
      } else if (idList.length) {
        query = query.in('user_id', idList);
      }
    }

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const userMap = await hydrateUsers(sb, (logs || []).map((l) => l.user_id));

    res.json({
      loginInfo: (logs || []).map((l) => toClientLog(l, userMap)),
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Get login info error:', error);
    res.status(500).json({ message: 'Failed to fetch login information' });
  }
});

router.get('/login-statistics', async (req, res) => {
  try {
    const sb = req.sb;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startIso = startOfDay.toISOString();

    const [
      totalUsersRes,
      lockedUsersRes,
      todayLoginsRes,
      failedTodayRes,
      recentLoginsRes,
    ] = await Promise.all([
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', false),
      sb
        .from('login_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'login')
        .eq('status', 'success')
        .gte('created_at', startIso),
      sb
        .from('login_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', startIso),
      sb
        .from('login_logs')
        .select('*')
        .eq('action', 'login')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const recentLogs = recentLoginsRes.data || [];
    const userMap = await hydrateUsers(sb, recentLogs.map((l) => l.user_id));

    res.json({
      totalUsers: totalUsersRes.count || 0,
      activeUsers: todayLoginsRes.count || 0,
      lockedUsers: lockedUsersRes.count || 0,
      todayLogins: todayLoginsRes.count || 0,
      failedLogins: failedTodayRes.count || 0,
      recentLogins: recentLogs.map((l) => toClientLog(l, userMap)),
    });
  } catch (error) {
    console.error('Get login statistics error:', error);
    res.status(500).json({ message: 'Failed to fetch login statistics' });
  }
});

router.get('/recent-logins', async (req, res) => {
  try {
    const sb = req.sb;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const { data: logs, error } = await sb
      .from('login_logs')
      .select('*')
      .eq('action', 'login')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const userMap = await hydrateUsers(sb, (logs || []).map((l) => l.user_id));
    res.json((logs || []).map((l) => toClientLog(l, userMap)));
  } catch (error) {
    console.error('Get recent logins error:', error);
    res.status(500).json({ message: 'Failed to fetch recent logins' });
  }
});

router.get('/suspicious-logins', async (req, res) => {
  try {
    const sb = req.sb;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // PostgREST can't group_by. Pull failed attempts from last 24h and bucket in node.
    const { data: failed, error } = await sb
      .from('login_logs')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) throw error;

    const buckets = new Map();
    for (const row of failed || []) {
      const key = String(row.ip_address);
      if (!buckets.has(key)) buckets.set(key, { _id: key, count: 0, attempts: [] });
      const bucket = buckets.get(key);
      bucket.count += 1;
      bucket.attempts.push(row);
    }

    const suspicious = [...buckets.values()]
      .filter((b) => b.count >= 5)
      .sort((a, b) => b.count - a.count);

    res.json(suspicious);
  } catch (error) {
    console.error('Get suspicious logins error:', error);
    res.status(500).json({ message: 'Failed to fetch suspicious logins' });
  }
});

router.get('/user-login-history/:userId', async (req, res) => {
  try {
    const sb = req.sb;
    const { userId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const { data: logs, error } = await sb
      .from('login_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const userMap = await hydrateUsers(sb, [userId]);
    res.json((logs || []).map((l) => toClientLog(l, userMap)));
  } catch (error) {
    console.error('Get user login history error:', error);
    res.status(500).json({ message: 'Failed to fetch user login history' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const sb = req.sb;
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'User ID and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const { data: profile } = await sb.from('profiles').select('id, email').eq('id', userId).maybeSingle();
    if (!profile) return res.status(404).json({ message: 'User not found' });

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (updateErr) {
      console.error('Auth password update failed:', updateErr);
      return res.status(500).json({ message: 'Failed to reset password' });
    }

    await logAuditEvent(sb, {
      userId,
      email: profile.email,
      action: 'password_reset',
      reason: 'Reset by admin',
      req,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

router.post('/toggle-user-status', async (req, res) => {
  try {
    const sb = req.sb;
    const { userId, action } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ message: 'User ID and action are required' });
    }
    if (!['lock', 'unlock'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either lock or unlock' });
    }

    const { data: profile } = await sb.from('profiles').select('id, email, role').eq('id', userId).maybeSingle();
    if (!profile) return res.status(404).json({ message: 'User not found' });
    if (profile.role === 'admin' && action === 'lock') {
      return res.status(403).json({ message: 'Cannot lock admin users' });
    }

    const isActive = action === 'unlock';
    const { error: updateErr } = await sb.from('profiles').update({ is_active: isActive }).eq('id', userId);
    if (updateErr) throw updateErr;

    await logAuditEvent(sb, {
      userId,
      email: profile.email,
      action: action === 'lock' ? 'account_lock' : 'account_unlock',
      reason: `Account ${action}ed by admin`,
      req,
    });

    res.json({ message: `User ${action}ed successfully`, isActive });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

// OTP statistics endpoint removed in Phase 2 — OTP is now handled by Supabase
// Auth (no longer queryable from our DB). Track via Supabase dashboard logs.
router.get('/otp-statistics', (req, res) => {
  res.status(410).json({ message: 'OTP statistics moved — see Supabase Auth logs.' });
});

router.get('/users', async (req, res) => {
  try {
    const sb = req.sb;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    let query = sb.from('profiles').select(PROFILE_FIELDS, { count: 'exact' });

    if (role && role !== 'all' && ROLE_VALUES.has(role)) query = query.eq('role', role);
    if (status && status !== 'all') query = query.eq('is_active', status === 'active');

    if (search) {
      const term = `%${escapeLike(search)}%`;
      // For studentId search we need to prefetch matching ids from role-specific tables
      const [{ data: matchedStudents }, { data: matchedFaculty }, { data: matchedStaff }] = await Promise.all([
        sb.from('students').select('id').ilike('student_id', term),
        sb.from('faculty').select('id').ilike('faculty_id', term),
        sb.from('dispensary_staff').select('id').ilike('staff_id', term),
      ]);
      const idList = [
        ...(matchedStudents || []).map((r) => r.id),
        ...(matchedFaculty || []).map((r) => r.id),
        ...(matchedStaff || []).map((r) => r.id),
      ];
      const idsClause = idList.length ? `,id.in.(${idList.join(',')})` : '';
      query = query.or(`name.ilike.${term},email.ilike.${term}${idsClause}`);
    }

    const { data: profiles, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const userMap = await hydrateUsers(sb, (profiles || []).map((p) => p.id));
    const users = (profiles || []).map((p) => userMap[p.id]).filter(Boolean);

    res.json({
      users,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    const sb = req.sb;
    const { userId } = req.params;

    const { data: profile } = await sb.from('profiles').select('id, email, role').eq('id', userId).maybeSingle();
    if (!profile) return res.status(404).json({ message: 'User not found' });
    if (profile.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });

    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error('Auth user delete failed:', deleteErr);
      return res.status(500).json({ message: 'Failed to delete user' });
    }

    await logAuditEvent(sb, {
      userId: null,
      email: profile.email,
      action: 'account_lock',
      reason: 'User deleted by admin',
      req,
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.get('/export-login-data', async (req, res) => {
  try {
    const sb = req.sb;
    const { format = 'csv', startDate, endDate } = req.query;

    let query = sb.from('login_logs').select('*').order('created_at', { ascending: false }).limit(10000);
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    const { data: logs, error } = await query;
    if (error) throw error;

    const userMap = await hydrateUsers(sb, (logs || []).map((l) => l.user_id));

    if (format === 'csv') {
      const csvEscape = (v) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = [
        ['Timestamp', 'User', 'Email', 'Role', 'Action', 'IP Address', 'Status', 'Reason'],
        ...(logs || []).map((log) => {
          const u = log.user_id ? userMap[log.user_id] : null;
          return [
            log.created_at,
            u?.name || 'N/A',
            log.email,
            u?.role || 'N/A',
            log.action,
            log.ip_address,
            log.status,
            log.reason || 'N/A',
          ];
        }),
      ];
      const csvData = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=login-data.csv');
      return res.send(csvData);
    }

    res.json((logs || []).map((l) => toClientLog(l, userMap)));
  } catch (error) {
    console.error('Export login data error:', error);
    res.status(500).json({ message: 'Failed to export login data' });
  }
});

module.exports = router;
