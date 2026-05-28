const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../db/supabase');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['doctor', 'admin']));

const PROFILE_COLS = 'id, name, email, phone';
const STUDENT_COLS = 'id, student_id, department, year, blood_group';

const today = () => new Date().toISOString().slice(0, 10);

async function loadStudentDetails(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const [{ data: profiles }, { data: students }] = await Promise.all([
    supabaseAdmin.from('profiles').select(PROFILE_COLS).in('id', unique),
    supabaseAdmin.from('students').select(STUDENT_COLS).in('id', unique),
  ]);
  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));
  return Object.fromEntries(
    unique.map((id) => [
      id,
      {
        id,
        name: profileMap[id]?.name || 'Unknown',
        email: profileMap[id]?.email,
        phone: profileMap[id]?.phone,
        studentId: studentMap[id]?.student_id,
        department: studentMap[id]?.department,
        year: studentMap[id]?.year,
        bloodGroup: studentMap[id]?.blood_group,
      },
    ]),
  );
}

router.get('/appointments/today', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('id, student_id, appointment_date, appointment_time, status, symptoms, queue_number, is_emergency')
      .eq('doctor_id', req.user.id)
      .eq('appointment_date', today())
      .order('appointment_time', { ascending: true });
    if (error) throw error;

    const students = await loadStudentDetails((data || []).map((a) => a.student_id));
    res.json(
      (data || []).map((a) => ({
        _id: a.id,
        patientName: students[a.student_id]?.name || 'Unknown',
        patientId: students[a.student_id]?.studentId || '',
        department: students[a.student_id]?.department || '',
        appointmentTime: `${a.appointment_date}T${a.appointment_time}`,
        status: a.status,
        reason: a.symptoms || '',
        isEmergency: a.is_emergency,
        queueNumber: a.queue_number,
      })),
    );
  } catch (err) {
    console.error('doctor/appointments/today failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients/recent', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('student_id, appointment_date')
      .eq('doctor_id', req.user.id)
      .order('appointment_date', { ascending: false })
      .limit(50);
    if (error) throw error;

    const seen = new Map();
    for (const row of data || []) {
      if (!seen.has(row.student_id)) {
        seen.set(row.student_id, { lastVisit: row.appointment_date, totalVisits: 1 });
      } else {
        seen.get(row.student_id).totalVisits += 1;
      }
    }

    const students = await loadStudentDetails([...seen.keys()]);
    res.json(
      [...seen.entries()].slice(0, 12).map(([id, agg]) => ({
        _id: id,
        name: students[id]?.name || 'Unknown',
        studentId: students[id]?.studentId || '',
        department: students[id]?.department || '',
        bloodGroup: students[id]?.bloodGroup || '',
        lastVisit: agg.lastVisit,
        totalVisits: agg.totalVisits,
      })),
    );
  } catch (err) {
    console.error('doctor/patients/recent failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(STUDENT_COLS)
      .order('student_id', { ascending: true })
      .limit(500);
    if (error) throw error;

    const ids = (data || []).map((s) => s.id);
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select(PROFILE_COLS)
      .in('id', ids);
    const profileMap = Object.fromEntries((profs || []).map((p) => [p.id, p]));

    res.json(
      (data || []).map((s) => ({
        _id: s.id,
        name: profileMap[s.id]?.name || 'Unknown',
        studentId: s.student_id,
        department: s.department,
        year: s.year,
        bloodGroup: s.blood_group,
      })),
    );
  } catch (err) {
    console.error('doctor/patients failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/prescriptions', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('prescriptions')
      .select('id, student_id, created_at, prescription_medications(name, dosage, duration)')
      .eq('doctor_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const students = await loadStudentDetails((data || []).map((p) => p.student_id));
    res.json(
      (data || []).map((p) => {
        const meds = p.prescription_medications || [];
        return {
          _id: p.id,
          patientName: students[p.student_id]?.name || 'Unknown',
          patientId: students[p.student_id]?.studentId || '',
          medication: meds.map((m) => m.name).filter(Boolean).join(', ') || '—',
          dosage: meds.map((m) => m.dosage).filter(Boolean).join(', ') || '—',
          duration: meds.map((m) => m.duration).filter(Boolean).join(', ') || '—',
          createdAt: p.created_at,
        };
      }),
    );
  } catch (err) {
    console.error('doctor/prescriptions failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/ambulances/available', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ambulances')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map((a) => ({ ...a, _id: a.id })));
  } catch (err) {
    console.error('doctor/ambulances/available failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/prescriptions', async (req, res) => {
  try {
    const { patientId, medication, dosage, frequency, duration, instructions, notes } = req.body || {};
    if (!patientId || !medication) {
      return res.status(400).json({ message: 'patientId and medication are required' });
    }

    const { data: rx, error: rxErr } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        student_id: patientId,
        doctor_id: req.user.id,
        doctor_name: req.user.name || 'Doctor',
        date: today(),
        notes: notes || '',
      })
      .select('id')
      .single();
    if (rxErr) throw rxErr;

    const { error: medErr } = await supabaseAdmin
      .from('prescription_medications')
      .insert({
        prescription_id: rx.id,
        name: medication,
        dosage: dosage || '—',
        frequency: frequency || '—',
        duration: duration || '—',
        instructions: instructions || '',
      });
    if (medErr) throw medErr;

    res.status(201).json({ id: rx.id });
  } catch (err) {
    console.error('doctor/prescriptions POST failed:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/ambulance-booking', async (req, res) => {
  try {
    const { patientId, priority, reason, destination, estimatedTime, notes } = req.body || {};
    if (!patientId) return res.status(400).json({ message: 'patientId required' });

    const { data: amb } = await supabaseAdmin
      .from('ambulances')
      .select('id')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();
    if (!amb) return res.status(409).json({ message: 'No ambulance available right now' });

    const { data: student } = await supabaseAdmin
      .from('profiles')
      .select('name, phone')
      .eq('id', patientId)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('ambulance_trips')
      .insert({
        ambulance_id: amb.id,
        student_id: patientId,
        patient_name: student?.name || 'Unknown',
        patient_phone: student?.phone || '',
        priority: priority || 'medium',
        pickup_location: 'Campus',
        destination: destination || 'Dispensary',
        estimated_time: parseInt(estimatedTime, 10) || null,
        notes: [reason, notes].filter(Boolean).join(' · '),
        created_by: req.user.id,
      })
      .select('id')
      .single();
    if (error) throw error;

    await supabaseAdmin.from('ambulances').update({ status: 'in_use' }).eq('id', amb.id);

    res.status(201).json({ id: data.id });
  } catch (err) {
    console.error('doctor/ambulance-booking failed:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
