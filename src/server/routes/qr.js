const express = require('express');
const { body, validationResult } = require('express-validator');
const qrcode = require('qrcode');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// ─── helpers ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'in_progress'];

async function findActiveStudent(sb, studentIdCode) {
  const { data: studentRow } = await sb
    .from('students')
    .select('id, student_id, department, year, blood_group, allergies, current_medications, emergency_contact, qr_code')
    .eq('student_id', studentIdCode)
    .maybeSingle();
  if (!studentRow) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select('id, name, email, is_active')
    .eq('id', studentRow.id)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    studentId: studentRow.student_id,
    department: studentRow.department,
    year: studentRow.year,
    bloodGroup: studentRow.blood_group,
    allergies: studentRow.allergies || [],
    currentMedications: studentRow.current_medications || [],
    emergencyContact: studentRow.emergency_contact || {},
    qrCode: studentRow.qr_code,
  };
}

async function findActiveAppointment(sb, studentUuid, { emergencyOnly = false } = {}) {
  let q = sb
    .from('appointments')
    .select('*')
    .eq('student_id', studentUuid)
    .in('status', ACTIVE_STATUSES)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(1);
  if (emergencyOnly) q = q.eq('is_emergency', true);
  const { data } = await q;
  return data?.[0] || null;
}

async function emitIo(req, event, payload) {
  if (req.io) req.io.emit(event, payload);
}

// ─── routes ─────────────────────────────────────────────────────────────────

