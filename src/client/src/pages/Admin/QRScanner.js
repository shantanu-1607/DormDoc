import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
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
  Badge,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  QrCodeScanner,
  Person,
  School,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  CheckCircle,
  Warning,
  Refresh,
  Download,
  Print,
  History,
  LocalHospital,
  DirectionsCar,
  Schedule,
  MedicalServices,
  Assignment,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [ambulanceId, setAmbulanceId] = useState('');
  const [notes, setNotes] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const queryClient = useQueryClient();

  // Fetch students for verification
  const { data: students, isLoading: studentsLoading } = useQuery(
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

  // Fetch ambulances
  const { data: ambulances, isLoading: ambulancesLoading } = useQuery(
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

  // Record scan mutation
  const recordScanMutation = useMutation(
    async (scanData) => {
      const response = await axios.post('/api/admin/ambulance-scans', scanData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Student scan recorded successfully!');
        setScanHistory(prev => [data, ...prev]);
        queryClient.invalidateQueries('ambulanceScans');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record scan');
      },
    }
  );

  const startScanning = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleQRCodeDetected = (data) => {
    try {
      const studentData = JSON.parse(data);
      setScannedData(studentData);
      setSelectedStudent(studentData);
      setOpenDetails(true);
      stopScanning();
    } catch (error) {
      console.error('Invalid QR code data:', error);
      toast.error('Invalid QR code format');
    }
  };

  const handleConfirmScan = () => {
    if (selectedStudent && ambulanceId) {
      recordScanMutation.mutate({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentRollNo: selectedStudent.rollNo,
        ambulanceId: ambulanceId,
        scanTime: new Date().toISOString(),
        notes: notes,
        status: 'scanned'
      });
      setOpenDetails(false);
      setSelectedStudent(null);
      setNotes('');
    }
  };

  const handleCancelScan = () => {
    setOpenDetails(false);
    setSelectedStudent(null);
    setScannedData(null);
    setNotes('');
  };

  // Load scan history
  useEffect(() => {
    const savedHistory = localStorage.getItem('ambulanceScanHistory');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save scan history
  useEffect(() => {
    if (scanHistory.length > 0) {
      localStorage.setItem('ambulanceScanHistory', JSON.stringify(scanHistory));
    }
  }, [scanHistory]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            QR Scanner
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Scan student ID cards for ambulance boarding
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setScanHistory([])}
          >
            Clear History
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              const dataStr = JSON.stringify(scanHistory, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `ambulance-scans-${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Scanner Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Student ID Scanner
              </Typography>
              
              {!isScanning ? (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                  }}
                >
                  <QrCodeScanner sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Ready to Scan
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                    Click the button below to start scanning student ID cards
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<QrCodeScanner />}
                    onClick={startScanning}
                    sx={{ borderRadius: 2 }}
                  >
                    Start Scanning
                  </Button>
                </Box>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="video"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    sx={{
                      width: '100%',
                      height: 400,
                      objectFit: 'cover',
                      borderRadius: 2,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Stop Scanning">
                      <Fab
                        size="small"
                        color="error"
                        onClick={stopScanning}
                      >
                        <QrCodeScanner />
                      </Fab>
                    </Tooltip>
                  </Box>
                  
                  {/* Scanning overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 200,
                      height: 200,
                      border: '2px solid #4CAF50',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                    }}
                  >
                    <Typography variant="body2" color="white" fontWeight="bold">
                      Position QR code here
                    </Typography>
                  </Box>
                </Box>
              )}

              {scannedData && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  QR Code detected! Student information loaded.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Scans
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <QrCodeScanner />
                </Avatar>
                <Box>
                  <Typography variant="h4">{scanHistory.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Scans
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Last scan: {scanHistory[0]?.scanTime ? new Date(scanHistory[0].scanTime).toLocaleTimeString() : 'None'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => queryClient.invalidateQueries('ambulances')}
                  fullWidth
                >
                  Refresh Ambulances
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                  fullWidth
                >
                  Print Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Scan History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Scans
              </Typography>
              {scanHistory.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <QrCodeScanner sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No scans recorded yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {scanHistory.slice(0, 10).map((scan, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {scan.studentName}
                              </Typography>
                              <Chip
                                label={scan.status}
                                color="success"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Roll No: {scan.studentRollNo} | Ambulance: {scan.ambulanceId}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(scan.scanTime).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box display="flex" alignItems="center">
                          <CheckCircle color="success" />
                        </Box>
                      </ListItem>
                      {index < scanHistory.slice(0, 10).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Student Details Dialog */}
      <Dialog open={openDetails} onClose={handleCancelScan} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6">Student Details</Typography>
              <Typography variant="body2" color="text.secondary">
                Confirm student information before recording scan
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student Name"
                  value={selectedStudent.name || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  value={selectedStudent.rollNo || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedStudent.email || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedStudent.phone || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Ambulance</InputLabel>
                  <Select
                    value={ambulanceId}
                    onChange={(e) => setAmbulanceId(e.target.value)}
                    label="Ambulance"
                  >
                    {ambulancesLoading ? (
                      <MenuItem disabled>Loading ambulances...</MenuItem>
                    ) : (
                      (ambulances || []).map((ambulance) => (
                        <MenuItem key={ambulance._id} value={ambulance._id}>
                          {ambulance.vehicleNumber} - {ambulance.driverName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about the scan..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelScan}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmScan}
            disabled={!ambulanceId || recordScanMutation.isLoading}
            startIcon={recordScanMutation.isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {recordScanMutation.isLoading ? 'Recording...' : 'Confirm Scan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRScanner;