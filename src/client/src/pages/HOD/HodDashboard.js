import React from 'react';
import {
  Box, Typography, Grid, Paper, Divider, Avatar,
  Alert, Skeleton, Chip, Table, TableBody,
  TableCell, TableHead, TableRow,
} from '@mui/material';
import {
  AccountBalance, Assignment, PendingActions, TrendingUp,
  LocalHospital, Warning,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useClerkAuth } from '../../contexts/ClerkAuthContext';
import DeptStatCard from '../../components/HOD/DeptStatCard';
import { fetchDashboardStats } from '../../services/hodService';

const STATUS_CHIP = {
  pending:  <Chip label="Pending"  color="warning" size="small" />,
  approved: <Chip label="Approved" color="success" size="small" />,
  rejected: <Chip label="Rejected" color="error"   size="small" />,
};

const HodDashboard = () => {
  const { user } = useClerkAuth();

  const { data, isLoading, isError } = useQuery(
    'hod-dashboard',
    fetchDashboardStats,
    { staleTime: 2 * 60 * 1000 }
  );

  const stats = [
    { label: 'Pending Leave Requests',      key: 'pendingLeaves',     color: '#3b82f6', icon: <PendingActions /> },
    { label: 'Approved Leaves (This Month)', key: 'approvedThisMonth', color: '#10b981', icon: <Assignment /> },
    { label: 'Active Medical Cases',         key: 'activeCases',       color: '#f59e0b', icon: <LocalHospital /> },
    { label: 'Emergency Cases',              key: 'emergencyCases',    color: '#ef4444', icon: <Warning /> },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: '#f59e0b', width: 56, height: 56, mr: 2 }}>
          <AccountBalance fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1A365D">
            HOD Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.department || 'Department'} · Medical & Leave Summary
          </Typography>
        </Box>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please refresh the page.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stat cards */}
        {stats.map(({ label, key, color }) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <DeptStatCard
              label={label}
              value={data?.[key]}
              color={color}
              loading={isLoading}
            />
          </Grid>
        ))}

        {/* Recent leave requests */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography
              variant="h6" fontWeight="bold" color="#1A365D" mb={2}
              display="flex" alignItems="center"
            >
              <PendingActions sx={{ mr: 1 }} /> Recent Leave Applications
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />
              ))
            ) : !data?.recentLeaveActivity?.length ? (
              <Box textAlign="center" py={4}>
                <Assignment sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography color="text.secondary">No leave requests yet.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Student</b></TableCell>
                    <TableCell><b>Year</b></TableCell>
                    <TableCell><b>Duration</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentLeaveActivity.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>{item.studentName}</TableCell>
                      <TableCell>{item.year || '—'}</TableCell>
                      <TableCell>{item.duration ? `${item.duration}d` : '—'}</TableCell>
                      <TableCell>{STATUS_CHIP[item.status] || item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {/* Top symptoms + health metrics */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography
              variant="h6" fontWeight="bold" color="#1A365D" mb={2}
              display="flex" alignItems="center"
            >
              <TrendingUp sx={{ mr: 1 }} /> Top Symptoms (90 days)
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" height={28} sx={{ mb: 0.5 }} />
              ))
            ) : !data?.topSymptoms?.length ? (
              <Typography color="text.secondary" variant="body2">
                No symptom data yet.
              </Typography>
            ) : (
              data.topSymptoms.map((s, i) => (
                <Box key={i} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: '75%' }}>
                    {s.symptom}
                  </Typography>
                  <Chip label={s.count} size="small" sx={{ bgcolor: '#e0e7ff', color: '#1e3a8a', fontWeight: 700 }} />
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
