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

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithOtp, verifyOtp, needsOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signInWithOtp(email.trim().toLowerCase());
    setLoading(false);
    if (result.success) {
      setStage('otp');
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyOtp(email.trim().toLowerCase(), otp.trim());
    setLoading(false);
    if (result.success) {
      navigate(needsOnboarding ? '/onboarding' : '/dashboard');
    } else {
      setError(result.message);
    }
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
              DormDoc · BIT Mesra
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stage === 'email'
                ? 'Sign in with your email — we’ll send you a 6-digit code.'
                : `Enter the 6-digit code sent to ${email}`}
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send code'}
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
              <Button
                fullWidth
                onClick={() => { setStage('email'); setOtp(''); setError(''); }}
                sx={{ mt: 1 }}
              >
                Use a different email
              </Button>
            </Box>
          )}

          <Box textAlign="center" mt={3}>
            <Link component={RouterLink} to="/register" variant="body2" sx={{ color: '#C41E3A' }}>
              New here? Same email-OTP flow on the sign-up page →
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
