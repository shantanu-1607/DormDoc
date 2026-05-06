import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  LocalHospital,
  Schedule,
  Warning,
  CheckCircle,
  Cancel,
  AccessTime,
  Person,
  MedicalServices,
  LocalHospital as Emergency,
  Analytics as AnalyticsIcon,
  Refresh,
  Download,
  FilterList,
  DateRange,
  Assessment,
  BarChart,
  PieChart,
  Timeline,
  HealthAndSafety,
  School,
  Group,
  Assignment,
  LocalPharmacy,
  DirectionsCar,
  QrCodeScanner,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('7d');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery(
    ['analytics', dateRange, refreshKey],
    async () => {
      const response = await axios.get(`/api/analytics/dashboard?range=${dateRange}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Analytics data refreshed!');
  };

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

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

  if (error) {
    return (
      <Alert severity="error">
        Failed to load analytics data. Please try again.
      </Alert>
    );
  }

  const data = analyticsData || {};

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
            <AnalyticsIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive insights into dispensary operations
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select value={dateRange} onChange={handleDateRangeChange}>
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 3 Months</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => toast.info('Export feature coming soon!')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Patients
                  </Typography>
                  <Typography variant="h4" component="div">
                    {data.totalPatients || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +12% from last period
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Appointments Today
                  </Typography>
                  <Typography variant="h4" component="div">
                    {data.todayAppointments || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +8% from yesterday
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Emergency Cases
                  </Typography>
                  <Typography variant="h4" component="div">
                    {data.emergencyCases || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingDown color="error" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="error.main">
                      -5% from last period
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                  <Emergency />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Active Doctors
                  </Typography>
                  <Typography variant="h4" component="div">
                    {data.activeDoctors || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +2 new this week
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <MedicalServices />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" icon={<Assessment />} />
            <Tab label="Appointments" icon={<Schedule />} />
            <Tab label="Patients" icon={<People />} />
            <Tab label="Doctors" icon={<MedicalServices />} />
            <Tab label="Emergency" icon={<Warning />} />
            <Tab label="Reports" icon={<BarChart />} />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Appointment Trends */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Appointment Trends
                  </Typography>
                  <Box height={300} display="flex" alignItems="center" justifyContent="center">
                    <Typography color="textSecondary">
                      Chart visualization would go here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Statistics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Completed Appointments"
                        secondary={`${data.completedAppointments || 0} today`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTime color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Pending Appointments"
                        secondary={`${data.pendingAppointments || 0} today`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Cancel color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Cancelled Appointments"
                        secondary={`${data.cancelledAppointments || 0} today`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Warning color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Emergency Alerts"
                        secondary={`${data.emergencyAlerts || 0} today`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Department Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Department Distribution
                  </Typography>
                  <List>
                    {data.departmentStats?.map((dept, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={dept.department}
                          secondary={`${dept.count} patients`}
                        />
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={dept.percentage}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {dept.percentage}%
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recent Activity
                  </Typography>
                  <List>
                    {data.recentActivity?.map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: activity.color }}>
                            {activity.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={activity.time}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appointments Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Appointment Analytics
                  </Typography>
                  <Box height={400} display="flex" alignItems="center" justifyContent="center">
                    <Typography color="textSecondary">
                      Appointment charts and graphs would go here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Appointment Status
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Scheduled</Typography>
                      <Chip label={data.scheduledAppointments || 0} color="primary" />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>In Progress</Typography>
                      <Chip label={data.inProgressAppointments || 0} color="warning" />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Completed</Typography>
                      <Chip label={data.completedAppointments || 0} color="success" />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Cancelled</Typography>
                      <Chip label={data.cancelledAppointments || 0} color="error" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Patients Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Patient Demographics
                  </Typography>
                  <Box height={300} display="flex" alignItems="center" justifyContent="center">
                    <Typography color="textSecondary">
                      Patient demographic charts would go here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Health Statistics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Most Common Symptoms"
                        secondary="Fever, Headache, Cold"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Average Consultation Time"
                        secondary="15 minutes"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Patient Satisfaction"
                        secondary="4.8/5.0"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Doctors Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Doctor Performance
                  </Typography>
                  <List>
                    {data.doctorStats?.map((doctor, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={doctor.name}
                          secondary={`${doctor.specialization} - ${doctor.patientsSeen} patients`}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {doctor.rating}/5.0
                          </Typography>
                          <Chip
                            label={doctor.status}
                            color={doctor.status === 'Available' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Emergency Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Emergency Response Times
                  </Typography>
                  <Box height={300} display="flex" alignItems="center" justifyContent="center">
                    <Typography color="textSecondary">
                      Emergency response charts would go here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Emergency Statistics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Warning color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Active Emergencies"
                        secondary={`${data.activeEmergencies || 0} cases`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTime color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Average Response Time"
                        secondary="3.2 minutes"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Resolved Today"
                        secondary={`${data.resolvedEmergencies || 0} cases`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generate Reports
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => toast.info('Patient report generation coming soon!')}
                    >
                      Patient Report
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => toast.info('Appointment report generation coming soon!')}
                    >
                      Appointment Report
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => toast.info('Emergency report generation coming soon!')}
                    >
                      Emergency Report
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => toast.info('Financial report generation coming soon!')}
                    >
                      Financial Report
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Health
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Database Status"
                        secondary="Connected"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="API Status"
                        secondary="All endpoints operational"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="System Uptime"
                        secondary="99.9%"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Analytics;
