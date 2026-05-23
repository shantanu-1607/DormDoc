import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  TextField,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Security,
  Notifications,
  History,
  MedicalServices,
  LocalHospital,
  Badge,
  CalendarToday,
  CheckCircle,
  Info,
  QrCode,
  Download,
  Print,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import UserQRCode from '../../components/UserQRCode';

const Profile = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  
  const { user, getUserQRCode, regenerateQRCode } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    department: '',
    year: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    profilePicture: null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    emergencyAlerts: true,
    healthTips: true,
  });

  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery(
    'userProfile',
    async () => {
      const response = await axios.get('/api/student/profile');
      return response.data;
    }
  );

  // Fetch user's medical history
  const { data: medicalHistory } = useQuery(
    'medicalHistory',
    async () => {
      const response = await axios.get('/api/student/medical-history');
      return response.data;
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (profileData) => {
      const response = await axios.put('/api/student/profile', profileData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userProfile');
        toast.success('Profile updated successfully!');
        setEditMode(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (passwordData) => {
      const response = await axios.put('/api/student/change-password', passwordData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully!');
        setChangePasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      },
    }
  );

  // Update notifications mutation
  const updateNotificationsMutation = useMutation(
    async (notificationSettings) => {
      const response = await axios.put('/api/student/notifications', notificationSettings);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Notification settings updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update notifications');
      },
    }
  );

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        studentId: userProfile.studentId || '',
        department: userProfile.department || '',
        year: userProfile.year || '',
        bloodGroup: userProfile.bloodGroup || '',
        address: userProfile.address || '',
        emergencyContact: userProfile.emergencyContact || '',
        emergencyPhone: userProfile.emergencyPhone || '',
        medicalHistory: userProfile.medicalHistory || '',
        allergies: userProfile.allergies || '',
        medications: userProfile.medications || '',
        profilePicture: userProfile.profilePicture || null,
      });
    }
  }, [userProfile]);

  // QR Code functions
  const loadQRCode = useCallback(async () => {
    if (!user) return;
    
    setQrCodeLoading(true);
    try {
      const qrCode = await getUserQRCode();
      setQrCodeDataURL(qrCode);
    } catch (error) {
      console.error('Error loading QR code:', error);
      toast.error('Failed to load QR code');
    } finally {
      setQrCodeLoading(false);
    }
  }, [user, getUserQRCode]);

  // Load QR code when component mounts
  useEffect(() => {
    if (user) {
      loadQRCode();
    }
  }, [user, loadQRCode]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const handleRegenerateQRCode = async () => {
    setQrCodeLoading(true);
    try {
      const newQRCode = await regenerateQRCode();
      if (newQRCode) {
        setQrCodeDataURL(newQRCode);
      }
    } catch (error) {
      console.error('Error regenerating QR code:', error);
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `${user.name}-QR-Code.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  const handlePrintQRCode = () => {
    if (qrCodeDataURL && user) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${user.name} - Student QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 20px;
                max-width: 400px;
                margin: 0 auto;
              }
              .qr-code { 
                border: 2px solid #000; 
                padding: 10px; 
                border-radius: 8px;
              }
              .user-info { 
                text-align: left; 
                max-width: 300px;
              }
              .header {
                background: #1976d2;
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="header">
                <h2>Birla Institute of Technology, Mesra</h2>
                <h3>Student ID QR Code</h3>
              </div>
              <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="QR Code" style="width: 250px; height: 250px;" />
              </div>
              <div class="user-info">
                <h4>Student Information</h4>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Student ID:</strong> ${user.studentId || user.rollNo}</p>
                <p><strong>Department:</strong> ${user.department}</p>
                <p><strong>Year:</strong> ${user.year}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                ${user.phone ? `<p><strong>Phone:</strong> ${user.phone}</p>` : ''}
                ${user.bloodGroup ? `<p><strong>Blood Group:</strong> ${user.bloodGroup}</p>` : ''}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleNotificationChange = (field, value) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
    updateNotificationsMutation.mutate({ ...notifications, [field]: value });
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (profileLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
          <Person sx={{ fontSize: 30 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom>
            Profile Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your personal information and preferences
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Personal Info" icon={<Person />} />
            <Tab label="Medical Info" icon={<MedicalServices />} />
            <Tab label="QR Code" icon={<QrCode />} />
            <Tab label="Security" icon={<Security />} />
            <Tab label="Notifications" icon={<Notifications />} />
            <Tab label="History" icon={<History />} />
          </Tabs>
        </Box>

        {/* Personal Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                      sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}
                      src={profileData.profilePicture}
                    >
                      <Person sx={{ fontSize: 60 }} />
                    </Avatar>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => {/* Handle profile picture upload */}}
                    >
                      Change Photo
                    </Button>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      {profileData.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profileData.studentId}
                    </Typography>
                    <Chip
                      label={userProfile?.role || 'Student'}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Personal Information</Typography>
                    <Button
                      variant={editMode ? "contained" : "outlined"}
                      startIcon={editMode ? <Save /> : <Edit />}
                      onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
                      disabled={updateProfileMutation.isLoading}
                    >
                      {editMode ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Person /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Email /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Student ID"
                        value={profileData.studentId}
                        disabled
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Badge /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Department</InputLabel>
                        <Select
                          value={profileData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          label="Department"
                        >
                          <MenuItem value="Computer Science">Computer Science</MenuItem>
                          <MenuItem value="Electronics">Electronics</MenuItem>
                          <MenuItem value="Mechanical">Mechanical</MenuItem>
                          <MenuItem value="Civil">Civil</MenuItem>
                          <MenuItem value="Chemical">Chemical</MenuItem>
                          <MenuItem value="Production">Production</MenuItem>
                          <MenuItem value="Mining">Mining</MenuItem>
                          <MenuItem value="Architecture">Architecture</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={profileData.year}
                          onChange={(e) => handleInputChange('year', e.target.value)}
                          label="Year"
                        >
                          <MenuItem value="1st Year">1st Year</MenuItem>
                          <MenuItem value="2nd Year">2nd Year</MenuItem>
                          <MenuItem value="3rd Year">3rd Year</MenuItem>
                          <MenuItem value="4th Year">4th Year</MenuItem>
                          <MenuItem value="5th Year">5th Year</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={3}
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medical Information Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <MedicalServices sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Medical Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!editMode}>
                        <InputLabel>Blood Group</InputLabel>
                        <Select
                          value={profileData.bloodGroup}
                          onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                          label="Blood Group"
                        >
                          <MenuItem value="A+">A+</MenuItem>
                          <MenuItem value="A-">A-</MenuItem>
                          <MenuItem value="B+">B+</MenuItem>
                          <MenuItem value="B-">B-</MenuItem>
                          <MenuItem value="AB+">AB+</MenuItem>
                          <MenuItem value="AB-">AB-</MenuItem>
                          <MenuItem value="O+">O+</MenuItem>
                          <MenuItem value="O-">O-</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Medical History"
                        multiline
                        rows={4}
                        value={profileData.medicalHistory}
                        onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                        disabled={!editMode}
                        placeholder="Any previous medical conditions, surgeries, etc."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Allergies"
                        multiline
                        rows={2}
                        value={profileData.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                        disabled={!editMode}
                        placeholder="List any known allergies"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Medications"
                        multiline
                        rows={2}
                        value={profileData.medications}
                        onChange={(e) => handleInputChange('medications', e.target.value)}
                        disabled={!editMode}
                        placeholder="List any current medications"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Emergency Contact
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Emergency Contact Name"
                        value={profileData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Person /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Emergency Contact Phone"
                        value={profileData.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {medicalHistory && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Medical History
                    </Typography>
                    <List>
                      {medicalHistory.appointments?.slice(0, 3).map((appointment, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CalendarToday color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${appointment.date} - ${appointment.doctor}`}
                            secondary={appointment.reason}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your QR Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Your unique QR code for identification and access to college services.
                  </Typography>
                  
                  {qrCodeLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : qrCodeDataURL ? (
                    <UserQRCode user={user} size={200} showDetails={true} />
                  ) : (
                    <Box textAlign="center" py={4}>
                      <QrCode sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" mb={2}>
                        No QR code available
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={handleRegenerateQRCode}
                        disabled={qrCodeLoading}
                      >
                        Generate QR Code
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    QR Code Actions
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={handleRegenerateQRCode}
                      disabled={qrCodeLoading}
                      fullWidth
                    >
                      Regenerate QR Code
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleDownloadQRCode}
                      disabled={!qrCodeDataURL}
                      fullWidth
                    >
                      Download QR Code
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={handlePrintQRCode}
                      disabled={!qrCodeDataURL}
                      fullWidth
                    >
                      Print QR Code
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    QR Code Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Your QR code contains the following information:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Personal Information" 
                        secondary="Name, Student ID, Department, Year"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Contact Details" 
                        secondary="Email, Phone number"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Badge />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Identification" 
                        secondary="Unique student identifier"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Password Security
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setChangePasswordDialog(true)}
                    startIcon={<Security />}
                  >
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Security
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Two-Factor Authentication"
                        secondary="Recommended for enhanced security"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Info color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Login History"
                        secondary="Last login: Today at 2:30 PM"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notification Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.emailNotifications}
                        onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.smsNotifications}
                        onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                      />
                    }
                    label="SMS Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.appointmentReminders}
                        onChange={(e) => handleNotificationChange('appointmentReminders', e.target.checked)}
                      />
                    }
                    label="Appointment Reminders"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.emergencyAlerts}
                        onChange={(e) => handleNotificationChange('emergencyAlerts', e.target.checked)}
                      />
                    }
                    label="Emergency Alerts"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.healthTips}
                        onChange={(e) => handleNotificationChange('healthTips', e.target.checked)}
                      />
                    }
                    label="Health Tips & Updates"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recent Activity
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Profile Updated"
                        secondary="2 hours ago"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <MedicalServices color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Appointment Booked"
                        secondary="Yesterday"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Security color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Password Changed"
                        secondary="3 days ago"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          12
                        </Typography>
                        <Typography variant="body2">
                          Appointments
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">
                          3
                        </Typography>
                        <Typography variant="body2">
                          Prescriptions
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={changePasswordMutation.isLoading}
          >
            {changePasswordMutation.isLoading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
