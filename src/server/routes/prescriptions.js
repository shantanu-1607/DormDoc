const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  PRESCRIPTIONS_BUCKET,
  uploadBuffer,
  deleteObject,
  createSignedUrl,
} = require('../db/storage');

const router = express.Router();

// In-memory multer — files go straight to Supabase Storage, never touch disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    return ok ? cb(null, true) : cb(new Error('Only images and PDF files are allowed'));
  },
});

router.use(authenticateToken);

const PRESCRIPTION_SELECT = '*, medications:prescription_medications(id, name, dosage, frequency, duration, instructions, position)';

const parseMedications = (raw) => {
  if (!raw) return [];
  const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(arr)) return [];
  return arr.map((m, i) => ({
    name: m.name ?? '',
    dosage: m.dosage ?? '',
    frequency: m.frequency ?? '',
    duration: m.duration ?? '',
    instructions: m.instructions ?? '',
    position: m.position ?? i,
  }));
};

const writeMedications = async (sb, prescriptionId, meds) => {
  if (!meds.length) return;
  const rows = meds.map((m) => ({ ...m, prescription_id: prescriptionId }));
  const { error } = await sb.from('prescription_medications').insert(rows);
  if (error) throw error;
};

const hydrateNames = async (req, rows) => {
  const ids = [
    ...new Set(
      rows.flatMap((r) => [r.student_id, r.doctor_id]).filter(Boolean)
    ),
  ];
  if (!ids.length) return {};
  const { data } = await req.sb.from('profiles').select('id, name, email').in('id', ids);
  const map = {};
  for (const row of data || []) map[row.id] = row;
  return map;
};

// Convert a legacy /uploads/prescriptions/<file> path to null so we don't try
// to sign a path that doesn't exist in Storage. After Phase 5 every newly
// uploaded file_url is a Storage key, but historic rows may still hold the
// legacy disk path.
const isStoragePath = (fileUrl) =>
  typeof fileUrl === 'string' && fileUrl.length > 0 && !fileUrl.startsWith('/uploads/');

// === STUDENT ROUTES ===
router.get('/student/prescriptions', async (req, res) => {
  const { data, error } = await req.sb
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .eq('student_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.post('/student/prescriptions/upload', upload.single('prescriptionFile'), async (req, res) => {
  let storagePath = null;
  try {
    const { doctorName, date, medications, notes } = req.body;
    if (!doctorName || !date || !medications) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const { data: prescription, error } = await req.sb
      .from('prescriptions')
      .insert({
        student_id: req.user.id,
        doctor_name: doctorName,
        date,
        notes: notes ?? '',
        file_url: null,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase() || '';
      storagePath = `${req.user.id}/${prescription.id}${ext}`;
      await uploadBuffer({
        bucket: PRESCRIPTIONS_BUCKET,
        path: storagePath,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });
      const { error: updErr } = await req.sb
        .from('prescriptions')
        .update({ file_url: storagePath })
        .eq('id', prescription.id);
      if (updErr) throw updErr;
    }

    await writeMedications(req.sb, prescription.id, parseMedications(medications));

    const { data: hydrated } = await req.sb
      .from('prescriptions')
      .select(PRESCRIPTION_SELECT)
      .eq('id', prescription.id)
      .single();
    res.json(hydrated);
  } catch (error) {
    console.error('Upload prescription error:', error);
    if (storagePath) {
      try { await deleteObject({ bucket: PRESCRIPTIONS_BUCKET, path: storagePath }); } catch {}
    }
    res.status(500).json({ message: error.message || 'Server error uploading prescription' });
  }
});

router.delete('/student/prescriptions/:id', async (req, res) => {
  const { data: prescription, error: readErr } = await req.sb
    .from('prescriptions')
    .select('id, student_id, file_url')
    .eq('id', req.params.id)
    .maybeSingle();
  if (readErr) return res.status(500).json({ message: readErr.message });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
  if (prescription.student_id !== req.user.id) return res.status(403).json({ message: 'Not authorized to delete this prescription' });

  if (isStoragePath(prescription.file_url)) {
    try { await deleteObject({ bucket: PRESCRIPTIONS_BUCKET, path: prescription.file_url }); }
    catch (err) { console.error('Storage delete failed (continuing):', err.message); }
  }

  const { error } = await req.sb.from('prescriptions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Prescription deleted successfully' });
});

// === ADMIN ROUTES ===
router.get('/admin/prescriptions', requireRole(['admin']), async (req, res) => {
  const { data, error } = await req.sb
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });

  const names = await hydrateNames(req, data || []);
  res.json((data || []).map((p) => ({
    ...p,
    student: names[p.student_id] || null,
    doctor: names[p.doctor_id] || null,
  })));
});

