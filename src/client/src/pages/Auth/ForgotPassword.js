import React from 'react';
import { Box, Button, Stack, Typography, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import AuthShell from './AuthShell';
import { palette } from '../../theme';

// Phase 2: password-based accounts are gone. With Supabase email OTP, signing
// in IS the recovery flow — the same /login page sends a fresh 6-digit code
// each time. This page exists only to redirect any deep links that used to
// land on /forgot-password.
const ForgotPassword = () => (
  <AuthShell>
    <Stack spacing={1} mb={3}>
      <Typography
        variant="overline"
        sx={{ color: palette.maroon.main, letterSpacing: '0.22em' }}
      >
        Account recovery
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 700,
          color: 'text.primary',
        }}
      >
        No passwords here anymore
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        DormDoc signs you in with a fresh 6-digit code each time. There's nothing to
        reset — just head back to sign in and request a new code.
      </Typography>
    </Stack>

    <Alert
      icon={<LockResetRoundedIcon fontSize="small" />}
      severity="info"
      sx={{ mb: 3 }}
    >
      Lost access to your email? Contact the campus dispensary at{' '}
      <Box component="span" sx={{ fontWeight: 600 }}>dispensary@bitmesra.ac.in</Box>.
    </Alert>

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
      Go to sign in
    </Button>

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

export default ForgotPassword;
