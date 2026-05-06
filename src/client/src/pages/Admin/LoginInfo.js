import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  LocalizationProvider,
  AdapterDateFns,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  LocationOn,
  AccessTime,
  Security,
  Person,
  School,
  Work,
  Star,
  Warning,
  CheckCircle,
  Info,
  Download,
  Print,
  Delete,
  Edit,
  Add,
  History,
  Dashboard,
  Analytics,
  LocalHospital,
  DirectionsCar,
  Queue,
  Chat,
  Assignment,
  QrCodeScanner,
  LocalPharmacy,
  Inventory,
  TrackChanges,
  CrisisAlert,
  Schedule,
  MedicalServices,
  Description,
  AttachFile,
  CalendarToday,
  FileUpload,
  Bloodtype,
  Badge,
  Notifications,
  Security as SecurityIcon,
  VpnKey,
  Lock,
  LockOpen,
  AccountCircle,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axios from 'axios';

const LoginInfo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });

  // Fetch all login information
  const { data: loginInfo, isLoading, refetch } = useQuery({
    queryKey: ['loginInfo'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/login-info');
      return response.data;
    },
    select: (data) => data || [],
  });

  // Fetch login statistics
  const { data: statistics } = useQuery({
    queryKey: ['loginStatistics'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/login-statistics');
      return response.data;
    },
  });

  // Fetch recent login attempts
  const { data: recentLogins } = useQuery({
    queryKey: ['recentLogins'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/recent-logins');
      return response.data;
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      const response = await axios.post('/api/admin/reset-password', {
        userId,
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  // Lock/Unlock user mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, action }) => {
      const response = await axios.post('/api/admin/toggle-user-status', {
        userId,
        action,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('User status updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  // Filter login information
  const filteredLogins = (loginInfo || []).filter((login) => {
    const matchesSearch = 
      login.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.user?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || login.user?.role === filterRole;
    const matchesStatus = filterStatus === 'all' || login.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setOpenDetailsDialog(true);
  };

  const handleResetPassword = (userId) => {
    const newPassword = prompt('Enter new password:');
    if (newPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ userId, newPassword });
    } else {
      toast.error('Password must be at least 6 characters long');
    }
  };

  const handleToggleUserStatus = (userId, currentStatus) => {
    const action = currentStatus === 'active' ? 'lock' : 'unlock';
    toggleUserStatusMutation.mutate({ userId, action });
  };

  const handleExportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Last Login', 'IP Address', 'Status', 'Login Count'],
      ...filteredLogins.map(login => [
        login.user?.name || '',
        login.user?.email || '',
        login.user?.role || '',
        login.lastLogin || '',
        login.ipAddress || '',
        login.status || '',
        login.loginCount || 0,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login-info.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'locked': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'doctor': return <MedicalServices />;
      case 'student': return <School />;
      default: return <Person />;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading login information...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Login Information Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Monitor and manage all user login activities and account information
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6">{statistics?.totalUsers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
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
                  <Typography variant="h6">{statistics?.activeUsers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
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
                  <Typography variant="h6">{statistics?.lockedUsers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Locked Users
                  </Typography>
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
                  <AccessTime />
                </Avatar>
                <Box>
                  <Typography variant="h6">{statistics?.todayLogins || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Logins
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Login Information Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Login Information ({filteredLogins.length} users)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Login Count</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogins.map((login) => (
                  <TableRow key={login._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {getRoleIcon(login.user?.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {login.user?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {login.user?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={login.user?.role}
                        color={login.user?.role === 'admin' ? 'error' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {login.lastLogin ? new Date(login.lastLogin).toLocaleString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {login.ipAddress || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {login.loginCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={login.status}
                        color={getStatusColor(login.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(login)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => handleResetPassword(login.user?._id)}
                          >
                            <VpnKey />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={login.status === 'active' ? 'Lock User' : 'Unlock User'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleUserStatus(login.user?._id, login.status)}
                          >
                            {login.status === 'active' ? <Lock /> : <LockOpen />}
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

      {/* User Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Details - {selectedUser?.user?.name}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Name: {selectedUser.user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {selectedUser.user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Student ID: {selectedUser.user?.studentId || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Role: {selectedUser.user?.role}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Login Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Last Login: {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IP Address: {selectedUser.ipAddress || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Login Count: {selectedUser.loginCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {selectedUser.status}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginInfo;
