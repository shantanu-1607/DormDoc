const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole(['admin']));

const ACTIVE_STATUSES = ['pending', 'dispatched', 'en_route', 'arrived'];
const NORMALIZE_STATUS = (s) => (s === 'en-route' ? 'en_route' : s); // legacy compat

// Phase 4: socket.io emits removed. Clients subscribe to public.ambulance_trips
// via supabase_realtime postgres_changes; trip status history lives in
// ambulance_trip_status_log (also a candidate for realtime if needed later).

async function hydrate(sb, trips) {
  const rows = trips || [];
  if (!rows.length) return [];
  const ambulanceIds = [...new Set(rows.map((t) => t.ambulance_id).filter(Boolean))];
  const studentIds = [...new Set(rows.map((t) => t.student_id).filter(Boolean))];

  const [{ data: ambulances }, { data: profiles }, { data: students }] = await Promise.all([
    ambulanceIds.length
      ? sb.from('ambulances').select('id, vehicle_number, driver_name, driver_phone').in('id', ambulanceIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? sb.from('profiles').select('id, name, email').in('id', studentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? sb.from('students').select('id, student_id').in('id', studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ambulanceMap = Object.fromEntries((ambulances || []).map((a) => [a.id, a]));
  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));

  return rows.map((t) => ({
    _id: t.id,
    patientName: t.patient_name,
    patientPhone: t.patient_phone,
    pickupLocation: t.pickup_location,
    destination: t.destination,
    emergencyType: t.emergency_type,
    priority: t.priority,
    status: t.status,
    currentLocation: {
      latitude: t.current_latitude,
      longitude: t.current_longitude,
      address: t.current_address,
    },
    estimatedTime: t.estimated_time,
    duration: t.actual_duration,
    notes: t.notes,
    completionNotes: t.completion_notes,
    completedAt: t.completed_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    ambulance: ambulanceMap[t.ambulance_id]
      ? {
          _id: t.ambulance_id,
          vehicleNumber: ambulanceMap[t.ambulance_id].vehicle_number,
          driverName: ambulanceMap[t.ambulance_id].driver_name,
          driverPhone: ambulanceMap[t.ambulance_id].driver_phone,
        }
      : null,
    student: t.student_id
      ? {
          _id: t.student_id,
          name: profileMap[t.student_id]?.name || null,
          email: profileMap[t.student_id]?.email || null,
          studentId: studentMap[t.student_id]?.student_id || null,
        }
      : null,
  }));
}

// ─── routes ─────────────────────────────────────────────────────────────────

router.get('/admin/ambulance-trips', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: trips, error } = await sb
      .from('ambulance_trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(await hydrate(sb, trips));
  } catch (error) {
    console.error('Get ambulance trips error:', error);
    res.status(500).json({ message: 'Server error fetching ambulance trips' });
  }
});

router.post('/admin/ambulance-trips', async (req, res) => {
  try {
    const sb = req.sb;
    const {
      patientName,
      patientPhone,
      pickupLocation,
      destination,
      emergencyType,
      priority,
      ambulanceId,
      driverId,
      estimatedTime,
      notes,
      studentId,
    } = req.body;

    if (!patientName || !pickupLocation || !destination || !ambulanceId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const { data: ambulance } = await sb.from('ambulances').select('id').eq('id', ambulanceId).maybeSingle();
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

    const { data: trip, error: insErr } = await sb
      .from('ambulance_trips')
      .insert({
        patient_name: patientName,
        patient_phone: patientPhone || '',
        student_id: studentId || null,
        pickup_location: pickupLocation,
        destination,
        emergency_type: emergencyType || 'medical',
        priority: priority || 'medium',
        ambulance_id: ambulanceId,
        driver_id: driverId || null,
        estimated_time: estimatedTime ? parseInt(estimatedTime, 10) : null,
        notes: notes || '',
        status: 'pending',
        created_by: req.user.id,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    await sb.from('ambulance_trip_status_log').insert({
      trip_id: trip.id,
      status: 'pending',
      updated_by: req.user.id,
    });

    const [hydrated] = await hydrate(sb, [trip]);
    res.json(hydrated);
  } catch (error) {
    console.error('Create ambulance trip error:', error);
    res.status(500).json({ message: 'Server error creating ambulance trip' });
  }
});

router.put('/admin/ambulance-trips/:id/status', async (req, res) => {
  try {
    const sb = req.sb;
    const status = NORMALIZE_STATUS(req.body.status);
    const { location } = req.body;
    const { id } = req.params;

    if (!['pending', 'dispatched', 'en_route', 'arrived', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { data: trip } = await sb.from('ambulance_trips').select('id').eq('id', id).maybeSingle();
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const updates = { status };
    if (location?.latitude != null) updates.current_latitude = location.latitude;
    if (location?.longitude != null) updates.current_longitude = location.longitude;
    if (location?.address) updates.current_address = location.address;

    const { data: updated, error: updErr } = await sb
      .from('ambulance_trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (updErr) throw updErr;

    await sb.from('ambulance_trip_status_log').insert({
      trip_id: id,
      status,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      address: location?.address || null,
      updated_by: req.user.id,
    });

    const [hydrated] = await hydrate(sb, [updated]);
    res.json(hydrated);
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ message: 'Server error updating trip status' });
  }
});

router.put('/admin/ambulance-trips/:id/complete', async (req, res) => {
  try {
    const sb = req.sb;
    const { id } = req.params;
    const { completionNotes = '', completedAt } = req.body;

    const { data: trip } = await sb.from('ambulance_trips').select('*').eq('id', id).maybeSingle();
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const completedTs = completedAt ? new Date(completedAt) : new Date();
    const durationMin = trip.created_at
      ? Math.round((completedTs - new Date(trip.created_at)) / (1000 * 60))
      : null;

    const { data: updated, error: updErr } = await sb
      .from('ambulance_trips')
      .update({
        status: 'completed',
        completion_notes: completionNotes,
        completed_at: completedTs.toISOString(),
        actual_duration: durationMin,
      })
      .eq('id', id)
      .select()
      .single();
    if (updErr) throw updErr;

    await sb.from('ambulance_trip_status_log').insert({
      trip_id: id,
      status: 'completed',
      updated_by: req.user.id,
    });

    const [hydrated] = await hydrate(sb, [updated]);
    res.json(hydrated);
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({ message: 'Server error completing trip' });
  }
});

router.get('/admin/ambulance-trips/active', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: trips } = await sb
      .from('ambulance_trips')
      .select('*')
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false });
    res.json(await hydrate(sb, trips));
  } catch (error) {
    console.error('Get active trips error:', error);
    res.status(500).json({ message: 'Server error fetching active trips' });
  }
});

