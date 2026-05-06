import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  List
} from '@mui/material';
import {
  DirectionsCar,
  LocalHospital,
  LocationOn,
  Phone,
  Timer
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const AmbulanceBooking = () => {
  const [symptoms, setSymptoms] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('College Dispensary');
  const [isEmergency, setIsEmergency] = useState(false);
  
  // Active tracking state
  const [activeBooking, setActiveBooking] = useState(null);

  // Fetch all ambulances status
  const { data: statusData, isLoading: isLoadingStatus } = useQuery(
    'ambulanceStatus',
    async () => {
      const response = await axios.get('/api/ambulance/status');
      return response.data;
    },
    { refetchInterval: 5000 }
  );

  // Mutation for booking ambulance
  const bookAmbulance = useMutation(
    async (bookingData) => {
      const response = await axios.post('/api/ambulance/request', bookingData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message || 'Ambulance booked successfully!');
        setActiveBooking(data);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to book ambulance');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptoms || !pickupAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    bookAmbulance.mutate({
      symptoms,
      pickupLocation: {
        address: pickupAddress,
        latitude: 23.4123, // Mock coordinates for BIT Mesra
        longitude: 85.4399
      },
      destination: {
        address: destinationAddress,
        latitude: 23.4140,
        longitude: 85.4410
      },
      isEmergency
    });
  };

  if (isLoadingStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const ambulances = statusData?.ambulances || [];
  const availableCount = ambulances.filter(a => a.status === 'available').length;
  const busyCount = ambulances.filter(a => a.status === 'in-use').length;
  const maintenanceCount = ambulances.filter(a => a.status === 'maintenance').length;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DirectionsCar fontSize="large" /> Ambulance Booking
      </Typography>

      {/* Fleet Status Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="h3" color="success.main">{availableCount}</Typography>
            <Typography variant="subtitle1">Available Ambulances</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
            <Typography variant="h3" color="warning.main">{busyCount}</Typography>
            <Typography variant="subtitle1">Busy Ambulances</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
            <Typography variant="h3" color="error.main">{maintenanceCount}</Typography>
            <Typography variant="subtitle1">In Maintenance</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left Side - Booking Form or Tracking View */}
        <Grid item xs={12} md={7}>
          {activeBooking ? (
            <Card elevation={4} sx={{ borderTop: '4px solid #1976d2' }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn /> Active Tracking
                </Typography>
                <Alert severity={activeBooking.appointment?.isEmergency ? "error" : "info"} sx={{ mb: 3 }}>
                  Ambulance is on the way to your location.
                </Alert>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography color="textSecondary">Vehicle Number</Typography>
                    <Typography variant="h6">{activeBooking.ambulance?.vehicleNumber}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography color="textSecondary">Driver Name</Typography>
                    <Typography variant="h6">{activeBooking.ambulance?.driverName}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone color="primary" />
                    <Typography variant="h6">{activeBooking.ambulance?.driverPhone}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer color="action" />
                    <Typography variant="h6">Est. Wait: {activeBooking.estimatedWaitTime} mins</Typography>
                  </Box>
                </Box>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 4 }}
                  onClick={() => setActiveBooking(null)}
                >
                  Book Another Ambulance
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Request an Ambulance
                </Typography>
                {availableCount === 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No ambulances are currently available. Your request may be delayed.
                  </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Current Pickup Location (Hostel/Block)"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                    margin="normal"
                    placeholder="E.g., Hostel 1, Block B"
                  />
                  <TextField
                    fullWidth
                    label="Destination"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    required
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Symptoms / Reason"
                    multiline
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                    margin="normal"
                    placeholder="Describe the medical situation briefly..."
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        color="error"
                      />
                    }
                    label="This is a critical emergency"
                    sx={{ mt: 2, display: 'block' }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color={isEmergency ? "error" : "primary"}
                    size="large"
                    fullWidth
                    sx={{ mt: 3, py: 1.5 }}
                    disabled={bookAmbulance.isLoading}
                    startIcon={bookAmbulance.isLoading ? <CircularProgress size={20} /> : <DirectionsCar />}
                  >
                    {bookAmbulance.isLoading ? 'Requesting...' : 'Request Ambulance Now'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Side - Fleet Details */}
        <Grid item xs={12} md={5}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalHospital /> Ambulance Fleet Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List disablePadding>
                {ambulances.map((amb) => (
                  <Box key={amb._id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {amb.vehicleNumber}
                      </Typography>
                      <Chip 
                        label={amb.status} 
                        size="small"
                        color={amb.status === 'available' ? 'success' : amb.status === 'in-use' ? 'warning' : 'error'}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Driver: {amb.driverName}
                    </Typography>
                    {amb.status === 'in-use' && amb.currentAssignment && (
                      <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <LocationOn fontSize="small" sx={{ mr: 0.5 }} /> 
                        Heading to {amb.currentAssignment.pickupLocation?.address || 'Pickup'}
                      </Typography>
                    )}
                  </Box>
                ))}
                {ambulances.length === 0 && (
                  <Typography variant="body2" color="textSecondary" align="center">
                    No ambulance details available.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AmbulanceBooking;
