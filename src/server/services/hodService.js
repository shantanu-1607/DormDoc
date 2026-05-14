/**
 * hodService.js
 *
 * All HOD business logic lives here. Route handlers stay thin.
 *
 * SECURITY INVARIANT: every exported function receives `department` from
 * req.scope.department (injected by scopeToDepartment middleware). No function
 * here ever reads req.query.department or req.body.department — the caller
 * is responsible for passing only the scoped value.
 */

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Student = require('../models/Student');
const LeaveDecision = require('../models/LeaveDecision');

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns all student ObjectIds that belong to `department`, querying both
 * the legacy User collection and the Clerk-based Student collection.
 * De-duplication is done by string key to avoid false duplicates from
 * ObjectId reference inequality.
 */
async function getDeptStudentIds(department) {
  const [userIds, studentIds] = await Promise.all([
    User.find({ department, role: { $in: ['student', 'Student'] } }).distinct('_id'),
    Student.find({ department }).distinct('_id'),
  ]);
  const seen = new Set();
  const merged = [];
  for (const id of [...userIds, ...studentIds]) {
    const key = id.toString();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(id);
    }
  }
  return merged;
}

/**
 * Returns the start and end of the current calendar month as Date objects.
 */
function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Escapes a string for safe use inside a RegExp literal.
 * Prevents ReDoS when user-supplied search terms contain regex special characters.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes a single value for RFC-4180 CSV output.
 */
function csvCell(value) {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields) {
  return fields.map(csvCell).join(',');
}

// ─── 1. Dashboard stats ───────────────────────────────────────────────────────

