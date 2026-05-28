import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useAuth } from '../../contexts/AuthContext';
import AuthShell from './AuthShell';
import { palette } from '../../theme';

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
    <AuthShell>
      <Stack spacing={1} mb={4}>
        <Typography
          variant="overline"
          sx={{ color: palette.maroon.main, letterSpacing: '0.22em' }}
        >
          {stage === 'email' ? 'Create account' : 'Verify code'}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          {stage === 'email' ? 'Join DormDoc' : 'Confirm your email'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {stage === 'email'
            ? "We'll send a 6-digit code to your inbox. You'll finish your profile after verifying."
            : (
              <>
                Enter the 6-digit code we sent to{' '}
                <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {email}
                </Box>
                .
              </>
            )}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {stage === 'email' && (
        <Box component="form" onSubmit={handleSendOtp} noValidate>
          <TextField
            fullWidth
            autoFocus
            label="Institute email"
            placeholder="you@bitmesra.ac.in"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            helperText="Use your @bitmesra.ac.in address. Parents — use the email registered with the institute."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || !email}
            endIcon={!loading && <ArrowForwardRoundedIcon />}
            sx={{ mt: 3, py: 1.4, fontSize: '1rem' }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Send verification code'}
          </Button>
        </Box>
      )}

      {stage === 'otp' && (
        <Box component="form" onSubmit={handleVerifyOtp} noValidate>
          <TextField
            fullWidth
            autoFocus
            label="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]{6}',
              maxLength: 6,
              style: {
                letterSpacing: '0.6em',
                fontSize: '1.4rem',
                fontWeight: 600,
                textAlign: 'center',
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || otp.length !== 6}
            endIcon={!loading && <ArrowForwardRoundedIcon />}
            sx={{ mt: 3, py: 1.4, fontSize: '1rem' }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify & continue'}
          </Button>
          <Button
            fullWidth
            onClick={() => {
              setStage('email');
              setOtp('');
              setError('');
            }}
            sx={{ mt: 1.5, color: 'text.secondary' }}
          >
            Use a different email
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 4 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
          ALREADY ENROLLED
        </Typography>
      </Divider>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Already have an account?
        </Typography>
        <Link
          component={RouterLink}
          to="/login"
          variant="body2"
          sx={{
            color: palette.maroon.main,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Sign in instead
          <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
        </Link>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 5,
          color: 'text.secondary',
          textAlign: 'center',
        }}
      >
        DormDoc · Birla Institute of Technology, Mesra · © {new Date().getFullYear()}
      </Typography>
    </AuthShell>
  );
};

export default Register;
