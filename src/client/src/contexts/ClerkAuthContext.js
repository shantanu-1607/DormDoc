import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';

const ClerkAuthContext = createContext();

export const useClerkAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (!context) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};

export const ClerkAuthProvider = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoaded && authLoaded) {
      setLoading(false);
    }
  }, [userLoaded, authLoaded]);

  const login = async (email, password) => {
    // Clerk handles login automatically
    // This is just for compatibility with existing code
    return { success: true };
  };

  const register = async (userData) => {
    // Clerk handles registration automatically
    // This is just for compatibility with existing code
    return { success: true };
  };

  const logout = async () => {
    try {
      await signOut();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (user) {
        await user.update(profileData);
        return { success: true };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      // Clerk handles password changes
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  };

  const getUserQRCode = () => {
    // Generate QR code for Clerk user
    if (user) {
      const qrData = {
        id: user.id,
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        role: user.publicMetadata?.role || 'student',
        studentId: user.publicMetadata?.studentId,
        department: user.publicMetadata?.department,
        year: user.publicMetadata?.year,
        phone: user.publicMetadata?.phone,
        bloodGroup: user.publicMetadata?.bloodGroup,
        emergencyContact: user.publicMetadata?.emergencyContact,
        timestamp: new Date().toISOString(),
        type: 'user_id',
        version: '1.0',
      };
      
      // Store in localStorage for compatibility
      localStorage.setItem('userQRCode', JSON.stringify(qrData));
      return qrData;
    }
    return null;
  };

  const regenerateQRCode = async () => {
    // Clerk doesn't need QR code regeneration
    return { success: true };
  };

  const value = {
    user: user ? {
      _id: user.id,
      name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
      role: user.publicMetadata?.role || 'student',
      studentId: user.publicMetadata?.studentId,
      department: user.publicMetadata?.department,
      year: user.publicMetadata?.year,
      phone: user.publicMetadata?.phone,
      bloodGroup: user.publicMetadata?.bloodGroup,
      emergencyContact: user.publicMetadata?.emergencyContact,
      lastLogin: user.lastSignInAt,
      loginCount: user.signInCount,
    } : null,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getUserQRCode,
    regenerateQRCode,
    isSignedIn,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};
