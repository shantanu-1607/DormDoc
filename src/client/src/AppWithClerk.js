import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClerkAuthProvider } from './contexts/ClerkAuthContext';
import Layout from './components/Layout/Layout';
import ClerkLogin from './pages/Auth/ClerkLogin';
import ClerkRegister from './pages/Auth/ClerkRegister';
import StudentDashboard from './pages/Student/StudentDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Profile from './pages/Profile/Profile';
import Appointments from './pages/Student/Appointments';
import BookAppointment from './pages/Student/BookAppointment';
import EmergencySOS from './pages/Student/EmergencySOS';
import AmbulanceBooking from './pages/Student/AmbulanceBooking';
import Prescriptions from './pages/Student/Prescriptions';
import Chatbot from './pages/Student/Chatbot';
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
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function AppWithClerk() {
  if (!clerkPubKey) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <div>Missing Clerk publishable key. Please set REACT_APP_CLERK_PUBLISHABLE_KEY in your environment.</div>
      </Box>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ClerkAuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<ClerkLogin />} />
            <Route path="/register" element={<ClerkRegister />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <>
                  <SignedIn>
                    <Layout>
                      <Routes>
                        {/* Student Routes */}
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <StudentDashboard />
                            </ProtectedRoute>
                          }
                        />
                        
                        {/* Student-specific routes */}
                        <Route
                          path="/appointments"
                          element={
                            <ProtectedRoute>
                              <Appointments />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/book-appointment"
                          element={
                            <ProtectedRoute>
                              <BookAppointment />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/emergency-sos"
                          element={
                            <ProtectedRoute>
                              <EmergencySOS />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ambulance-booking"
                          element={
                            <ProtectedRoute>
                              <AmbulanceBooking />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/prescriptions"
                          element={
                            <ProtectedRoute>
                              <PrescriptionManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/leave-application"
                          element={
                            <ProtectedRoute>
                              <LeaveApplication />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/chatbot"
                          element={
                            <ProtectedRoute>
                              <Chatbot />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin-specific routes */}
                        <Route
                          path="/doctors"
                          element={
                            <ProtectedRoute>
                              <DoctorManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ambulances"
                          element={
                            <ProtectedRoute>
                              <AmbulanceManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/queue"
                          element={
                            <ProtectedRoute>
                              <QueueManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/analytics"
                          element={
                            <ProtectedRoute>
                              <Analytics />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin-prescriptions"
                          element={
                            <ProtectedRoute>
                              <AdminPrescriptionManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/inventory"
                          element={
                            <ProtectedRoute>
                              <InventoryManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ambulance-tracking"
                          element={
                            <ProtectedRoute>
                              <AmbulanceTracking />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/leave-requests"
                          element={
                            <ProtectedRoute>
                              <LeaveRequests />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/qr-scanner"
                          element={
                            <ProtectedRoute>
                              <QRScanner />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/login-info"
                          element={
                            <ProtectedRoute>
                              <LoginInfo />
                            </ProtectedRoute>
                          }
                        />

                        {/* Doctor-specific routes */}
                        <Route
                          path="/doctor-dashboard"
                          element={
                            <ProtectedRoute>
                              <DoctorDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/patient-chat"
                          element={
                            <ProtectedRoute>
                              <PatientChat />
                            </ProtectedRoute>
                          }
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </Layout>
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
          </Routes>
        </ClerkAuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default AppWithClerk;
