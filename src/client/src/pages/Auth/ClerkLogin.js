import React, { useState } from 'react';
import { SignIn } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School,
  AdminPanelSettings,
  LocalHospital,
  AccountBalance,
  FamilyRestroom,
  ArrowBack,
  ChevronRight,
  ShieldOutlined,
  VerifiedOutlined,
  AutoAwesomeOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { palette } from '../../theme';

const roles = [
  {
    id: 'student',
    title: 'Student',
    icon: School,
    color: palette.navy.main,
    desc: 'Book appointments, view prescriptions, request leave',
  },
  {
    id: 'doctor',
    title: 'Medical Faculty',
    icon: LocalHospital,
    color: palette.maroon.main,
    desc: 'Manage queues, write prescriptions, chat with patients',
  },
  {
    id: 'admin',
    title: 'Administrator',
    icon: AdminPanelSettings,
    color: palette.navy.dark,
    desc: 'Oversee operations, inventory, analytics & fleet',
  },
  {
    id: 'hod',
    title: 'Head of Department',
    icon: AccountBalance,
    color: palette.gold,
    desc: 'Approve leaves, monitor department health metrics',
  },
  {
    id: 'parent',
    title: 'Parent / Guardian',
    icon: FamilyRestroom,
    color: '#7A5C3B',
    desc: 'Track your ward’s health & receive alerts',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const HeroPanel = () => (
  <Box
    sx={{
      position: 'relative',
      overflow: 'hidden',
      display: { xs: 'none', md: 'flex' },
      flexDirection: 'column',
      flex: 1.15,
      color: '#FFFFFF',
      background: `
        radial-gradient(1200px 800px at 10% 0%, rgba(212, 162, 76, 0.18) 0%, transparent 60%),
        radial-gradient(900px 600px at 90% 100%, rgba(26, 43, 92, 0.55) 0%, transparent 55%),
        linear-gradient(135deg, ${palette.maroon.dark} 0%, ${palette.maroon.main} 50%, ${palette.navy.main} 100%)
      `,
      backgroundImage: `
        linear-gradient(rgba(15, 24, 64, 0.55), rgba(92, 15, 15, 0.65)),
        url('/assets/bit_campus.jpg')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      // NOTE: If /assets/bit_campus.jpg is not present, the linear-gradient
      // fallback above is sufficient and looks premium on its own.
      px: { md: 6, lg: 9 },
      py: { md: 6, lg: 8 },
      borderRadius: { md: '20px 0 0 20px' },
    }}
  >
    {/* Subtle decorative grid */}
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at 30% 30%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 30% 30%, black 30%, transparent 75%)',
      }}
    />

    {/* Top brand row */}
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        component="img"
        src="/assets/bit_logo.png"
        alt="BIT Mesra"
        sx={{
          width: 56,
          height: 56,
          p: 0.75,
          background: '#FFFFFF',
          borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      />
      <Box>
        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.24em' }}>
          Birla Institute of Technology
        </Typography>
        <Typography sx={{ fontWeight: 600, letterSpacing: '0.18em', fontSize: '0.75rem', color: palette.gold }}>
          MESRA · RANCHI · EST. 1955
        </Typography>
      </Box>
    </Box>

    {/* Centerpiece */}
    <Box sx={{ position: 'relative', mt: 'auto', mb: 'auto' }}>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { md: '3.4rem', lg: '4.2rem' },
            color: '#FFFFFF',
            lineHeight: 1.05,
            mb: 2,
          }}
        >
          Campus healthcare,
          <Box component="span" sx={{ display: 'block', fontStyle: 'italic', color: palette.gold }}>
            elevated.
          </Box>
        </Typography>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.82)',
            fontSize: '1.05rem',
            maxWidth: 520,
            lineHeight: 1.7,
          }}
        >
          DormDoc connects students, faculty, and administrators through a single,
          intelligent platform — from appointments and prescriptions to ambulance
          dispatch and emergency SOS, all under one roof.
        </Typography>
      </motion.div>

      <Stack direction="row" spacing={4} sx={{ mt: 5 }}>
        {[
          { icon: ShieldOutlined, label: 'HIPAA-style privacy' },
          { icon: VerifiedOutlined, label: 'Role-verified access' },
          { icon: AutoAwesomeOutlined, label: 'AI medical assistant' },
        ].map(({ icon: Icon, label }, idx) => (
          <motion.div
            key={label}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3 + idx}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Icon sx={{ color: palette.gold, fontSize: 22 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.92rem' }}>
                {label}
              </Typography>
            </Stack>
          </motion.div>
        ))}
      </Stack>
    </Box>

    {/* Footer attribution */}
    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em' }}>
        © {new Date().getFullYear()} DORMDOC · A BIT MESRA INITIATIVE
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em' }}>
        v1.0
      </Typography>
    </Box>
  </Box>
);

const RoleTile = ({ role, onSelect }) => {
  const Icon = role.icon;
  return (
    <Box
      component={motion.div}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={() => onSelect(role.id)}
      sx={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 2.25,
        padding: '18px 20px',
        borderRadius: 2.5,
        border: '1px solid rgba(15, 24, 64, 0.08)',
        background: '#FFFFFF',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          borderColor: 'rgba(123, 30, 30, 0.4)',
          boxShadow: '0 12px 30px rgba(15, 24, 64, 0.08)',
        },
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: `${role.color}14`,
          color: role.color,
          flexShrink: 0,
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, color: palette.navy.dark, fontSize: '1rem' }}>
          {role.title}
        </Typography>
        <Typography variant="body2" sx={{ color: palette.navy.light, opacity: 0.85 }}>
          {role.desc}
        </Typography>
      </Box>
      <ChevronRight sx={{ color: palette.maroon.main, opacity: 0.5 }} />
    </Box>
  );
};

const ClerkLogin = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('md'));

  const handleRoleSelect = (roleId) => {
    localStorage.setItem('pendingRole', roleId);
    setSelectedRole(roleId);
  };

  const activeRole = roles.find((r) => r.id === selectedRole);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(900px 600px at 100% 0%, rgba(123, 30, 30, 0.06), transparent 70%),
          radial-gradient(700px 500px at 0% 100%, rgba(26, 43, 92, 0.06), transparent 70%),
          ${palette.cream.default}
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 0, md: 6 },
        px: { xs: 0, md: 4 },
      }}
    >
      <Container disableGutters maxWidth="lg" sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            borderRadius: { xs: 0, md: 4 },
            minHeight: { xs: '100vh', md: '680px' },
            backgroundColor: '#FFFFFF',
            border: { md: '1px solid rgba(15, 24, 64, 0.06)' },
            boxShadow: { md: '0 30px 80px rgba(15, 24, 64, 0.08)' },
          }}
        >
          <HeroPanel />

          {/* Form / role selection panel */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: 3, sm: 6, md: 6, lg: 7 },
              py: { xs: 5, md: 6 },
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Mobile brand block */}
            {isSm && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                <Box
                  component="img"
                  src="/assets/bit_logo.png"
                  alt="BIT Mesra"
                  sx={{ width: 44, height: 44 }}
                />
                <Box>
                  <Typography variant="overline" sx={{ color: palette.navy.main }}>
                    BIT Mesra · DormDoc
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: palette.gold, fontWeight: 600 }}>
                    Campus Dispensary System
                  </Typography>
                </Box>
              </Stack>
            )}

            <AnimatePresence mode="wait">
              {!selectedRole ? (
                <motion.div
                  key="role-select"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <Box
                    sx={{
                      height: 3,
                      width: 56,
                      backgroundColor: palette.gold,
                      borderRadius: 4,
                      mb: 2.5,
                    }}
                  />
                  <Typography variant="h3" sx={{ fontSize: { xs: '1.9rem', md: '2.4rem' }, mb: 1 }}>
                    Welcome back
                  </Typography>
                  <Typography sx={{ color: palette.navy.light, mb: 4, fontSize: '1rem' }}>
                    Select your role to continue to DormDoc.
                  </Typography>

                  <Stack spacing={1.5}>
                    {roles.map((role, idx) => (
                      <motion.div
                        key={role.id}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        custom={idx}
                      >
                        <RoleTile role={role} onSelect={handleRoleSelect} />
                      </motion.div>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 4 }} />

                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="caption" sx={{ color: palette.navy.light }}>
                      Need help? Contact the campus health office.
                    </Typography>
                    <Typography variant="caption" sx={{ color: palette.navy.light }}>
                      Privacy · Terms
                    </Typography>
                  </Stack>
                </motion.div>
              ) : (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <IconButton
                      onClick={() => setSelectedRole(null)}
                      sx={{
                        color: palette.maroon.main,
                        border: '1px solid rgba(123, 30, 30, 0.18)',
                        borderRadius: 2,
                        '&:hover': { backgroundColor: 'rgba(123, 30, 30, 0.06)' },
                      }}
                    >
                      <ArrowBack fontSize="small" />
                    </IconButton>
                    <Box>
                      <Typography variant="overline" sx={{ color: palette.navy.main }}>
                        Continue as
                      </Typography>
                      <Typography variant="h5" sx={{ color: palette.navy.dark, fontWeight: 700 }}>
                        {activeRole?.title}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      '& .cl-rootBox, & .cl-card': {
                        width: '100%',
                        boxShadow: 'none',
                        border: 'none',
                        padding: 0,
                        background: 'transparent',
                      },
                    }}
                  >
                    <SignIn
                      appearance={{
                        variables: {
                          colorPrimary: palette.maroon.main,
                          colorText: palette.navy.dark,
                          colorTextSecondary: palette.navy.light,
                          colorBackground: '#FFFFFF',
                          borderRadius: '10px',
                          fontFamily: '"Inter", sans-serif',
                        },
                        elements: {
                          rootBox: { width: '100%' },
                          card: {
                            width: '100%',
                            boxShadow: 'none',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                          },
                          header: { display: 'none' },
                          formButtonPrimary: {
                            backgroundColor: palette.maroon.main,
                            padding: '12px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            letterSpacing: 0.2,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(123, 30, 30, 0.25)',
                            '&:hover': { backgroundColor: palette.maroon.dark },
                          },
                          socialButtonsBlockButton: {
                            padding: '11px',
                            border: '1px solid rgba(15, 24, 64, 0.12)',
                            borderRadius: '10px',
                            '&:hover': {
                              backgroundColor: 'rgba(15, 24, 64, 0.03)',
                            },
                          },
                          formFieldInput: {
                            padding: '12px',
                            border: '1px solid rgba(15, 24, 64, 0.16)',
                            borderRadius: '10px',
                            backgroundColor: '#FFFFFF',
                            '&:focus': {
                              borderColor: palette.maroon.main,
                              boxShadow: `0 0 0 4px ${palette.maroon.main}1f`,
                            },
                          },
                          footerActionLink: {
                            color: palette.maroon.main,
                            fontWeight: 600,
                            '&:hover': { color: palette.maroon.dark },
                          },
                          dividerLine: { backgroundColor: 'rgba(15, 24, 64, 0.1)' },
                          dividerText: { color: palette.navy.light },
                        },
                      }}
                      redirectUrl="/dashboard"
                      signUpUrl="/register"
                    />
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ClerkLogin;
