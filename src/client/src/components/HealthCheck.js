import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

const HealthCheck = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple health check - just check if the app is running
    const checkHealth = async () => {
      try {
        // Simulate a health check
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('healthy');
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    };

    checkHealth();
  }, []);

  if (status === 'checking') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">Loading College Dispensary System...</Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we initialize the application
        </Typography>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
        p={3}
      >
        <Error color="error" sx={{ fontSize: 60 }} />
        <Typography variant="h6" color="error">
          Application Error
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {error || 'An unexpected error occurred. Please try refreshing the page.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CheckCircle color="success" sx={{ fontSize: 60 }} />
      <Typography variant="h6" color="success.main">
        System Ready
      </Typography>
      <Typography variant="body2" color="text.secondary">
        College Dispensary Management System is running properly
      </Typography>
    </Box>
  );
};

export default HealthCheck;
