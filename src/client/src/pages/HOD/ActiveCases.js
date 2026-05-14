import React from 'react';
import {
  Box, Typography, Grid, Paper, Avatar, Alert,
  Chip, Skeleton, Divider,
} from '@mui/material';
import { LocalHospital, Warning } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { fetchActiveCases } from '../../services/hodService';

const STATUS_COLOR = {
  scheduled:   { color: 'info',    label: 'Scheduled' },
  confirmed:   { color: 'primary', label: 'Confirmed' },
  'in-progress':{ color: 'warning', label: 'In Progress' },
};

const CaseSkeleton = () => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
    <Skeleton variant="text" width="60%" height={28} />
    <Skeleton variant="text" width="40%" />
    <Skeleton variant="text" width="80%" />
  </Paper>
);

const ActiveCases = () => {
  const { data, isLoading, isError } = useQuery(
    'hod-active-cases',
    fetchActiveCases,
    { staleTime: 60 * 1000, refetchInterval: 2 * 60 * 1000 }
  );

  const cases = data?.cases || [];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#f59e0b', width: 48, height: 48 }}>
          <LocalHospital />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#1A365D">
            Active Medical Cases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Students currently under treatment in your department
            {!isLoading && ` · ${data?.total ?? 0} active`}
          </Typography>
        </Box>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>Failed to load active cases.</Alert>
      )}

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <CaseSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : cases.length === 0 ? (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <LocalHospital sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No active cases right now
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All students in your department are currently well.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {cases.map((c) => {
            const student = c.student || {};
            const doctor = c.doctor || {};
            const statusMeta = STATUS_COLOR[c.status] || { color: 'default', label: c.status };

            return (
              <Grid item xs={12} sm={6} md={4} key={c._id}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2.5, borderRadius: 3,
                    borderLeft: `5px solid ${c.isEmergency ? '#ef4444' : '#f59e0b'}`,
                    position: 'relative',
                  }}
                >
                  {c.isEmergency && (
                    <Chip
                      icon={<Warning sx={{ fontSize: 14 }} />}
                      label="Emergency"
                      color="error"
                      size="small"
                      sx={{ position: 'absolute', top: 12, right: 12 }}
                    />
                  )}

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#1e3a8a', fontSize: 13 }}>
                      {student.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="bold" variant="body1" color="#1A365D">
                        {student.name || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.studentId} · {student.year} Year
                        {student.hostel ? ` · ${student.hostel}` : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    <b>Symptoms:</b> {c.symptoms || '—'}
                  </Typography>
                  {c.diagnosis && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      <b>Diagnosis:</b> {c.diagnosis}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    <b>Doctor:</b> {doctor.name || '—'}
                    {doctor.specialization ? ` (${doctor.specialization})` : ''}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
                    <Chip
                      label={`Priority ${c.priority}`}
                      size="small"
                      sx={{
                        bgcolor: c.priority >= 8 ? '#fee2e2' : '#f1f5f9',
                        color: c.priority >= 8 ? '#991b1b' : 'text.secondary',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ActiveCases;
