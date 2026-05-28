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
  IconButton,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useAuth } from '../../contexts/AuthContext';
import AuthShell from './AuthShell';
import { palette } from '../../theme';
import { isBitEmail, isWhitelisted, BIT_DOMAIN, normalizeEmail } from '../../utils/emailDomain';

const MIN_PASSWORD = 8;

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const { signUpWithPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalized = normalizeEmail(email);

    if (!isBitEmail(normalized) && !isWhitelisted(normalized)) {
      setError(
        `Registration is open only to @${BIT_DOMAIN} addresses. If you're a parent, ask the dispensary to enrol you — parents don't self-register.`,
      );
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError(`Passwords don't match.`);
      return;
    }

    setLoading(true);
    const result = await signUpWithPassword(normalized, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }
    if (result.needsConfirmation) {
      setConfirmationSent(true);
    } else {
      navigate('/onboarding');
    }
  };

  if (confirmationSent) {
    return (
      <AuthShell>
        <Stack spacing={1} mb={3}>
          <Typography
            variant="overline"
            sx={{ color: palette.maroon.main, letterSpacing: '0.22em' }}
          >
            Confirm your email
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            One link away
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            We sent a confirmation link to{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {email}
            </Box>
            . Open it from the same device, then come back to sign in.
          </Typography>
        </Stack>
        <Button
          component={RouterLink}
          to="/login"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ py: 1.4, fontSize: '1rem' }}
        >
          Back to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Stack spacing={1} mb={4}>
        <Typography
          variant="overline"
          sx={{ color: palette.maroon.main, letterSpacing: '0.22em' }}
        >
          Create account
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Join DormDoc
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Use your institute email and set a password you'll remember. You'll finish
          your profile after the first sign-in.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
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
            helperText={`Use your @${BIT_DOMAIN} address.`}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            helperText={`At least ${MIN_PASSWORD} characters.`}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    aria-label={showPassword ? 'hide password' : 'show password'}
                  >
                    {showPassword ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={loading || !email || !password || !confirm}
          endIcon={!loading && <ArrowForwardRoundedIcon />}
          sx={{ mt: 3, py: 1.4, fontSize: '1rem' }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
        </Button>
      </Box>

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
