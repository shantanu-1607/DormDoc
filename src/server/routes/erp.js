const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// ─── helpers ────────────────────────────────────────────────────────────────

const HOD_EMAILS = {
  'Computer Science': 'hod.cs@college.edu',
  Electronics: 'hod.electronics@college.edu',
  Mechanical: 'hod.mechanical@college.edu',
  Civil: 'hod.civil@college.edu',
  Electrical: 'hod.electrical@college.edu',
};

let transporter = null;
function getTransporter() {
  if (transporter !== null) return transporter;
  if (!process.env.EMAIL_HOST) {
    transporter = false; // memoize "no SMTP configured"
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
}

async function safeSendMail(mailOptions) {
  const t = getTransporter();
  if (!t) {
    console.warn('[erp] SMTP not configured — skipping email to', mailOptions.to);
    return;
  }
  try {
    await t.sendMail(mailOptions);
  } catch (err) {
    console.error('[erp] email send failed:', err.message);
  }
}

function emitIo(req, event, payload) {
  if (req.io) req.io.emit(event, payload);
}

async function loadStudentContext(sb, studentUuid) {
  const [{ data: profile }, { data: studentRow }] = await Promise.all([
    sb.from('profiles').select('id, name, email').eq('id', studentUuid).maybeSingle(),
    sb
      .from('students')
      .select('student_id, department, year')
      .eq('id', studentUuid)
      .maybeSingle(),
  ]);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    studentId: studentRow?.student_id || null,
    department: studentRow?.department || null,
    year: studentRow?.year || null,
  };
}

const toClientLeaveRequest = (row, appointment) => ({
  _id: row.id,
  appointmentId: row.appointment_id,
  studentId: row.student_id,
  duration: row.duration_days,
  reason: row.reason,
  status: row.status,
  decidedBy: row.decided_by,
  decidedByName: row.decided_by_name || null,
  decidedAt: row.decided_at,
  decisionRole: row.decision_role || null,
  decisionComments: row.decision_comments || null,
  submittedAt: row.created_at,
  appointment: appointment
    ? {
        date: appointment.appointment_date,
        diagnosis: appointment.diagnosis,
        treatment: appointment.treatment,
        doctorId: appointment.doctor_id,
      }
    : null,
});

// ─── routes ─────────────────────────────────────────────────────────────────

router.post(
  '/request-leave',
  [
    body('appointmentId').isUUID().withMessage('Valid appointment ID is required'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
    body('reason').notEmpty().withMessage('Leave reason is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('year').notEmpty().withMessage('Year is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const sb = req.sb;
      const studentId = req.user.id;
      const { appointmentId, duration, reason, department, year } = req.body;

      const { data: appointment } = await sb
        .from('appointments')
        .select('id, doctor_id, appointment_date, diagnosis, treatment, status')
        .eq('id', appointmentId)
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .maybeSingle();

      if (!appointment) {
        return res.status(404).json({ message: 'Completed appointment not found' });
      }

      const { data: existing } = await sb
        .from('leave_requests')
        .select('id, status')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ message: 'Leave request already submitted for this appointment' });
      }

      const { data: inserted, error: insertErr } = await sb
        .from('leave_requests')
        .insert({
          appointment_id: appointmentId,
          student_id: studentId,
          duration_days: parseInt(duration, 10),
          reason,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      let doctorName = 'N/A';
      if (appointment.doctor_id) {
        const { data: doctorProfile } = await sb
          .from('profiles')
          .select('name')
          .eq('id', appointment.doctor_id)
          .maybeSingle();
        doctorName = doctorProfile?.name || 'N/A';
      }

      const hodEmail = HOD_EMAILS[department] || 'hod@college.edu';
      await safeSendMail({
        from: process.env.EMAIL_USER,
        to: hodEmail,
        subject: `Medical Leave Request - ${req.user.name} (${req.user.studentId || ''})`,
        html: `
          <h2>Medical Leave Request</h2>
          <p><strong>Student Details:</strong></p>
          <ul>
            <li>Name: ${req.user.name}</li>
            <li>Student ID: ${req.user.studentId || ''}</li>
            <li>Department: ${department}</li>
            <li>Year: ${year}</li>
          </ul>

          <p><strong>Medical Details:</strong></p>
          <ul>
            <li>Appointment Date: ${appointment.appointment_date}</li>
            <li>Doctor: ${doctorName}</li>
            <li>Diagnosis: ${appointment.diagnosis || 'Not provided'}</li>
            <li>Treatment: ${appointment.treatment || 'Not provided'}</li>
          </ul>

          <p><strong>Leave Request:</strong></p>
          <ul>
            <li>Duration: ${duration} days</li>
            <li>Reason: ${reason}</li>
            <li>Submitted At: ${inserted.created_at}</li>
          </ul>

          <p>Please review and approve/reject this leave request through the admin portal.</p>
        `,
      });

      emitIo(req, 'leave-request-submitted', {
        studentId,
        appointmentId,
        leaveRequestId: inserted.id,
        duration,
        reason,
        timestamp: new Date(),
      });

      res.json({
        message: 'Leave request submitted successfully',
        leaveRequest: toClientLeaveRequest(inserted, appointment),
      });
    } catch (error) {
      console.error('Leave request error:', error);
      res.status(500).json({ message: 'Server error submitting leave request' });
    }
  }
);