async function getDashboardStats(department) {
  const studentIds = await getDeptStudentIds(department);
  const { start, end } = currentMonthRange();

  const baseMatch = { student: { $in: studentIds } };
  const leaveBase = { ...baseMatch, 'leaveRequest.requested': true };

  const [
    pendingLeaves,
    approvedThisMonth,
    activeCases,
    emergencyCases,
    recentLeaves,
    topSymptomsRaw,
  ] = await Promise.all([
    // Pending leave count
    Appointment.countDocuments({
      ...leaveBase,
      'leaveRequest.status': 'pending',
    }),

    // Approved this month
    Appointment.countDocuments({
      ...leaveBase,
      'leaveRequest.status': 'approved',
      'leaveRequest.decidedAt': { $gte: start, $lte: end },
    }),

    // Active medical cases (non-terminal appointment statuses)
    Appointment.countDocuments({
      ...baseMatch,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    }),

    // Emergency / SOS cases (unresolved)
    Appointment.countDocuments({
      ...baseMatch,
      isEmergency: true,
      status: { $nin: ['completed', 'cancelled'] },
    }),

    // Recent leave activity (last 10)
    Appointment.find({ ...leaveBase })
      .populate('student', 'name studentId department year')
      .select('leaveRequest createdAt student symptoms')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    // Top symptoms aggregation (last 90 days)
    Appointment.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          symptoms: { $ne: '' },
        },
      },
      { $group: { _id: '$symptoms', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  return {
    pendingLeaves,
    approvedThisMonth,
    activeCases,
    emergencyCases,
    topSymptoms: topSymptomsRaw.map(s => ({ symptom: s._id, count: s.count })),
    recentLeaveActivity: recentLeaves.map(appt => ({
      _id: appt._id,
      studentName: appt.student?.name || 'Unknown',
      studentId: appt.student?.studentId || '',
      year: appt.student?.year || '',
      reason: appt.leaveRequest?.reason || '',
      duration: appt.leaveRequest?.duration,
      status: appt.leaveRequest?.status,
      requestedAt: appt.createdAt,
    })),
  };
}

// ─── 2. Leave request list ────────────────────────────────────────────────────

async function getLeaveRequests(department, { page = 1, limit = 15, status } = {}) {
  const studentIds = await getDeptStudentIds(department);

  const filter = {
    student: { $in: studentIds },
    'leaveRequest.requested': true,
  };
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter['leaveRequest.status'] = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .populate('student', 'name studentId department year email phone')
      .populate('doctor', 'name specialization')
      .select('leaveRequest symptoms diagnosis createdAt student doctor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

// ─── 3. Leave request detail ──────────────────────────────────────────────────

async function getLeaveRequestDetail(appointmentId, department) {
  const studentIds = await getDeptStudentIds(department);

  const appt = await Appointment.findOne({
    _id: appointmentId,
    student: { $in: studentIds },
    'leaveRequest.requested': true,
  })
    .populate('student', 'name studentId department year email phone bloodGroup emergencyContact')
    .populate('doctor', 'name specialization')
    .lean();

  if (!appt) return null;

  // Approval history from the audit collection
  const history = await LeaveDecision.find({ leaveRequestId: appointmentId })
    .sort({ decidedAt: -1 })
    .lean();

  return { appointment: appt, approvalHistory: history };
}

// ─── 4. Process leave decision (approve / reject) ─────────────────────────────

async function processLeaveDecision(
  appointmentId,
  department,
  { deciderId, deciderName, action, comments, ipAddress, userAgent }
) {
  if (!['approved', 'rejected'].includes(action)) {
    throw Object.assign(new Error('action must be "approved" or "rejected"'), { status: 400 });
  }
  if (action === 'rejected' && !comments?.trim()) {
    throw Object.assign(new Error('Comments are required when rejecting a leave request'), { status: 400 });
  }

  const studentIds = await getDeptStudentIds(department);

  const appt = await Appointment.findOne({
    _id: appointmentId,
    student: { $in: studentIds },
    'leaveRequest.requested': true,
  }).populate('student', 'name studentId department');

  if (!appt) {
    throw Object.assign(new Error('Leave request not found or not in your department'), { status: 404 });
  }

  // Block re-decisions: once a leave is approved or rejected it is final.
  // The frontend hides the form for already-decided leaves, but the API
  // must enforce this independently.
  if (appt.leaveRequest.status !== 'pending') {
    throw Object.assign(
      new Error(
        `This leave request has already been ${appt.leaveRequest.status}. Re-decisions are not permitted.`
      ),
      { status: 409 }
    );
  }

  const now = new Date();

  // Update appointment atomically
  appt.leaveRequest.status = action;
  appt.leaveRequest.approvedBy = deciderName;
  appt.leaveRequest.approvedAt = now;
  appt.leaveRequest.decidedBy = deciderId;
  appt.leaveRequest.decidedByName = deciderName;
  appt.leaveRequest.decidedAt = now;
  appt.leaveRequest.decisionRole = 'hod';
  appt.leaveRequest.decisionComments = comments || '';
  appt.leaveRequest.hodReviewedAt = now;

  // Create immutable audit record and save appointment in parallel
  const auditDoc = new LeaveDecision({
    leaveRequestId: appt._id,
    studentId: appt.student._id,
    studentName: appt.student.name,
    studentDepartment: appt.student.department,
    deciderId,
    deciderName,
    deciderRole: 'hod',
    action,
    comments: comments || '',
    decidedAt: now,
    leaveSnapshot: {
      duration: appt.leaveRequest.duration,
      reason: appt.leaveRequest.reason,
      status: action,
    },
    ipAddress: ipAddress || '',
    userAgent: userAgent || '',
  });

  await Promise.all([appt.save(), auditDoc.save()]);

  return { appointment: appt, auditRecord: auditDoc };
}

// ─── 5. Department student roster ─────────────────────────────────────────────

async function getDepartmentStudents(department, { page = 1, limit = 20, search = '' } = {}) {
  const filter = { department };
  if (search.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: re }, { studentId: re }, { email: re }];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [students, total] = await Promise.all([
    Student.find(filter)
      .select('name studentId email phone department year programme hostel bloodGroup chronicConditions isActive isCurrentlyAdmitted')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Student.countDocuments(filter),
  ]);

  return {
    students,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

// ─── 6. Individual student medical summary ────────────────────────────────────

async function getStudentMedicalSummary(studentId, department) {
  // Verify the student belongs to the HOD's department before exposing data
  const student = await Student.findOne({
    _id: studentId,
    department,
  })
    .select('-__v')
    .lean();

  if (!student) {
    // Also check legacy User collection
    const legacyUser = await User.findOne({
      _id: studentId,
      department,
      role: { $in: ['student', 'Student'] },
    })
      .select('-password -__v')
      .lean();

    if (!legacyUser) return null;

    // Fall through with legacy user as the profile
    return buildMedicalSummary(legacyUser, studentId);
  }

  return buildMedicalSummary(student, student._id);
}

async function buildMedicalSummary(profile, queryId) {
  const [appointments, leaveHistory] = await Promise.all([
    Appointment.find({ student: queryId })
      .populate('doctor', 'name specialization')
      .select('appointmentDate status symptoms diagnosis treatment prescription leaveRequest createdAt')
      .sort({ appointmentDate: -1 })
      .limit(20)
      .lean(),

    LeaveDecision.find({ studentId: queryId })
      .sort({ decidedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const chronicConditions = profile.chronicConditions || profile.medicalHistory?.map(h => h.condition) || [];

  return {
    profile,
    appointments,
    leaveHistory,
    summary: {
      totalAppointments: appointments.length,
      totalLeaveRequests: appointments.filter(a => a.leaveRequest?.requested).length,
      approvedLeaves: appointments.filter(a => a.leaveRequest?.status === 'approved').length,
      chronicConditions,
    },
  };
}

// ─── 7. Active medical cases ──────────────────────────────────────────────────

async function getActiveCases(department) {
  const studentIds = await getDeptStudentIds(department);

  const cases = await Appointment.find({
    student: { $in: studentIds },
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
  })
    .populate('student', 'name studentId department year hostel')
    .populate('doctor', 'name specialization')
    .select('appointmentDate appointmentTime status symptoms diagnosis treatment isEmergency priority student doctor')
    .sort({ priority: -1, appointmentDate: 1 })
    .lean();

  return cases;
}

// ─── 8. Department analytics ──────────────────────────────────────────────────

async function getDepartmentAnalytics(department) {
  const studentIds = await getDeptStudentIds(department);

  const baseMatch = { student: { $in: studentIds } };
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [monthlyLeaves, topSymptoms, demographics, recoveryStats, yearWiseLeaves] =
    await Promise.all([
      // Monthly leave request trends (last 12 months)
      Appointment.aggregate([
        {
          $match: {
            ...baseMatch,
            'leaveRequest.requested': true,
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            total: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$leaveRequest.status', 'approved'] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$leaveRequest.status', 'rejected'] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$leaveRequest.status', 'pending'] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Top symptoms (last 90 days)
      Appointment.aggregate([
        {
          $match: {
            ...baseMatch,
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            symptoms: { $nin: ['', null] },
          },
        },
        { $group: { _id: '$symptoms', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Year-wise student demographics (from Student collection)
      Student.aggregate([
        { $match: { department } },
        {
          $group: {
            _id: '$year',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Recovery stats: completed vs total appointments
      Appointment.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
            emergency: {
              $sum: { $cond: ['$isEmergency', 1, 0] },
            },
          },
        },
      ]),

      // Leave rate by academic year
      Appointment.aggregate([
        {
          $match: {
            ...baseMatch,
            'leaveRequest.requested': true,
          },
        },
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'studentDoc',
          },
        },
        { $unwind: { path: '$studentDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$studentDoc.year',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const recovery = recoveryStats[0] || { total: 0, completed: 0, cancelled: 0, emergency: 0 };
  const recoveryRate = recovery.total > 0
    ? Math.round((recovery.completed / recovery.total) * 100)
    : 0;

  return {
    monthlyLeaves: monthlyLeaves.map(m => ({
      year: m._id.year,
      month: m._id.month,
      label: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      total: m.total,
      approved: m.approved,
      rejected: m.rejected,
      pending: m.pending,
    })),
    topSymptoms: topSymptoms.map(s => ({ symptom: s._id, count: s.count })),
    demographics: demographics.map(d => ({ year: d._id || 'Unknown', count: d.count })),
    recoveryRate,
    totalAppointments: recovery.total,
    completedAppointments: recovery.completed,
    emergencyCount: recovery.emergency,
    yearWiseLeaves: yearWiseLeaves.map(y => ({
      year: y._id || 'Unknown',
      count: y.count,
    })),
  };
}

// ─── 9. Monthly CSV report ────────────────────────────────────────────────────

async function getMonthlyReportCsv(department, year, month) {
  const monthNum = Number(month);
  const yearNum = Number(year);

  if (
    !monthNum || monthNum < 1 || monthNum > 12 ||
    !yearNum  || yearNum  < 2000 || yearNum > 2100
  ) {
    throw Object.assign(
      new Error('Valid year (2000–2100) and month (1–12) are required'),
      { status: 400 }
    );
  }

  const start = new Date(yearNum, monthNum - 1, 1);
  const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const studentIds = await getDeptStudentIds(department);

  const appointments = await Appointment.find({
    student: { $in: studentIds },
    createdAt: { $gte: start, $lte: end },
  })
    .populate('student', 'name studentId year email department')
    .populate('doctor', 'name specialization')
    .lean();

  const headers = [
    'Date',
    'Student Name',
    'Student ID',
    'Year',
    'Email',
    'Department',
    'Symptoms',
    'Diagnosis',
    'Status',
    'Leave Requested',
    'Leave Duration (days)',
    'Leave Status',
    'Leave Reason',
    'Doctor',
    'Specialization',
    'Is Emergency',
  ];

  const rows = appointments.map(a => [
    a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : '',
    a.student?.name || '',
    a.student?.studentId || '',
    a.student?.year || '',
    a.student?.email || '',
    a.student?.department || department,
    a.symptoms || '',
    a.diagnosis || '',
    a.status || '',
    a.leaveRequest?.requested ? 'Yes' : 'No',
    a.leaveRequest?.duration || '',
    a.leaveRequest?.requested ? (a.leaveRequest.status || '') : '',
    a.leaveRequest?.requested ? (a.leaveRequest.reason || '') : '',
    a.doctor?.name || '',
    a.doctor?.specialization || '',
    a.isEmergency ? 'Yes' : 'No',
  ]);

  const csvLines = [csvRow(headers), ...rows.map(csvRow)];
  return {
    csv: csvLines.join('\r\n'),
    filename: `hod-report-${department.replace(/\s+/g, '_')}-${yearNum}-${String(monthNum).padStart(2, '0')}.csv`,
    recordCount: rows.length,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getDashboardStats,
  getLeaveRequests,
  getLeaveRequestDetail,
  processLeaveDecision,
  getDepartmentStudents,
  getStudentMedicalSummary,
  getActiveCases,
  getDepartmentAnalytics,
  getMonthlyReportCsv,
};
