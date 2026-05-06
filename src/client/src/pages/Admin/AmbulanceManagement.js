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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Phone,
  LocationOn,
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
  MedicalServices,
  Work,
  Star,
  QrCode,
  Email,
  Print,
  Approved,
  Rejected,
  Assignment,
  School,
  Send,
  QrCodeScanner,
  Dashboard,
  Queue,
  Analytics,
  Chat,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const AmbulanceManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  // Fetch ambulances
  const { data: ambulances = [], isLoading: ambulancesLoading, refetch: refetchAmbulances } = useQuery(
    'ambulances',
    () => axios.get('/api/admin/ambulances').then(res => res.data),
    {
      select: (data) => (data || []),
      retry: 3,
    }
  );

  // Fetch queue data
  const { data: queue = [], isLoading: queueLoading, refetch: refetchQueue } = useQuery(
    'ambulance-queue',
    () => axios.get('/api/admin/ambulance-queue').then(res => res.data),
    {
      select: (data) => (data || []),
      retry: 3,
    }
  );

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery(
    'drivers',
    () => axios.get('/api/admin/drivers').then(res => res.data),
    {
      select: (data) => (data || []),
      retry: 3,
    }
  );

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery(
    'students',
    () => axios.get('/api/admin/students').then(res => res.data),
    {
      select: (data) => (data || []),
      retry: 3,
    }
  );

  // Update ambulance status mutation
  const updateAmbulanceMutation = useMutation(
    ({ id, status, driverId }) => 
      axios.put(`/api/admin/ambulances/${id}`, { status, driverId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulances');
        toast.success('Ambulance status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update ambulance status');
      }
    }
  );

  // Update queue status mutation
  const updateQueueMutation = useMutation(
    ({ id, status, ambulanceId, estimatedTime }) => 
      axios.put(`/api/admin/ambulance-queue/${id}`, { status, ambulanceId, estimatedTime }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulance-queue');
        toast.success('Queue status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update queue status');
      }
    }
  );

  // Assign ambulance to queue item
  const assignAmbulanceMutation = useMutation(
    ({ queueId, ambulanceId, driverId }) => 
      axios.post(`/api/admin/ambulance-queue/${queueId}/assign`, { ambulanceId, driverId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambulance-queue');
        queryClient.invalidateQueries('ambulances');
        toast.success('Ambulance assigned successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign ambulance');
      }
    }
  );

  const handleStatusChange = (ambulanceId, newStatus, driverId = null) => {
    updateAmbulanceMutation.mutate({ id: ambulanceId, status: newStatus, driverId });
  };

  const handleQueueStatusChange = (queueId, newStatus, ambulanceId = null, estimatedTime = null) => {
    updateQueueMutation.mutate({ id: queueId, status: newStatus, ambulanceId, estimatedTime });
  };

  const handleAssignAmbulance = (queueId, ambulanceId, driverId) => {
    assignAmbulanceMutation.mutate({ queueId, ambulanceId, driverId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'maintenance': return 'error';
      case 'pending': return 'info';
      case 'assigned': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle />;
      case 'busy': return <Warning />;
      case 'maintenance': return <CrisisAlert />;
      case 'pending': return <Schedule />;
      case 'assigned': return <Assignment />;
      case 'completed': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const filteredAmbulances = (Array.isArray(ambulances) ? ambulances : []).filter(ambulance => {
    if (filterStatus !== 'all' && ambulance.status !== filterStatus) return false;
    if (searchTerm && !ambulance.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredQueue = (Array.isArray(queue) ? queue : []).filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchTerm && !item.studentName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getQueueStats = () => {
    const queueArray = Array.isArray(queue) ? queue : [];
    const total = queueArray.length;
    const pending = queueArray.filter(item => item.status === 'pending').length;
    const assigned = queueArray.filter(item => item.status === 'assigned').length;
    const completed = queueArray.filter(item => item.status === 'completed').length;
    return { total, pending, assigned, completed };
  };

  const getAmbulanceStats = () => {
    const ambulancesArray = Array.isArray(ambulances) ? ambulances : [];
    const total = ambulancesArray.length;
    const available = ambulancesArray.filter(ambulance => ambulance.status === 'available').length;
    const busy = ambulancesArray.filter(ambulance => ambulance.status === 'busy').length;
    const maintenance = ambulancesArray.filter(ambulance => ambulance.status === 'maintenance').length;
    return { total, available, busy, maintenance };
  };

  const queueStats = getQueueStats();
  const ambulanceStats = getAmbulanceStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ambulance & Queue Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage ambulance fleet and student transportation queue
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary">
                    {ambulanceStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Ambulances
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DirectionsCar />
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
                    {ambulanceStats.available}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available
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
                    {queueStats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
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
                    {queueStats.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Today
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CheckCircle />
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
            <Tab label="Ambulance Fleet" icon={<DirectionsCar />} />
            <Tab label="Transportation Queue" icon={<Queue />} />
            <Tab label="Real-time Tracking" icon={<TrackChanges />} />
          </Tabs>
        </Box>

        {/* Ambulance Fleet Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box mb={3} display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search ambulances..."
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
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="busy">Busy</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchAmbulances()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ambulancesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredAmbulances.map((ambulance) => (
                  <TableRow key={ambulance._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <DirectionsCar />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {ambulance.vehicleNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ambulance.model} - {ambulance.year}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {ambulance.driver ? (
                        <Box>
                          <Typography variant="body1">
                            {ambulance.driver.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ambulance.driver.phone}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No driver assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(ambulance.status)}
                        label={ambulance.status}
                        color={getStatusColor(ambulance.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">
                          {ambulance.currentLocation || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(ambulance.updatedAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAmbulance(ambulance);
                              setOpenDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        {ambulance.status === 'available' && (
                          <Tooltip title="Mark as Busy">
                            <IconButton
                              size="small"
                              onClick={() => handleStatusChange(ambulance._id, 'busy')}
                            >
                              <Pause />
                            </IconButton>
                          </Tooltip>
                        )}
                        {ambulance.status === 'busy' && (
                          <Tooltip title="Mark as Available">
                            <IconButton
                              size="small"
                              onClick={() => handleStatusChange(ambulance._id, 'available')}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Transportation Queue Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box mb={3} display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search students..."
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
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchQueue()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Request Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Ambulance</TableCell>
                  <TableCell>Request Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredQueue.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {item.studentName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.studentId} - {item.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.requestType}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.priority}
                        color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(item.status)}
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {item.assignedAmbulance ? (
                        <Box>
                          <Typography variant="body2">
                            {item.assignedAmbulance.vehicleNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.assignedAmbulance.driver?.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {item.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Assignment />}
                            onClick={() => {
                              // Open assignment dialog
                              setSelectedAmbulance(item);
                              setOpenDialog(true);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {item.status === 'assigned' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleQueueStatusChange(item._id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Real-time Tracking Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box textAlign="center" py={4}>
            <TrackChanges sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Real-time Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Track ambulance locations and monitor transportation progress
            </Typography>
            <Button
              variant="contained"
              startIcon={<MyLocation />}
              size="large"
            >
              Enable Live Tracking
            </Button>
          </Box>
        </TabPanel>
      </Card>

      {/* Ambulance Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <DirectionsCar />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedAmbulance?.vehicleNumber || 'Ambulance Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete information and status
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAmbulance && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Vehicle Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Vehicle Number"
                      secondary={selectedAmbulance.vehicleNumber}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Model"
                      secondary={selectedAmbulance.model}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Year"
                      secondary={selectedAmbulance.year}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Capacity"
                      secondary={`${selectedAmbulance.capacity} passengers`}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          icon={getStatusIcon(selectedAmbulance.status)}
                          label={selectedAmbulance.status}
                          color={getStatusColor(selectedAmbulance.status)}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Location"
                      secondary={selectedAmbulance.currentLocation || 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={new Date(selectedAmbulance.updatedAt).toLocaleString()}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Edit />}>
            Edit Details
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

export default AmbulanceManagement;