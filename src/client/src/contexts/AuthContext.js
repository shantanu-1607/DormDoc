import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useDevBypass } from './DevBypassContext';
import QRService from '../services/qrService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const applyAccessToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const AuthProvider = ({ children }) => {
  const { active: bypassActive, mockUser } = useDevBypass();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const hydrateProfile = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me');
      const u = res.data?.user || null;
      setUser(u);
      // Students need onboarding until their students row is filled.
      // Mark on absence of department (the trigger only sets profiles row).
      if (u?.role === 'student' && !u.department) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
      return u;
    } catch (err) {
      console.error('Profile hydrate failed:', err);
      setUser(null);
      return null;
    }
  }, []);

  // Session bootstrap + subscription.
  useEffect(() => {
    let sub;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      const initial = data?.session || null;
      setSession(initial);
      applyAccessToken(initial?.access_token);
      if (initial) await hydrateProfile();
      setLoading(false);

      sub = supabase.auth.onAuthStateChange(async (_event, next) => {
        setSession(next);
        applyAccessToken(next?.access_token);
        if (next) {
          await hydrateProfile();
        } else {
          setUser(null);
          setNeedsOnboarding(false);
        }
      });
    };

    bootstrap();
    return () => sub?.data?.subscription?.unsubscribe();
  }, [hydrateProfile]);

  // Send a 6-digit OTP to the email. `shouldCreateUser: true` makes the same
  // endpoint serve both signup and login — Supabase decides based on whether
  // the email already exists in auth.users.
  const signInWithOtp = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      const message = error?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Verify the 6-digit code. On success, onAuthStateChange fires and hydrates
  // the profile. We don't navigate here — callers decide.
  const verifyOtp = useCallback(async (email, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;

      // Best-effort QR code generation; non-fatal.
      try {
        const profile = await hydrateProfile();
        if (profile) {
          const qr = await QRService.generateQRCodeDataURL(profile);
          if (qr) {
            await QRService.saveQRCodeToServer(profile, qr);
            localStorage.setItem('userQRCode', qr);
          }
        }
      } catch (qrError) {
        console.warn('QR generation failed:', qrError);
      }

      toast.success('Signed in!');
      return { success: true, data };
    } catch (error) {
      const message = error?.message || 'Invalid or expired code';
      toast.error(message);
      return { success: false, message };
    }
  }, [hydrateProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userQRCode');
    setUser(null);
    setSession(null);
    setNeedsOnboarding(false);
    toast.success('Logged out');
  }, []);

  const updateProfile = useCallback(async (patch) => {
    try {
      const res = await axios.put('/api/auth/profile', patch);
      // Re-hydrate so role-specific fields stay attached.
      await hydrateProfile();
      toast.success('Profile updated');
      return { success: true, user: res.data?.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  }, [hydrateProfile]);

  const getUserQRCode = useCallback(async () => {
    if (!user) return null;
    const cached = localStorage.getItem('userQRCode');
    if (cached) return cached;
    const qr = await QRService.generateQRCodeDataURL(user);
    if (qr) localStorage.setItem('userQRCode', qr);
    return qr;
  }, [user]);

  const regenerateQRCode = useCallback(async () => {
    if (!user) return null;
    const qr = await QRService.generateQRCodeDataURL(user);
    if (qr) {
      await QRService.saveQRCodeToServer(user, qr);
      localStorage.setItem('userQRCode', qr);
      toast.success('QR code regenerated');
    }
    return qr;
  }, [user]);

  // Resolved user: dev-bypass mock overrides the real session for local UI work.
  const resolvedUser = bypassActive && mockUser ? mockUser : user;

  const value = {
    session,
    user: resolvedUser,
    mongoUser: resolvedUser, // legacy alias used by some pages
    setMongoUser: () => {},  // legacy no-op
    loading,
    needsOnboarding,
    setNeedsOnboarding,
    signInWithOtp,
    verifyOtp,
    logout,
    updateProfile,
    getUserQRCode,
    regenerateQRCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
