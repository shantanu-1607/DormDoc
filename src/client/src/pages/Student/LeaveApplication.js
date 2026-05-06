import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Assignment,
  School,
  Send,
  CalendarToday,
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
  MedicalServices,
  LocalHospital,
  Description,
  AttachFile,
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Star,
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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const LeaveApplication = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    duration: '',
    startDate: '',
    endDate: '',
    notes: '',
    prescriptionId: '',
    emergencyContact: '',
    returnDate: '',
    medicalCertificate: null,
    supportingDocuments: []
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's leave applications
  const { data: leaveApplications = [], isLoading: leaveLoading, refetch: refetchLeave } = useQuery(
    'user-leave-applications',
    () => axios.get('/api/student/leave-applications').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Fetch prescriptions for leave application
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery(
    'user-prescriptions',
    () => axios.get('/api/student/prescriptions').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Submit leave application mutation
  const submitLeaveMutation = useMutation(
    (leaveData) => axios.post('/api/student/leave-application', leaveData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-leave-applications');
        toast.success('Leave application submitted successfully');
        setOpenDialog(false);
        setFormData({
          reason: '',
          duration: '',
          startDate: '',
          endDate: '',
          notes: '',
          prescriptionId: '',
          emergencyContact: '',
          returnDate: '',
          medicalCertificate: null,
          supportingDocuments: []
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit leave application');
      }
    }
  );

  // Update leave application mutation
  const updateLeaveMutation = useMutation(
    ({ id, data }) => axios.put(`/api/student/leave-application/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-leave-applications');
        toast.success('Leave application updated successfully');
        setOpenDialog(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update leave application');
      }
    }
  );

  // Delete leave application mutation
  const deleteLeaveMutation = useMutation(
    (id) => axios.delete(`/api/student/leave-application/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-leave-applications');
        toast.success('Leave application deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete leave application');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.duration || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedLeave) {
      updateLeaveMutation.mutate({ id: selectedLeave._id, data: formData });
    } else {
      submitLeaveMutation.mutate(formData);
    }
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setFormData({
      reason: leave.reason,
      duration: leave.duration,
      startDate: leave.startDate,
      endDate: leave.endDate,
      notes: leave.notes,
      prescriptionId: leave.prescriptionId || '',
      emergencyContact: leave.emergencyContact || '',
      returnDate: leave.returnDate || '',
      medicalCertificate: leave.medicalCertificate,
      supportingDocuments: leave.supportingDocuments || []
    });
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this leave application?')) {
      deleteLeaveMutation.mutate(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Warning />;
      case 'pending': return <Schedule />;
      case 'under_review': return <Info />;
      default: return <Info />;
    }
  };

  const filteredApplications = (leaveApplications || []).filter(application => {
    if (filterStatus !== 'all' && application.status !== filterStatus) return false;
    if (searchTerm && !application.reason.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getLeaveStats = () => {
    const total = (leaveApplications || []).length;
    const pending = (leaveApplications || []).filter(app => app.status === 'pending').length;
    const approved = (leaveApplications || []).filter(app => app.status === 'approved').length;
    const rejected = (leaveApplications || []).filter(app => app.status === 'rejected').length;
    return { total, pending, approved, rejected };
  };

  const leaveStats = getLeaveStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Leave Application
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Apply for leave using your medical prescriptions and track your applications
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary">
                    {leaveStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Assignment />
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
                    {leaveStats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
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
                  <Typography variant="h4" color="success.main">
                    {leaveStats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
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
                  <Typography variant="h4" color="error.main">
                    {leaveStats.rejected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Warning />
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
            <Tab label="My Applications" icon={<Assignment />} />
            <Tab label="Apply for Leave" icon={<Add />} />
            <Tab label="Leave History" icon={<History />} />
          </Tabs>
        </Box>

        {/* My Applications Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box mb={3} display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search applications..."
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
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetchLeave()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Application ID</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaveLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{application._id.slice(-8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {application.reason}
                      </Typography>
                      {application.prescriptionId && (
                        <Chip
                          label="Medical Prescription"
                          color="primary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {application.duration} days
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(application.status)}
                        label={application.status}
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(application.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLeave(application);
                              setOpenDialog(true);
                            }}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                        {application.status === 'pending' && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(application)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                        {application.status === 'pending' && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(application._id)}
                              color="error"
                            >
                              <Delete />
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

        {/* Apply for Leave Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box maxWidth={800} mx="auto">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  New Leave Application
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Fill in the details below to apply for leave. You can attach medical prescriptions to support your application.
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Reason for Leave"
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        required
                        multiline
                        rows={3}
                        placeholder="Describe the reason for your leave request..."
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Duration (Days)"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleInputChange}
                        required
                        inputProps={{ min: 1, max: 30 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Related Prescription</InputLabel>
                        <Select
                          name="prescriptionId"
                          value={formData.prescriptionId}
                          onChange={handleInputChange}
                          label="Related Prescription"
                        >
                          <MenuItem value="">No prescription</MenuItem>
                          {(prescriptions || []).map((prescription) => (
                            <MenuItem key={prescription._id} value={prescription._id}>
                              {prescription.medication} - {new Date(prescription.date).toLocaleDateString()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="End Date"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Emergency Contact"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        placeholder="Phone number or email"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Expected Return Date"
                        name="returnDate"
                        type="date"
                        value={formData.returnDate}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Additional Notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        placeholder="Any additional information or special requirements..."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        disabled={submitLeaveMutation.isLoading}
                        fullWidth
                      >
                        {submitLeaveMutation.isLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Submit Leave Application'
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Leave History Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box textAlign="center" py={4}>
            <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Leave History
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              View your complete leave application history and statistics
            </Typography>
            <Button
              variant="contained"
              startIcon={<Analytics />}
              size="large"
            >
              View Detailed History
            </Button>
          </Box>
        </TabPanel>
      </Card>

      {/* Leave Application Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant="h6">
                Leave Application Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete information about your leave application
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Application Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Application ID"
                      secondary={`#${selectedLeave._id.slice(-8)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Reason"
                      secondary={selectedLeave.reason}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Duration"
                      secondary={`${selectedLeave.duration} days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          icon={getStatusIcon(selectedLeave.status)}
                          label={selectedLeave.status}
                          color={getStatusColor(selectedLeave.status)}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Dates & Timeline
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Start Date"
                      secondary={new Date(selectedLeave.startDate).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="End Date"
                      secondary={new Date(selectedLeave.endDate).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Applied Date"
                      secondary={new Date(selectedLeave.createdAt).toLocaleString()}
                    />
                  </ListItem>
                  {selectedLeave.updatedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Last Updated"
                        secondary={new Date(selectedLeave.updatedAt).toLocaleString()}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedLeave && selectedLeave.status === 'pending' && (
            <Button variant="contained" startIcon={<Edit />}>
              Edit Application
            </Button>
          )}
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

export default LeaveApplication;
