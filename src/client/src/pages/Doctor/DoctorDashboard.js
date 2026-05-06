import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MedicalServices,
  Person,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  LocalHospital,
  CrisisAlert,
  TrackChanges,
  Visibility,
  Assignment,
  School,
  Send,
  QrCode,
  Print,
  Approved,
  Rejected,
  Pending,
  Schedule,
  History,
  Dashboard,
  Queue,
  Analytics,
  Chat,
  DirectionsCar,
  Medication,
  LocalPharmacy,
  CalendarToday,
  FileUpload,
  AttachFile,
  Description,
  Work,
  Star,
  QrCodeScanner,
  Email as EmailIcon,
  Print as PrintIcon,
  PlayArrow,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    followUpDate: '',
    notes: ''
  });
  const [ambulanceData, setAmbulanceData] = useState({
    patientId: '',
    priority: 'medium',
    reason: '',
    destination: '',
    estimatedTime: '',
    notes: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch doctor's appointments for today
  const { data: todayAppointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery(
    'doctor-today-appointments',
    () => axios.get('/api/doctor/appointments/today').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Fetch recent patients
  const { data: recentPatients = [], isLoading: patientsLoading, refetch: refetchPatients } = useQuery(
    'doctor-recent-patients',
    () => axios.get('/api/doctor/patients/recent').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Fetch prescriptions prescribed by doctor
  const { data: prescriptions = [], isLoading: prescriptionsLoading, refetch: refetchPrescriptions } = useQuery(
    'doctor-prescriptions',
    () => axios.get('/api/doctor/prescriptions').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Fetch patients for prescription
  const { data: patients = [], isLoading: patientsListLoading } = useQuery(
    'doctor-patients-list',
    () => axios.get('/api/doctor/patients').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Fetch ambulances for booking
  const { data: ambulances = [], isLoading: ambulancesLoading } = useQuery(
    'available-ambulances',
    () => axios.get('/api/doctor/ambulances/available').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Create prescription mutation
  const createPrescriptionMutation = useMutation(
    (prescriptionData) => axios.post('/api/doctor/prescriptions', prescriptionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctor-prescriptions');
        toast.success('Prescription created successfully');
        setOpenDialog(false);
        setPrescriptionData({
          patientId: '',
          medication: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          followUpDate: '',
          notes: ''
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create prescription');
      }
    }
  );

  // Book ambulance mutation
  const bookAmbulanceMutation = useMutation(
    (ambulanceData) => axios.post('/api/doctor/ambulance-booking', ambulanceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('available-ambulances');
        toast.success('Ambulance booked successfully');
        setOpenDialog(false);
        setAmbulanceData({
          patientId: '',
          priority: 'medium',
          reason: '',
          destination: '',
          estimatedTime: '',
          notes: ''
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to book ambulance');
      }
    }
  );

  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    
    if (!prescriptionData.patientId || !prescriptionData.medication || !prescriptionData.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    createPrescriptionMutation.mutate(prescriptionData);
  };

  const handleAmbulanceBooking = (e) => {
    e.preventDefault();
    
    if (!ambulanceData.patientId || !ambulanceData.reason || !ambulanceData.destination) {
      toast.error('Please fill in all required fields');
      return;
    }

    bookAmbulanceMutation.mutate(ambulanceData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPrescriptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmbulanceInputChange = (e) => {
    const { name, value } = e.target;
    setAmbulanceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'cancelled': return <Warning />;
      case 'in_progress': return <Info />;
      default: return <Info />;
    }
  };

  const filteredAppointments = (todayAppointments || []).filter(appointment => {
    if (filterStatus !== 'all' && appointment.status !== filterStatus) return false;
    if (searchTerm && !appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getDashboardStats = () => {
    const totalAppointments = (todayAppointments || []).length;
    const completedAppointments = (todayAppointments || []).filter(apt => apt.status === 'completed').length;
    const pendingAppointments = (todayAppointments || []).filter(apt => apt.status === 'pending').length;
    const totalPrescriptions = (prescriptions || []).length;
    return { totalAppointments, completedAppointments, pendingAppointments, totalPrescriptions };
  };

  const dashboardStats = getDashboardStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Doctor Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Welcome, Dr. {user?.name}. Manage your patients, prescriptions, and appointments.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary">
                    {dashboardStats.totalAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Appointments
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CalendarToday />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="success.main">
                    {dashboardStats.completedAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {dashboardStats.pendingAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="info.main">
                    {dashboardStats.totalPrescriptions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prescriptions
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Medication />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Today's Appointments" icon={<CalendarToday />} />
            <Tab label="Recent Patients" icon={<Person />} />
            <Tab label="Prescriptions" icon={<Medication />} />
            <Tab label="Book Ambulance" icon={<DirectionsCar />} />
            <Tab label="Chat with Patients" icon={<Chat />} />
          </Tabs>
        </Box>

        {/* Today's Appointments Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box mb={3} display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search />
              }}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchAppointments()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {appointment.patientName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.patientId} - {appointment.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(appointment.appointmentTime).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(appointment.status)}
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {appointment.reason || 'General consultation'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPatient(appointment);
                              setOpenDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Start Consultation">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              // Start consultation
                              toast.info('Starting consultation...');
                            }}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Recent Patients Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box mb={3} display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search />
              }}
              size="small"
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchPatients()}
            >
              Refresh
            </Button>
          </Box>

          <Grid container spacing={3}>
            {(recentPatients || []).map((patient) => (
              <Grid item xs={12} md={6} lg={4} key={patient._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {patient.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {patient.studentId} - {patient.department}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Last Visit"
                          secondary={new Date(patient.lastVisit).toLocaleDateString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Total Visits"
                          secondary={patient.totalVisits}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Blood Group"
                          secondary={patient.bloodGroup || 'Not specified'}
                        />
                      </ListItem>
                    </List>
                    
                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Chat />}
                        onClick={() => {
                          // Open chat with patient
                          toast.info('Opening chat with patient...');
                        }}
                      >
                        Chat
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MedicalServices />}
                        onClick={() => {
                          // View medical history
                          toast.info('Opening medical history...');
                        }}
                      >
                        History
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Prescriptions Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box mb={3} display="flex" gap={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedPatient(null);
                setOpenDialog(true);
              }}
            >
              New Prescription
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchPrescriptions()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Medication</TableCell>
                  <TableCell>Dosage</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescriptionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (prescriptions || []).map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {prescription.patientName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {prescription.patientId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {prescription.medication}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.dosage}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.duration}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print">
                          <IconButton size="small">
                            <Print />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Book Ambulance Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box maxWidth={800} mx="auto">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Book Ambulance for Patient
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Book an ambulance for patient transportation
                </Typography>

                <Box component="form" onSubmit={handleAmbulanceBooking}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Select Patient</InputLabel>
                        <Select
                          name="patientId"
                          value={ambulanceData.patientId}
                          onChange={handleAmbulanceInputChange}
                          label="Select Patient"
                        >
                          {(patients || []).map((patient) => (
                            <MenuItem key={patient._id} value={patient._id}>
                              {patient.name} - {patient.studentId}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          name="priority"
                          value={ambulanceData.priority}
                          onChange={handleAmbulanceInputChange}
                          label="Priority"
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="emergency">Emergency</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Reason for Transportation"
                        name="reason"
                        value={ambulanceData.reason}
                        onChange={handleAmbulanceInputChange}
                        required
                        multiline
                        rows={3}
                        placeholder="Describe the reason for ambulance transportation..."
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Destination"
                        name="destination"
                        value={ambulanceData.destination}
                        onChange={handleAmbulanceInputChange}
                        required
                        placeholder="Hospital name or address"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Estimated Time"
                        name="estimatedTime"
                        value={ambulanceData.estimatedTime}
                        onChange={handleAmbulanceInputChange}
                        placeholder="e.g., 30 minutes"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Additional Notes"
                        name="notes"
                        value={ambulanceData.notes}
                        onChange={handleAmbulanceInputChange}
                        multiline
                        rows={2}
                        placeholder="Any additional information..."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<DirectionsCar />}
                        disabled={bookAmbulanceMutation.isLoading}
                        fullWidth
                      >
                        {bookAmbulanceMutation.isLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Book Ambulance'
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Chat with Patients Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box textAlign="center" py={4}>
            <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Patient Communication
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Chat with your patients for follow-up consultations and support
            </Typography>
            <Button
              variant="contained"
              startIcon={<Chat />}
              size="large"
            >
              Open Chat System
            </Button>
          </Box>
        </TabPanel>
      </Card>

      {/* Prescription Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Medication />
            </Avatar>
            <Box>
              <Typography variant="h6">
                New Prescription
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a new prescription for patient
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePrescriptionSubmit}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Patient</InputLabel>
                  <Select
                    name="patientId"
                    value={prescriptionData.patientId}
                    onChange={handleInputChange}
                    label="Select Patient"
                  >
                    {(patients || []).map((patient) => (
                      <MenuItem key={patient._id} value={patient._id}>
                        {patient.name} - {patient.studentId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Medication"
                  name="medication"
                  value={prescriptionData.medication}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dosage"
                  name="dosage"
                  value={prescriptionData.dosage}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 500mg"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frequency"
                  name="frequency"
                  value={prescriptionData.frequency}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 3 times daily"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration"
                  name="duration"
                  value={prescriptionData.duration}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 7 days"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Follow-up Date"
                  name="followUpDate"
                  type="date"
                  value={prescriptionData.followUpDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  name="instructions"
                  value={prescriptionData.instructions}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="Special instructions for the patient..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  name="notes"
                  value={prescriptionData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handlePrescriptionSubmit}
            disabled={createPrescriptionMutation.isLoading}
          >
            {createPrescriptionMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Create Prescription'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// TabPanel component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export default DoctorDashboard;
