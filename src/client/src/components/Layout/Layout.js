import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Person,
  LocalHospital,
  DirectionsCar,
  Queue,
  Analytics,
  Assignment,
  QrCodeScanner,
  Warning,
  Chat,
  Medication,
  Logout,
  Notifications,
  Security,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerkAuth } from '../../contexts/ClerkAuthContext';
import CollegeHeader from './CollegeHeader';
import CollegeFooter from './CollegeFooter';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);
  const { user, logout } = useClerkAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSidebarEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setSidebarHovered(true);
  };

  const handleSidebarLeave = () => {
    const timeout = setTimeout(() => {
      setSidebarHovered(false);
    }, 300);
    setHideTimeout(timeout);
  };

  const getMenuItems = () => {
        if (user?.role === 'student') {
          return [
            { text: 'Dashboard', icon: <Dashboard />, path: '/' },
            { text: 'Book Appointment', icon: <LocalHospital />, path: '/book-appointment' },
            { text: 'My Appointments', icon: <Queue />, path: '/appointments' },
            { text: 'Emergency SOS', icon: <Warning />, path: '/emergency-sos' },
            { text: 'Ambulance Booking', icon: <DirectionsCar />, path: '/ambulance-booking' },
            { text: 'Prescriptions', icon: <Medication />, path: '/prescriptions' },
            { text: 'Leave Application', icon: <Assignment />, path: '/leave-application' },
            { text: 'AI Chatbot', icon: <Chat />, path: '/chatbot' },
            { text: 'Profile', icon: <Person />, path: '/profile' },
          ];
        } else if (user?.role === 'doctor') {
          return [
            { text: 'Dashboard', icon: <Dashboard />, path: '/' },
            { text: 'Today\'s Appointments', icon: <LocalHospital />, path: '/doctor-dashboard' },
            { text: 'Patient Chat', icon: <Chat />, path: '/patient-chat' },
            { text: 'Profile', icon: <Person />, path: '/profile' },
          ];
        } else {
          return [
            { text: 'Dashboard', icon: <Dashboard />, path: '/' },
            { text: 'Doctors', icon: <LocalHospital />, path: '/doctors' },
            { text: 'Ambulances', icon: <DirectionsCar />, path: '/ambulances' },
            { text: 'Queue Management', icon: <Queue />, path: '/queue' },
            { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
            { text: 'Prescriptions', icon: <Medication />, path: '/admin-prescriptions' },
            { text: 'Inventory', icon: <Assignment />, path: '/inventory' },
            { text: 'Ambulance Tracking', icon: <DirectionsCar />, path: '/ambulance-tracking' },
            { text: 'Leave Requests', icon: <Assignment />, path: '/leave-requests' },
            { text: 'QR Scanner', icon: <QrCodeScanner />, path: '/qr-scanner' },
            { text: 'Login Info', icon: <Security />, path: '/login-info' },
            { text: 'Profile', icon: <Person />, path: '/profile' },
          ];
        }
      };

  const drawer = (
    <div>
      <Toolbar sx={{ bgcolor: '#1e3a8a', color: 'white' }}>
        <Box display="flex" alignItems="center" width="100%">
          <Avatar sx={{ bgcolor: 'white', color: '#1e3a8a', mr: 1, width: 32, height: 32 }}>
            <LocalHospital />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              BIT MESRA
            </Typography>
            <Typography variant="caption" sx={{ color: '#fbbf24', fontSize: '0.7rem' }}>
              DISPENSARY
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: '#1e3a8a',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: '#fbbf24',
                  },
                },
                '&:hover': {
                  bgcolor: '#f1f5f9',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* College Header */}
      <CollegeHeader />
      
          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            {/* Hover Trigger Area */}
            <Box
              sx={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '20px',
                height: '100vh',
                zIndex: 1300,
                cursor: 'pointer',
                '&:hover': {
                  width: '20px',
                }
              }}
              onMouseEnter={handleSidebarEnter}
            />
            
            {/* Navigation Drawer */}
            <Box
              component="nav"
              sx={{ 
                width: { sm: sidebarHovered ? drawerWidth : 0 }, 
                flexShrink: { sm: 0 },
                transition: 'width 0.3s ease-in-out',
                position: 'relative',
                zIndex: 1200
              }}
              aria-label="mailbox folders"
            >
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
              >
                {drawer}
              </Drawer>
              <Drawer
                variant="permanent"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  '& .MuiDrawer-paper': { 
                    boxSizing: 'border-box', 
                    width: sidebarHovered ? drawerWidth : 0,
                    overflow: 'hidden',
                    transition: 'width 0.3s ease-in-out',
                    border: 'none',
                    boxShadow: sidebarHovered ? 3 : 0
                  },
                }}
                open={sidebarHovered}
              >
                <Paper
                  onMouseEnter={handleSidebarEnter}
                  onMouseLeave={handleSidebarLeave}
                  sx={{
                    height: '100%',
                    width: drawerWidth,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 1,
                    bgcolor: 'white',
                    boxShadow: 3
                  }}
                >
                  {drawer}
                </Paper>
              </Drawer>
            </Box>

        {/* Main Content Area */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* Top Navigation Bar */}
          <AppBar
            position="static"
            sx={{
              bgcolor: '#f8fafc',
              color: 'text.primary',
              boxShadow: 1,
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#1e3a8a' }}>
                {user?.role === 'student' ? 'Student Portal' : 'Admin Portal'}
              </Typography>
              <IconButton color="inherit" sx={{ mr: 2, color: '#1e3a8a' }}>
                <Badge badgeContent={0} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
                sx={{ color: '#1e3a8a' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1e3a8a' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              bgcolor: '#f8fafc',
              minHeight: 'calc(100vh - 200px)',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* College Footer */}
      <CollegeFooter />
    </Box>
  );
};

export default Layout;
