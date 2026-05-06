import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Warning,
  LocalHospital,
  Phone,
  LocationOn,
  Send,
  CheckCircle,
  LocalHospital as Emergency,
  AccessTime,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const EmergencySOS = () => {
  const [symptoms, setSymptoms] = useState('');
  const [location, setLocation] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const queryClient = useQueryClient();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('Location not available');
        }
      );
    }
  }, []);

  // Send emergency SOS mutation
  const sendSOSMutation = useMutation(
    async (sosData) => {
      const response = await axios.post('/api/student/emergency-sos', sosData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setEmergencyDetails(data);
        setShowSuccessDialog(true);
        queryClient.invalidateQueries('studentDashboard');
        toast.success('Emergency SOS sent successfully!');
        setIsSending(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send emergency SOS');
        setIsSending(false);
      },
    }
  );

  const handleSendSOS = () => {
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setIsSending(true);
    setCountdown(3);

    // Countdown before sending
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Send SOS
          sendSOSMutation.mutate({
            symptoms: symptoms.trim(),
            location: {
              latitude: location.includes(',') ? parseFloat(location.split(',')[0]) : 0,
              longitude: location.includes(',') ? parseFloat(location.split(',')[1]) : 0,
              address: location
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSymptoms('');
    setLocation('');
  };

  const emergencyContacts = [
    { name: 'Campus Security', phone: '911', type: 'Security' },
    { name: 'Medical Emergency', phone: '108', type: 'Medical' },
    { name: 'Ambulance', phone: '102', type: 'Transport' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="error">
        🚨 Emergency SOS
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Send an emergency alert to get immediate medical assistance
      </Typography>

      <Grid container spacing={3}>
        {/* Emergency SOS Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Warning color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" color="error">
                    Emergency Alert
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This will send an immediate emergency alert to medical staff
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Symptoms */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Describe your emergency symptoms"
                    multiline
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Please describe your emergency symptoms in detail..."
                    required
                    color="error"
                    focused
                  />
                </Grid>

                {/* Location */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your current location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location or it will be auto-detected"
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Send SOS Button */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    fullWidth
                    onClick={handleSendSOS}
                    disabled={isSending || !symptoms.trim()}
                    startIcon={isSending ? <CircularProgress size={20} /> : <Send />}
                    sx={{ 
                      py: 2,
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 12px rgba(244, 67, 54, 0.4)',
                      }
                    }}
                  >
                    {isSending ? (
                      countdown > 0 ? `Sending in ${countdown}...` : 'Sending Emergency Alert...'
                    ) : (
                      '🚨 SEND EMERGENCY SOS'
                    )}
                  </Button>
                </Grid>
              </Grid>

              {isSending && countdown > 0 && (
                <Fade in={isSending}>
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Emergency alert will be sent in {countdown} seconds...
                    </Typography>
                  </Alert>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contacts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Emergency Contacts
              </Typography>
              <List>
                {emergencyContacts.map((contact, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'error.main' }}>
                        <Phone />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={contact.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="primary">
                            {contact.phone}
                          </Typography>
                          <Chip label={contact.type} size="small" color="error" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{ mb: 1 }}
                startIcon={<LocalHospital />}
              >
                Call Campus Medical
              </Button>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<Emergency />}
              >
                Call Ambulance
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleCloseSuccessDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Emergency SOS Sent Successfully!
          </Box>
        </DialogTitle>
        <DialogContent>
          {emergencyDetails && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your emergency alert has been sent to medical staff and administrators.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Emergency details:
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Symptoms:</strong> {emergencyDetails.symptoms}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {emergencyDetails.location}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {new Date().toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> Emergency alert sent
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Medical staff and emergency services have been notified. 
                  Help is on the way. Please stay calm and wait for assistance.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencySOS;
