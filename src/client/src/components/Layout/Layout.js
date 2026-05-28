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
  Stack,
  Tooltip,
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
  ArrowBack,
  ArrowForward,
  Insights,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PanelSwitcher from '../PanelSwitcher';
import { palette } from '../../theme';
import CollegeHeader from './CollegeHeader';
import CollegeFooter from './CollegeFooter';

const drawerWidth = 256;

const ROLE_LABEL = {
  student: 'Student Portal',
  doctor: 'Medical Faculty Portal',
  hod: 'HOD Portal',
  parent: 'Parent Portal',
  admin: 'Administrator Portal',
};

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen((open) => !open);
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const getMenuItems = () => {
    if (user?.role === 'student') {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
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
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { text: "Today's Appointments", icon: <LocalHospital />, path: '/doctor-dashboard' },
        { text: 'Patient Chat', icon: <Chat />, path: '/patient-chat' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
      ];
    } else if (user?.role === 'hod') {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Leave Approvals', icon: <Assignment />, path: '/hod/leave-approvals' },
        { text: 'Department Analytics', icon: <Analytics />, path: '/hod/analytics' },
        { text: 'Department Students', icon: <Person />, path: '/hod/students' },
        { text: 'Active Cases', icon: <LocalHospital />, path: '/hod/active-cases' },
        { text: 'Reports', icon: <Assignment />, path: '/hod/reports' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
      ];
    } else if (user?.role === 'parent') {
      return [
        { text: 'Ward Overview', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Medical Records', icon: <Medication />, path: '/prescriptions' },
        { text: 'AI Support', icon: <Chat />, path: '/chatbot' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
      ];
    } else if (user?.role === 'admin') {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
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
        { text: 'Admin Analytics', icon: <Insights />, path: '/admin-analytics' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
      ];
    }
    return [];
  };

  const sidebarBrand = (
    <Box
      sx={{
        px: 2.5,
        py: 2.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        background: `linear-gradient(135deg, ${palette.navy.dark} 0%, ${palette.maroon.dark} 100%)`,
        color: '#FFFFFF',
      }}
    >
      <Avatar
        src="/assets/bit_logo.png"
        sx={{
          width: 38,
          height: 38,
          bgcolor: '#FFFFFF',
          p: 0.5,
          border: `1.5px solid ${palette.gold}`,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1.1,
          }}
        >
          DormDoc
        </Typography>
        <Typography
          sx={{
            color: palette.gold,
            fontSize: '0.62rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 600,
            mt: 0.3,
          }}
        >
          {ROLE_LABEL[user?.role] || 'Portal'}
        </Typography>
      </Box>
    </Box>
  );

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: palette.navy.dark,
        color: 'rgba(255,255,255,0.92)',
      }}
    >
      {sidebarBrand}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ flex: 1, py: 1.5 }}>
        {getMenuItems().map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={active}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(212, 162, 76, 0.16)',
                    color: '#FFFFFF',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: 4,
                      backgroundColor: palette.gold,
                    },
                    '& .MuiListItemIcon-root': { color: palette.gold },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? palette.gold : 'rgba(255,255,255,0.7)',
                    minWidth: 36,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: active ? 600 : 500,
                    letterSpacing: 0.1,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ px: 2.5, py: 1.75 }}>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          v1.0 · BIT Mesra
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: palette.cream.default }}>
      <CssBaseline />

      <CollegeHeader />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="primary navigation"
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
            }}
          >
            {drawerContent}
          </Drawer>
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                position: 'relative',
                border: 'none',
                boxShadow: '4px 0 24px rgba(15,24,64,0.06)',
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
          {/* Sub-toolbar */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: palette.navy.dark,
              borderBottom: '1px solid rgba(15,24,64,0.08)',
              top: 0,
              zIndex: (theme) => theme.zIndex.drawer - 1,
            }}
          >
            <Toolbar sx={{ minHeight: { xs: 56, md: 60 }, gap: 1 }}>
              <IconButton
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, display: { md: 'none' }, color: palette.maroon.main }}
              >
                <MenuIcon />
              </IconButton>

              <Tooltip title="Back">
                <IconButton
                  onClick={() => navigate(-1)}
                  size="small"
                  sx={{ color: palette.navy.dark, mr: 0.25 }}
                  aria-label="go back"
                >
                  <ArrowBack fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Forward">
                <IconButton
                  onClick={() => navigate(1)}
                  size="small"
                  sx={{ color: palette.navy.dark, mr: 1.5 }}
                  aria-label="go forward"
                >
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Tooltip>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: palette.navy.light,
                    letterSpacing: '0.22em',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.66rem',
                    display: 'block',
                    lineHeight: 1,
                  }}
                >
                  DormDoc
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                    fontSize: { xs: '1rem', md: '1.15rem' },
                    color: palette.navy.dark,
                    lineHeight: 1.1,
                  }}
                >
                  {ROLE_LABEL[user?.role] || 'Portal'}
                </Typography>
              </Box>

              <PanelSwitcher sx={{ display: { xs: 'none', md: 'block' } }} />

              <Tooltip title="Notifications">
                <IconButton sx={{ color: palette.navy.dark }}>
                  <Badge badgeContent={0} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  ml: 1,
                  pl: 1.5,
                  borderLeft: '1px solid rgba(15,24,64,0.1)',
                  cursor: 'pointer',
                }}
                onClick={handleProfileMenuOpen}
              >
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: palette.navy.dark, lineHeight: 1.1 }}>
                    {user?.name || 'Member'}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.66rem',
                      color: palette.navy.light,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {user?.role || 'guest'}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: palette.maroon.main,
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 600,
                  }}
                >
                  {(user?.name || 'D').charAt(0).toUpperCase()}
                </Avatar>
              </Stack>

              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                PaperProps={{ sx: { mt: 1, minWidth: 180 } }}
              >
                <MenuItem
                  onClick={() => {
                    navigate('/profile');
                    handleProfileMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
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

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              px: { xs: 2, md: 4 },
              py: { xs: 3, md: 4 },
              bgcolor: palette.cream.default,
              minHeight: 'calc(100vh - 280px)',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      <CollegeFooter />
    </Box>
  );
};

export default Layout;
