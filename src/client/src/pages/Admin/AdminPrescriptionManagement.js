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
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Edit,
  Delete,
  Medication,
  LocalPharmacy,
  Person,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  PersonAdd,
  School,
  LocalHospital,
  Assignment,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminPrescriptionManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');

  const queryClient = useQueryClient();

  // Fetch all prescriptions
  const { data: allPrescriptions, isLoading: allLoading } = useQuery(
    'admin-prescriptions',
    async () => {
      const response = await axios.get('/api/admin/prescriptions');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Fetch doctors
  const { data: doctors } = useQuery(
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

  // Fetch students
  const { data: students } = useQuery(
    'students',
    async () => {
      const response = await axios.get('/api/admin/students');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Delete prescription mutation
  const deletePrescriptionMutation = useMutation(
    async (prescriptionId) => {
      const response = await axios.delete(`/api/admin/prescriptions/${prescriptionId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-prescriptions');
        toast.success('Prescription deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete prescription');
      },
    }
  );

  // Update prescription status mutation
  const updateStatusMutation = useMutation(
    async ({ prescriptionId, status }) => {
      const response = await axios.put(`/api/admin/prescriptions/${prescriptionId}/status`, { status });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-prescriptions');
        toast.success('Prescription status updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status');
      },
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredPrescriptions = (allPrescriptions || []).filter(prescription => {
    const matchesSearch = prescription.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    const matchesDoctor = filterDoctor === 'all' || prescription.doctorId === filterDoctor;
    
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'expired': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleStatusChange = (prescriptionId, newStatus) => {
    updateStatusMutation.mutate({ prescriptionId, status: newStatus });
  };

  const handleDownloadPrescription = (prescription) => {
    if (prescription.fileUrl) {
      window.open(prescription.fileUrl, '_blank');
    } else {
      toast.info('No file available for download');
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (allLoading) {
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
            📋 Prescription Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all prescriptions and medications across the dispensary
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          sx={{ bgcolor: '#1e3a8a' }}
        >
          Export Data
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Medication />
                </Avatar>
                <Box>
                  <Typography variant="h4">{allPrescriptions?.length || 0}</Typography>
                  <Typography color="textSecondary">Total Prescriptions</Typography>
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
                    {(allPrescriptions || []).filter(p => p.status === 'active').length}
                  </Typography>
                  <Typography color="textSecondary">Active Prescriptions</Typography>
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
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {(allPrescriptions || []).filter(p => p.status === 'pending').length}
                  </Typography>
                  <Typography color="textSecondary">Pending Review</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <LocalPharmacy />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {allPrescriptions?.reduce((total, p) => total + p.medications.length, 0) || 0}
                  </Typography>
                  <Typography color="textSecondary">Total Medications</Typography>
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
                label="Search prescriptions"
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Doctor</InputLabel>
                <Select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  label="Doctor"
                >
                  <MenuItem value="all">All Doctors</MenuItem>
                  {(doctors || []).map((doctor) => (
                    <MenuItem key={doctor._id} value={doctor._id}>
                      {doctor.name}
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
                  setFilterDoctor('all');
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
            <Tab label="All Prescriptions" icon={<Assignment />} />
            <Tab label="Active Prescriptions" icon={<CheckCircle />} />
            <Tab label="Pending Review" icon={<Warning />} />
            <Tab label="Expired Prescriptions" icon={<Info />} />
          </Tabs>
        </Box>

        {/* All Prescriptions Tab */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPrescriptions?.map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                          <Person />
                        </Avatar>
                        {prescription.studentName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          <LocalHospital />
                        </Avatar>
                        {prescription.doctorName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                        {new Date(prescription.date).toLocaleDateString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.medications.length} medication(s)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prescription.status}
                        color={getStatusColor(prescription.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedPrescription(prescription)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDownloadPrescription(prescription)}
                        color="secondary"
                      >
                        <Download />
                      </IconButton>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={prescription.status}
                          onChange={(e) => handleStatusChange(prescription._id, e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="expired">Expired</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton
                        onClick={() => deletePrescriptionMutation.mutate(prescription._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Active Prescriptions Tab */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredPrescriptions || []).filter(p => p.status === 'active').map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                          <Person />
                        </Avatar>
                        {prescription.studentName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          <LocalHospital />
                        </Avatar>
                        {prescription.doctorName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                        {new Date(prescription.date).toLocaleDateString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.medications.length} medication(s)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedPrescription(prescription)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDownloadPrescription(prescription)}
                        color="secondary"
                      >
                        <Download />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Pending Review Tab */}
        <TabPanel value={activeTab} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredPrescriptions || []).filter(p => p.status === 'pending').map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                          <Person />
                        </Avatar>
                        {prescription.studentName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          <LocalHospital />
                        </Avatar>
                        {prescription.doctorName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                        {new Date(prescription.date).toLocaleDateString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.medications.length} medication(s)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedPrescription(prescription)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusChange(prescription._id, 'active')}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Expired Prescriptions Tab */}
        <TabPanel value={activeTab} index={3}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredPrescriptions || []).filter(p => p.status === 'expired').map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                          <Person />
                        </Avatar>
                        {prescription.studentName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          <LocalHospital />
                        </Avatar>
                        {prescription.doctorName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                        {new Date(prescription.date).toLocaleDateString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.medications.length} medication(s)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedPrescription(prescription)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        onClick={() => deletePrescriptionMutation.mutate(prescription._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* View Prescription Dialog */}
      <Dialog open={!!selectedPrescription} onClose={() => setSelectedPrescription(null)} maxWidth="md" fullWidth>
        <DialogTitle>Prescription Details</DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Student</Typography>
                  <Typography variant="body1">{selectedPrescription.studentName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Doctor</Typography>
                  <Typography variant="body1">{selectedPrescription.doctorName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedPrescription.date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedPrescription.status}
                    color={getStatusColor(selectedPrescription.status)}
                    size="small"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Medications</Typography>
              <List>
                {selectedPrescription.medications.map((medication, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Medication />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${medication.name} - ${medication.dosage}`}
                      secondary={`${medication.frequency} for ${medication.duration}. ${medication.instructions}`}
                    />
                  </ListItem>
                ))}
              </List>
              {selectedPrescription.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{selectedPrescription.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPrescription(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPrescriptionManagement;
