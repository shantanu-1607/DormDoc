// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Authentication (using Clerk, so these are not needed for frontend)
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/user',
  },
  
  // Student endpoints
  STUDENT: {
    APPOINTMENTS: '/api/student/appointments',
    PRESCRIPTIONS: '/api/student/prescriptions',
    PROFILE: '/api/student/profile',
  },
  
  // Admin endpoints
  ADMIN: {
    DOCTORS: '/api/admin/doctors',
    AMBULANCES: '/api/admin/ambulances',
    ANALYTICS: '/api/admin/analytics',
  },
  
  // General endpoints
  GENERAL: {
    HEALTH: '/api/health',
  }
};

export default API_BASE_URL;