router.put('/admin/prescriptions/:id/status', requireRole(['admin']), async (req, res) => {
  const { status } = req.body;
  const { data, error } = await req.sb
    .from('prescriptions')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: 'Prescription not found' });
  res.json(data);
});

router.delete('/admin/prescriptions/:id', requireRole(['admin']), async (req, res) => {
  const { data: prescription, error: readErr } = await req.sb
    .from('prescriptions')
    .select('id, file_url')
    .eq('id', req.params.id)
    .maybeSingle();
  if (readErr) return res.status(500).json({ message: readErr.message });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

  if (isStoragePath(prescription.file_url)) {
    try { await deleteObject({ bucket: PRESCRIPTIONS_BUCKET, path: prescription.file_url }); }
    catch (err) { console.error('Storage delete failed (continuing):', err.message); }
  }

  const { error } = await req.sb.from('prescriptions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Prescription deleted successfully' });
});

// === DOCTOR ROUTES ===
router.get('/doctor/prescriptions', requireRole(['doctor']), async (req, res) => {
  const { data, error } = await req.sb
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .eq('doctor_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });

  const names = await hydrateNames(req, data || []);
  res.json((data || []).map((p) => ({ ...p, student: names[p.student_id] || null })));
});

router.post('/doctor/prescriptions', requireRole(['doctor']), async (req, res) => {
  try {
    const { studentId, date, medications, notes } = req.body;
    if (!studentId || !date || !medications) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const { data: student } = await req.sb.from('profiles').select('id').eq('id', studentId).maybeSingle();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { data: prescription, error } = await req.sb
      .from('prescriptions')
      .insert({
        student_id: studentId,
        doctor_id: req.user.id,
        doctor_name: req.user.name,
        date,
        notes: notes ?? '',
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;

    await writeMedications(req.sb, prescription.id, parseMedications(medications));

    const { data: hydrated } = await req.sb
      .from('prescriptions')
      .select(PRESCRIPTION_SELECT)
      .eq('id', prescription.id)
      .single();
    res.json(hydrated);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: error.message || 'Server error creating prescription' });
  }
});

// === GET BY ID ===
router.get('/:id', async (req, res) => {
  const { data: prescription, error } = await req.sb
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

  if (req.user.role === 'student' && prescription.student_id !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const names = await hydrateNames(req, [prescription]);
  res.json({
    ...prescription,
    student: names[prescription.student_id] || null,
    doctor: names[prescription.doctor_id] || null,
  });
});

// === SIGNED FILE URL ===
// Returns a short-lived signed URL the client can open() in a new tab.
// Replaces the legacy practice of storing a static /uploads/... path that
// the client opened directly.
router.get('/:id/file-url', async (req, res) => {
  const { data: prescription, error } = await req.sb
    .from('prescriptions')
    .select('id, student_id, file_url')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
  if (req.user.role === 'student' && prescription.student_id !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (!isStoragePath(prescription.file_url)) {
    return res.status(404).json({ message: 'No file attached to this prescription' });
  }

  try {
    const signedUrl = await createSignedUrl({
      bucket: PRESCRIPTIONS_BUCKET,
      path: prescription.file_url,
    });
    res.json({ signedUrl });
  } catch (err) {
    console.error('Sign prescription file URL failed:', err);
    res.status(500).json({ message: 'Failed to generate file URL' });
  }
});

module.exports = router;
