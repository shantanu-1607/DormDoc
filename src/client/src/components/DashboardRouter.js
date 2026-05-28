import React from 'react';

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useViewAs, ROLES_ALLOWED_TO_SWITCH } from '../contexts/ViewAsContext';
import StudentDashboard from '../pages/Student/StudentDashboard';
import DoctorDashboard from '../pages/Doctor/DoctorDashboard';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import HodDashboard from '../pages/HOD/HodDashboard';
import ParentDashboard from '../pages/Parent/ParentDashboard';

const DASHBOARDS = {
  student: StudentDashboard,
  doctor: DoctorDashboard,
  admin: AdminDashboard,
  hod: HodDashboard,
  parent: ParentDashboard,
};

const DashboardRouter = () => {
  const { user, needsOnboarding } = useAuth();
  const { viewAsRole } = useViewAs();

  if (!user) return <Navigate to="/login" />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  const canPreview = ROLES_ALLOWED_TO_SWITCH.has(user.role);
  const effectiveRole = canPreview && viewAsRole ? viewAsRole : user.role;

  const Component = DASHBOARDS[effectiveRole] || StudentDashboard;
  return <Component />;
};

export default DashboardRouter;
