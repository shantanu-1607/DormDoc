import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { LocationOff, LocationOn, ErrorOutline, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [locationStatus, setLocationStatus] = useState('initial'); // 'initial', 'checking', 'allowed', 'blocked', 'error', 'prompt'
  const [distance, setDistance] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminBypass = () => {
    // Only allow bypass if the user has an admin/doctor role, or if they just want to force it during dev.
    console.warn("ADMIN BYPASS ENGAGED: Geolocation checks disabled.");
    setLocationStatus('allowed');
  };

  const checkIpLocation = async () => {
    setLocationStatus('checking');
    try {
      // Use ipapi.co to get location from IP address
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const dist = calculateDistance(data.latitude, data.longitude, BIT_LAT, BIT_LNG);
        setDistance(dist.toFixed(2));
        
        // Note: IP location is less accurate. We might need to be more lenient here.
        // If they are in Ranchi (dist < 50km maybe?), we can allow it. For now, stick to threshold.
        if (dist <= MAX_ALLOWED_DISTANCE_KM * 10) { // Increased threshold for IP inaccuracy
          setLocationStatus('allowed');
        } else {
          setErrorMsg(`IP Location shows you are ${dist.toFixed(2)} km away.`);
          setLocationStatus('blocked');
        }
      } else {
        throw new Error("Invalid IP location data");
      }
    } catch (error) {
      console.error("IP Geolocation failed:", error);
      setErrorMsg('Failed to determine location via IP Address.');
      setLocationStatus('error');
    }
  };

  const checkLocation = () => {
    setLocationStatus('checking');
    
    if (!navigator.geolocation) {
      // Fallback directly to IP if geolocation API is completely unsupported
      checkIpLocation();
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
        // If user denies permission, automatically fallback to IP tracking
        console.log("Browser location denied. Falling back to IP tracking...");
        checkIpLocation();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Auto-bypass for system administrators or doctors
    if (user?.role && user.role !== 'student') {
      console.log("Admin role detected. Bypassing geofence.");
      setLocationStatus('allowed');
    }
  }, [user]);

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
        p: 3,
        position: 'relative'
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

        {locationStatus === 'initial' && (
          <>
            <LocationOn sx={{ fontSize: 60, color: '#1A365D', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="#1A365D" fontWeight="bold">
              Campus Verification Required
            </Typography>
            <Typography color="text.secondary" paragraph>
              To access the DormDoc portal, we need to verify that you are currently within the BIT Mesra campus boundaries.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={checkLocation} 
                sx={{ bgcolor: '#C41E3A', '&:hover': { bgcolor: '#8B0000' } }}
                size="large"
              >
                Verify My Location
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleAdminBypass} 
                sx={{ color: '#1A365D', borderColor: '#1A365D', '&:hover': { borderColor: '#0F172A', bgcolor: 'rgba(26, 54, 93, 0.05)' } }}
                size="large"
                startIcon={<AdminPanelSettings />}
              >
                Bypass Verification (Admin/Dev)
              </Button>
            </Box>
          </>
        )}

        {locationStatus === 'checking' && (
          <>
            <CircularProgress sx={{ mb: 3, color: '#C41E3A' }} />
            <Typography variant="h5" gutterBottom color="#1A365D" fontWeight="bold">
              Verifying Location...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we confirm you are near the BIT Mesra campus. Make sure to click "Allow" if your browser prompts you.
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
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button variant="contained" onClick={checkLocation} sx={{ bgcolor: '#1A365D' }}>
                Re-check Location
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleAdminBypass} 
                sx={{ color: '#1A365D', borderColor: '#1A365D' }}
              >
                Bypass
              </Button>
            </Box>
          </>
        )}

        {(locationStatus === 'error' || locationStatus === 'prompt') && (
          <>
            <ErrorOutline sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="#1A365D" fontWeight="bold">
              Location Blocked
            </Typography>
            <Typography color="error" paragraph fontWeight="bold">
              {errorMsg}
            </Typography>
            <Typography color="text.secondary" paragraph sx={{ fontSize: '0.9rem', textAlign: 'left', bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
              <strong>How to fix this:</strong><br/>
              1. Look at your browser's address bar.<br/>
              2. Click the settings/lock icon or the crossed-out location icon.<br/>
              3. Change Location permission to "Allow".<br/>
              4. Refresh this page and try again.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={checkLocation} 
                sx={{ bgcolor: '#1A365D' }}
                startIcon={<LocationOn />}
              >
                I have enabled it, Retry
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleAdminBypass} 
                sx={{ color: '#1A365D', borderColor: '#1A365D' }}
                startIcon={<AdminPanelSettings />}
              >
                Bypass (Admin/Dev)
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LocationGate;
