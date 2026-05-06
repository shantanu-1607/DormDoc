import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import QRService from '../services/qrService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      // Generate QR code after successful login
      try {
        const qrCodeDataURL = await QRService.generateQRCodeDataURL(userData);
        if (qrCodeDataURL) {
          // Save QR code to server
          await QRService.saveQRCodeToServer(userData, qrCodeDataURL);
          // Store QR code in localStorage for quick access
          localStorage.setItem('userQRCode', qrCodeDataURL);
        }
      } catch (qrError) {
        console.warn('QR code generation failed:', qrError);
        // Don't fail login if QR generation fails
      }
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(newUser);
      
      // Generate QR code after successful registration
      try {
        const qrCodeDataURL = await QRService.generateQRCodeDataURL(newUser);
        if (qrCodeDataURL) {
          // Save QR code to server
          await QRService.saveQRCodeToServer(newUser, qrCodeDataURL);
          // Store QR code in localStorage for quick access
          localStorage.setItem('userQRCode', qrCodeDataURL);
        }
      } catch (qrError) {
        console.warn('QR code generation failed:', qrError);
        // Don't fail registration if QR generation fails
      }
      
      toast.success('Registration successful! Your unique QR code has been generated.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userQRCode');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const getUserQRCode = async () => {
    try {
      if (!user) return null;
      
      // First try to get from localStorage
      const cachedQR = localStorage.getItem('userQRCode');
      if (cachedQR) return cachedQR;
      
      // If not in cache, generate new one
      const qrCodeDataURL = await QRService.generateQRCodeDataURL(user);
      if (qrCodeDataURL) {
        localStorage.setItem('userQRCode', qrCodeDataURL);
        return qrCodeDataURL;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user QR code:', error);
      return null;
    }
  };

  const regenerateQRCode = async () => {
    try {
      if (!user) return null;
      
      const qrCodeDataURL = await QRService.generateQRCodeDataURL(user);
      if (qrCodeDataURL) {
        await QRService.saveQRCodeToServer(user, qrCodeDataURL);
        localStorage.setItem('userQRCode', qrCodeDataURL);
        toast.success('QR code regenerated successfully!');
        return qrCodeDataURL;
      }
      
      return null;
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error('Failed to regenerate QR code');
      return null;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getUserQRCode,
    regenerateQRCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
