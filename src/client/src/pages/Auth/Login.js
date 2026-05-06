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
  Grid,
  Paper,
  IconButton,
  InputAdornment,
  Fade,
  Slide,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import BITEmblem from '../../components/BITEmblem';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, rgba(196, 30, 58, 0.9) 0%, rgba(196, 30, 58, 0.8) 30%, rgba(0, 0, 0, 0.7) 70%, rgba(0, 0, 0, 0.8) 100%),
          url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23E8F4FD;stop-opacity:1" /><stop offset="50%" style="stop-color:%23D1E7DD;stop-opacity:1" /><stop offset="100%" style="stop-color:%23B8E6B8;stop-opacity:1" /></linearGradient><linearGradient id="building" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23F5F5DC;stop-opacity:1" /><stop offset="50%" style="stop-color:%23F0F8FF;stop-opacity:1" /><stop offset="100%" style="stop-color:%23E6F3FF;stop-opacity:1" /></linearGradient><linearGradient id="windows" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23C41E3A;stop-opacity:0.8" /><stop offset="100%" style="stop-color:%23A0172E;stop-opacity:0.9" /></linearGradient></defs><rect width="1200" height="800" fill="url(%23sky)"/><rect x="150" y="200" width="900" height="450" fill="url(%23building)" stroke="%23C41E3A" stroke-width="4" rx="12"/><rect x="200" y="250" width="800" height="350" fill="%23FFFFFF" stroke="%23C41E3A" stroke-width="2" rx="8"/><rect x="250" y="300" width="700" height="250" fill="%23F8F9FA" rx="4"/><circle cx="600" cy="425" r="35" fill="%23C41E3A"/><rect x="450" y="380" width="300" height="90" fill="url(%23windows)" opacity="0.3" rx="6"/><text x="600" y="435" text-anchor="middle" fill="white" font-size="18" font-weight="bold">BIT</text><rect x="100" y="600" width="1000" height="120" fill="%2387CEEB" opacity="0.4" rx="25"/><circle cx="200" cy="650" r="35" fill="%23FFD700" opacity="0.7"/><circle cx="1000" cy="650" r="35" fill="%23FFD700" opacity="0.7"/><rect x="500" y="620" width="200" height="60" fill="%23FFD700" opacity="0.5" rx="15"/><rect x="400" y="380" width="400" height="15" fill="%23C41E3A" opacity="0.4" rx="2"/><rect x="400" y="410" width="400" height="15" fill="%23C41E3A" opacity="0.3" rx="2"/><rect x="400" y="440" width="400" height="15" fill="%23C41E3A" opacity="0.2" rx="2"/><rect x="400" y="470" width="400" height="15" fill="%23C41E3A" opacity="0.1" rx="2"/><rect x="300" y="320" width="20" height="200" fill="%23C41E3A" opacity="0.6" rx="10"/><rect x="880" y="320" width="20" height="200" fill="%23C41E3A" opacity="0.6" rx="10"/><rect x="350" y="100" width="500" height="40" fill="%23C41E3A" opacity="0.1" rx="20"/><rect x="400" y="110" width="400" height="20" fill="%23C41E3A" opacity="0.2" rx="10"/></svg>')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(196, 30, 58, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, transparent 30%, rgba(196, 30, 58, 0.05) 50%, transparent 70%)
          `,
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        },
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 2,
          animation: 'fadeInUp 0.8s ease-out',
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(30px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
          {/* Left Panel - Institute Information */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4, md: 5 },
                  backgroundColor: 'rgba(196, 30, 58, 0.95)',
                  color: 'white',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
                    pointerEvents: 'none',
                  },
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 2 }}>
                  <Box sx={{ 
                    display: 'inline-block',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                    },
                  }}>
                    <BITEmblem size={140} sx={{ mx: 'auto', mb: 3, filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))' }} />
                  </Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      background: 'linear-gradient(45deg, #FFD700, #FFFFFF)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    }}
                  >
                    BIRLA INSTITUTE OF TECHNOLOGY, MESRA
                  </Typography>
                </Box>

                <Box sx={{ mb: 4, position: 'relative', zIndex: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      color: '#FFD700',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                    }}
                  >
                    Institute Vision
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      lineHeight: 1.7,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    To become a globally recognized academic institution in consonance with the social, economic and ecological environment, striving continuously for excellence in education, research and technological service to the national needs.
                  </Typography>
                </Box>

                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      color: '#FFD700',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                    }}
                  >
                    Institute Mission
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, m: 0 }}>
                    {[
                      'To educate students to become responsible, innovative and successful professionals.',
                      'To provide state-of-the-art research facilities and create a conducive environment for research.',
                      'To develop teaching skills and research capabilities of faculty members.',
                      'To build national capabilities in technology, education and research.',
                      'To provide technological services to the industry and society.'
                    ].map((mission, index) => (
                      <Typography 
                        key={index}
                        variant="body2" 
                        sx={{ 
                          mb: 1.5, 
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          lineHeight: 1.6,
                        }}
                      >
                        {index + 1}. {mission}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Grid>

          {/* Right Panel - Login Form */}
          <Grid item xs={12} md={6}>
            <Slide direction="left" in timeout={1200}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4, md: 5 },
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(196, 30, 58, 0.2)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(196, 30, 58, 0.05) 0%, transparent 50%, rgba(255, 215, 0, 0.05) 100%)',
                    pointerEvents: 'none',
                  },
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 2 }}>
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{
                      fontWeight: 'bold',
                      color: '#C41E3A',
                      mb: 1,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                      background: 'linear-gradient(45deg, #C41E3A, #A0172E)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Welcome!
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#666',
                      fontWeight: '500',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                    }}
                  >
                    Please login to continue
                  </Typography>
                </Box>

                {error && (
                  <Fade in>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 3,
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        border: '1px solid rgba(211, 47, 47, 0.2)',
                        '& .MuiAlert-icon': {
                          color: '#C41E3A',
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative', zIndex: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter username"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    autoComplete="email"
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': {
                            borderColor: '#C41E3A',
                            borderWidth: 2,
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          '& fieldset': {
                            borderColor: '#C41E3A',
                            borderWidth: 2,
                            boxShadow: '0 0 0 3px rgba(196, 30, 58, 0.1)',
                          },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#C41E3A',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Enter password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    margin="normal"
                    required
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ 
                              color: '#C41E3A',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(196, 30, 58, 0.1)',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': {
                            borderColor: '#C41E3A',
                            borderWidth: 2,
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          '& fieldset': {
                            borderColor: '#C41E3A',
                            borderWidth: 2,
                            boxShadow: '0 0 0 3px rgba(196, 30, 58, 0.1)',
                          },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#C41E3A',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 4,
                      mb: 3,
                      py: 1.8,
                      backgroundColor: '#C41E3A',
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 8px 16px rgba(196, 30, 58, 0.3)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        backgroundColor: '#A0172E',
                        boxShadow: '0 12px 24px rgba(196, 30, 58, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                        transform: 'none',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        transition: 'left 0.5s',
                      },
                      '&:hover::before': {
                        left: '100%',
                      },
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Login'
                    )}
                  </Button>
                  
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Link
                      component={RouterLink}
                      to="/register"
                      variant="body2"
                      sx={{
                        color: '#C41E3A',
                        textDecoration: 'none',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#A0172E',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      Don't have an account? Sign up
                    </Link>
                  </Box>
                  
                  <Box sx={{ 
                    textAlign: 'center', 
                    mt: 4, 
                    pt: 3, 
                    borderTop: '1px solid rgba(196, 30, 58, 0.2)',
                  }}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Link
                        to="/forgot-password"
                        variant="body2"
                        sx={{
                          color: '#666',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: '#C41E3A',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        Forgot password?
                      </Link>
                      <Typography sx={{ color: '#666' }}>|</Typography>
                      <Link
                        to="/register"
                        variant="body2"
                        sx={{
                          color: '#666',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: '#C41E3A',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        Don't have an account? Sign up
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Slide>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;