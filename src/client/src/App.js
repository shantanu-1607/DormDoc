import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { Box, CircularProgress, Typography } from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';

import { ClerkAuthProvider } from './contexts/ClerkAuthContext';
import Layout from './components/Layout/Layout';
import DashboardRouter from './components/DashboardRouter';
import LocationGate from './components/LocationGate';
import ClerkLogin from './pages/Auth/ClerkLogin';
import ClerkRegister from './pages/Auth/ClerkRegister';
import TestPage from './TestPage';
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
import Onboarding from './pages/Auth/Onboarding';
import RoleRoute from './components/Auth/RoleRoute';
import LeaveApprovals from './pages/HOD/LeaveApprovals';
import DepartmentAnalytics from './pages/HOD/DepartmentAnalytics';
import DepartmentStudents from './pages/HOD/DepartmentStudents';
import ActiveCases from './pages/HOD/ActiveCases';
import DepartmentReports from './pages/HOD/DepartmentReports';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Get Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_Zmx1ZW50LXN3YW4tNjYuY2xlcmsuYWNjb3VudHMuZGV2JA';

// Debug environment variables
console.log('Environment check:');
console.log('REACT_APP_CLERK_PUBLISHABLE_KEY:', clerkPubKey);
console.log('All env vars:', process.env);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PUBLIC_URL:', process.env.PUBLIC_URL);

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

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
        <Typography variant="h6">Loading College Dispensary System...</Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we initialize the application
        </Typography>
      </Box>
    );
  }

  if (!clerkPubKey) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2>Missing Clerk Publishable Key</h2>
          <p>Please set REACT_APP_CLERK_PUBLISHABLE_KEY in your environment variables.</p>
          <p>Current value: {clerkPubKey || 'undefined'}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h4>Debug Info:</h4>
          <p>REACT_APP_CLERK_PUBLISHABLE_KEY: {process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}</p>
          <p>REACT_APP_API_URL: {process.env.REACT_APP_API_URL}</p>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
        </div>
      </div>
    );
  }

  // Temporary diagnostic - show test page if Clerk key is missing
  if (!process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || process.env.REACT_APP_CLERK_PUBLISHABLE_KEY === 'undefined') {
    return <TestPage />;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ClerkAuthProvider>
          <Router>
            <LocationGate>
            <Routes>
              {/* Public Root Route - Always show the role selection/login first */}
              <Route path="/" element={<ClerkLogin />} />
              <Route path="/login" element={<ClerkLogin />} />
              <Route path="/register" element={<ClerkRegister />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <>
                    <SignedIn>
                      <Layout>
                        <Routes>
                          {/* Dynamic Dashboard Route */}
                          <Route path="dashboard" element={<DashboardRouter />} />
                          <Route index element={<Navigate to="dashboard" replace />} />
                          
                          {/* Student Routes */}
                          <Route path="appointments" element={<Appointments />} />
                          <Route path="book-appointment" element={<BookAppointment />} />
                          <Route path="emergency-sos" element={<EmergencySOS />} />
                          <Route path="ambulance-booking" element={<AmbulanceBooking />} />
                          <Route path="prescriptions" element={<PrescriptionManagement />} />
                          <Route path="leave-application" element={<LeaveApplication />} />
                          <Route path="chatbot" element={<ChatbotPage />} />
                          
                          {/* Admin Routes */}
                          <Route path="doctors" element={<DoctorManagement />} />
                          <Route path="ambulances" element={<AmbulanceManagement />} />
                          <Route path="queue" element={<QueueManagement />} />
                          <Route path="analytics" element={<Analytics />} />
                          <Route path="admin-prescriptions" element={<AdminPrescriptionManagement />} />
                          <Route path="inventory" element={<InventoryManagement />} />
                          <Route path="ambulance-tracking" element={<AmbulanceTracking />} />
                          <Route path="leave-requests" element={<LeaveRequests />} />
                          <Route path="qr-scanner" element={<QRScanner />} />
                          <Route path="login-info" element={<LoginInfo />} />
                          
                          {/* Doctor Routes */}
                          <Route path="doctor-dashboard" element={<DoctorDashboard />} />
                          <Route path="patient-chat" element={<PatientChat />} />

                          {/* HOD Routes — protected by RoleRoute */}
                          <Route
                            path="hod/leave-approvals"
                            element={
                              <RoleRoute roles={['hod']}>
                                <LeaveApprovals />
                              </RoleRoute>
                            }
                          />
                          <Route
                            path="hod/analytics"
                            element={
                              <RoleRoute roles={['hod']}>
                                <DepartmentAnalytics />
                              </RoleRoute>
                            }
                          />
                          <Route
                            path="hod/students"
                            element={
                              <RoleRoute roles={['hod']}>
                                <DepartmentStudents />
                              </RoleRoute>
                            }
                          />
                          <Route
                            path="hod/active-cases"
                            element={
                              <RoleRoute roles={['hod']}>
                                <ActiveCases />
                              </RoleRoute>
                            }
                          />
                          <Route
                            path="hod/reports"
                            element={
                              <RoleRoute roles={['hod']}>
                                <DepartmentReports />
                              </RoleRoute>
                            }
                          />

                          {/* Profile Route */}
                          <Route path="profile" element={<Profile />} />
                        </Routes>
                      </Layout>
                    </SignedIn>
                    <SignedOut>
                      <Navigate to="/login" replace />
                    </SignedOut>
                  </>
                }
              />
            </Routes>
            </LocationGate>
            <ChatbotComponent />
            <ToastContainer />
          </Router>
        </ClerkAuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;