router.get('/admin/ambulance-trips/completed', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: trips } = await sb
      .from('ambulance_trips')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    res.json(await hydrate(sb, trips));
  } catch (error) {
    console.error('Get completed trips error:', error);
    res.status(500).json({ message: 'Server error fetching completed trips' });
  }
});

router.get('/admin/ambulance-trips/statistics', async (req, res) => {
  try {
    const sb = req.sb;
    const { period = '30d' } = req.query;
    const days = parseInt(String(period).replace('d', ''), 10) || 30;
    const startIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalTrips },
      { count: completedTrips },
      { count: activeTrips },
      { data: completedRows },
      { count: highPriorityTrips },
    ] = await Promise.all([
      sb.from('ambulance_trips').select('id', { count: 'exact', head: true }).gte('created_at', startIso),
      sb
        .from('ambulance_trips')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startIso),
      sb.from('ambulance_trips').select('id', { count: 'exact', head: true }).in('status', ACTIVE_STATUSES),
      sb
        .from('ambulance_trips')
        .select('actual_duration')
        .eq('status', 'completed')
        .gte('created_at', startIso)
        .not('actual_duration', 'is', null),
      sb
        .from('ambulance_trips')
        .select('id', { count: 'exact', head: true })
        .eq('priority', 'high')
        .gte('created_at', startIso),
    ]);

    const durations = (completedRows || []).map((r) => r.actual_duration);
    const averageDuration = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;

    res.json({
      totalTrips: totalTrips || 0,
      completedTrips: completedTrips || 0,
      activeTrips: activeTrips || 0,
      averageDuration,
      highPriorityTrips: highPriorityTrips || 0,
      completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
    });
  } catch (error) {
    console.error('Get trip statistics error:', error);
    res.status(500).json({ message: 'Server error fetching trip statistics' });
  }
});

router.get('/admin/ambulance-trips/:id', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: trip } = await sb.from('ambulance_trips').select('*').eq('id', req.params.id).maybeSingle();
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const [hydrated] = await hydrate(sb, [trip]);
    res.json(hydrated);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ message: 'Server error fetching trip' });
  }
});

router.delete('/admin/ambulance-trips/:id', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: trip } = await sb.from('ambulance_trips').select('id').eq('id', req.params.id).maybeSingle();
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Status log rows are append-only at the policy layer; service-role can delete them.
    await sb.from('ambulance_trip_status_log').delete().eq('trip_id', req.params.id);
    const { error: delErr } = await sb.from('ambulance_trips').delete().eq('id', req.params.id);
    if (delErr) throw delErr;
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error deleting trip' });
  }
});

router.get('/admin/ambulances', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: ambulances, error } = await sb
      .from('ambulances')
      .select('*')
      .eq('is_active', true)
      .order('vehicle_number', { ascending: true });
    if (error) throw error;
    res.json(ambulances || []);
  } catch (error) {
    console.error('Get ambulances error:', error);
    res.status(500).json({ message: 'Server error fetching ambulances' });
  }
});

router.get('/admin/drivers', async (req, res) => {
  try {
    const sb = req.sb;
    // No separate drivers table — drivers are denormalized onto ambulances.
    // Return distinct (driver_name, driver_phone, driver_license) tuples.
    const { data: ambulances } = await sb
      .from('ambulances')
      .select('id, driver_name, driver_phone, driver_license, vehicle_number')
      .eq('is_active', true)
      .order('driver_name', { ascending: true });

    const seen = new Set();
    const drivers = [];
    for (const a of ambulances || []) {
      const key = `${a.driver_name}|${a.driver_phone}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drivers.push({
        _id: a.id, // fallback id; no separate table
        name: a.driver_name,
        phone: a.driver_phone,
        license: a.driver_license,
        vehicleNumber: a.vehicle_number,
      });
    }
    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
});

module.exports = router;
