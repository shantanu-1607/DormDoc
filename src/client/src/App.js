import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { Box, CircularProgress, Typography } from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { DevBypassProvider } from './contexts/DevBypassContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { ViewAsProvider } from './contexts/ViewAsContext';
import RequireAuth from './components/Auth/RequireAuth';
import DevBypassBanner from './components/DevBypassBanner';
import Layout from './components/Layout/Layout';
import DashboardRouter from './components/DashboardRouter';
import LocationGate from './components/LocationGate';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Onboarding from './pages/Auth/Onboarding';
import Profile from './pages/Profile/Profile';
import Appointments from './pages/Student/Appointments';
import BookAppointment from './pages/Student/BookAppointment';
import EmergencySOS from './pages/Student/EmergencySOS';
import AmbulanceBooking from './pages/Student/AmbulanceBooking';
import ChatbotPage from './pages/Student/Chatbot';
import ChatbotComponent from './components/Chatbot';
import DoctorManagement from './pages/Admin/DoctorManagement';
import AmbulanceManagement from './pages/Admin/AmbulanceManagement';
import QueueManagement from './pages/Admin/QueueManagement';
import Analytics from './pages/Admin/Analytics';
import AnalyticsDashboard from './pages/Admin/Analytics/AnalyticsDashboard';
import LeaveRequests from './pages/Admin/LeaveRequests';
import QRScanner from './pages/Admin/QRScanner';
import PrescriptionManagement from './pages/Student/PrescriptionManagement';
import LeaveApplication from './pages/Student/LeaveApplication';
import AdminPrescriptionManagement from './pages/Admin/AdminPrescriptionManagement';
import InventoryManagement from './pages/Admin/InventoryManagement';
import AmbulanceTracking from './pages/Admin/AmbulanceTracking';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import PatientChat from './pages/Doctor/PatientChat';
import LoginInfo from './pages/Admin/LoginInfo';
import RoleRoute from './components/Auth/RoleRoute';
import LeaveApprovals from './pages/HOD/LeaveApprovals';
import DepartmentAnalytics from './pages/HOD/DepartmentAnalytics';
import DepartmentStudents from './pages/HOD/DepartmentStudents';
import ActiveCases from './pages/HOD/ActiveCases';
import DepartmentReports from './pages/HOD/DepartmentReports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
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
        <Typography variant="h6">Loading DormDoc…</Typography>
      </Box>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DevBypassProvider>
        <AuthProvider>
          <ViewAsProvider>
          <RealtimeProvider>
            <Router>
              <LocationGate>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<Onboarding />} />

                  <Route
                    path="/*"
                    element={
                      <RequireAuth>
                        <Layout>
                          <Routes>
                            <Route path="dashboard" element={<DashboardRouter />} />
                            <Route index element={<Navigate to="dashboard" replace />} />

                            <Route path="appointments" element={<Appointments />} />
                            <Route path="book-appointment" element={<BookAppointment />} />
                            <Route path="emergency-sos" element={<EmergencySOS />} />
                            <Route path="ambulance-booking" element={<AmbulanceBooking />} />
                            <Route path="prescriptions" element={<PrescriptionManagement />} />
                            <Route path="leave-application" element={<LeaveApplication />} />
                            <Route path="chatbot" element={<ChatbotPage />} />

                            <Route path="doctors" element={<DoctorManagement />} />
                            <Route path="ambulances" element={<AmbulanceManagement />} />
                            <Route path="queue" element={<QueueManagement />} />
                            <Route path="analytics" element={<Analytics />} />
                            <Route path="admin-analytics" element={<AnalyticsDashboard />} />
                            <Route path="admin-prescriptions" element={<AdminPrescriptionManagement />} />
                            <Route path="inventory" element={<InventoryManagement />} />
                            <Route path="ambulance-tracking" element={<AmbulanceTracking />} />
                            <Route path="leave-requests" element={<LeaveRequests />} />
                            <Route path="qr-scanner" element={<QRScanner />} />
                            <Route path="login-info" element={<LoginInfo />} />

                            <Route path="doctor-dashboard" element={<DoctorDashboard />} />
                            <Route path="patient-chat" element={<PatientChat />} />

                            <Route
                              path="hod/leave-approvals"
                              element={<RoleRoute roles={['hod']}><LeaveApprovals /></RoleRoute>}
                            />
                            <Route
                              path="hod/analytics"
                              element={<RoleRoute roles={['hod']}><DepartmentAnalytics /></RoleRoute>}
                            />
                            <Route
                              path="hod/students"
                              element={<RoleRoute roles={['hod']}><DepartmentStudents /></RoleRoute>}
                            />
                            <Route
                              path="hod/active-cases"
                              element={<RoleRoute roles={['hod']}><ActiveCases /></RoleRoute>}
                            />
                            <Route
                              path="hod/reports"
                              element={<RoleRoute roles={['hod']}><DepartmentReports /></RoleRoute>}
                            />

                            <Route path="profile" element={<Profile />} />
                          </Routes>
                        </Layout>
                      </RequireAuth>
                    }
                  />
                </Routes>
              </LocationGate>
              <ChatbotComponent />
              <ToastContainer />
              <DevBypassBanner />
            </Router>
          </RealtimeProvider>
          </ViewAsProvider>
        </AuthProvider>
      </DevBypassProvider>
    </QueryClientProvider>
  );
}

export default App;
