import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Chip,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import {
  PendingActions,
  Assignment,
  LocalHospital,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardStats } from '../../services/hodService';
import { palette } from '../../theme';
import PanelSwitcher from '../../components/PanelSwitcher';
import {
  WelcomeBanner,
  StatTile,
  SectionCard,
  PersonRow,
  EmptyState,
  sectionFade,
} from '../../components/Dashboard/Primitives';

const statusChipFor = (status) => {
  const map = {
    pending: { color: '#B8862B', label: 'Pending' },
    approved: { color: '#2F7D5A', label: 'Approved' },
    rejected: { color: '#B0322B', label: 'Rejected' },
  };
  const s = map[status] || { color: palette.navy.light, label: status };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        height: 22,
        backgroundColor: `${s.color}1f`,
        color: s.color,
        fontWeight: 700,
      }}
    />
  );
};

const HodDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery('hod-dashboard', fetchDashboardStats, {
    staleTime: 2 * 60 * 1000,
  });

  const stats = [
    { icon: PendingActions, label: 'Pending leaves', value: data?.pendingLeaves ?? 0, accent: palette.maroon.main },
    { icon: Assignment, label: 'Approved this month', value: data?.approvedThisMonth ?? 0, accent: '#2F7D5A' },
    { icon: LocalHospital, label: 'Active medical cases', value: data?.activeCases ?? 0, accent: palette.gold },
    { icon: Warning, label: 'Emergency cases', value: data?.emergencyCases ?? 0, accent: '#B0322B' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ pb: 4 }}>
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <PanelSwitcher />
      </Box>
      <WelcomeBanner
        overline={user?.department ? `Department · ${user.department}` : 'Department overview'}
        title="HOD"
        highlight="overview"
        subtitle="A digest of leaves, medical activity and student well-being in your department — everything you need to act decisively today."
      />

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load dashboard data. Please refresh the page.
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={s.label}>
            <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={i + 1}>
              <StatTile {...s} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={4}>
            <SectionCard
              overline="Department"
              title="Recent leave applications"
              action={
                <Chip
                  label={`${data?.recentLeaveActivity?.length || 0} shown`}
                  size="small"
                  sx={{
                    backgroundColor: `${palette.navy.main}12`,
                    color: palette.navy.dark,
                    fontWeight: 700,
                  }}
                />
              }
            >
              {!data?.recentLeaveActivity?.length ? (
                <EmptyState icon={Assignment} title="No leave requests yet" hint="New applications will appear here." />
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {data.recentLeaveActivity.map((item) => (
                    <PersonRow
                      key={item._id}
                      avatarColor={palette.navy.main}
                      name={item.studentName}
                      sub={`Year ${item.year || '—'} · ${item.duration ? `${item.duration} day${item.duration > 1 ? 's' : ''}` : 'Duration N/A'}`}
                      right={statusChipFor(item.status)}
                    />
                  ))}
                </Stack>
              )}
            </SectionCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div initial="hidden" animate="visible" variants={sectionFade} custom={5}>
            <SectionCard overline="90 days" title="Top reported symptoms">
              {!data?.topSymptoms?.length ? (
                <EmptyState icon={TrendingUp} title="No symptom data" hint="As cases are logged, trends appear here." />
              ) : (
                <Stack spacing={1.25}>
                  {data.topSymptoms.map((s, i) => {
                    const max = Math.max(...data.topSymptoms.map((x) => x.count));
                    const pct = Math.round((s.count / max) * 100);
                    return (
                      <Box key={i}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: palette.navy.dark, fontWeight: 600 }}
                            noWrap
                          >
                            {s.symptom}
                          </Typography>
                          <Chip
                            label={s.count}
                            size="small"
                            sx={{
                              height: 20,
                              backgroundColor: `${palette.gold}1f`,
                              color: '#7A5C00',
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                        <Box
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(15,24,64,0.06)',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${palette.maroon.main}, ${palette.gold})`,
                              borderRadius: 3,
                              transition: 'width 600ms ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </SectionCard>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
