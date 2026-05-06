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
  Fab,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
} from '@mui/material';
import {
  Add,
  Upload,
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
  FileUpload,
  AttachFile,
  Description,
  Assignment,
  School,
  Send,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const PrescriptionManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    doctorName: '',
    date: '',
    medications: [],
    notes: '',
    file: null,
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    reason: '',
    duration: '',
    startDate: '',
    endDate: '',
    notes: '',
    prescriptionId: '',
  });

  const queryClient = useQueryClient();

  // Leave application mutation
  const leaveMutation = useMutation(
    async (leaveData) => {
      const response = await axios.post('/api/student/leave-request', leaveData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leaveRequests');
        toast.success('Leave request submitted successfully!');
        setOpenLeaveDialog(false);
        setLeaveFormData({
          reason: '',
          duration: '',
          startDate: '',
          endDate: '',
          notes: '',
          prescriptionId: '',
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit leave request');
      },
    }
  );

  // Fetch prescriptions
  const { data: prescriptions, isLoading } = useQuery(
    'prescriptions',
    async () => {
      const response = await axios.get('/api/student/prescriptions');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Upload prescription mutation
  const uploadPrescriptionMutation = useMutation(
    async (formData) => {
      const response = await axios.post('/api/student/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('prescriptions');
        toast.success('Prescription uploaded successfully!');
        setUploadDialog(false);
        setPrescriptionData({
          doctorName: '',
          date: '',
          medications: [],
          notes: '',
          file: null,
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload prescription');
      },
    }
  );

  // Delete prescription mutation
  const deletePrescriptionMutation = useMutation(
    async (prescriptionId) => {
      const response = await axios.delete(`/api/student/prescriptions/${prescriptionId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('prescriptions');
        toast.success('Prescription deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete prescription');
      },
    }
  );

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setPrescriptionData(prev => ({ ...prev, file }));
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setPrescriptionData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication, id: Date.now() }]
      }));
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
    }
  };

  const handleRemoveMedication = (medicationId) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== medicationId)
    }));
  };

  const handleSubmitPrescription = () => {
    if (!prescriptionData.doctorName || !prescriptionData.date || prescriptionData.medications.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('doctorName', prescriptionData.doctorName);
    formData.append('date', prescriptionData.date);
    formData.append('medications', JSON.stringify(prescriptionData.medications));
    formData.append('notes', prescriptionData.notes);
    if (prescriptionData.file) {
      formData.append('prescriptionFile', prescriptionData.file);
    }

    uploadPrescriptionMutation.mutate(formData);
  };

  const handleDownloadPrescription = (prescription) => {
    if (prescription.fileUrl) {
      window.open(prescription.fileUrl, '_blank');
    } else {
      toast.info('No file available for download');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const handleOpenLeaveDialog = (prescription) => {
    setLeaveFormData({
      ...leaveFormData,
      prescriptionId: prescription._id,
    });
    setOpenLeaveDialog(true);
  };

  const handleCloseLeaveDialog = () => {
    setOpenLeaveDialog(false);
    setLeaveFormData({
      reason: '',
      duration: '',
      startDate: '',
      endDate: '',
      notes: '',
      prescriptionId: '',
    });
  };

  const handleLeaveFormChange = (e) => {
    setLeaveFormData({
      ...leaveFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitLeaveRequest = (e) => {
    e.preventDefault();
    leaveMutation.mutate(leaveFormData);
  };

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
            📋 Prescription Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your medical prescriptions and medications
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setUploadDialog(true)}
          sx={{ bgcolor: '#1e3a8a' }}
        >
          Upload Prescription
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
                  <Typography variant="h4">{(prescriptions || []).length}</Typography>
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
                    {(prescriptions || []).filter(p => p.status === 'active').length}
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
                    {(prescriptions || []).filter(p => p.status === 'expired').length}
                  </Typography>
                  <Typography color="textSecondary">Expired Prescriptions</Typography>
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
                    {(prescriptions || []).reduce((total, p) => total + (p.medications?.length || 0), 0)}
                  </Typography>
                  <Typography color="textSecondary">Total Medications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Prescriptions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Prescriptions
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(prescriptions || []).map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          <Person />
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
                        {(prescription.medications || []).length} medication(s)
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
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => setSelectedPrescription(prescription)}
                            color="primary"
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            onClick={() => handleDownloadPrescription(prescription)}
                            color="secondary"
                            size="small"
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Apply for Leave">
                          <IconButton
                            onClick={() => handleOpenLeaveDialog(prescription)}
                            color="success"
                            size="small"
                          >
                            <Assignment />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => deletePrescriptionMutation.mutate(prescription._id)}
                            color="error"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Upload Prescription Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload New Prescription</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Doctor Name"
                value={prescriptionData.doctorName}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, doctorName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={prescriptionData.date}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Add Medications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Medication Name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Frequency"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instructions"
                    multiline
                    rows={2}
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddMedication}
                    disabled={!newMedication.name || !newMedication.dosage}
                  >
                    Add Medication
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Current Medications
              </Typography>
              <List>
                {prescriptionData.medications.map((medication) => (
                  <ListItem key={medication.id}>
                    <ListItemIcon>
                      <Medication />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${medication.name} - ${medication.dosage}`}
                      secondary={`${medication.frequency} for ${medication.duration}`}
                    />
                    <IconButton
                      onClick={() => handleRemoveMedication(medication.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={prescriptionData.notes}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FileUpload />}
                fullWidth
              >
                Upload Prescription File
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </Button>
              {prescriptionData.file && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  File selected: {prescriptionData.file.name}
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitPrescription}
            variant="contained"
            disabled={uploadPrescriptionMutation.isLoading}
          >
            {uploadPrescriptionMutation.isLoading ? <CircularProgress size={20} /> : 'Upload Prescription'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={!!selectedPrescription} onClose={() => setSelectedPrescription(null)} maxWidth="md" fullWidth>
        <DialogTitle>Prescription Details</DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <Box>
              <Grid container spacing={2} mb={2}>
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
                <Grid item xs={12}>
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
                {(selectedPrescription.medications || []).map((medication, index) => (
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

      {/* Leave Application Dialog */}
      <Dialog open={openLeaveDialog} onClose={handleCloseLeaveDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant="h6">Apply for Leave</Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a leave request based on your prescription
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmitLeaveRequest}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reason for Leave"
                  name="reason"
                  value={leaveFormData.reason}
                  onChange={handleLeaveFormChange}
                  required
                  placeholder="e.g., Medical treatment, Recovery period"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  name="duration"
                  type="number"
                  value={leaveFormData.duration}
                  onChange={handleLeaveFormChange}
                  required
                  inputProps={{ min: 1, max: 30 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={leaveFormData.startDate}
                  onChange={handleLeaveFormChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={leaveFormData.endDate}
                  onChange={handleLeaveFormChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={leaveFormData.notes}
                  onChange={handleLeaveFormChange}
                  placeholder="Provide any additional information about your leave request..."
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> This leave request will be linked to your prescription and will be reviewed by the administration. 
                    Please ensure all information is accurate and complete.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseLeaveDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={leaveMutation.isLoading}
              startIcon={leaveMutation.isLoading ? <CircularProgress size={20} /> : <Send />}
            >
              {leaveMutation.isLoading ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PrescriptionManagement;
