import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  DirectionsCar,
  Warning,
  Schedule,
  Person,
  Queue,
  ArrowOutward,
  HealthAndSafety,
  AccessTime,
  CalendarMonth,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { palette } from '../../theme';

const greetingFor = (date) => {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

const sectionFade = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const StatTile = ({ icon: Icon, label, value, accent }) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: 3,
      border: '1px solid rgba(15, 24, 64, 0.06)',
      background: '#FFFFFF',
      transition: 'transform 220ms ease, box-shadow 220ms ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 16px 36px rgba(15, 24, 64, 0.08)',
      },
    }}
  >
    <CardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            backgroundColor: `${accent}14`,
            color: accent,
          }}
        >
          <Icon />
        </Box>
        <Typography variant="overline" sx={{ color: palette.navy.light }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          mt: 2,
          fontFamily: '"Playfair Display", serif',
          fontWeight: 700,
          fontSize: '2.1rem',
          color: palette.navy.dark,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const QuickAction = ({ icon: Icon, label, color, onClick }) => (
  <Box
    component={motion.button}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    sx={{
      all: 'unset',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      gap: 2,
      padding: '14px 16px',
      borderRadius: 2.5,
      border: '1px solid rgba(15, 24, 64, 0.08)',
      backgroundColor: '#FFFFFF',
      transition: 'border-color 200ms ease, box-shadow 200ms ease',
      '&:hover': {
        borderColor: `${color}66`,
        boxShadow: `0 10px 26px ${color}22`,
      },
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: `${color}14`,
        color,
      }}
    >
      <Icon />
    </Box>
    <Typography sx={{ flex: 1, fontWeight: 600, color: palette.navy.dark }}>
      {label}
    </Typography>
    <ArrowOutward sx={{ color, opacity: 0.6 }} fontSize="small" />
  </Box>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { mongoUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData, isLoading, error } = useQuery(
    'studentDashboard',
    async () => {
      const response = await axios.get('/api/student/dashboard');
      return response.data;
    },
    { refetchInterval: 30000 }
  );

  const {
    doctorOnDuty,
    currentAppointments = [],
    availableSlots = [],
    queueStatus = [],
    studentInfo,
  } = dashboardData || {};

  const stats = useMemo(
    () => [
      {
        icon: CalendarMonth,
        label: 'Appointments',
        value: currentAppointments.length || 0,
        accent: palette.maroon.main,
      },
      {
        icon: Queue,
        label: 'Active queues',
        value: queueStatus.length || 0,
        accent: palette.navy.main,
      },
      {
        icon: AccessTime,
        label: 'Open slots',
        value: availableSlots.reduce(
          (sum, s) => sum + (s.availableSlots?.length || 0),
          0
        ),
        accent: palette.gold,
      },
      {
        icon: TrendingUp,
        label: 'Doctor on duty',
        value: doctorOnDuty ? 'Yes' : 'No',
        accent: doctorOnDuty ? '#2F7D5A' : '#B0322B',
      },
    ],
    [currentAppointments, queueStatus, availableSlots, doctorOnDuty]
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">Failed to load dashboard data. Please try again.</Alert>
    );
  }

  const displayName =
    mongoUser?.name || studentInfo?.name || 'Student';
  const firstName = (displayName || '').split(' ')[0];

  return (
    <Box sx={{ pb: 4 }}>
      {/* ─── Welcome banner ───────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={0}>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 3,
            p: { xs: 3, md: 5 },
            color: '#FFFFFF',
            background: `
              radial-gradient(800px 400px at 0% 0%, rgba(212, 162, 76, 0.22), transparent 60%),
              radial-gradient(700px 400px at 100% 100%, rgba(26, 43, 92, 0.5), transparent 55%),
              linear-gradient(135deg, ${palette.maroon.dark} 0%, ${palette.maroon.main} 50%, ${palette.navy.main} 100%)
            `,
            boxShadow: '0 20px 50px rgba(123, 30, 30, 0.18)',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse at 0% 0%, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 0% 0%, black 0%, transparent 70%)',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <Typography
              variant="overline"
              sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.22em' }}
            >
              {greetingFor(currentTime)} ·{' '}
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '2.8rem' },
                mt: 1,
                mb: 1,
                color: '#FFFFFF',
              }}
            >
              Welcome back,{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: palette.gold }}>
                {firstName}
              </Box>
              .
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 620 }}>
              Here&apos;s a snapshot of your campus health activity. Book a slot,
              check your prescriptions, or reach a doctor — all in a click.
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 3, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.18em' }}
            >
              LIVE · {currentTime.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* ─── Stat tiles ───────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {stats.map((s, idx) => (
          <Grid item xs={6} md={3} key={s.label}>
            <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={idx + 1}>
              <StatTile {...s} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* ─── Doctor on duty + Quick Actions ───────────── */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={2}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="overline" sx={{ color: palette.navy.light }}>
                      Doctor on duty
                    </Typography>
                    <Typography variant="h5" sx={{ color: palette.navy.dark, fontWeight: 700, mt: 0.5 }}>
                      {doctorOnDuty ? `Dr. ${doctorOnDuty.name}` : 'No active duty'}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: palette.maroon.main,
                      width: 56,
                      height: 56,
                      boxShadow: '0 8px 24px rgba(123, 30, 30, 0.25)',
                    }}
                  >
                    <HealthAndSafety />
                  </Avatar>
                </Stack>

                {doctorOnDuty ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 2.5 }}>
                      {doctorOnDuty.specialization}
                    </Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                      <Chip
                        icon={<Queue fontSize="small" />}
                        label={`Queue · ${doctorOnDuty.currentQueueNumber}`}
                        sx={{
                          backgroundColor: `${palette.navy.main}12`,
                          color: palette.navy.dark,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={<Person fontSize="small" />}
                        label={`${doctorOnDuty.currentPatientCount} patients today`}
                        sx={{
                          backgroundColor: `${palette.maroon.main}12`,
                          color: palette.maroon.dark,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={<AccessTime fontSize="small" />}
                        label={`Avg ${doctorOnDuty.averageConsultationTime} min`}
                        sx={{
                          backgroundColor: `${palette.gold}1f`,
                          color: '#7A5C00',
                          fontWeight: 600,
                        }}
                      />
                    </Stack>
                    <Divider sx={{ my: 3 }} />
                    <Button
                      variant="contained"
                      onClick={() => navigate('/book-appointment')}
                      startIcon={<Schedule />}
                    >
                      Book an appointment with Dr. {doctorOnDuty.name?.split(' ')[0]}
                    </Button>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No doctor is currently on duty. Please check back later or use
                    Emergency SOS if it is urgent.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={3}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                <Typography variant="overline" sx={{ color: palette.navy.light }}>
                  Quick actions
                </Typography>
                <Typography variant="h6" sx={{ color: palette.navy.dark, mb: 2 }}>
                  What do you need?
                </Typography>
                <Stack spacing={1.5}>
                  <QuickAction
                    icon={Schedule}
                    label="Book appointment"
                    color={palette.maroon.main}
                    onClick={() => navigate('/book-appointment')}
                  />
                  <QuickAction
                    icon={DirectionsCar}
                    label="Book ambulance"
                    color={palette.navy.main}
                    onClick={() => navigate('/ambulance-booking')}
                  />
                  <QuickAction
                    icon={Warning}
                    label="Emergency SOS"
                    color="#B0322B"
                    onClick={() => navigate('/emergency-sos')}
                  />
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ─── Profile card ───────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={4}>
        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Avatar
                sx={{
                  bgcolor: palette.navy.dark,
                  width: 72,
                  height: 72,
                  fontSize: '1.6rem',
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(26, 43, 92, 0.18)',
                }}
              >
                {firstName?.[0]?.toUpperCase() || <Person />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" sx={{ color: palette.navy.dark, fontWeight: 700 }}>
                  {displayName}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.navy.light }}>
                  {mongoUser?.email || 'No email on file'}
                </Typography>
              </Box>
              <IconButton
                aria-label="profile"
                onClick={() => navigate('/profile')}
                sx={{
                  border: '1px solid rgba(15, 24, 64, 0.12)',
                  borderRadius: 2,
                  color: palette.maroon.main,
                }}
              >
                <ArrowOutward fontSize="small" />
              </IconButton>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2.5}>
              {[
                ['Roll Number', mongoUser?.studentId || 'N/A'],
                ['Department', mongoUser?.department || 'N/A'],
                [
                  'Phone',
                  mongoUser?.phone ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>{mongoUser.phone}</span>
                      <Chip
                        label="Verified"
                        size="small"
                        color="success"
                        sx={{ height: 20 }}
                      />
                    </Stack>
                  ) : (
                    'Not verified'
                  ),
                ],
                ['Blood Group', mongoUser?.bloodGroup || 'N/A'],
              ].map(([label, value]) => (
                <Grid item xs={6} sm={3} key={label}>
                  <Typography variant="caption" sx={{ color: palette.navy.light, letterSpacing: '0.14em' }}>
                    {label.toUpperCase()}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: palette.navy.dark, mt: 0.5 }}
                  >
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Appointments + Queue ─────────────────── */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={5}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: palette.navy.dark, fontWeight: 700 }}>
                    Upcoming appointments
                  </Typography>
                  <Chip
                    label={`${currentAppointments.length}`}
                    size="small"
                    sx={{
                      backgroundColor: `${palette.maroon.main}12`,
                      color: palette.maroon.dark,
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                {currentAppointments.length > 0 ? (
                  <List disablePadding>
                    {currentAppointments.map((appointment) => (
                      <ListItem
                        key={appointment._id}
                        divider
                        sx={{ px: 0, py: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Schedule sx={{ color: palette.maroon.main }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 600, color: palette.navy.dark }}>
                              Dr. {appointment.doctor?.name || 'TBD'}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                              <Typography variant="body2">
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                                {' · '}
                                {appointment.appointmentTime}
                              </Typography>
                              <Chip
                                label={appointment.status}
                                size="small"
                                sx={{
                                  height: 20,
                                  backgroundColor: 'rgba(15, 24, 64, 0.06)',
                                  color: palette.navy.dark,
                                  fontWeight: 600,
                                }}
                              />
                              {appointment.isEmergency && (
                                <Chip label="Emergency" color="error" size="small" sx={{ height: 20 }} />
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" sx={{ color: palette.navy.light, mt: 1 }}>
                    No upcoming appointments. Book one to consult the on-duty doctor.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={6}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: palette.navy.dark, fontWeight: 700 }}>
                    Live queues
                  </Typography>
                  <Chip
                    label={`${queueStatus.length} active`}
                    size="small"
                    sx={{
                      backgroundColor: `${palette.navy.main}12`,
                      color: palette.navy.dark,
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                {queueStatus.length > 0 ? (
                  <List disablePadding>
                    {queueStatus.map((queue) => (
                      <ListItem
                        key={queue.doctorId}
                        divider
                        sx={{ px: 0, py: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Queue sx={{ color: palette.navy.main }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 600, color: palette.navy.dark }}>
                              Dr. {queue.doctorName}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" spacing={1.5} alignItems="center" mt={0.5}>
                              <Typography variant="body2">
                                {queue.currentQueue} in queue · ~{queue.averageWaitTime} min wait
                              </Typography>
                              {queue.nextInQueue && (
                                <Chip
                                  label={`Next #${queue.nextInQueue}`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    backgroundColor: `${palette.gold}1f`,
                                    color: '#7A5C00',
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" sx={{ color: palette.navy.light, mt: 1 }}>
                    No active queues right now.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ─── Available slots ──────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={7}>
        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="overline" sx={{ color: palette.navy.light }}>
                  Next 7 days
                </Typography>
                <Typography variant="h6" sx={{ color: palette.navy.dark, fontWeight: 700 }}>
                  Available time slots
                </Typography>
              </Box>
              <Button
                onClick={() => navigate('/book-appointment')}
                endIcon={<ArrowOutward fontSize="small" />}
                sx={{ color: palette.maroon.main }}
              >
                See all
              </Button>
            </Stack>
            {availableSlots.length > 0 ? (
              <Grid container spacing={2}>
                {availableSlots.slice(0, 6).map((slot, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Box
                      onClick={() => navigate('/book-appointment')}
                      sx={{
                        cursor: 'pointer',
                        p: 2.25,
                        borderRadius: 2.5,
                        border: '1px solid rgba(15, 24, 64, 0.08)',
                        background: '#FFFFFF',
                        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: 'rgba(123, 30, 30, 0.35)',
                          boxShadow: '0 12px 28px rgba(15, 24, 64, 0.06)',
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: palette.navy.dark }}
                        >
                          Dr. {slot.doctorName}
                        </Typography>
                        <Chip
                          label={`${slot.availableSlots?.length || 0} slots`}
                          size="small"
                          sx={{
                            backgroundColor: `${palette.maroon.main}12`,
                            color: palette.maroon.dark,
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ color: palette.navy.light, mt: 0.5 }}>
                        {slot.specialization}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 1.5, color: palette.navy.dark, letterSpacing: '0.12em' }}
                      >
                        {new Date(slot.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        }).toUpperCase()}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" sx={{ color: palette.navy.light }}>
                No open slots in the next 7 days.
              </Typography>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default StudentDashboard;
