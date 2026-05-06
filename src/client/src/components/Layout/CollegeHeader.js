import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Chip,
  Container,
} from '@mui/material';
import {
  LocalHospital,
  School,
  LocationOn,
} from '@mui/icons-material';

const CollegeHeader = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#1e3a8a', boxShadow: 3 }}>
      <Container maxWidth="xl">
        <Toolbar>
          {/* College Logo/Emblem */}
          <Box display="flex" alignItems="center" mr={3}>
            <Avatar
              src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Birla_Institute_of_Technology%2C_Mesra_Logo.svg/1200px-Birla_Institute_of_Technology%2C_Mesra_Logo.svg.png"
              alt="BIT Mesra Emblem"
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'white',
                mr: 2,
                border: '2px solid #fbbf24',
                p: 0.5,
              }}
            />
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 1.2,
                }}
              >
                BIRLA INSTITUTE OF TECHNOLOGY, MESRA
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#fbbf24',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}
              >
                RANCHI, JHARKHAND
              </Typography>
            </Box>
          </Box>

          {/* Divider */}
          <Box
            sx={{
              width: '2px',
              height: '40px',
              bgcolor: 'rgba(255,255,255,0.3)',
              mx: 2,
            }}
          />

          {/* Dispensary Info */}
          <Box display="flex" alignItems="center" flexGrow={1}>
            <LocalHospital sx={{ mr: 1, color: '#fbbf24' }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 1.2,
                }}
              >
                COLLEGE DISPENSARY
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.85rem',
                }}
              >
                Medical Services & Health Care
              </Typography>
            </Box>
          </Box>

          {/* Location & Status */}
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<LocationOn />}
              label="BIT Mesra Campus"
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
            <Chip
              label="24/7 Emergency"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default CollegeHeader;
