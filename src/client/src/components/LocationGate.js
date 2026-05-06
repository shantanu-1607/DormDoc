import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { LocationOff, LocationOn, ErrorOutline } from '@mui/icons-material';

// BIT Mesra Coordinates
const BIT_LAT = 23.4123;
const BIT_LNG = 85.4399;
const MAX_ALLOWED_DISTANCE_KM = 5; // 5 km radius

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const LocationGate = ({ children }) => {
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'allowed', 'blocked', 'error', 'prompt'
  const [distance, setDistance] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const checkLocation = () => {
    setLocationStatus('checking');
    
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const dist = calculateDistance(userLat, userLng, BIT_LAT, BIT_LNG);
        setDistance(dist.toFixed(2));

        if (dist <= MAX_ALLOWED_DISTANCE_KM) {
          setLocationStatus('allowed');
        } else {
          setLocationStatus('blocked');
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Location access was denied. We need your location to verify you are on campus.');
          setLocationStatus('prompt');
        } else {
          setErrorMsg('Failed to retrieve your location. Please ensure GPS is enabled.');
          setLocationStatus('error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    checkLocation();
  }, []);

  if (locationStatus === 'allowed') {
    return children;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A365D 0%, #0F172A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Paper
        elevation={24}
        sx={{
          maxWidth: 500,
          p: 5,
          textAlign: 'center',
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <img src="/assets/bit_logo.png" alt="BIT Mesra" style={{ width: 80, height: 80 }} />
        </Box>

        {locationStatus === 'checking' && (
          <>
            <CircularProgress sx={{ mb: 3, color: '#C41E3A' }} />
            <Typography variant="h5" gutterBottom color="#1A365D" fontWeight="bold">
              Verifying Location...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we confirm you are near the BIT Mesra campus.
            </Typography>
          </>
        )}

        {locationStatus === 'blocked' && (
          <>
            <LocationOff sx={{ fontSize: 60, color: '#C41E3A', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="#C41E3A" fontWeight="bold">
              Access Denied
            </Typography>
            <Typography variant="body1" paragraph>
              You are currently <strong>{distance} km</strong> away from the BIT Mesra campus.
            </Typography>
            <Typography color="text.secondary" paragraph>
              The DormDoc portal is geofenced and can only be accessed by students who are within a {MAX_ALLOWED_DISTANCE_KM} km radius of the college campus.
            </Typography>
            <Button variant="contained" onClick={checkLocation} sx={{ mt: 2, bgcolor: '#1A365D' }}>
              Re-check Location
            </Button>
          </>
        )}

        {(locationStatus === 'error' || locationStatus === 'prompt') && (
          <>
            <ErrorOutline sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="#1A365D" fontWeight="bold">
              Location Required
            </Typography>
            <Typography color="error" paragraph>
              {errorMsg}
            </Typography>
            <Typography color="text.secondary" paragraph>
              Please allow location permissions in your browser settings to access the portal.
            </Typography>
            <Button 
              variant="contained" 
              onClick={checkLocation} 
              sx={{ mt: 2, bgcolor: '#1A365D' }}
              startIcon={<LocationOn />}
            >
              Grant Permission & Retry
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LocationGate;