router.post(
  '/scan',
  [
    body('qrData').notEmpty().withMessage('QR code data is required'),
    body('scanType')
      .isIn(['check-in', 'ambulance-pickup', 'appointment-verification'])
      .withMessage('Invalid scan type'),
    body('location').optional().isObject().withMessage('Location must be an object'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { qrData, scanType, location, additionalInfo = {} } = req.body;
      const sb = req.sb;
      const scannerId = req.user.id;

      let parsed;
      try {
        parsed = JSON.parse(qrData);
      } catch {
        return res.status(400).json({ message: 'Invalid QR code format' });
      }
      if (!parsed.studentId) return res.status(400).json({ message: 'QR code missing studentId' });

      const student = await findActiveStudent(sb, parsed.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found or inactive' });

      let result;
      switch (scanType) {
        case 'check-in':
          result = await processCheckIn(sb, student, scannerId, location, additionalInfo);
          break;
        case 'ambulance-pickup':
          result = await processAmbulancePickup(sb, student, scannerId, location, additionalInfo);
          break;
        case 'appointment-verification':
          result = await processAppointmentVerification(sb, student, scannerId, additionalInfo);
          break;
        default:
          return res.status(400).json({ message: 'Invalid scan type' });
      }

      emitIo(req, 'qr-scan-processed', {
        scanType,
        studentId: student.id,
        studentName: student.name,
        timestamp: new Date(),
        result,
      });

      res.json({
        message: 'QR code processed successfully',
        student: {
          name: student.name,
          studentId: student.studentId,
          department: student.department,
          bloodGroup: student.bloodGroup,
        },
        result,
      });
    } catch (error) {
      console.error('QR scan processing error:', error);
      res.status(500).json({ message: 'Server error processing QR scan' });
    }
  }
);

router.get('/generate/:studentId', async (req, res) => {
  try {
    const sb = req.sb;
    const student = await findActiveStudent(sb, req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const qrData =
      student.qrCode ||
      JSON.stringify({
        studentId: student.studentId,
        name: student.name,
        department: student.department,
      });

    const qrCodeImage = await qrcode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    res.json({
      qrData,
      qrCodeImage,
      student: { name: student.name, studentId: student.studentId, department: student.department },
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ message: 'Server error generating QR code' });
  }
});

router.get('/scan-history', async (req, res) => {
  // No scan-log table exists yet — preserves legacy placeholder response.
  const { page = 1 } = req.query;
  res.json({ scans: [], totalPages: 0, currentPage: parseInt(page, 10) || 1, total: 0 });
});

router.post(
  '/bulk-scan',
  [
    body('scans').isArray().withMessage('Scans must be an array'),
    body('scans.*.qrData').notEmpty().withMessage('QR data is required for each scan'),
    body('scans.*.scanType')
      .isIn(['check-in', 'ambulance-pickup', 'appointment-verification'])
      .withMessage('Invalid scan type'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const sb = req.sb;
      const scannerId = req.user.id;
      const { scans } = req.body;
      const results = [];
      const scanErrors = [];

      for (let i = 0; i < scans.length; i++) {
        try {
          const { qrData, scanType, location, additionalInfo = {} } = scans[i];

          let parsed;
          try {
            parsed = JSON.parse(qrData);
          } catch {
            scanErrors.push({ index: i, error: 'Invalid QR code format', qrData });
            continue;
          }

          const student = await findActiveStudent(sb, parsed.studentId);
          if (!student) {
            scanErrors.push({ index: i, error: 'Student not found', studentId: parsed.studentId });
            continue;
          }

          let result;
          switch (scanType) {
            case 'check-in':
              result = await processCheckIn(sb, student, scannerId, location, additionalInfo);
              break;
            case 'ambulance-pickup':
              result = await processAmbulancePickup(sb, student, scannerId, location, additionalInfo);
              break;
            case 'appointment-verification':
              result = await processAppointmentVerification(sb, student, scannerId, additionalInfo);
              break;
          }

          results.push({
            index: i,
            student: { name: student.name, studentId: student.studentId },
            result,
          });
        } catch (error) {
          scanErrors.push({ index: i, error: error.message, qrData: scans[i].qrData });
        }
      }

      emitIo(req, 'bulk-qr-scan-completed', {
        totalScans: scans.length,
        successfulScans: results.length,
        failedScans: scanErrors.length,
        timestamp: new Date(),
      });

      res.json({
        message: 'Bulk scan processing completed',
        results,
        errors: scanErrors,
        summary: { total: scans.length, successful: results.length, failed: scanErrors.length },
      });
    } catch (error) {
      console.error('Bulk QR scan error:', error);
      res.status(500).json({ message: 'Server error processing bulk scans' });
    }
  }
);

// ─── handlers ───────────────────────────────────────────────────────────────

async function processCheckIn(sb, student, scannerId, location, additionalInfo) {
  const { data: appointmentRows } = await sb
    .from('appointments')
    .select('*')
    .eq('student_id', student.id)
    .in('status', ['scheduled', 'confirmed'])
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(1);

  const appointment = appointmentRows?.[0];
  if (!appointment) {
    return {
      success: false,
      message: 'No active appointment found for this student',
      action: 'Schedule an appointment first',
    };
  }

  const { error: updateErr } = await sb
    .from('appointments')
    .update({ status: 'in_progress', check_in_time: new Date().toISOString() })
    .eq('id', appointment.id);
  if (updateErr) throw updateErr;

  let doctorName = 'TBD';
  if (appointment.doctor_id) {
    const [{ data: doctorProfile }, { data: staffRow }] = await Promise.all([
      sb.from('profiles').select('name').eq('id', appointment.doctor_id).maybeSingle(),
      sb
        .from('dispensary_staff')
        .select('current_queue_number')
        .eq('id', appointment.doctor_id)
        .maybeSingle(),
    ]);
    doctorName = doctorProfile?.name || 'TBD';
    if (staffRow) {
      await sb
        .from('dispensary_staff')
        .update({ current_queue_number: (staffRow.current_queue_number || 0) + 1 })
        .eq('id', appointment.doctor_id);
    }
  }

  return {
    success: true,
    message: 'Student checked in successfully',
    appointment: {
      id: appointment.id,
      doctor: doctorName,
      queueNumber: appointment.queue_number,
      estimatedWaitTime: appointment.estimated_wait_time,
    },
    action: 'Student added to queue',
  };
}

async function processAmbulancePickup(sb, student, scannerId, location, additionalInfo) {
  const appointment = await findActiveAppointment(sb, student.id, { emergencyOnly: true });
  if (!appointment) {
    return {
      success: false,
      message: 'No ambulance assignment found for this student',
      action: 'Book an ambulance first',
    };
  }

  const { error: updateErr } = await sb
    .from('appointments')
    .update({ status: 'in_progress', check_in_time: new Date().toISOString() })
    .eq('id', appointment.id);
  if (updateErr) throw updateErr;

  return {
    success: true,
    message: 'Ambulance pickup confirmed',
    appointment: {
      id: appointment.id,
      symptoms: appointment.symptoms,
      priority: appointment.priority,
    },
    action: 'Ambulance en route to destination',
  };
}

async function processAppointmentVerification(sb, student, scannerId, additionalInfo) {
  const appointment = await findActiveAppointment(sb, student.id);
  if (!appointment) {
    return { success: false, message: 'No active appointment found', action: 'Schedule an appointment' };
  }

  let doctorName = 'TBD';
  let specialization = null;
  if (appointment.doctor_id) {
    const [{ data: profile }, { data: staff }] = await Promise.all([
      sb.from('profiles').select('name').eq('id', appointment.doctor_id).maybeSingle(),
      sb
        .from('dispensary_staff')
        .select('specialization')
        .eq('id', appointment.doctor_id)
        .maybeSingle(),
    ]);
    doctorName = profile?.name || 'TBD';
    specialization = staff?.specialization || null;
  }

  return {
    success: true,
    message: 'Appointment verified successfully',
    verification: {
      student: {
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        bloodGroup: student.bloodGroup,
      },
      appointment: {
        id: appointment.id,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        doctor: doctorName,
        specialization,
        symptoms: appointment.symptoms,
        priority: appointment.priority,
        status: appointment.status,
      },
      medicalInfo: {
        allergies: student.allergies,
        currentMedications: student.currentMedications,
        emergencyContact: student.emergencyContact,
      },
    },
    action: 'Proceed with consultation',
  };
}

module.exports = router;
