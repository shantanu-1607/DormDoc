import React from 'react';
import {
  Box, Typography, Grid, Paper, Avatar, Alert,
  Skeleton, LinearProgress, Divider,
} from '@mui/material';
import { Analytics } from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useQuery } from 'react-query';
import DeptHealthChart from '../../components/HOD/DeptHealthChart';
import { fetchAnalytics } from '../../services/hodService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SectionSkeleton = () => (
  <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
);

const DepartmentAnalytics = () => {
  const { data, isLoading, isError } = useQuery(
    'hod-analytics',
    fetchAnalytics,
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1e3a8a', width: 48, height: 48 }}>
          <Analytics />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#1A365D">
            Department Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Health and leave trends for your department
          </Typography>
        </Box>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>Failed to load analytics data.</Alert>
      )}

      <Grid container spacing={3}>
        {/* Monthly leave trends */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            {isLoading
              ? <SectionSkeleton />
              : <DeptHealthChart data={data?.monthlyLeaves || []} />}
          </Paper>
        </Grid>

        {/* Top symptoms bar chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#1A365D" mb={2}>
              Top Symptoms (Last 90 Days)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <SectionSkeleton />
            ) : !data?.topSymptoms?.length ? (
              <Typography color="text.secondary" variant="body2">No data yet.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={data.topSymptoms}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="symptom"
                    width={130}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.length > 18 ? `${v.slice(0, 18)}…` : v}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                    {(data?.topSymptoms || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Student demographics pie chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#1A365D" mb={2}>
              Students by Academic Year
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <SectionSkeleton />
            ) : !data?.demographics?.length ? (
              <Typography color="text.secondary" variant="body2">No data yet.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.demographics}
                    dataKey="count"
                    nameKey="year"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ year, percent }) =>
                      `${year} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {(data?.demographics || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => [`${v} students`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Recovery and aggregate stats */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#1A365D" mb={2}>
              Appointment Outcomes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            ) : (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Recovery Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">{data?.recoveryRate ?? 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={data?.recoveryRate ?? 0}
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                  />
                </Box>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {[
                    { label: 'Total Appointments', val: data?.totalAppointments },
                    { label: 'Completed',           val: data?.completedAppointments },
                    { label: 'Emergency Cases',      val: data?.emergencyCount },
                  ].map(({ label, val }) => (
                    <Box key={label} sx={{ flex: 1, minWidth: 80, textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight="bold" color="#1A365D">{val ?? 0}</Typography>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Leave rate by year */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#1A365D" mb={2}>
              Leave Requests by Year
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <SectionSkeleton />
            ) : !data?.yearWiseLeaves?.length ? (
              <Typography color="text.secondary" variant="body2">No data yet.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.yearWiseLeaves}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
                    {(data?.yearWiseLeaves || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DepartmentAnalytics;
