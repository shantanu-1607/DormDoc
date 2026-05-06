import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

const TestPage = () => {
  const testEnvironment = () => {
    console.log('=== ENVIRONMENT TEST ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_CLERK_PUBLISHABLE_KEY:', process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('PUBLIC_URL:', process.env.PUBLIC_URL);
    console.log('========================');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          College Dispensary System
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
          Deployment Test Page
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          If you can see this page, your React application is working correctly!
        </Typography>
        
        <Button
          variant="contained"
          onClick={testEnvironment}
          sx={{ mb: 2 }}
        >
          Test Environment Variables
        </Button>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}<br/>
            <strong>Clerk Key:</strong> {process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}<br/>
            <strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'Not set'}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Check the browser console for detailed environment information.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TestPage;
