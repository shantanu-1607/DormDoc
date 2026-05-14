/**
 * HOD Routes  —  /api/hod/*
 *
 * Security chain applied to EVERY endpoint in this file:
 *   authenticateToken  →  requireRole(['hod'])  →  scopeToDepartment
 *
 * authenticateToken   verifies JWT; falls back to Faculty collection for HODs
 * requireRole         rejects any caller whose role !== 'hod'
 * scopeToDepartment   injects req.scope.department from req.user.hodDepartment;
 *                     route handlers MUST use req.scope.department only —
 *                     never req.query.department or req.body.department
 */
const mongoose = require('mongoose');
const express  = require('express');
const router   = express.Router();

const { authenticateToken, requireRole } = require('../middleware/auth');
const scopeToDepartment = require('../middleware/scopeToDepartment');
const svc = require('../services/hodService');

// ─── Apply security chain to every HOD route ─────────────────────────────────
router.use(authenticateToken, requireRole(['hod']), scopeToDepartment);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sends a consistent JSON error response.
 * Uses err.status when set by the service layer (400/404/409/etc.).
 * Falls back to 500 and hides the raw message from the client.
 */
const handleError = (res, err) => {
  console.error('[HOD]', err.message);
  const status  = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
};

/**
 * Returns true when `id` is a syntactically valid MongoDB ObjectId.
 * Used at the route layer to return 400 instead of letting Mongoose throw
 * a CastError (which would become a confusing 500).
 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /api/hod/dashboard
 * Returns: pendingLeaves, approvedThisMonth, activeCases, emergencyCases,
 *          topSymptoms, recentLeaveActivity
 */
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await svc.getDashboardStats(req.scope.department);
    res.json(stats);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Leave Requests ───────────────────────────────────────────────────────────

/**
 * GET /api/hod/leave-requests
 * Query params: page (default 1), limit (default 15), status (pending|approved|rejected)
 */
router.get('/leave-requests', async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await svc.getLeaveRequests(
      req.scope.department,
      { page, limit, status }
    );
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/hod/leave-requests/:id
 * Returns full leave detail + student profile + prescription + approval history
 */
router.get('/leave-requests/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid leave request ID' });
    }
    const detail = await svc.getLeaveRequestDetail(
      req.params.id,
      req.scope.department
    );
    if (!detail) {
      return res.status(404).json({ error: 'Leave request not found or not in your department' });
    }
    res.json(detail);
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * PUT /api/hod/leave-requests/:id/decision
 * Body: { action: 'approved'|'rejected', comments: String }
 *
 * - Validates the ObjectId and the action value before hitting the service.
 * - Service enforces: department scope, pending-only, mandatory comments on reject.
 * - Creates an immutable LeaveDecision audit record on every successful call.
 * - Returns 409 if the leave has already been decided.
 */
router.put('/leave-requests/:id/decision', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid leave request ID' });
    }

    const { action, comments } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required (approved | rejected)' });
    }
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approved" or "rejected"' });
    }

    const result = await svc.processLeaveDecision(
      req.params.id,
      req.scope.department,
      {
        deciderId:   req.user._id,
        deciderName: req.user.name,
        action,
        comments,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || '',
      }
    );

    res.json({
      message:     `Leave request ${action} successfully`,
      appointment: result.appointment,
      auditId:     result.auditRecord._id,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Students ─────────────────────────────────────────────────────────────────

/**
 * GET /api/hod/students
 * Query params: page, limit, search (name | studentId | email)
 * Read-only department roster.
 */
router.get('/students', async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await svc.getDepartmentStudents(
      req.scope.department,
      { page, limit, search }
    );
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/hod/students/:id/medical-summary
 * Returns student profile, appointment history, leave history, chronic conditions.
 * Verifies the student belongs to the HOD's department before responding.
 */
router.get('/students/:id/medical-summary', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const summary = await svc.getStudentMedicalSummary(
      req.params.id,
      req.scope.department
    );
    if (!summary) {
      return res.status(404).json({ error: 'Student not found or not in your department' });
    }
    res.json(summary);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Active Cases ─────────────────────────────────────────────────────────────

/**
 * GET /api/hod/active-cases
 * Returns students currently under treatment (scheduled/confirmed/in-progress).
 */
router.get('/active-cases', async (req, res) => {
  try {
    const cases = await svc.getActiveCases(req.scope.department);
    res.json({ cases, total: cases.length });
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * GET /api/hod/analytics
 * Returns: monthlyLeaves, topSymptoms, demographics, recoveryRate,
 *          yearWiseLeaves, aggregate counters
 */
router.get('/analytics', async (req, res) => {
  try {
    const data = await svc.getDepartmentAnalytics(req.scope.department);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * GET /api/hod/reports/monthly
 * Query params: year (2000–2100), month (1–12)
 * Returns a CSV file download.
 */
router.get('/reports/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'year and month query params are required' });
    }

    const report = await svc.getMonthlyReportCsv(req.scope.department, year, month);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`
    );
    res.send(report.csv);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
