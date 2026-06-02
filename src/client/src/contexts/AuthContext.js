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

// Drop any persisted "view as" preview so a fresh sign-in / sign-out always
// starts on the real account's panel instead of a stale previewed role.
const clearViewAsPreview = () => {
  try {
    window.localStorage.removeItem('dormdoc.viewAsRole');
    window.dispatchEvent(new Event('dormdoc:viewAsChange'));
  } catch (_) {
    /* localStorage unavailable — nothing to clear */
  }
};

// Forward the active "view as" preview role (set by the panel switcher and
// persisted in localStorage) on every request. The server uses it to serve the
// previewed role's data for admins/HODs; absent it, requests behave normally.
axios.interceptors.request.use((config) => {
  try {
    const viewAs = window.localStorage.getItem('dormdoc.viewAsRole');
    if (viewAs) {
      config.headers = config.headers || {};
      config.headers['X-View-As'] = viewAs;
    } else if (config.headers && config.headers['X-View-As']) {
      delete config.headers['X-View-As'];
    }
  } catch (_) {
    /* localStorage unavailable — skip preview header */
  }
  return config;
});

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

  // Email + password sign-in. Supabase stores the bcrypt hash in
  // auth.users.encrypted_password — there's no need for our own column.
  const signInWithPassword = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      clearViewAsPreview();
      toast.success('Signed in!');
      return { success: true, data };
    } catch (error) {
      const message = error?.message || 'Invalid email or password';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Email + password sign-up. If the project requires email confirmation,
  // the user has to click a link before they can sign in.
  const signUpWithPassword = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      const needsConfirmation = !data.session;
      if (needsConfirmation) {
        toast.info('Check your inbox to confirm your email.');
      } else {
        toast.success('Account created!');
      }
      return { success: true, needsConfirmation, data };
    } catch (error) {
      const message = error?.message || 'Sign-up failed';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Trigger a password-reset email with a magic link back to /reset-password.
  const requestPasswordReset = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      const message = error?.message || 'Could not send reset email';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Verify a 6-digit recovery code coming from the password-reset email.
  // On success Supabase puts the user in a recovery session — we can call
  // updatePassword right after to set the new password without ever logging
  // the user in fully.
  const verifyRecoveryOtp = useCallback(async (email, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      const message = error?.message || 'Invalid or expired code';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Set a new password — used after the recovery code has been verified, or
  // on the /reset-password landing page after the magic link puts the user
  // in a recovery session.
  const updatePassword = useCallback(async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated');
      return { success: true };
    } catch (error) {
      const message = error?.message || 'Password update failed';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

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
    clearViewAsPreview();
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
    signInWithPassword,
    signUpWithPassword,
    requestPasswordReset,
    verifyRecoveryOtp,
    updatePassword,
    signInWithOtp,
    verifyOtp,
    logout,
    updateProfile,
    getUserQRCode,
    regenerateQRCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
