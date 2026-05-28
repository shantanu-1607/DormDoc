import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BITEmblem from '../../components/BITEmblem';
import { palette } from '../../theme';

const FEATURE_BULLETS = [
  'Appointments with the campus dispensary',
  'Digital prescriptions & medical records',
  'Ambulance dispatch and live tracking',
  'Leave-from-class workflow signed by doctors',
];

const AuthShell = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
      backgroundColor: palette.cream.default,
    }}
  >
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#FFFFFF',
        px: { xs: 4, md: 6 },
        py: { xs: 5, md: 7 },
        background: `linear-gradient(155deg, ${palette.maroon.dark} 0%, ${palette.maroon.main} 55%, ${palette.navy.dark} 100%)`,
        overflow: 'hidden',
        minHeight: { xs: 280, md: '100vh' },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 15%, rgba(212,162,76,0.18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.08), transparent 50%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${palette.gold} 50%, transparent)`,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <BITEmblem size={48} />
        <Box>
          <Typography
            variant="overline"
            sx={{ color: palette.gold, letterSpacing: '0.24em' }}
          >
            BIT Mesra
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#FFFFFF', lineHeight: 1.1, fontWeight: 700 }}
          >
            DormDoc
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, my: { xs: 2, md: 0 } }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: { xs: '1.85rem', md: '2.6rem' },
            lineHeight: 1.15,
            color: '#FFFFFF',
          }}
        >
          The campus dispensary,
          <br />
          on every device.
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 460 }}
        >
          One signed-in portal for students, faculty, doctors, HODs, parents and admin
          staff — built for BIT Mesra.
        </Typography>

        <Stack spacing={1.25} sx={{ pt: 1 }}>
          {FEATURE_BULLETS.map((line) => (
            <Stack key={line} direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212,162,76,0.22)',
                  border: `1px solid ${palette.gold}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckRoundedIcon sx={{ fontSize: 14, color: palette.gold }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {line}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: 'rgba(255,255,255,0.6)',
          display: { xs: 'none', md: 'flex' },
        }}
      >
        <LockOutlinedIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ letterSpacing: 0.4 }}>
          Secured by Supabase Auth · One-time-code sign-in
        </Typography>
      </Stack>
    </Box>

    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, sm: 6 },
        py: { xs: 5, md: 7 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>{children}</Box>
    </Box>
  </Box>
);

export default AuthShell;
