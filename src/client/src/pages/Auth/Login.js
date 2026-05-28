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
  Chip,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useAuth } from '../../contexts/AuthContext';
import AuthShell from './AuthShell';
import { palette } from '../../theme';

const ROLE_CHIPS = ['Student', 'Doctor', 'HOD', 'Parent', 'Admin'];

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
    if (result.success) setStage('otp');
    else setError(result.message);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyOtp(email.trim().toLowerCase(), otp.trim());
    setLoading(false);
    if (result.success) navigate(needsOnboarding ? '/onboarding' : '/dashboard');
    else setError(result.message);
  };

  return (
    <AuthShell>
      <Stack spacing={1} mb={4}>
        <Typography
          variant="overline"
          sx={{ color: palette.maroon.main, letterSpacing: '0.22em' }}
        >
          {stage === 'email' ? 'Sign in' : 'Verify code'}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          {stage === 'email' ? 'Welcome back' : 'Check your inbox'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {stage === 'email'
            ? "We'll email you a 6-digit code — no password to remember."
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
            helperText="Students & staff: use @bitmesra.ac.in. Parents: use your registered email."
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
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Send 6-digit code'}
          </Button>

          <Stack direction="row" sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
            {ROLE_CHIPS.map((role) => (
              <Chip
                key={role}
                size="small"
                label={role}
                variant="outlined"
                sx={{ borderColor: 'rgba(123,30,30,0.25)', color: palette.maroon.main }}
              />
            ))}
          </Stack>
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
          NEW TO DORMDOC
        </Typography>
      </Divider>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          First time on campus?
        </Typography>
        <Link
          component={RouterLink}
          to="/register"
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
          Create your account
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

export default Login;
