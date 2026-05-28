import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  Stack,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  LocalHospital,
  DirectionsCar,
  Queue,
  Warning,
  Person,
  TrendingUp,
  Inventory,
  Schedule,
  EventAvailable,
  CheckCircle,
  Cancel,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import { palette } from '../../theme';
import PanelSwitcher from '../../components/PanelSwitcher';
import {
  WelcomeBanner,
  StatTile,
  QuickAction,
  SectionCard,
  PersonRow,
  EmptyState,
  sectionFade,
} from '../../components/Dashboard/Primitives';

const statusChipFor = (status) => {
  const map = {
    available: { color: '#2F7D5A', label: 'Available' },
    'in-use': { color: '#B8862B', label: 'In use' },
    maintenance: { color: '#B0322B', label: 'Maintenance' },
    completed: { color: '#2F7D5A', label: 'Completed' },
    'in-progress': { color: palette.maroon.main, label: 'In progress' },
    cancelled: { color: '#B0322B', label: 'Cancelled' },
  };
  const s = map[status] || { color: palette.navy.light, label: status || '—' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        height: 22,
        backgroundColor: `${s.color}1f`,
        color: s.color,
        fontWeight: 700,
        textTransform: 'capitalize',
      }}
    />
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: dashboardData, isLoading, error } = useQuery(
    'adminDashboard',
    async () => {
      const response = await axios.get('/api/admin/dashboard');
      return response.data;
    },
    { refetchInterval: 30000 }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard data. Please try again.</Alert>;
  }

  const {
    doctors = [],
    ambulances = [],
    studentQueue = [],
    todayStats = [],
    emergencyAlerts = [],
    systemMetrics = {},
  } = dashboardData || {};

  const completed = todayStats.find((s) => s._id === 'completed')?.count || 0;
  const inProgress = todayStats.find((s) => s._id === 'in-progress')?.count || 0;
  const cancelled = todayStats.find((s) => s._id === 'cancelled')?.count || 0;

  const stats = [
    { icon: School, label: 'Students', value: systemMetrics.totalStudents || 0, accent: palette.navy.main },
    { icon: LocalHospital, label: 'Doctors', value: systemMetrics.totalDoctors || 0, accent: palette.maroon.main },
    { icon: DirectionsCar, label: 'Ambulances', value: systemMetrics.totalAmbulances || 0, accent: palette.gold },
    { icon: EventAvailable, label: 'Active appointments', value: systemMetrics.activeAppointments || 0, accent: '#2F7D5A' },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <PanelSwitcher />
      </Box>
      <WelcomeBanner
        overline={currentTime.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        title="Administration"
        highlight="control room"
        subtitle="A live view of every doctor, ambulance, queue and alert across campus. Everything you need to keep DormDoc healthy."
        timestamp={currentTime.toLocaleTimeString()}
      />

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={s.label}>
            <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={i + 1}>
              <StatTile {...s} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Today + Quick actions */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={2}>
            <SectionCard
              overline="Today"
              title="Appointment activity"
              action={
                <Chip
                  label={`${systemMetrics.todayAppointments || 0} total`}
                  size="small"
                  sx={{
                    backgroundColor: `${palette.navy.main}12`,
                    color: palette.navy.dark,
                    fontWeight: 700,
                  }}
                />
              }
            >
              <Grid container spacing={2}>
                {[
                  { label: 'Completed', value: completed, color: '#2F7D5A', icon: <CheckCircle /> },
                  { label: 'In progress', value: inProgress, color: palette.maroon.main, icon: <Schedule /> },
                  { label: 'Cancelled', value: cancelled, color: '#B0322B', icon: <Cancel /> },
                ].map((row) => (
                  <Grid item xs={12} sm={4} key={row.label}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: '1px solid rgba(15, 24, 64, 0.08)',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          backgroundColor: `${row.color}14`,
                          color: row.color,
                        }}
                      >
                        {row.icon}
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: palette.navy.dark,
                            lineHeight: 1,
                          }}
                        >
                          {row.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: palette.navy.light }}>
                          {row.label}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: palette.navy.light }}>
                  Need granular numbers? Open the analytics workspace.
                </Typography>
                <Button
                  onClick={() => navigate('/analytics')}
                  startIcon={<TrendingUp />}
                  sx={{ color: palette.maroon.main }}
                >
                  View analytics
                </Button>
              </Stack>
            </SectionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={3}>
            <SectionCard overline="Quick actions" title="Jump straight to">
              <Stack spacing={1.5}>
                <QuickAction
                  icon={LocalHospital}
                  label="Manage doctors"
                  color={palette.maroon.main}
                  onClick={() => navigate('/doctors')}
                />
                <QuickAction
                  icon={DirectionsCar}
                  label="Manage ambulances"
                  color={palette.navy.main}
                  onClick={() => navigate('/ambulances')}
                />
                <QuickAction
                  icon={Queue}
                  label="Queue management"
                  color={palette.gold}
                  onClick={() => navigate('/queue')}
                />
                <QuickAction
                  icon={Inventory}
                  label="Inventory"
                  color="#2F7D5A"
                  onClick={() => navigate('/inventory')}
                />
              </Stack>
            </SectionCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Emergencies + Live queue */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={4}>
            <SectionCard
              overline="Live"
              title="Emergency alerts"
              action={
                <Chip
                  label={`${emergencyAlerts.length} active`}
                  size="small"
                  sx={{
                    backgroundColor: emergencyAlerts.length ? '#B0322B1f' : 'rgba(15,24,64,0.06)',
                    color: emergencyAlerts.length ? '#B0322B' : palette.navy.light,
                    fontWeight: 700,
                  }}
                />
              }
            >
              {emergencyAlerts.length > 0 ? (
                emergencyAlerts.slice(0, 4).map((alert) => (
                  <PersonRow
                    key={alert._id}
                    avatarColor="#B0322B"
                    name={alert.student?.name || 'Unknown student'}
                    sub={`${alert.symptoms || 'No symptoms recorded'} · Priority ${alert.priority}/10`}
                    right={
                      <Chip
                        icon={<Warning sx={{ fontSize: '14px !important' }} />}
                        label="SOS"
                        size="small"
                        sx={{
                          height: 22,
                          backgroundColor: '#B0322B',
                          color: '#FFFFFF',
                          fontWeight: 700,
                        }}
                      />
                    }
                  />
                ))
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="All clear"
                  hint="No emergency alerts in the last hour."
                />
              )}
            </SectionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={5}>
            <SectionCard
              overline="Queue"
              title="Currently consulting"
              action={
                <Button
                  size="small"
                  onClick={() => navigate('/queue')}
                  sx={{ color: palette.maroon.main }}
                >
                  Open queue
                </Button>
              }
            >
              {studentQueue.length > 0 ? (
                studentQueue.slice(0, 5).map((appt) => (
                  <PersonRow
                    key={appt._id}
                    avatarColor={palette.navy.main}
                    name={appt.student?.name || 'Unknown student'}
                    sub={`Dr. ${appt.doctor?.name || 'TBD'} · #${appt.queueNumber}`}
                    right={
                      appt.isEmergency ? (
                        <Chip label="Emergency" color="error" size="small" sx={{ height: 22, fontWeight: 700 }} />
                      ) : (
                        <Chip
                          label={`P${appt.priority || '—'}`}
                          size="small"
                          sx={{
                            height: 22,
                            backgroundColor: `${palette.gold}1f`,
                            color: '#7A5C00',
                            fontWeight: 700,
                          }}
                        />
                      )
                    }
                  />
                ))
              ) : (
                <EmptyState icon={Queue} title="Queue is empty" hint="No students currently in queue." />
              )}
            </SectionCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Doctors + Ambulances */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={6}>
            <SectionCard
              overline="Medical faculty"
              title="Doctor status"
              action={
                <Button
                  size="small"
                  onClick={() => navigate('/doctors')}
                  sx={{ color: palette.maroon.main }}
                >
                  Manage
                </Button>
              }
            >
              {doctors.length > 0 ? (
                doctors.slice(0, 4).map((doctor) => (
                  <PersonRow
                    key={doctor._id}
                    avatarColor={doctor.isOnDuty ? '#2F7D5A' : palette.navy.light}
                    name={`Dr. ${doctor.name}`}
                    sub={`${doctor.specialization || '—'} · ${doctor.currentPatientCount || 0} patients today`}
                    right={
                      <Chip
                        label={doctor.isOnDuty ? 'On duty' : 'Off duty'}
                        size="small"
                        sx={{
                          height: 22,
                          backgroundColor: doctor.isOnDuty ? '#2F7D5A1f' : 'rgba(15,24,64,0.06)',
                          color: doctor.isOnDuty ? '#2F7D5A' : palette.navy.dark,
                          fontWeight: 700,
                        }}
                      />
                    }
                  />
                ))
              ) : (
                <EmptyState icon={Person} title="No doctors yet" hint="Add medical faculty to get started." />
              )}
            </SectionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={7}>
            <SectionCard
              overline="Fleet"
              title="Ambulance status"
              action={
                <Button
                  size="small"
                  onClick={() => navigate('/ambulance-tracking')}
                  sx={{ color: palette.maroon.main }}
                >
                  Live tracking
                </Button>
              }
            >
              {ambulances.length > 0 ? (
                <Grid container spacing={1.5}>
                  {ambulances.slice(0, 4).map((amb) => (
                    <Grid item xs={12} sm={6} key={amb._id}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid rgba(15,24,64,0.08)',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <Avatar sx={{ bgcolor: `${palette.maroon.main}14`, color: palette.maroon.main }}>
                          <DirectionsCar />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{ fontWeight: 700, color: palette.navy.dark, fontSize: '0.9rem' }}
                            noWrap
                          >
                            {amb.vehicleNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: palette.navy.light }} noWrap>
                            {amb.driverName || 'Unassigned'}
                          </Typography>
                        </Box>
                        {statusChipFor(amb.status)}
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  icon={DirectionsCar}
                  title="No ambulances yet"
                  hint="Add vehicles to enable dispatch."
                />
              )}
            </SectionCard>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
