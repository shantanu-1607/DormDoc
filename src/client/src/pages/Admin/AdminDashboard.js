import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  LocalHospital,
  DirectionsCar,
  Queue,
  Warning,
  Person,
  AccessTime,
  TrendingUp,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData, isLoading, error } = useQuery(
    'adminDashboard',
    async () => {
      const response = await axios.get('/api/admin/dashboard');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

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
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  const {
    doctors,
    ambulances,
    studentQueue,
    todayStats,
    emergencyAlerts,
    systemMetrics,
  } = dashboardData || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {currentTime.toLocaleString()}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* System Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Total Students:</Typography>
                  <Typography variant="h6">{systemMetrics?.totalStudents || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Active Doctors:</Typography>
                  <Typography variant="h6">{systemMetrics?.totalDoctors || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Ambulances:</Typography>
                  <Typography variant="h6">{systemMetrics?.totalAmbulances || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Active Appointments:</Typography>
                  <Typography variant="h6">{systemMetrics?.activeAppointments || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Statistics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Stats
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Total Appointments:</Typography>
                  <Typography variant="h6">{systemMetrics?.todayAppointments || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Completed:</Typography>
                  <Typography variant="h6" color="success.main">
                    {todayStats?.find(stat => stat._id === 'completed')?.count || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">In Progress:</Typography>
                  <Typography variant="h6" color="primary.main">
                    {todayStats?.find(stat => stat._id === 'in-progress')?.count || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Cancelled:</Typography>
                  <Typography variant="h6" color="error.main">
                    {todayStats?.find(stat => stat._id === 'cancelled')?.count || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Alerts
              </Typography>
              {emergencyAlerts && emergencyAlerts.length > 0 ? (
                <List>
                  {emergencyAlerts.slice(0, 3).map((alert) => (
                    <ListItem key={alert._id} divider>
                      <ListItemIcon>
                        <Warning color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.student?.name || 'Unknown Student'}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Priority: {alert.priority}/10
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {alert.symptoms}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip label="Emergency" color="error" size="small" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No emergency alerts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<LocalHospital />}
                  onClick={() => navigate('/doctors')}
                  fullWidth
                >
                  Manage Doctors
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DirectionsCar />}
                  onClick={() => navigate('/ambulances')}
                  fullWidth
                >
                  Manage Ambulances
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Queue />}
                  onClick={() => navigate('/queue')}
                  fullWidth
                >
                  Queue Management
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/analytics')}
                  fullWidth
                >
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Queue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Queue
              </Typography>
              {studentQueue && studentQueue.length > 0 ? (
                <List>
                  {studentQueue.slice(0, 5).map((appointment) => (
                    <ListItem key={appointment._id} divider>
                      <ListItemIcon>
                        <Person color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={appointment.student?.name || 'Unknown Student'}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Dr. {appointment.doctor?.name || 'TBD'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Queue: #{appointment.queueNumber} | Priority: {appointment.priority}
                            </Typography>
                            {appointment.isEmergency && (
                              <Chip label="Emergency" color="error" size="small" />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No students in queue
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Doctor Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Doctor Status
              </Typography>
              {doctors && doctors.length > 0 ? (
                <List>
                  {doctors.slice(0, 3).map((doctor) => (
                    <ListItem key={doctor._id} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: doctor.isOnDuty ? 'success.main' : 'grey.400' }}>
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
                            <Typography variant="body2" color="text.secondary">
                              Patients: {doctor.currentPatientCount} | Queue: {doctor.currentQueueNumber}
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
              ) : (
                <Typography color="text.secondary">
                  No doctors available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Ambulance Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ambulance Status
              </Typography>
              {ambulances && ambulances.length > 0 ? (
                <Grid container spacing={2}>
                  {ambulances.map((ambulance) => (
                    <Grid item xs={12} sm={6} md={4} key={ambulance._id}>
                      <Paper sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <DirectionsCar color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">
                            {ambulance.vehicleNumber}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Driver: {ambulance.driverName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {ambulance.status}
                        </Typography>
                        <Chip
                          label={ambulance.status}
                          color={
                            ambulance.status === 'available' ? 'success' :
                            ambulance.status === 'in-use' ? 'warning' :
                            ambulance.status === 'maintenance' ? 'error' : 'default'
                          }
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  No ambulances available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
