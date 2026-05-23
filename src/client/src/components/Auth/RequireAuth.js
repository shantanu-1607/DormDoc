import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useDevBypass } from '../../contexts/DevBypassContext';

const RequireAuth = ({ children }) => {
  const { session, loading } = useAuth();
  const { active: bypassActive } = useDevBypass();

  if (bypassActive) return <>{children}</>;

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default RequireAuth;
