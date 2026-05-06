import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Email,
  Security,
  VpnKey,
  CheckCircle,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Send,
  Refresh,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';

const ForgotPassword = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (email) => {
      const response = await axios.post('/api/auth/send-otp', { email });
      return response.data;
    },
    onSuccess: () => {
      toast.success('OTP sent to your email address');
      setOtpSent(true);
      setActiveStep(1);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, otp }) => {
      const response = await axios.post('/api/auth/verify-otp', { email, otp });
      return response.data;
    },
    onSuccess: () => {
      toast.success('OTP verified successfully');
      setOtpVerified(true);
      setActiveStep(2);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, otp, newPassword }) => {
      const response = await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      setActiveStep(3);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const handleSendOtp = () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    sendOtpMutation.mutate(email);
  };

  const handleVerifyOtp = () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    verifyOtpMutation.mutate({ email, otp });
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    resetPasswordMutation.mutate({ email, otp, newPassword });
  };

  const handleResendOtp = () => {
    sendOtpMutation.mutate(email);
  };

  const steps = [
    'Enter Email',
    'Verify OTP',
    'Reset Password',
    'Complete',
  ];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Enter Your Email Address
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              We'll send you a verification code to reset your password
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSendOtp}
              disabled={sendOtpMutation.isPending}
              startIcon={sendOtpMutation.isPending ? <CircularProgress size={20} /> : <Send />}
            >
              {sendOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Verify OTP
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter the 6-digit code sent to {email}
            </Typography>
            <TextField
              fullWidth
              label="OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Security />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Box display="flex" gap={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOtp}
                disabled={verifyOtpMutation.isPending}
                startIcon={verifyOtpMutation.isPending ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleResendOtp}
                disabled={sendOtpMutation.isPending}
                startIcon={<Refresh />}
              >
                Resend
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Set New Password
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create a strong password for your account
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              startIcon={resetPasswordMutation.isPending ? <CircularProgress size={20} /> : <VpnKey />}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Password Reset Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Your password has been reset successfully. You can now login with your new password.
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
            >
              Go to Login
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" gutterBottom>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reset your password using OTP verification
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent>
              {renderStepContent(activeStep)}
            </CardContent>
          </Card>

          <Box textAlign="center" mt={3}>
            <Button
              component={RouterLink}
              to="/login"
              startIcon={<ArrowBack />}
              color="inherit"
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
