import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useClerkAuth } from '../../contexts/ClerkAuthContext';

/**
 * RoleRoute — client-side route guard.
 *
 * Renders children only when the authenticated user's role is included in
 * the `roles` array. Any other role is redirected to /dashboard.
 *
 * NOTE: this is a UX guard only. Real authorization is enforced server-side
 * by requireRole(['hod']) + scopeToDepartment middleware on every /api/hod/* route.
 *
 * Usage:
 *   <RoleRoute roles={['hod']}>
 *     <LeaveApprovals />
 *   </RoleRoute>
 */
const RoleRoute = ({ roles, children }) => {
  const { user, loading } = useClerkAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: '#1e3a8a' }} />
      </Box>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
