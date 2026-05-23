const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// ─── helpers ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'in_progress'];

function rangeToStart(range) {
  const now = new Date();
  const start = new Date(now);
  switch (range) {
    case '1d': start.setDate(start.getDate() - 1); break;
    case '7d': start.setDate(start.getDate() - 7); break;
    case '30d': start.setDate(start.getDate() - 30); break;
    case '90d': start.setDate(start.getDate() - 90); break;
    case '1y': start.setDate(start.getDate() - 365); break;
    default: start.setDate(start.getDate() - 7);
  }
  return { start, end: now };
}

function todayBounds() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

async function countWhere(query) {
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

// ─── /dashboard ────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const sb = req.sb;
    const { range = '7d' } = req.query;
    const { start, end } = rangeToStart(range);
    const today = todayBounds();

    const [
      totalPatients,
      todayAppointments,
      emergencyCases,
      activeDoctors,
      completedToday,
      pendingToday,
      cancelledToday,
      activeEmergencies,
      resolvedEmergenciesToday,
      inProgressAll,
      departmentStats,
      recentAppointments,
      recentStudents,
      doctorRows,
    ] = await Promise.all([
      countWhere(sb.from('students').select('id', { count: 'exact', head: true })),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .gte('appointment_date', today.start).lte('appointment_date', today.end)
      ),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .eq('is_emergency', true)
          .gte('appointment_date', start.toISOString().slice(0, 10))
          .lte('appointment_date', end.toISOString().slice(0, 10))
      ),
      countWhere(
        sb.from('dispensary_staff').select('id', { count: 'exact', head: true })
          .eq('staff_type', 'medical_officer').eq('is_on_duty', true)
      ),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('appointment_date', today.start).lte('appointment_date', today.end)
      ),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .in('status', ['scheduled', 'confirmed'])
          .gte('appointment_date', today.start).lte('appointment_date', today.end)
      ),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'cancelled')
          .gte('appointment_date', today.start).lte('appointment_date', today.end)
      ),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .eq('is_emergency', true).in('status', ACTIVE_STATUSES)
      ),
      countWhere(
        sb.from('appointments').select('id', { count: 'exact', head: true })
          .eq('is_emergency', true).eq('status', 'completed')
          .gte('appointment_date', today.start).lte('appointment_date', today.end)
      ),
      countWhere(sb.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')),
      sb.from('students').select('department').not('department', 'is', null),
      sb
        .from('appointments')
        .select('id, status, is_emergency, student_id, doctor_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      sb.from('profiles').select('id, name, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(3),
      sb.from('dispensary_staff').select('id, specialization, total_consultations, current_queue_number, is_on_duty').eq('staff_type', 'medical_officer'),
    ]);

    // department stats (node-side group_by + percentage)
    const deptMap = new Map();
    for (const r of departmentStats.data || []) {
      if (!r.department) continue;
      deptMap.set(r.department, (deptMap.get(r.department) || 0) + 1);
    }
    const deptTotal = [...deptMap.values()].reduce((s, c) => s + c, 0);
    const deptStats = [...deptMap.entries()]
      .map(([department, count]) => ({
        department,
        count,
        percentage: deptTotal ? Math.round((count / deptTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // recent activity — hydrate names
    const apptStudentIds = (recentAppointments.data || []).map((a) => a.student_id).filter(Boolean);
    const studentNameMap = apptStudentIds.length
      ? Object.fromEntries(
          ((await sb.from('profiles').select('id, name').in('id', apptStudentIds)).data || []).map((p) => [p.id, p.name])
        )
      : {};

    const recentActivity = [];
    for (const a of recentAppointments.data || []) {
      recentActivity.push({
        title: `Appointment ${a.status} - ${studentNameMap[a.student_id] || 'Unknown'}`,
        time: a.created_at,
        color:
          a.status === 'completed' ? 'success.main' :
          a.status === 'cancelled' ? 'error.main' : 'warning.main',
        icon: a.is_emergency ? 'Warning' : 'Schedule',
      });
    }
    for (const s of recentStudents.data || []) {
      recentActivity.push({
        title: `New student registered - ${s.name}`,
        time: s.created_at,
        color: 'primary.main',
        icon: 'Person',
      });
    }
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

    // doctor stats with name hydrate
    const doctorIds = (doctorRows.data || []).map((d) => d.id);
    const doctorNameMap = doctorIds.length
      ? Object.fromEntries(
          ((await sb.from('profiles').select('id, name').in('id', doctorIds)).data || []).map((p) => [p.id, p.name])
        )
      : {};
    const doctorStats = (doctorRows.data || [])
      .map((d) => ({
        _id: d.id,
        name: doctorNameMap[d.id] || 'Unknown',
        specialization: d.specialization,
        patientsSeen: d.total_consultations || 0,
        rating: null,
        status: d.is_on_duty ? 'Available' : 'Off Duty',
      }))
      .sort((a, b) => b.patientsSeen - a.patientsSeen);

    res.json({
      totalPatients,
      todayAppointments,
      emergencyCases,
      activeDoctors,
      completedAppointments: completedToday,
      pendingAppointments: pendingToday,
      cancelledAppointments: cancelledToday,
      emergencyAlerts: emergencyCases,
      departmentStats: deptStats,
      recentActivity: recentActivity.slice(0, 10),
      doctorStats,
      activeEmergencies,
      resolvedEmergencies: resolvedEmergenciesToday,
      scheduledAppointments: pendingToday,
      inProgressAppointments: inProgressAll,
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Server error loading analytics dashboard' });
  }
});

// ─── /appointments ─────────────────────────────────────────────────────────

router.get('/appointments', async (req, res) => {
  try {
    const sb = req.sb;
    const { period = '30d', groupBy = 'day' } = req.query;
    const { start, end } = rangeToStart(period);

    const { data: rows, error } = await sb
      .from('appointments')
      .select('appointment_date, status, is_emergency, actual_wait_time, priority')
      .gte('appointment_date', start.toISOString().slice(0, 10))
      .lte('appointment_date', end.toISOString().slice(0, 10));
    if (error) throw error;

    const keyFor = (date) => {
      const d = new Date(date);
      if (groupBy === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (groupBy === 'week') {
        const firstThurs = new Date(d.getFullYear(), 0, 4);
        const days = Math.floor((d - firstThurs) / (24 * 60 * 60 * 1000));
        const week = Math.floor(days / 7) + 1;
        return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      }
      return date;
    };

    const buckets = new Map();
    for (const r of rows || []) {
      const k = keyFor(r.appointment_date);
      if (!buckets.has(k)) {
        buckets.set(k, {
          _id: k,
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          emergencyAppointments: 0,
          _waitSum: 0, _waitCount: 0,
          _prioSum: 0, _prioCount: 0,
        });
      }
      const b = buckets.get(k);
      b.totalAppointments += 1;
      if (r.status === 'completed') b.completedAppointments += 1;
      if (r.status === 'cancelled') b.cancelledAppointments += 1;
      if (r.is_emergency) b.emergencyAppointments += 1;
      if (r.actual_wait_time != null) { b._waitSum += r.actual_wait_time; b._waitCount += 1; }
      if (r.priority != null) { b._prioSum += r.priority; b._prioCount += 1; }
    }

    const appointmentAnalytics = [...buckets.values()]
      .sort((a, b) => a._id.localeCompare(b._id))
      .map(({ _waitSum, _waitCount, _prioSum, _prioCount, ...rest }) => ({
        ...rest,
        averageWaitTime: _waitCount ? _waitSum / _waitCount : null,
        averagePriority: _prioCount ? _prioSum / _prioCount : null,
      }));

    res.json({ appointmentAnalytics });
  } catch (error) {
    console.error('Appointment analytics error:', error);
    res.status(500).json({ message: 'Server error fetching appointment analytics' });
  }
});

// ─── /doctors ──────────────────────────────────────────────────────────────

router.get('/doctors', async (req, res) => {
  try {
    const sb = req.sb;
    const { period = '30d' } = req.query;
    const days = parseInt(String(period).replace('d', ''), 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: rows, error } = await sb
      .from('appointments')
      .select('doctor_id, status, actual_wait_time, is_emergency, feedback_rating')
      .gte('appointment_date', startDate)
      .eq('status', 'completed');
    if (error) throw error;

    const buckets = new Map();
    for (const r of rows || []) {
      if (!r.doctor_id) continue;
      if (!buckets.has(r.doctor_id)) {
        buckets.set(r.doctor_id, {
          doctorId: r.doctor_id,
          totalAppointments: 0,
          _waitSum: 0, _waitCount: 0,
          _ratingSum: 0, _ratingCount: 0,
          emergencyCases: 0,
        });
      }
      const b = buckets.get(r.doctor_id);
      b.totalAppointments += 1;
      if (r.actual_wait_time != null) { b._waitSum += r.actual_wait_time; b._waitCount += 1; }
      if (r.feedback_rating != null) { b._ratingSum += r.feedback_rating; b._ratingCount += 1; }
      if (r.is_emergency) b.emergencyCases += 1;
    }

    const doctorIds = [...buckets.keys()];
    let nameMap = {}, staffMap = {};
    if (doctorIds.length) {
      const [{ data: profiles }, { data: staff }] = await Promise.all([
        sb.from('profiles').select('id, name').in('id', doctorIds),
        sb.from('dispensary_staff').select('id, specialization, average_consultation_time').in('id', doctorIds),
      ]);
      nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
      staffMap = Object.fromEntries((staff || []).map((s) => [s.id, s]));
    }

    const doctorAnalytics = [...buckets.values()]
      .map((b) => {
        const consultTime = staffMap[b.doctorId]?.average_consultation_time || null;
        return {
          doctorId: b.doctorId,
          doctorName: nameMap[b.doctorId] || 'Unknown',
          specialization: staffMap[b.doctorId]?.specialization || null,
          totalAppointments: b.totalAppointments,
          averageConsultationTime: consultTime,
          averageWaitTime: b._waitCount ? b._waitSum / b._waitCount : null,
          averageRating: b._ratingCount ? b._ratingSum / b._ratingCount : null,
          emergencyCases: b.emergencyCases,
          efficiency: consultTime ? b.totalAppointments / consultTime : null,
        };
      })
      .sort((a, b) => b.totalAppointments - a.totalAppointments);

    res.json({ doctorAnalytics });
  } catch (error) {
    console.error('Doctor analytics error:', error);
    res.status(500).json({ message: 'Server error fetching doctor analytics' });
  }
});

// ─── /wait-times ───────────────────────────────────────────────────────────

router.get('/wait-times', async (req, res) => {
  try {
    const sb = req.sb;
    const { doctorId, date } = req.query;

    let query = sb.from('appointments').select('doctor_id, actual_wait_time, is_emergency');
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (date) query = query.eq('appointment_date', date);

    const { data: rows, error } = await query;
    if (error) throw error;

    const buckets = new Map();
    for (const r of rows || []) {
      if (!r.doctor_id) continue;
      if (!buckets.has(r.doctor_id)) {
        buckets.set(r.doctor_id, {
          doctorId: r.doctor_id,
          _sum: 0, _count: 0, _min: Infinity, _max: -Infinity,
          totalAppointments: 0, _emSum: 0, _emCount: 0,
        });
      }
      const b = buckets.get(r.doctor_id);
      b.totalAppointments += 1;
      if (r.actual_wait_time != null) {
        b._sum += r.actual_wait_time;
        b._count += 1;
        b._min = Math.min(b._min, r.actual_wait_time);
        b._max = Math.max(b._max, r.actual_wait_time);
        if (r.is_emergency) { b._emSum += r.actual_wait_time; b._emCount += 1; }
      }
    }

    const doctorIds = [...buckets.keys()];
    let nameMap = {}, staffMap = {};
    if (doctorIds.length) {
      const [{ data: profiles }, { data: staff }] = await Promise.all([
        sb.from('profiles').select('id, name').in('id', doctorIds),
        sb.from('dispensary_staff').select('id, specialization').in('id', doctorIds),
      ]);
      nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
      staffMap = Object.fromEntries((staff || []).map((s) => [s.id, s]));
    }

    const waitTimeAnalytics = [...buckets.values()].map((b) => ({
      doctorId: b.doctorId,
      doctorName: nameMap[b.doctorId] || 'Unknown',
      specialization: staffMap[b.doctorId]?.specialization || null,
      averageWaitTime: b._count ? b._sum / b._count : null,
      minWaitTime: b._min === Infinity ? null : b._min,
      maxWaitTime: b._max === -Infinity ? null : b._max,
      totalAppointments: b.totalAppointments,
      emergencyWaitTime: b._emCount ? b._emSum / b._emCount : null,
    }));

    // Current queue predictions
    const { data: onDutyDoctors } = await sb
      .from('dispensary_staff')
      .select('id, average_consultation_time')
      .eq('staff_type', 'medical_officer').eq('is_on_duty', true);
    const onDutyIds = (onDutyDoctors || []).map((d) => d.id);
    const onDutyNameMap = onDutyIds.length
      ? Object.fromEntries(
          ((await sb.from('profiles').select('id, name').in('id', onDutyIds)).data || []).map((p) => [p.id, p.name])
        )
      : {};

    const currentQueuePredictions = [];
    for (const d of onDutyDoctors || []) {
      const queueRes = await sb
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', d.id)
        .in('status', ACTIVE_STATUSES);
      const currentQueue = queueRes.count || 0;
      currentQueuePredictions.push({
        doctorId: d.id,
        doctorName: onDutyNameMap[d.id] || 'Unknown',
        currentQueue,
        estimatedWaitTime: currentQueue * (d.average_consultation_time || 15),
        predictedPeakTime: '14:00-16:00',
      });
    }

    res.json({ waitTimeAnalytics, currentQueuePredictions });
  } catch (error) {
    console.error('Wait time analytics error:', error);
    res.status(500).json({ message: 'Server error fetching wait time analytics' });
  }
});

// ─── /emergency ────────────────────────────────────────────────────────────

router.get('/emergency', async (req, res) => {
  try {
    const sb = req.sb;
    const { period = '30d' } = req.query;
    const days = parseInt(String(period).replace('d', ''), 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: rows } = await sb
      .from('appointments')
      .select('appointment_date, appointment_time, priority, actual_wait_time')
      .eq('is_emergency', true)
      .gte('appointment_date', startDate);

    const dayBuckets = new Map();
    const hourBuckets = new Map();
    for (const r of rows || []) {
      const day = r.appointment_date;
      if (!dayBuckets.has(day)) {
        dayBuckets.set(day, {
          _id: day,
          totalEmergencies: 0,
          _waitSum: 0, _waitCount: 0,
          highPriorityEmergencies: 0,
          criticalEmergencies: 0,
        });
      }
      const b = dayBuckets.get(day);
      b.totalEmergencies += 1;
      if (r.actual_wait_time != null) { b._waitSum += r.actual_wait_time; b._waitCount += 1; }
      if (r.priority >= 8) b.highPriorityEmergencies += 1;
      if (r.priority === 10) b.criticalEmergencies += 1;

      if (r.appointment_time) {
        const hour = parseInt(String(r.appointment_time).slice(0, 2), 10);
        if (!Number.isNaN(hour)) {
          if (!hourBuckets.has(hour)) hourBuckets.set(hour, { _id: { hour }, emergencyCount: 0, _prioSum: 0, _prioCount: 0 });
          const h = hourBuckets.get(hour);
          h.emergencyCount += 1;
          if (r.priority != null) { h._prioSum += r.priority; h._prioCount += 1; }
        }
      }
    }

    const emergencyAnalytics = [...dayBuckets.values()]
      .sort((a, b) => a._id.localeCompare(b._id))
      .map(({ _waitSum, _waitCount, ...rest }) => ({
        ...rest,
        averageResponseTime: _waitCount ? _waitSum / _waitCount : null,
      }));

    const emergencyTrends = [...hourBuckets.values()]
      .sort((a, b) => a._id.hour - b._id.hour)
      .map(({ _prioSum, _prioCount, ...rest }) => ({
        ...rest,
        averagePriority: _prioCount ? _prioSum / _prioCount : null,
      }));

    res.json({ emergencyAnalytics, emergencyTrends });
  } catch (error) {
    console.error('Emergency analytics error:', error);
    res.status(500).json({ message: 'Server error fetching emergency analytics' });
  }
});

// ─── /predictions (still mostly placeholder; preserved for surface compat) ──

router.get('/predictions', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const predictions = {};

    if (type === 'all' || type === 'appointments') {
      predictions.appointmentPredictions = {
        nextWeekPredictions: {
          expectedAppointments: 150,
          peakDays: ['Monday', 'Wednesday', 'Friday'],
          peakHours: ['09:00-11:00', '14:00-16:00'],
        },
        seasonalTrends: {
          winter: 'Higher respiratory issues',
          summer: 'More heat-related problems',
          monsoon: 'Increased waterborne diseases',
        },
      };
    }
    if (type === 'all' || type === 'wait-times') {
      predictions.waitTimePredictions = {
        todayPredictions: { morning: '15-20 minutes', afternoon: '25-30 minutes', evening: '20-25 minutes' },
        tomorrowPredictions: { morning: '10-15 minutes', afternoon: '20-25 minutes', evening: '15-20 minutes' },
      };
    }
    if (type === 'all' || type === 'emergency') {
      predictions.emergencyPredictions = {
        riskFactors: ['Weather changes', 'Exam periods', 'Festival seasons'],
        predictedEmergencies: { nextWeek: 5, nextMonth: 20 },
      };
    }
    if (type === 'all' || type === 'resource-utilization') {
      predictions.resourceUtilization = {
        doctorUtilization: { current: '75%', predicted: '85%' },
        ambulanceUtilization: { current: '60%', predicted: '70%' },
        recommendations: [
          'Add one more doctor for peak hours',
          'Schedule maintenance for ambulances during low-usage periods',
        ],
      };
    }

    res.json({ predictions });
  } catch (error) {
    console.error('Predictions analytics error:', error);
    res.status(500).json({ message: 'Server error fetching predictions' });
  }
});

module.exports = router;
