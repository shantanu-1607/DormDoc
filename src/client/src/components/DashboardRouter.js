import React from 'react';

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from '../pages/Student/StudentDashboard';
import DoctorDashboard from '../pages/Doctor/DoctorDashboard';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import HodDashboard from '../pages/HOD/HodDashboard';
import ParentDashboard from '../pages/Parent/ParentDashboard';

const DashboardRouter = () => {
  const { user, needsOnboarding } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'admin':
      return <AdminDashboard />; 
    case 'hod':
      return <HodDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <StudentDashboard />;
  }
};

export default DashboardRouter;
