import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  School,
  LocalHospital,
  AdminPanelSettings,
  SupervisorAccount,
  FamilyRestroom,
  CheckRounded,
  KeyboardArrowDown,
  VisibilityRounded,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  useViewAs,
  ROLES_ALLOWED_TO_SWITCH,
  VIEW_AS_ROLES,
} from '../contexts/ViewAsContext';
import { palette } from '../theme';

const ROLE_META = {
  student: { label: 'Student',  icon: <School fontSize="small" /> },
  doctor:  { label: 'Doctor',   icon: <LocalHospital fontSize="small" /> },
  hod:     { label: 'HOD',      icon: <SupervisorAccount fontSize="small" /> },
  admin:   { label: 'Admin',    icon: <AdminPanelSettings fontSize="small" /> },
  parent:  { label: 'Parent',   icon: <FamilyRestroom fontSize="small" /> },
};

const PanelSwitcher = ({ size = 'small', sx = {} }) => {
  const { user } = useAuth();
  const { viewAsRole, setViewAsRole } = useViewAs();
  const [anchor, setAnchor] = useState(null);

  if (!user || !ROLES_ALLOWED_TO_SWITCH.has(user.role)) return null;

  const activeRole = viewAsRole || user.role;
  const activeMeta = ROLE_META[activeRole] || ROLE_META[user.role];
  const isViewingAs = !!viewAsRole && viewAsRole !== user.role;

  const handleSelect = (role) => {
    setViewAsRole(role === user.role ? null : role);
    setAnchor(null);
  };

  return (
    <Box sx={sx}>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        size={size}
        variant="outlined"
        startIcon={<VisibilityRounded fontSize="small" />}
        endIcon={<KeyboardArrowDown fontSize="small" />}
        sx={{
          borderColor: isViewingAs ? palette.maroon.main : 'rgba(15,24,64,0.16)',
          color: isViewingAs ? palette.maroon.main : palette.navy.dark,
          backgroundColor: '#FFFFFF',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: 0,
          '&:hover': { borderColor: palette.maroon.main, backgroundColor: '#FFFFFF' },
        }}
      >
        Viewing as&nbsp;
        <Box component="span" sx={{ color: palette.maroon.main, fontWeight: 700 }}>
          {activeMeta.label}
        </Box>
        {isViewingAs && (
          <Chip
            size="small"
            label="preview"
            sx={{
              ml: 1,
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              backgroundColor: `${palette.maroon.main}1f`,
              color: palette.maroon.main,
            }}
          />
        )}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography
            variant="overline"
            sx={{ color: palette.navy.light, letterSpacing: '0.18em' }}
          >
            Switch panel
          </Typography>
        </Box>
        {VIEW_AS_ROLES.map((role) => {
          const meta = ROLE_META[role];
          const isActive = role === activeRole;
          const isOwn = role === user.role;
          return (
            <MenuItem
              key={role}
              onClick={() => handleSelect(role)}
              selected={isActive}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon sx={{ color: palette.navy.dark }}>{meta.icon}</ListItemIcon>
              <ListItemText
                primary={meta.label}
                secondary={isOwn ? 'Your panel' : 'Preview view'}
                primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }}
                secondaryTypographyProps={{ fontSize: '0.72rem' }}
              />
              {isActive && (
                <CheckRounded fontSize="small" sx={{ color: palette.maroon.main, ml: 1 }} />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default PanelSwitcher;
