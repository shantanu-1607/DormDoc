import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Stack,
} from '@mui/material';
import { AccountCircleOutlined, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { palette } from '../../theme';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Other'];
const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Onboarding = () => {
  const { user, setNeedsOnboarding } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const role = user?.role || 'student';

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    studentId: '',
    department: '',
    year: '1st',
    hostel: '',
    roomNumber: '',
    bloodGroup: 'O+',
    facultyId: '',
    designation: 'Assistant Professor',
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/auth/profile', { name: form.name, phone: form.phone });
      await axios.post('/api/onboarding', {
        role,
        data:
          role === 'student'
            ? {
                student_id: form.studentId,
                department: form.department,
                year: form.year,
                hostel: form.hostel || null,
                room_number: form.roomNumber || null,
                blood_group: form.bloodGroup,
              }
            : role === 'faculty' || role === 'hod'
            ? {
                faculty_id: form.facultyId,
                department: form.department,
                designation: form.designation,
              }
            : {},
      });
      toast.success('Profile completed.');
      setNeedsOnboarding(false);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4,
        backgroundColor: palette.navy.dark,
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(92, 15, 15, 0.78) 0%, rgba(26, 43, 92, 0.78) 60%, rgba(6, 11, 34, 0.92) 100%)',
        }}
      />
      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4.5 },
            borderRadius: 3,
            border: '1px solid rgba(15,24,64,0.06)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: `${palette.maroon.main}14`,
                color: palette.maroon.main,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <AccountCircleOutlined />
            </Box>
            <Box>
              <Typography
                variant="overline"
                sx={{ color: palette.navy.light, letterSpacing: '0.22em' }}
              >
                One more step
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', md: '1.85rem' },
                  color: palette.navy.dark,
                  lineHeight: 1.1,
                }}
              >
                Complete your profile
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ color: palette.navy.light, mb: 3 }}>
            Add your {role} details to unlock the DormDoc portal.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                />
              </Grid>

              {role === 'student' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Roll number / Student ID"
                      value={form.studentId}
                      onChange={(e) => update('studentId', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Department"
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                      required
                    >
                      {DEPARTMENTS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Year"
                      value={form.year}
                      onChange={(e) => update('year', e.target.value)}
                    >
                      {YEARS.map((y) => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Blood group"
                      value={form.bloodGroup}
                      onChange={(e) => update('bloodGroup', e.target.value)}
                    >
                      {BLOOD_GROUPS.map((b) => (
                        <MenuItem key={b} value={b}>
                          {b}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hostel (optional)"
                      value={form.hostel}
                      onChange={(e) => update('hostel', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Room number (optional)"
                      value={form.roomNumber}
                      onChange={(e) => update('roomNumber', e.target.value)}
                    />
                  </Grid>
                </>
              )}

              {(role === 'faculty' || role === 'hod') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Faculty ID"
                      value={form.facultyId}
                      onChange={(e) => update('facultyId', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Department"
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                      required
                    >
                      {DEPARTMENTS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={!loading && <ChevronRight />}
                  sx={{ mt: 1, py: 1.4 }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    'Complete setup & enter dashboard'
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.16em',
          }}
        >
          DORMDOC · BIT MESRA
        </Typography>
      </Container>
    </Box>
  );
};

export default Onboarding;
