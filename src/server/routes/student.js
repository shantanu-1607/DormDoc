const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireStudent } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireStudent);

// ─── helpers ────────────────────────────────────────────────────────────────

const SLOT_MINUTES = 30;
const EMERGENCY_KEYWORDS = ['emergency', 'urgent', 'severe', 'critical', 'bleeding', 'unconscious'];
const HIGH_PRIORITY_KEYWORDS = ['pain', 'fever', 'nausea', 'dizziness'];

const calculatePriority = (symptoms = '') => {
  const lower = symptoms.toLowerCase();
  if (EMERGENCY_KEYWORDS.some((k) => lower.includes(k))) return 9;
  if (HIGH_PRIORITY_KEYWORDS.some((k) => lower.includes(k))) return 7;
  return 5;
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayOfWeekName = (date) => DAY_NAMES[date.getDay()];

const hydrateDoctorNames = async (sb, ids) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data } = await sb.from('profiles').select('id, name').in('id', unique);
  return Object.fromEntries((data || []).map((r) => [r.id, r.name]));
};

// ─── routes ─────────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const sb = req.sb;
    const studentId = req.user.id;

    // Doctor on duty = dispensary_staff row where staff_type='medical_officer' and is_on_duty=true
    const { data: doctorRows } = await sb
      .from('dispensary_staff')
      .select('id, designation, specialization, current_queue_number, average_consultation_time, total_consultations')
      .eq('staff_type', 'medical_officer')
      .eq('is_on_duty', true)
      .limit(1);
    const doctorRow = doctorRows?.[0];
    let doctorOnDuty = null;
    if (doctorRow) {
      const { data: profile } = await sb.from('profiles').select('name').eq('id', doctorRow.id).maybeSingle();
      doctorOnDuty = { id: doctorRow.id, name: profile?.name, ...doctorRow };
    }

    const { data: currentAppointments } = await sb
      .from('appointments')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    const { data: appointmentHistory } = await sb
      .from('appointments')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .limit(5);

    const doctorIds = [
      ...(currentAppointments || []).map((a) => a.doctor_id),
      ...(appointmentHistory || []).map((a) => a.doctor_id),
    ];
    const doctorNames = await hydrateDoctorNames(sb, doctorIds);
    const attach = (rows) => (rows || []).map((a) => ({ ...a, doctor_name: doctorNames[a.doctor_id] || null }));

    res.json({
      doctorOnDuty,
      currentAppointments: attach(currentAppointments),
      appointmentHistory: attach(appointmentHistory),
      availableSlots: [],
      queueStatus: [],
      studentInfo: {
        name: req.user.name,
        studentId: req.user.studentId,
        department: req.user.department,
        bloodGroup: req.user.bloodGroup,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
});

router.post(
  '/book-appointment',
  [
    body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
    body('symptoms').notEmpty().withMessage('Symptoms description is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { doctorId, appointmentDate, appointmentTime, symptoms, isEmergency = false } = req.body;
      const sb = req.sb;
      const studentId = req.user.id;

      const { data: doctor } = await sb
        .from('dispensary_staff')
        .select('id, current_queue_number')
        .eq('id', doctorId)
        .eq('staff_type', 'medical_officer')
        .maybeSingle();
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

      const dt = new Date(`${appointmentDate}T${appointmentTime}`);
      if (dt <= new Date()) return res.status(400).json({ message: 'Appointment must be scheduled for future date and time' });

      const { data: availability } = await sb
        .from('staff_availability')
        .select('start_time, end_time, is_available')
        .eq('staff_id', doctorId)
        .eq('day_of_week', dayOfWeekName(dt))
        .maybeSingle();
      if (!availability?.is_available) {
        return res.status(400).json({ message: 'Doctor is not available on the requested day' });
      }
      if (availability.start_time > appointmentTime || availability.end_time <= appointmentTime) {
        return res.status(400).json({ message: 'Doctor is not available at the requested time' });
      }

      const { data: clash } = await sb
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', appointmentDate)
        .eq('appointment_time', appointmentTime)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .maybeSingle();
      if (clash) return res.status(400).json({ message: 'Time slot is already booked' });

      const { data: lastForDay } = await sb
        .from('appointments')
        .select('queue_number')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', appointmentDate)
        .order('queue_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      const queueNumber = (lastForDay?.queue_number ?? 0) + 1;
      const priority = isEmergency ? 10 : calculatePriority(symptoms);

      const { data: appointment, error: insertErr } = await sb
        .from('appointments')
        .insert({
          student_id: studentId,
          doctor_id: doctorId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'scheduled',
          symptoms,
          priority,
          queue_number: queueNumber,
          estimated_wait_time: 0,
          actual_wait_time: 0,
          consultation_notes: '',
          diagnosis: '',
          treatment: '',
          is_emergency: !!isEmergency,
          emergency_reason: '',
          follow_up_required: false,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      await sb
        .from('dispensary_staff')
        .update({ current_queue_number: (doctor.current_queue_number || 0) + 1 })
        .eq('id', doctorId);

      // Realtime: clients subscribed to public.appointments via supabase_realtime
      // get the INSERT event automatically (Phase 4).

      res.status(201).json({ message: 'Appointment booked successfully', appointment });
    } catch (error) {
      console.error('Appointment booking error:', error);
      res.status(500).json({ message: error.message || 'Server error booking appointment' });
    }
  }
);

router.get('/appointments', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = req.sb
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('student_id', req.user.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .range(from, to);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;

    const doctorNames = await hydrateDoctorNames(req.sb, (data || []).map((a) => a.doctor_id));
    res.json({
      appointments: (data || []).map((a) => ({ ...a, doctor_name: doctorNames[a.doctor_id] || null })),
      totalPages: Math.ceil((count || 0) / limitNum),
      currentPage: pageNum,
      total: count || 0,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

router.put('/appointments/:id/cancel', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: appointment, error: readErr } = await sb
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .eq('student_id', req.user.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Cannot cancel completed or already cancelled appointment' });
    }

    const dt = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const hoursDiff = (dt - new Date()) / 3.6e6;
    if (hoursDiff < 2) {
      return res.status(400).json({ message: 'Cannot cancel appointment within 2 hours of scheduled time' });
    }

    const { error: updErr } = await sb
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment.id);
    if (updErr) throw updErr;

    if (appointment.doctor_id) {
      const { data: doc } = await sb
        .from('dispensary_staff')
        .select('current_queue_number')
        .eq('id', appointment.doctor_id)
        .maybeSingle();
      if (doc) {
        await sb
          .from('dispensary_staff')
          .update({ current_queue_number: Math.max(0, (doc.current_queue_number || 0) - 1) })
          .eq('id', appointment.doctor_id);
      }
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
});

router.post(
  '/book-ambulance',
  [
    body('symptoms').notEmpty().withMessage('Symptoms description is required'),
    body('pickupLocation').notEmpty().withMessage('Pickup location is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { symptoms, pickupLocation, destination, isEmergency = false } = req.body;
      const sb = req.sb;

      // Pick the first in-service ambulance; nearest-geo fallback is a Phase 4
      // follow-up (needs a PostGIS distance query / RPC).
      const { data: ambulances } = await sb
        .from('ambulances')
        .select('id, vehicle_number, driver_name, driver_phone')
        .eq('status', 'available')
        .limit(1);
      if (!ambulances?.length) return res.status(400).json({ message: 'No ambulances available at the moment' });
      const ambulance = ambulances[0];

      const priority = isEmergency ? 'critical' : 'high';

      const { data: trip, error: tripErr } = await sb
        .from('ambulance_trips')
        .insert({
          patient_name: req.user.name,
          patient_phone: req.user.phone ?? '',
          student_id: req.user.id,
          pickup_location: typeof pickupLocation === 'string' ? pickupLocation : JSON.stringify(pickupLocation),
          destination: typeof destination === 'string' ? destination : (destination ? JSON.stringify(destination) : 'Campus dispensary'),
          emergency_type: 'medical',
          priority,
          ambulance_id: ambulance.id,
          status: 'dispatched',
          current_address: 'En route',
          notes: symptoms,
          completion_notes: '',
          created_by: req.user.id,
        })
        .select()
        .single();
      if (tripErr) throw tripErr;

      await sb.from('ambulances').update({ status: 'on_trip' }).eq('id', ambulance.id);

      // Realtime: clients subscribed to public.ambulance_trips get the INSERT
      // event automatically (Phase 4).

      res.status(201).json({
        message: 'Ambulance booked successfully',
        ambulance: {
          vehicleNumber: ambulance.vehicle_number,
          driverName: ambulance.driver_name,
          driverPhone: ambulance.driver_phone,
        },
        trip,
      });
    } catch (error) {
      console.error('Ambulance booking error:', error);
      res.status(500).json({ message: error.message || 'Server error booking ambulance' });
    }
  }
);

router.post(
  '/emergency-sos',
  [
    body('symptoms').notEmpty().withMessage('Symptoms description is required'),
    body('location').notEmpty().withMessage('Current location is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { symptoms, location } = req.body;
      const sb = req.sb;

      const { data: ambulances } = await sb
        .from('ambulances')
        .select('id, vehicle_number')
        .eq('status', 'available')
        .limit(1);
      const ambulance = ambulances?.[0];

      let trip = null;
      if (ambulance) {
        const result = await sb
          .from('ambulance_trips')
          .insert({
            patient_name: req.user.name,
            patient_phone: req.user.phone ?? '',
            student_id: req.user.id,
            pickup_location: typeof location === 'string' ? location : JSON.stringify(location),
            destination: 'Campus dispensary',
            emergency_type: 'medical',
            priority: 'critical',
            ambulance_id: ambulance.id,
            status: 'dispatched',
            current_address: 'En route',
            notes: `SOS: ${symptoms}`,
            completion_notes: '',
            created_by: req.user.id,
          })
          .select()
          .single();
        if (result.error) throw result.error;
        trip = result.data;
        await sb.from('ambulances').update({ status: 'on_trip' }).eq('id', ambulance.id);
      }

      // Realtime: emergency dispatch shows up via the ambulance_trips INSERT
      // (priority='high' drives the admin SOS toast on the client).

      res.status(201).json({
        message: 'Emergency SOS sent successfully',
        trip,
        dispatched: !!trip,
      });
    } catch (error) {
      console.error('Emergency SOS error:', error);
      res.status(500).json({ message: error.message || 'Server error sending emergency SOS' });
    }
  }
);

router.get('/available-slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date parameter is required' });

    const sb = req.sb;
    const { data: doctor } = await sb
      .from('dispensary_staff')
      .select('id')
      .eq('id', doctorId)
      .eq('staff_type', 'medical_officer')
      .maybeSingle();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const target = new Date(date);
    const { data: availability } = await sb
      .from('staff_availability')
      .select('start_time, end_time, is_available')
      .eq('staff_id', doctorId)
      .eq('day_of_week', dayOfWeekName(target))
      .maybeSingle();
    if (!availability?.is_available) return res.json([]);

    const { data: booked } = await sb
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);
    const bookedSet = new Set((booked || []).map((b) => b.appointment_time.slice(0, 5)));

    const slots = [];
    const [sh, sm] = availability.start_time.split(':').map(Number);
    const [eh, em] = availability.end_time.split(':').map(Number);
    let mins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    while (mins < endMins) {
      const hh = String(Math.floor(mins / 60)).padStart(2, '0');
      const mm = String(mins % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      if (!bookedSet.has(timeStr)) slots.push(timeStr);
      mins += SLOT_MINUTES;
    }
    res.json(slots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error fetching available slots' });
  }
});

router.get('/prescriptions', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, count, error } = await req.sb
      .from('prescriptions')
      .select('*, medications:prescription_medications(*)', { count: 'exact' })
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    res.json({
      prescriptions: data || [],
      totalPages: Math.ceil((count || 0) / limitNum),
      currentPage: pageNum,
      total: count || 0,
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error fetching prescriptions' });
  }
});

// Legacy stub — real upload flow lives in routes/prescriptions.js
router.post('/upload-prescription', (req, res) => {
  res.json({ message: 'Use /api/prescriptions/student/prescriptions/upload instead' });
});

module.exports = router;
