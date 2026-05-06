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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Badge,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  Person,
  Phone,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  PlayArrow,
  Pause,
  Stop,
  Navigation,
  MyLocation,
  Schedule,
  LocalHospital,
  CrisisAlert,
  TrackChanges,
  Visibility,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const AmbulanceTracking = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAmbulance, setFilterAmbulance] = useState('all');

  const [tripData, setTripData] = useState({
    patientName: '',
    patientPhone: '',
    pickupLocation: '',
    destination: '',
    emergencyType: '',
    priority: 'medium',
    ambulanceId: '',
    driverId: '',
    estimatedTime: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch ambulance trips
  const { data: trips, isLoading } = useQuery(
    'ambulance-trips',
    async () => {
      const response = await axios.get('/api/admin/ambulance-trips');
      return response.data;
    },
    {
      refetchInterval: 5000, // Refresh every 5 seconds for real-time tracking
    }
  );

  // Fetch ambulances
  const { data: ambulances } = useQuery(
    'ambulances',
    async () => {
      const response = await axios.get('/api/admin/ambulances');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Fetch drivers
  const { data: drivers } = useQuery(
    'drivers',
    async () => {
      const response = await axios.get('/api/admin/drivers');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Create trip mutation
  const createTripMutation = useMutation(
    async (tripData) => {
      const response = await axios.post('/api/admin/ambulance-trips', tripData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulance-trips');
        toast.success('Ambulance trip created successfully!');
        setOpenDialog(false);
        setTripData({
          patientName: '',
          patientPhone: '',
          pickupLocation: '',
          destination: '',
          emergencyType: '',
          priority: 'medium',
          ambulanceId: '',
          driverId: '',
          estimatedTime: '',
          notes: '',
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create trip');
      },
    }
  );

  // Update trip status mutation
  const updateTripStatusMutation = useMutation(
    async ({ tripId, status, location }) => {
      const response = await axios.put(`/api/admin/ambulance-trips/${tripId}/status`, { 
        status, 
        location,
        timestamp: new Date().toISOString()
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulance-trips');
        toast.success('Trip status updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status');
      },
    }
  );

  // Complete trip mutation
  const completeTripMutation = useMutation(
    async ({ tripId, completionNotes }) => {
      const response = await axios.put(`/api/admin/ambulance-trips/${tripId}/complete`, { 
        completionNotes,
        completedAt: new Date().toISOString()
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulance-trips');
        toast.success('Trip completed successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to complete trip');
      },
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!tripData.patientName || !tripData.pickupLocation || !tripData.destination) {
      toast.error('Please fill in all required fields');
      return;
    }
    createTripMutation.mutate(tripData);
  };

  const handleStatusUpdate = (tripId, status) => {
    updateTripStatusMutation.mutate({ tripId, status });
  };

  const handleCompleteTrip = (tripId) => {
    const completionNotes = prompt('Enter completion notes:');
    if (completionNotes !== null) {
      completeTripMutation.mutate({ tripId, completionNotes });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'dispatched': return 'info';
      case 'en-route': return 'warning';
      case 'arrived': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTripSteps = (trip) => {
    const steps = [
      { label: 'Trip Created', completed: true },
      { label: 'Ambulance Dispatched', completed: trip.status !== 'pending' },
      { label: 'En Route to Pickup', completed: ['en-route', 'arrived', 'completed'].includes(trip.status) },
      { label: 'Arrived at Pickup', completed: ['arrived', 'completed'].includes(trip.status) },
      { label: 'Trip Completed', completed: trip.status === 'completed' },
    ];
    return steps;
  };

  const filteredTrips = trips?.filter(trip => {
    const matchesSearch = trip.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
    const matchesAmbulance = filterAmbulance === 'all' || trip.ambulanceId === filterAmbulance;
    
    return matchesSearch && matchesStatus && matchesAmbulance;
  });

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            🚑 Ambulance Tracking
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time tracking of ambulance trips and emergency responses
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries('ambulance-trips')}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ bgcolor: '#1e3a8a' }}
          >
            New Trip
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <DirectionsCar />
                </Avatar>
                <Box>
                  <Typography variant="h4">{trips?.length || 0}</Typography>
                  <Typography color="textSecondary">Total Trips</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <PlayArrow />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {trips?.filter(t => ['dispatched', 'en-route'].includes(t.status)).length || 0}
                  </Typography>
                  <Typography color="textSecondary">Active Trips</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {trips?.filter(t => t.status === 'completed').length || 0}
                  </Typography>
                  <Typography color="textSecondary">Completed</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <CrisisAlert />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {trips?.filter(t => t.priority === 'high').length || 0}
                  </Typography>
                  <Typography color="textSecondary">High Priority</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search trips"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="dispatched">Dispatched</MenuItem>
                  <MenuItem value="en-route">En Route</MenuItem>
                  <MenuItem value="arrived">Arrived</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Ambulance</InputLabel>
                <Select
                  value={filterAmbulance}
                  onChange={(e) => setFilterAmbulance(e.target.value)}
                  label="Ambulance"
                >
                  <MenuItem value="all">All Ambulances</MenuItem>
                  {(ambulances || []).map((ambulance) => (
                    <MenuItem key={ambulance._id} value={ambulance._id}>
                      {ambulance.vehicleNumber} - {ambulance.driverName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterAmbulance('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Trips" icon={<DirectionsCar />} />
            <Tab label="Active Trips" icon={<PlayArrow />} />
            <Tab label="Completed Trips" icon={<CheckCircle />} />
            <Tab label="High Priority" icon={<CrisisAlert />} />
          </Tabs>
        </Box>

        {/* All Trips Tab */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Pickup Location</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ambulance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredTrips || []).map((trip) => (
                  <TableRow key={trip._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{trip.patientName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {trip.patientPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                        {trip.pickupLocation}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocalHospital sx={{ mr: 1, fontSize: 16, color: 'success.main' }} />
                        {trip.destination}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.priority}
                        color={getPriorityColor(trip.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.status}
                        color={getStatusColor(trip.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trip.ambulance?.vehicleNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedTrip(trip)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      {trip.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusUpdate(trip._id, 'dispatched')}
                        >
                          Dispatch
                        </Button>
                      )}
                      {trip.status === 'dispatched' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={() => handleStatusUpdate(trip._id, 'en-route')}
                        >
                          En Route
                        </Button>
                      )}
                      {trip.status === 'en-route' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="info"
                          onClick={() => handleStatusUpdate(trip._id, 'arrived')}
                        >
                          Arrived
                        </Button>
                      )}
                      {trip.status === 'arrived' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleCompleteTrip(trip._id)}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Active Trips Tab */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Pickup Location</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips?.filter(trip => ['dispatched', 'en-route', 'arrived'].includes(trip.status)).map((trip) => (
                  <TableRow key={trip._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{trip.patientName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {trip.patientPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                        {trip.pickupLocation}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocalHospital sx={{ mr: 1, fontSize: 16, color: 'success.main' }} />
                        {trip.destination}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.priority}
                        color={getPriorityColor(trip.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.status}
                        color={getStatusColor(trip.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            trip.status === 'dispatched' ? 25 :
                            trip.status === 'en-route' ? 75 :
                            trip.status === 'arrived' ? 100 : 0
                          }
                          color="primary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {trip.status === 'dispatched' ? '25%' :
                           trip.status === 'en-route' ? '75%' :
                           trip.status === 'arrived' ? '100%' : '0%'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedTrip(trip)}
                        color="primary"
                      >
                        <TrackChanges />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Completed Trips Tab */}
        <TabPanel value={activeTab} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Pickup Location</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Completed At</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips?.filter(trip => trip.status === 'completed').map((trip) => (
                  <TableRow key={trip._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{trip.patientName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {trip.patientPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                        {trip.pickupLocation}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocalHospital sx={{ mr: 1, fontSize: 16, color: 'success.main' }} />
                        {trip.destination}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trip.completedAt ? new Date(trip.completedAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trip.duration || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedTrip(trip)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* High Priority Tab */}
        <TabPanel value={activeTab} index={3}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Emergency Type</TableCell>
                  <TableCell>Pickup Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips?.filter(trip => trip.priority === 'high').map((trip) => (
                  <TableRow key={trip._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{trip.patientName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {trip.patientPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.emergencyType}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn sx={{ mr: 1, fontSize: 16, color: 'error.main' }} />
                        {trip.pickupLocation}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.status}
                        color={getStatusColor(trip.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedTrip(trip)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Create Trip Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Ambulance Trip</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Name"
                value={tripData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Phone"
                value={tripData.patientPhone}
                onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pickup Location"
                value={tripData.pickupLocation}
                onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destination"
                value={tripData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Emergency Type</InputLabel>
                <Select
                  value={tripData.emergencyType}
                  onChange={(e) => handleInputChange('emergencyType', e.target.value)}
                  label="Emergency Type"
                >
                  <MenuItem value="medical">Medical Emergency</MenuItem>
                  <MenuItem value="accident">Accident</MenuItem>
                  <MenuItem value="cardiac">Cardiac Emergency</MenuItem>
                  <MenuItem value="respiratory">Respiratory Emergency</MenuItem>
                  <MenuItem value="trauma">Trauma</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={tripData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ambulance</InputLabel>
                <Select
                  value={tripData.ambulanceId}
                  onChange={(e) => handleInputChange('ambulanceId', e.target.value)}
                  label="Ambulance"
                >
                  {(ambulances || []).map((ambulance) => (
                    <MenuItem key={ambulance._id} value={ambulance._id}>
                      {ambulance.vehicleNumber} - {ambulance.driverName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Time (minutes)"
                type="number"
                value={tripData.estimatedTime}
                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={tripData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createTripMutation.isLoading}
          >
            {createTripMutation.isLoading ? <CircularProgress size={20} /> : 'Create Trip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trip Details Dialog */}
      <Dialog open={!!selectedTrip} onClose={() => setSelectedTrip(null)} maxWidth="md" fullWidth>
        <DialogTitle>Trip Details & Tracking</DialogTitle>
        <DialogContent>
          {selectedTrip && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Patient</Typography>
                  <Typography variant="body1">{selectedTrip.patientName}</Typography>
                  <Typography variant="body2" color="textSecondary">{selectedTrip.patientPhone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
                  <Chip
                    label={selectedTrip.priority}
                    color={getPriorityColor(selectedTrip.priority)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedTrip.status}
                    color={getStatusColor(selectedTrip.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Emergency Type</Typography>
                  <Typography variant="body1">{selectedTrip.emergencyType}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Trip Progress</Typography>
              <Stepper orientation="vertical">
                {getTripSteps(selectedTrip).map((step, index) => (
                  <Step key={step.label} completed={step.completed}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Pickup Location</Typography>
                  <Typography variant="body1">{selectedTrip.pickupLocation}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Destination</Typography>
                  <Typography variant="body1">{selectedTrip.destination}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Ambulance</Typography>
                  <Typography variant="body1">{selectedTrip.ambulance?.vehicleNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Driver</Typography>
                  <Typography variant="body1">{selectedTrip.ambulance?.driverName || 'N/A'}</Typography>
                </Grid>
              </Grid>
              
              {selectedTrip.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{selectedTrip.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTrip(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AmbulanceTracking;
