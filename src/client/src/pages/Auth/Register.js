import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Stack,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BITEmblem from '../../components/BITEmblem';

// With Supabase email OTP, signup and login share one flow — the OTP request
// creates the auth.users row on first use. The post-OTP onboarding form
// collects the role-specific fields (department, year, hostel for students).
const Register = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signInWithOtp(email.trim().toLowerCase());
    setLoading(false);
    if (result.success) setStage('otp');
    else setError(result.message);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyOtp(email.trim().toLowerCase(), otp.trim());
    setLoading(false);
    if (result.success) navigate('/onboarding');
    else setError(result.message);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #C41E3A 0%, #7B1E1E 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
          <Stack alignItems="center" spacing={1} mb={3}>
            <BITEmblem size={80} />
            <Typography variant="h5" fontWeight="bold" color="#C41E3A">
              Create your DormDoc account
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {stage === 'email'
                ? 'Enter your email. We’ll send a 6-digit code to verify it.'
                : `Enter the 6-digit code sent to ${email}.`}
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {stage === 'email' && (
            <Box component="form" onSubmit={handleSendOtp}>
              <TextField
                fullWidth
                autoFocus
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
                autoComplete="email"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !email}
                sx={{ mt: 2, py: 1.5, backgroundColor: '#C41E3A', '&:hover': { backgroundColor: '#A0172E' } }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send verification code'}
              </Button>
            </Box>
          )}

          {stage === 'otp' && (
            <Box component="form" onSubmit={handleVerifyOtp}>
              <TextField
                fullWidth
                autoFocus
                label="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                margin="normal"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || otp.length !== 6}
                sx={{ mt: 2, py: 1.5, backgroundColor: '#C41E3A', '&:hover': { backgroundColor: '#A0172E' } }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify & continue'}
              </Button>
            </Box>
          )}

          <Box textAlign="center" mt={3}>
            <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#C41E3A' }}>
              Already have an account? Sign in
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