router.get('/leave-status', async (req, res) => {
  try {
    const sb = req.sb;
    const studentId = req.user.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { status } = req.query;

    let query = sb
      .from('leave_requests')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId);

    if (status) query = query.eq('status', status);

    const { data: requests, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const appointmentIds = (requests || []).map((r) => r.appointment_id);
    let appointmentMap = {};
    if (appointmentIds.length) {
      const { data: appointments } = await sb
        .from('appointments')
        .select('id, doctor_id, appointment_date, diagnosis, treatment')
        .in('id', appointmentIds);
      appointmentMap = Object.fromEntries((appointments || []).map((a) => [a.id, a]));
    }

    res.json({
      leaveRequests: (requests || []).map((r) => toClientLeaveRequest(r, appointmentMap[r.appointment_id])),
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      total: count || 0,
    });
  } catch (error) {
    console.error('Get leave status error:', error);
    res.status(500).json({ message: 'Server error fetching leave status' });
  }
});

// leave_requests.decided_by FKs into faculty(id), so only HOD/faculty rows
// can decide leaves at the DB level. Gate the route to match.
router.put(
  '/approve-leave',
  requireRole(['hod']),
  [
    body('appointmentId').isUUID().withMessage('Valid appointment ID is required'),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('comments').optional().isString().withMessage('Comments must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const sb = req.sb;
      const approver = req.user;
      const { appointmentId, action, comments = '' } = req.body;

      const { data: leaveRequest } = await sb
        .from('leave_requests')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();
      if (!leaveRequest) {
        return res.status(404).json({ message: 'No leave request found for this appointment' });
      }
      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({ message: 'Leave request has already been processed' });
      }

      const studentCtx = await loadStudentContext(sb, leaveRequest.student_id);
      if (!studentCtx) return res.status(404).json({ message: 'Student profile not found' });

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const decidedAt = new Date().toISOString();

      const { data: updated, error: updErr } = await sb
        .from('leave_requests')
        .update({
          status: newStatus,
          decided_by: approver.id,
          decided_by_name: approver.name,
          decided_at: decidedAt,
          decision_role: approver.role,
          decision_comments: comments,
          hod_reviewed_at: approver.role === 'hod' ? decidedAt : leaveRequest.hod_reviewed_at,
        })
        .eq('id', leaveRequest.id)
        .select()
        .single();
      if (updErr) throw updErr;

      const { error: auditErr } = await sb.from('leave_decisions').insert({
        leave_request_id: leaveRequest.id,
        student_id: leaveRequest.student_id,
        student_name: studentCtx.name,
        student_department: studentCtx.department || '',
        decider_id: approver.id,
        decider_name: approver.name,
        decider_role: approver.role,
        action: newStatus,
        comments,
        leave_snapshot: leaveRequest,
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
      });
      if (auditErr) console.error('Leave decision audit insert failed:', auditErr);

      await safeSendMail({
        from: process.env.EMAIL_USER,
        to: studentCtx.email,
        subject: `Medical Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        html: `
          <h2>Medical Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'}</h2>
          <p>Dear ${studentCtx.name},</p>

          <p>Your medical leave request has been <strong>${action}d</strong> by ${approver.name}.</p>

          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}

          <p>Decided on: ${decidedAt}</p>

          <p>If you have any questions, please contact your department office.</p>
        `,
      });

      emitIo(req, 'leave-request-processed', {
        studentId: leaveRequest.student_id,
        appointmentId,
        leaveRequestId: leaveRequest.id,
        action: newStatus,
        approvedBy: approver.name,
        timestamp: new Date(),
      });

      res.json({
        message: `Leave request ${action}d successfully`,
        leaveRequest: toClientLeaveRequest(updated),
      });
    } catch (error) {
      console.error('Approve leave error:', error);
      res.status(500).json({ message: 'Server error processing leave request' });
    }
  }
);

router.get('/attendance-report', async (req, res) => {
  try {
    const sb = req.sb;
    const queryStudentId = req.query.studentId;
    const targetUuid = queryStudentId || req.user.id;

    if (queryStudentId && queryStudentId !== req.user.id && !['admin', 'hod', 'doctor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Cannot view another student\'s attendance' });
    }

    const student = await loadStudentContext(sb, targetUuid);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const start = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const { data: appointments } = await sb
      .from('appointments')
      .select('id, appointment_date, doctor_id, diagnosis, treatment, is_emergency, actual_wait_time, status')
      .eq('student_id', targetUuid)
      .eq('status', 'completed')
      .gte('appointment_date', start.toISOString().slice(0, 10))
      .lte('appointment_date', end.toISOString().slice(0, 10))
      .order('appointment_date', { ascending: false });

    const rows = appointments || [];
    const doctorIds = [...new Set(rows.map((a) => a.doctor_id).filter(Boolean))];
    let doctorMap = {};
    if (doctorIds.length) {
      const { data: doctors } = await sb.from('profiles').select('id, name').in('id', doctorIds);
      doctorMap = Object.fromEntries((doctors || []).map((d) => [d.id, d.name]));
    }

    const total = rows.length;
    const emergencyCount = rows.filter((a) => a.is_emergency).length;
    const averageWaitTime = total
      ? Math.round(rows.reduce((sum, a) => sum + (a.actual_wait_time || 0), 0) / total)
      : 0;

    res.json({
      student: {
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
      },
      period: { startDate: start, endDate: end },
      report: {
        totalAppointments: total,
        emergencyAppointments: emergencyCount,
        regularAppointments: total - emergencyCount,
        averageWaitTime,
        appointments: rows.map((a) => ({
          date: a.appointment_date,
          doctor: doctorMap[a.doctor_id] || 'N/A',
          diagnosis: a.diagnosis,
          treatment: a.treatment,
          isEmergency: a.is_emergency,
        })),
      },
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error generating attendance report' });
  }
});

router.post('/sync-data', requireRole(['admin']), async (req, res) => {
  try {
    const sb = req.sb;
    const { syncType = 'all' } = req.body;
    const syncResults = {};

    if (syncType === 'all' || syncType === 'students') {
      const { count } = await sb
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true);
      syncResults.students = { synced: count || 0, timestamp: new Date() };
    }

    if (syncType === 'all' || syncType === 'attendance') {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await sb
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', since);
      syncResults.attendance = { synced: count || 0, timestamp: new Date() };
    }

    if (syncType === 'all' || syncType === 'leave-requests') {
      const { count } = await sb
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');
      syncResults.leaveRequests = { synced: count || 0, timestamp: new Date() };
    }

    res.json({
      message: 'Data sync completed successfully',
      syncResults,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('ERP sync error:', error);
    res.status(500).json({ message: 'Server error syncing data with ERP' });
  }
});

module.exports = router;
