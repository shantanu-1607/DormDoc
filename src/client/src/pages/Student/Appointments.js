import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalHospital,
  Schedule,
  Cancel,
  CheckCircle,
  AccessTime,
  Warning,
  Person,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const Appointments = () => {
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointmentsData, isLoading, error } = useQuery(
    'appointments',
    async () => {
      const response = await axios.get('/api/student/appointments');
      return response.data;
    }
  );

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation(
    async (appointmentId) => {
      const response = await axios.put(`/api/student/appointments/${appointmentId}/cancel`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('studentDashboard');
        toast.success('Appointment cancelled successfully');
        setCancelDialogOpen(false);
        setAppointmentToCancel(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      },
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelAppointment = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (appointmentToCancel) {
      cancelAppointmentMutation.mutate(appointmentToCancel._id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'confirmed':
        return 'info';
      case 'in-progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Schedule />;
      case 'confirmed':
        return <CheckCircle />;
      case 'in-progress':
        return <AccessTime />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  const canCancelAppointment = (appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.appointmentTime}`);
    const timeDiff = appointmentDateTime - new Date();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return appointment.status === 'scheduled' && hoursDiff >= 2;
  };

  const filterAppointments = (appointments, status) => {
    if (!appointments) return [];
    
    switch (status) {
      case 'upcoming':
        return appointments.filter(apt => 
          ['scheduled', 'confirmed', 'in-progress'].includes(apt.status)
        );
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled');
      default:
        return appointments;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load appointments. Please try again.
      </Alert>
    );
  }

  const appointments = appointmentsData?.appointments || [];
  const upcomingAppointments = filterAppointments(appointments, 'upcoming');
  const completedAppointments = filterAppointments(appointments, 'completed');
  const cancelledAppointments = filterAppointments(appointments, 'cancelled');

  const currentAppointments = tabValue === 0 ? upcomingAppointments : 
                             tabValue === 1 ? completedAppointments : cancelledAppointments;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Appointments
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage your medical appointments
      </Typography>

      <Card sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={`Upcoming (${upcomingAppointments.length})`} 
              icon={<Schedule />}
              iconPosition="start"
            />
            <Tab 
              label={`Completed (${completedAppointments.length})`} 
              icon={<CheckCircle />}
              iconPosition="start"
            />
            <Tab 
              label={`Cancelled (${cancelledAppointments.length})`} 
              icon={<Cancel />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent>
          {currentAppointments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No appointments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0 && "You don't have any upcoming appointments"}
                {tabValue === 1 && "You don't have any completed appointments"}
                {tabValue === 2 && "You don't have any cancelled appointments"}
              </Typography>
            </Box>
          ) : (
            <List>
              {currentAppointments.map((appointment) => (
                <ListItem key={appointment._id} divider>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: `${getStatusColor(appointment.status)}.main` }}>
                      {getStatusIcon(appointment.status)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6">
                          {appointment.doctor?.name || 'TBD'}
                        </Typography>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                        {appointment.isEmergency && (
                          <Chip
                            label="Emergency"
                            color="error"
                            size="small"
                            icon={<Warning />}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          <strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Time:</strong> {appointment.appointmentTime}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Queue Number:</strong> {appointment.queueNumber}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Symptoms:</strong> {appointment.symptoms}
                        </Typography>
                        {appointment.doctor && (
                          <Typography variant="body2">
                            <strong>Specialization:</strong> {appointment.doctor.specialization}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {tabValue === 0 && canCancelAppointment(appointment) && (
                    <Tooltip title="Cancel Appointment">
                      <IconButton
                        color="error"
                        onClick={() => handleCancelAppointment(appointment)}
                      >
                        <Cancel />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this appointment?
          </Typography>
          {appointmentToCancel && (
            <Box mt={2}>
              <Typography variant="body2">
                <strong>Doctor:</strong> {appointmentToCancel.doctor?.name || 'TBD'}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(appointmentToCancel.appointmentDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                <strong>Time:</strong> {appointmentToCancel.appointmentTime}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Appointment
          </Button>
          <Button
            onClick={confirmCancel}
            color="error"
            variant="contained"
            disabled={cancelAppointmentMutation.isLoading}
          >
            {cancelAppointmentMutation.isLoading ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;
