import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocalHospital,
  Schedule,
  Person,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookAppointment = () => {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);

  const queryClient = useQueryClient();

  // Fetch available doctors
  const { data: doctors, isLoading: doctorsLoading } = useQuery(
    'doctors',
    async () => {
      const response = await axios.get('/api/admin/doctors');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Fetch available time slots when doctor is selected
  const { data: timeSlots, isLoading: slotsLoading } = useQuery(
    ['timeSlots', selectedDoctor, appointmentDate],
    async () => {
      if (!selectedDoctor || !appointmentDate) return [];
      const response = await axios.get(`/api/student/available-slots/${selectedDoctor}?date=${appointmentDate}`);
      return response.data;
    },
    {
      enabled: !!selectedDoctor && !!appointmentDate,
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Book appointment mutation
  const bookAppointmentMutation = useMutation(
    async (appointmentData) => {
      const response = await axios.post('/api/student/book-appointment', appointmentData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setAppointmentDetails(data.appointment);
        setShowSuccessDialog(true);
        queryClient.invalidateQueries('studentDashboard');
        queryClient.invalidateQueries('appointments');
        toast.success('Appointment booked successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to book appointment');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !appointmentTime || !symptoms) {
      toast.error('Please fill in all required fields');
      return;
    }

    bookAppointmentMutation.mutate({
      doctorId: selectedDoctor,
      appointmentDate,
      appointmentTime,
      symptoms,
      isEmergency,
    });
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSelectedDoctor('');
    setAppointmentDate('');
    setAppointmentTime('');
    setSymptoms('');
    setIsEmergency(false);
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book Appointment
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Schedule an appointment with our medical staff
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Doctor Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Select Doctor</InputLabel>
                      <Select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        disabled={doctorsLoading}
                      >
                        {(doctors || []).map((doctor) => (
                          <MenuItem key={doctor._id} value={doctor._id}>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                <LocalHospital />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1">
                                  {doctor.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {doctor.specialization}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Date Selection */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Appointment Date"
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: today }}
                      required
                    />
                  </Grid>

                  {/* Time Selection */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Select Time</InputLabel>
                      <Select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        disabled={!selectedDoctor || !appointmentDate || slotsLoading}
                      >
                        {(timeSlots || []).map((slot) => (
                          <MenuItem key={slot} value={slot}>
                            <Box display="flex" alignItems="center">
                              <AccessTime sx={{ mr: 1 }} />
                              {slot}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {slotsLoading && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Loading available slots...
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                  {/* Symptoms */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Describe your symptoms"
                      multiline
                      rows={4}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Please describe your symptoms in detail..."
                      required
                    />
                  </Grid>

                  {/* Emergency Checkbox */}
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <input
                        type="checkbox"
                        id="emergency"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor="emergency">
                        <Typography variant="body2" color="error">
                          This is an emergency appointment
                        </Typography>
                      </label>
                    </Box>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={bookAppointmentMutation.isLoading}
                      startIcon={
                        bookAppointmentMutation.isLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Schedule />
                        )
                      }
                    >
                      {bookAppointmentMutation.isLoading
                        ? 'Booking Appointment...'
                        : 'Book Appointment'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Doctors Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Doctors
              </Typography>
              {doctorsLoading ? (
                <Box display="flex" justifyContent="center">
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {doctors?.map((doctor) => (
                    <ListItem key={doctor._id} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <LocalHospital />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={doctor.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {doctor.specialization}
                            </Typography>
                            <Chip
                              label={doctor.isOnDuty ? 'On Duty' : 'Off Duty'}
                              color={doctor.isOnDuty ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleCloseSuccessDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Appointment Booked Successfully!
          </Box>
        </DialogTitle>
        <DialogContent>
          {appointmentDetails && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Your appointment has been confirmed with the following details:
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Doctor:</strong> {appointmentDetails.doctor?.name || 'TBD'}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(appointmentDetails.appointmentDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {appointmentDetails.appointmentTime}
                </Typography>
                <Typography variant="body2">
                  <strong>Queue Number:</strong> {appointmentDetails.queueNumber}
                </Typography>
                {appointmentDetails.isEmergency && (
                  <Chip label="Emergency" color="error" size="small" sx={{ mt: 1 }} />
                )}
              </Box>
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

export default BookAppointment;
