import React from 'react';
import { Box, Container, Paper, Stack, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import BITEmblem from '../../components/BITEmblem';

// Phase 2: password-based accounts are gone. With Supabase email OTP, signing
// in IS the recovery flow — the same /login page sends a fresh 6-digit code
// each time. This page exists only to redirect any deep links that used to
// land on /forgot-password.
const ForgotPassword = () => (
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
        <Stack alignItems="center" spacing={2}>
          <BITEmblem size={64} />
          <Typography variant="h6" fontWeight="bold" color="#C41E3A" textAlign="center">
            No passwords here anymore
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Sign in with your email — we send a fresh 6-digit code each time. No
            password to remember, nothing to reset.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            sx={{ backgroundColor: '#C41E3A', '&:hover': { backgroundColor: '#A0172E' } }}
          >
            Go to sign in
          </Button>
        </Stack>
      </Paper>
    </Container>
  </Box>
);

export default ForgotPassword;
