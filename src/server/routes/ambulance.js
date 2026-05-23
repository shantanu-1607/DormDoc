const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// ─── helpers ────────────────────────────────────────────────────────────────

const ACTIVE_TRIP_STATUSES = ['pending', 'dispatched', 'en_route', 'arrived'];
const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function calculateEstimatedWaitTime(ambulance, pickupLocation) {
  const distance = haversineKm(
    ambulance.latitude,
    ambulance.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  );
  const minutes = Math.round((distance / 30) * 60); // 30 km/h
  return Math.max(5, minutes);
}

// Phase 4: socket.io emits removed. Clients subscribe to public.ambulances
// and public.ambulance_trips via supabase_realtime postgres_changes.

async function getCurrentAssignment(sb, ambulanceId) {
  const { data } = await sb
    .from('ambulance_trips')
    .select('id, student_id, patient_name, pickup_location, destination, status, current_latitude, current_longitude, current_address, estimated_time, created_at')
    .eq('ambulance_id', ambulanceId)
    .in('status', ACTIVE_TRIP_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

function toClientAmbulance(amb, currentAssignment) {
  return {
    _id: amb.id,
    vehicleNumber: amb.vehicle_number,
    driverName: amb.driver_name,
    driverPhone: amb.driver_phone,
    status: amb.status,
    location: { latitude: amb.latitude, longitude: amb.longitude, address: amb.address },
    currentAssignment: currentAssignment
      ? {
          student: currentAssignment.student_id,
          patientName: currentAssignment.patient_name,
          pickupLocation: currentAssignment.pickup_location,
          destination: currentAssignment.destination,
          tripStatus: currentAssignment.status,
          estimatedArrival: currentAssignment.estimated_time,
          tripId: currentAssignment.id,
        }
      : null,
    performance: {
      totalTrips: amb.total_trips,
      averageResponseTime: amb.average_response_time,
      rating: amb.rating,
      totalRating: amb.total_rating,
      ratingCount: amb.rating_count,
    },
  };
}

// ─── routes ─────────────────────────────────────────────────────────────────

router.get('/status', async (req, res) => {
  try {
    const sb = req.sb;
    const { data: ambulances, error } = await sb
      .from('ambulances')
      .select('*')
      .eq('is_active', true)
      .order('status', { ascending: true })
      .order('vehicle_number', { ascending: true });
    if (error) throw error;

    const enriched = await Promise.all(
      (ambulances || []).map(async (a) => toClientAmbulance(a, await getCurrentAssignment(sb, a.id)))
    );
    res.json({ ambulances: enriched });
  } catch (error) {
    console.error('Get ambulance status error:', error);
    res.status(500).json({ message: 'Server error fetching ambulance status' });
  }
});

router.get('/available', async (req, res) => {
  try {
    const sb = req.sb;
    const { latitude, longitude, maxDistance = 10 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const { data: ambulances } = await sb
      .from('ambulances')
      .select('*')
      .eq('status', 'available')
      .eq('is_active', true);

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const max = parseFloat(maxDistance);

    const ranked = (ambulances || [])
      .map((a) => ({ ambulance: a, distance: haversineKm(a.latitude, a.longitude, lat, lon) }))
      .filter((x) => x.distance <= max)
      .sort((a, b) => a.distance - b.distance)
      .map((x) => ({ ...toClientAmbulance(x.ambulance, null), distanceKm: x.distance }));

    res.json({ availableAmbulances: ranked });
  } catch (error) {
    console.error('Get available ambulances error:', error);
    res.status(500).json({ message: 'Server error fetching available ambulances' });
  }
});

router.post(
  '/request',
  [
    body('symptoms').notEmpty().withMessage('Symptoms description is required'),
    body('pickupLocation.latitude').isNumeric().withMessage('Pickup latitude is required'),
    body('pickupLocation.longitude').isNumeric().withMessage('Pickup longitude is required'),
    body('pickupLocation.address').notEmpty().withMessage('Pickup address is required'),
    body('destination.latitude').optional().isNumeric().withMessage('Destination latitude must be numeric'),
    body('destination.longitude').optional().isNumeric().withMessage('Destination longitude must be numeric'),
    body('destination.address').optional().isString().withMessage('Destination address must be string'),
    body('isEmergency').optional().isBoolean().withMessage('Emergency flag must be boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const sb = req.sb;
      const { symptoms, pickupLocation, destination, isEmergency = false } = req.body;
      const student = req.user;

      const { data: candidates } = await sb
        .from('ambulances')
        .select('*')
        .eq('status', 'available')
        .eq('is_active', true);

      if (!candidates || !candidates.length) {
        return res.status(400).json({ message: 'No ambulances available at the moment', estimatedWaitTime: 'Unknown' });
      }

      const ranked = candidates
        .map((a) => ({ ambulance: a, distance: haversineKm(a.latitude, a.longitude, pickupLocation.latitude, pickupLocation.longitude) }))
        .sort((a, b) => a.distance - b.distance);
      const ambulance = ranked[0].ambulance;
      const estimatedWaitMinutes = calculateEstimatedWaitTime(ambulance, pickupLocation);

      const { data: trip, error: tripErr } = await sb
        .from('ambulance_trips')
        .insert({
          patient_name: student.name || 'Student',
          patient_phone: student.phone || '',
          student_id: student.id,
          pickup_location: pickupLocation.address,
          destination: destination?.address || 'College Dispensary',
          emergency_type: 'medical',
          priority: isEmergency ? 'high' : 'medium',
          ambulance_id: ambulance.id,
          status: 'dispatched',
          notes: symptoms,
          estimated_time: estimatedWaitMinutes,
          created_by: student.id,
        })
        .select()
        .single();
      if (tripErr) throw tripErr;

      const { error: ambErr } = await sb.from('ambulances').update({ status: 'in_use' }).eq('id', ambulance.id);
      if (ambErr) console.error('ambulance status update failed:', ambErr);

      res.status(201).json({
        message: 'Ambulance request submitted successfully',
        ambulance: {
          vehicleNumber: ambulance.vehicle_number,
          driverName: ambulance.driver_name,
          driverPhone: ambulance.driver_phone,
          estimatedArrival: estimatedWaitMinutes,
        },
        trip,
        estimatedWaitTime: estimatedWaitMinutes,
      });
    } catch (error) {
      console.error('Ambulance request error:', error);
      res.status(500).json({ message: 'Server error processing ambulance request' });
    }
  }
);

router.put(
  '/:id/update-location',
  [
    body('latitude').isNumeric().withMessage('Latitude is required'),
    body('longitude').isNumeric().withMessage('Longitude is required'),
    body('address').notEmpty().withMessage('Address is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const sb = req.sb;
      const { id } = req.params;
      const { latitude, longitude, address } = req.body;

      const { data: ambulance } = await sb.from('ambulances').select('id').eq('id', id).maybeSingle();
      if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

      const { error: updErr } = await sb
        .from('ambulances')
        .update({ latitude, longitude, address })
        .eq('id', id);
      if (updErr) throw updErr;

      // If there's an active trip, mirror onto the trip's current_* fields
      const active = await getCurrentAssignment(sb, id);
      if (active) {
        await sb
          .from('ambulance_trips')
          .update({ current_latitude: latitude, current_longitude: longitude, current_address: address })
          .eq('id', active.id);
      }

      res.json({ message: 'Ambulance location updated successfully', location: { latitude, longitude, address } });
    } catch (error) {
      console.error('Update ambulance location error:', error);
      res.status(500).json({ message: 'Server error updating ambulance location' });
    }
  }
);

router.put('/:id/complete-trip', async (req, res) => {
  try {
    const sb = req.sb;
    const { id } = req.params;
    const { rating } = req.body;

    const { data: ambulance } = await sb.from('ambulances').select('*').eq('id', id).maybeSingle();
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });
    if (ambulance.status !== 'in_use') {
      return res.status(400).json({ message: 'Ambulance is not currently in use' });
    }

    const active = await getCurrentAssignment(sb, id);
    if (active) {
      await sb
        .from('ambulance_trips')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', active.id);
    }

    const updates = {
      status: 'available',
      total_trips: (ambulance.total_trips || 0) + 1,
    };

    if (rating && rating >= 1 && rating <= 5) {
      const newCount = (ambulance.rating_count || 0) + 1;
      const newTotal = (ambulance.total_rating || 0) + Number(rating);
      updates.rating_count = newCount;
      updates.total_rating = newTotal;
      updates.rating = newTotal / newCount;
    }

    const { data: updated, error: updErr } = await sb
      .from('ambulances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (updErr) throw updErr;

    res.json({
      message: 'Ambulance trip completed successfully',
      ambulance: {
        vehicleNumber: updated.vehicle_number,
        status: updated.status,
        performance: {
          totalTrips: updated.total_trips,
          averageResponseTime: updated.average_response_time,
          rating: updated.rating,
          totalRating: updated.total_rating,
          ratingCount: updated.rating_count,
        },
      },
    });
  } catch (error) {
    console.error('Complete ambulance trip error:', error);
    res.status(500).json({ message: 'Server error completing ambulance trip' });
  }
});

router.get('/:id/tracking', async (req, res) => {
  try {
    const sb = req.sb;
    const { id } = req.params;
    const { data: ambulance } = await sb.from('ambulances').select('*').eq('id', id).maybeSingle();
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

    const active = await getCurrentAssignment(sb, id);
    res.json({ ambulance: toClientAmbulance(ambulance, active) });
  } catch (error) {
    console.error('Track ambulance error:', error);
    res.status(500).json({ message: 'Server error tracking ambulance' });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const sb = req.sb;
    const { period = '30d' } = req.query;

    const { data: ambulances } = await sb
      .from('ambulances')
      .select('id, vehicle_number, driver_name, total_trips, average_response_time, rating, total_rating, rating_count');

    const performanceStats = (ambulances || [])
      .map((a) => ({
        _id: a.id,
        vehicleNumber: a.vehicle_number,
        driverName: a.driver_name,
        totalTrips: a.total_trips,
        averageResponseTime: a.average_response_time,
        rating: a.rating,
        totalRating: a.total_rating,
        ratingCount: a.rating_count,
      }))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.totalTrips || 0) - (a.totalTrips || 0));

    const totalAmbulances = performanceStats.length;
    const avgRating = totalAmbulances
      ? performanceStats.reduce((s, a) => s + (a.rating || 0), 0) / totalAmbulances
      : 0;
    const totalTrips = performanceStats.reduce((s, a) => s + (a.totalTrips || 0), 0);
    const avgResponse = totalAmbulances
      ? performanceStats.reduce((s, a) => s + (a.averageResponseTime || 0), 0) / totalAmbulances
      : 0;

    res.json({
      period,
      performanceStats,
      overallStats: {
        totalAmbulances,
        averageRating: avgRating,
        totalTrips,
        averageResponseTime: avgResponse,
      },
    });
  } catch (error) {
    console.error('Get ambulance performance error:', error);
    res.status(500).json({ message: 'Server error fetching ambulance performance' });
  }
});

router.post(
  '/:id/report-issue',
  [
    body('description').notEmpty().withMessage('Issue description is required'),
    body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const sb = req.sb;
      const { id } = req.params;
      const { description, severity } = req.body;

      const { data: ambulance } = await sb.from('ambulances').select('id, vehicle_number, status').eq('id', id).maybeSingle();
      if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

      const { data: issue, error: issueErr } = await sb
        .from('ambulance_maintenance_issues')
        .insert({ ambulance_id: id, description, severity })
        .select()
        .single();
      if (issueErr) throw issueErr;

      if (severity === 'critical') {
        await sb.from('ambulances').update({ status: 'maintenance' }).eq('id', id);
      }

      res.json({
        message: 'Issue reported successfully',
        issue: { _id: issue.id, description, severity, reportedAt: issue.reported_at },
      });
    } catch (error) {
      console.error('Report ambulance issue error:', error);
      res.status(500).json({ message: 'Server error reporting issue' });
    }
  }
);

module.exports = router;
