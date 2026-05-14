import React, { useState } from 'react';
import {
  Box, Typography, Paper, Avatar, Button, Alert,
  Grid, Divider, CircularProgress, Chip,
} from '@mui/material';
import {
  Assessment, FileDownload, CalendarMonth,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useClerkAuth } from '../../contexts/ClerkAuthContext';
import { downloadMonthlyReport } from '../../services/hodService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-indexed

// Build year options: current year and 2 years back
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

const DepartmentReports = () => {
  const { user } = useClerkAuth();
  const [selectedYear,  setSelectedYear]  = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading]             = useState(false);
  const [recentExports, setRecentExports] = useState([]);

  const isFuture = selectedYear === currentYear && selectedMonth > currentMonth;

  const handleExport = async () => {
    if (isFuture) return;
    setLoading(true);
    try {
      await downloadMonthlyReport(selectedYear, selectedMonth);
      const record = {
        id:    Date.now(),
        label: `${MONTHS[selectedMonth - 1]} ${selectedYear}`,
        at:    new Date().toLocaleString('en-IN'),
      };
      setRecentExports((prev) => [record, ...prev].slice(0, 5));
      toast.success(`Report for ${record.label} downloaded.`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate report. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1e3a8a', width: 48, height: 48 }}>
          <Assessment />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#1A365D">
            Department Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Export monthly CSV reports for {user?.department || 'your department'}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Export card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#1A365D" mb={2} display="flex" alignItems="center" gap={1}>
              <CalendarMonth /> Select Period
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Year picker */}
            <Typography variant="subtitle2" color="text.secondary" mb={1}>Year</Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {YEARS.map((y) => (
                <Chip
                  key={y}
                  label={y}
                  onClick={() => setSelectedYear(y)}
                  color={selectedYear === y ? 'primary' : 'default'}
                  variant={selectedYear === y ? 'filled' : 'outlined'}
                  sx={{ fontWeight: selectedYear === y ? 700 : 400 }}
                />
              ))}
            </Box>

            {/* Month picker */}
            <Typography variant="subtitle2" color="text.secondary" mb={1}>Month</Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
              {MONTHS.map((m, i) => {
                const monthNum = i + 1;
                const future = selectedYear === currentYear && monthNum > currentMonth;
                return (
                  <Chip
                    key={m}
                    label={m.slice(0, 3)}
                    onClick={() => !future && setSelectedMonth(monthNum)}
                    color={selectedMonth === monthNum ? 'primary' : 'default'}
                    variant={selectedMonth === monthNum ? 'filled' : 'outlined'}
                    disabled={future}
                    sx={{ fontWeight: selectedMonth === monthNum ? 700 : 400 }}
                  />
                );
              })}
            </Box>

            {isFuture && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Cannot generate a report for a future period.
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <FileDownload />}
              onClick={handleExport}
              disabled={loading || isFuture}
              sx={{
                bgcolor: '#1e3a8a',
                '&:hover': { bgcolor: '#1e40af' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {loading
                ? 'Generating…'
                : `Export ${MONTHS[selectedMonth - 1]} ${selectedYear} (CSV)`}
            </Button>
          </Paper>
        </Grid>

        {/* Recent exports */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#1A365D" mb={2}>
              Recent Exports (This Session)
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {recentExports.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Assessment sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  No exports yet. Select a period above and click Export.
                </Typography>
              </Box>
            ) : (
              recentExports.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, mb: 1.5, bgcolor: '#f8fafc', borderRadius: 2,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.at}</Typography>
                  </Box>
                  <Chip label="CSV" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Report contents info */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <Typography variant="subtitle2" color="#0369a1" fontWeight="bold" mb={1}>
              What's included in the CSV report?
            </Typography>
            <Typography variant="body2" color="#0369a1">
              Each row covers one appointment from your department:
              student name, roll number, year, email, department, symptoms, diagnosis,
              appointment status, leave request details (duration, reason, status),
              attending doctor, and emergency flag.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DepartmentReports;
