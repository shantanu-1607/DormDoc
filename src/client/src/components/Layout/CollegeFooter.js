import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  LocalHospital,
  School,
  Security,
  HealthAndSafety,
} from '@mui/icons-material';

const CollegeFooter = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1e3a8a',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* College Information */}
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <School sx={{ mr: 1, color: '#fbbf24', fontSize: 30 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fbbf24' }}>
                BIT MESRA
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
              Birla Institute of Technology, Mesra is a premier engineering institute 
              committed to excellence in education, research, and innovation.
            </Typography>
            <Box display="flex" gap={1}>
              <IconButton sx={{ color: '#fbbf24' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: '#fbbf24' }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: '#fbbf24' }}>
                <LinkedIn />
              </IconButton>
              <IconButton sx={{ color: '#fbbf24' }}>
                <Instagram />
              </IconButton>
            </Box>
          </Grid>

          {/* Dispensary Information */}
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <LocalHospital sx={{ mr: 1, color: '#fbbf24', fontSize: 30 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fbbf24' }}>
                COLLEGE DISPENSARY
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
              Providing comprehensive medical services to the BIT Mesra community 
              with modern facilities and experienced healthcare professionals.
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip
                label="24/7 Emergency"
                size="small"
                sx={{ bgcolor: '#ef4444', color: 'white' }}
              />
              <Chip
                label="Appointment Booking"
                size="small"
                sx={{ bgcolor: '#10b981', color: 'white' }}
              />
              <Chip
                label="Online Consultation"
                size="small"
                sx={{ bgcolor: '#3b82f6', color: 'white' }}
              />
            </Box>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fbbf24', mb: 2 }}>
              Contact Information
            </Typography>
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn sx={{ mr: 1, color: '#fbbf24', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Birla Institute of Technology, Mesra<br />
                  Ranchi, Jharkhand - 835215
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Phone sx={{ mr: 1, color: '#fbbf24', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  +91-651-2275444 (Main)<br />
                  +91-651-2275445 (Dispensary)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Email sx={{ mr: 1, color: '#fbbf24', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  dispensary@bitmesra.ac.in<br />
                  medical@bitmesra.ac.in
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.2)' }} />

        {/* Quick Links */}
        <Grid container spacing={4} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fbbf24', mb: 1 }}>
              Quick Links
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Book Appointment
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Emergency SOS
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                My Prescriptions
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Health Records
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fbbf24', mb: 1 }}>
              Services
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                General Consultation
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Emergency Care
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Prescription Management
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Health Checkups
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fbbf24', mb: 1 }}>
              Resources
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Health Guidelines
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Emergency Procedures
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Medical Policies
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                Contact Directory
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fbbf24', mb: 1 }}>
              Emergency
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                🚨 Emergency: 100
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                🏥 Ambulance: 108
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                🆘 Campus Security: 101
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                📞 Dispensary: 102
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />

        {/* Bottom Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © 2024 Birla Institute of Technology, Mesra. All rights reserved.
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Security sx={{ fontSize: 16, color: '#fbbf24' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Secure & Confidential
            </Typography>
            <HealthAndSafety sx={{ fontSize: 16, color: '#fbbf24' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              HIPAA Compliant
            </Typography>
          </Box>
        </Box>

        {/* Additional Information */}
        <Box mt={2} p={2} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
            <strong>BIT Mesra College Dispensary</strong> - Committed to providing quality healthcare services 
            to our students, faculty, and staff. Your health and well-being are our top priority.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default CollegeFooter;
