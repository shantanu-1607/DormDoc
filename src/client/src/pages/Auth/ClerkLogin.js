import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Box, Container, Typography, Paper } from '@mui/material';
import BITEmblem from '../../components/BITEmblem';

const ClerkLogin = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.1,
        }}
      />

      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            py: 4,
          }}
        >
          {/* Left Panel - BIT Branding */}
          <Paper
            elevation={10}
            sx={{
              flex: 1,
              maxWidth: '500px',
              background: 'linear-gradient(135deg, #C41E3A 0%, #8B0000 100%)',
              color: 'white',
              p: 4,
              borderRadius: '20px 0 0 20px',
              position: 'relative',
              overflow: 'hidden',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '600px',
            }}
          >
            {/* BIT Emblem */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <BITEmblem size={120} />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                textAlign: 'center',
                color: '#FFD700',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Birla Institute of Technology
            </Typography>

            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                mb: 4,
                color: '#FFD700',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              Mesra, Ranchi
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: '#FFD700',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                textAlign: 'center',
              }}
            >
              College Dispensary Management System
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                mb: 3,
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              Secure, efficient, and comprehensive healthcare management for our college community.
            </Typography>
          </Paper>

          {/* Right Panel - Clerk Sign In */}
          <Paper
            elevation={10}
            sx={{
              flex: 1,
              maxWidth: '500px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              p: 4,
              borderRadius: '0 20px 20px 0',
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: '#C41E3A',
                }}
              >
                Welcome Back!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 3,
                }}
              >
                Please sign in to continue to your account
              </Typography>
            </Box>

            {/* Clerk Sign In Component */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <SignIn
                appearance={{
                  elements: {
                    formButtonPrimary: {
                      backgroundColor: '#C41E3A',
                      '&:hover': {
                        backgroundColor: '#8B0000',
                      },
                    },
                    card: {
                      boxShadow: 'none',
                      border: 'none',
                    },
                    headerTitle: {
                      color: '#C41E3A',
                      fontWeight: 'bold',
                    },
                    headerSubtitle: {
                      color: '#666',
                    },
                    socialButtonsBlockButton: {
                      border: '1px solid #ddd',
                      '&:hover': {
                        borderColor: '#C41E3A',
                      },
                    },
                    formFieldInput: {
                      border: '1px solid #ddd',
                      '&:focus': {
                        borderColor: '#C41E3A',
                        boxShadow: '0 0 0 2px rgba(196, 30, 58, 0.2)',
                      },
                    },
                    footerActionLink: {
                      color: '#C41E3A',
                      '&:hover': {
                        color: '#8B0000',
                      },
                    },
                  },
                }}
                redirectUrl="/"
                signUpUrl="/register"
              />
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default ClerkLogin;
