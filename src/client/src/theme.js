import { createTheme } from '@mui/material/styles';

const MAROON = {
  main: '#7B1E1E',
  light: '#A23E3E',
  dark: '#5C0F0F',
  contrastText: '#FFFFFF',
};

const NAVY = {
  main: '#1A2B5C',
  light: '#3D4F87',
  dark: '#0D1840',
  contrastText: '#FFFFFF',
};

const CREAM = {
  default: '#FAF7F2',
  paper: '#FFFFFF',
  alt: '#F3EFE7',
};

const GOLD = '#D4A24C';
const INK = '#1A1A1A';
const MUTED = '#5A5A5A';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: MAROON,
    secondary: NAVY,
    success: { main: '#2F7D5A', contrastText: '#FFFFFF' },
    warning: { main: '#B8862B', contrastText: '#FFFFFF' },
    error:   { main: '#B0322B', contrastText: '#FFFFFF' },
    info:    { main: '#2D5A87', contrastText: '#FFFFFF' },
    background: {
      default: CREAM.default,
      paper: CREAM.paper,
    },
    text: {
      primary: INK,
      secondary: MUTED,
      disabled: '#9A9A9A',
    },
    divider: 'rgba(15, 24, 64, 0.08)',
    action: {
      hover: 'rgba(123, 30, 30, 0.04)',
      selected: 'rgba(123, 30, 30, 0.08)',
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
    },
    h2: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.25,
    },
    h4: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 600,
      letterSpacing: '-0.005em',
      lineHeight: 1.3,
    },
    h5: {
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h6: {
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: 0,
    },
    subtitle1: { fontWeight: 500, letterSpacing: 0.1 },
    subtitle2: { fontWeight: 500, letterSpacing: 0.1, color: MUTED },
    body1:     { fontSize: '1rem', lineHeight: 1.65 },
    body2:     { fontSize: '0.9rem', lineHeight: 1.6, color: MUTED },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    overline: {
      letterSpacing: '0.18em',
      fontSize: '0.7rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: MUTED,
    },
  },

  shadows: [
    'none',
    '0 1px 2px rgba(15, 24, 64, 0.04), 0 1px 1px rgba(15, 24, 64, 0.03)',
    '0 2px 4px rgba(15, 24, 64, 0.05), 0 1px 2px rgba(15, 24, 64, 0.04)',
    '0 4px 8px rgba(15, 24, 64, 0.06), 0 2px 4px rgba(15, 24, 64, 0.04)',
    '0 6px 12px rgba(15, 24, 64, 0.07), 0 3px 6px rgba(15, 24, 64, 0.04)',
    '0 8px 16px rgba(15, 24, 64, 0.08), 0 4px 8px rgba(15, 24, 64, 0.04)',
    '0 10px 20px rgba(15, 24, 64, 0.09), 0 6px 10px rgba(15, 24, 64, 0.04)',
    '0 12px 24px rgba(15, 24, 64, 0.1), 0 8px 12px rgba(15, 24, 64, 0.05)',
    '0 14px 28px rgba(15, 24, 64, 0.11), 0 10px 14px rgba(15, 24, 64, 0.05)',
    '0 16px 32px rgba(15, 24, 64, 0.12), 0 12px 16px rgba(15, 24, 64, 0.06)',
    '0 18px 36px rgba(15, 24, 64, 0.13), 0 14px 18px rgba(15, 24, 64, 0.06)',
    '0 20px 40px rgba(15, 24, 64, 0.14), 0 16px 20px rgba(15, 24, 64, 0.07)',
    '0 22px 44px rgba(15, 24, 64, 0.15), 0 18px 22px rgba(15, 24, 64, 0.07)',
    '0 24px 48px rgba(15, 24, 64, 0.16), 0 20px 24px rgba(15, 24, 64, 0.08)',
    '0 26px 52px rgba(15, 24, 64, 0.17), 0 22px 26px rgba(15, 24, 64, 0.08)',
    '0 28px 56px rgba(15, 24, 64, 0.18), 0 24px 28px rgba(15, 24, 64, 0.09)',
    '0 30px 60px rgba(15, 24, 64, 0.19), 0 26px 30px rgba(15, 24, 64, 0.09)',
    '0 32px 64px rgba(15, 24, 64, 0.2), 0 28px 32px rgba(15, 24, 64, 0.1)',
    '0 34px 68px rgba(15, 24, 64, 0.21), 0 30px 34px rgba(15, 24, 64, 0.1)',
    '0 36px 72px rgba(15, 24, 64, 0.22), 0 32px 36px rgba(15, 24, 64, 0.11)',
    '0 38px 76px rgba(15, 24, 64, 0.23), 0 34px 38px rgba(15, 24, 64, 0.11)',
    '0 40px 80px rgba(15, 24, 64, 0.24), 0 36px 40px rgba(15, 24, 64, 0.12)',
    '0 42px 84px rgba(15, 24, 64, 0.25), 0 38px 42px rgba(15, 24, 64, 0.12)',
    '0 44px 88px rgba(15, 24, 64, 0.26), 0 40px 44px rgba(15, 24, 64, 0.13)',
    '0 46px 92px rgba(15, 24, 64, 0.27), 0 42px 46px rgba(15, 24, 64, 0.13)',
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: CREAM.default,
          color: INK,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { background: CREAM.alt },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(123, 30, 30, 0.3)',
          borderRadius: 8,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(123, 30, 30, 0.5)',
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          fontWeight: 600,
          letterSpacing: 0.2,
          transition: 'transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease',
          '&:hover': { transform: 'translateY(-1px)' },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(123, 30, 30, 0.18)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(123, 30, 30, 0.28)',
          },
        },
        containedSecondary: {
          boxShadow: '0 4px 12px rgba(26, 43, 92, 0.18)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(26, 43, 92, 0.28)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(15, 24, 64, 0.06)',
          boxShadow: '0 1px 3px rgba(15, 24, 64, 0.04), 0 4px 12px rgba(15, 24, 64, 0.04)',
          transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            transition: 'box-shadow 180ms ease, border-color 180ms ease',
            '& fieldset': { borderColor: 'rgba(15, 24, 64, 0.16)' },
            '&:hover fieldset': { borderColor: 'rgba(123, 30, 30, 0.4)' },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(123, 30, 30, 0.12)',
            },
            '&.Mui-focused fieldset': {
              borderColor: MAROON.main,
              borderWidth: 1.5,
            },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: 0.2,
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: INK,
          borderBottom: '1px solid rgba(15, 24, 64, 0.08)',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: NAVY.dark,
          color: '#FFFFFF',
          borderRight: 'none',
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 8,
          marginBlock: 2,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(212, 162, 76, 0.16)',
            '&:hover': { backgroundColor: 'rgba(212, 162, 76, 0.22)' },
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: NAVY.dark,
          fontSize: '0.78rem',
          padding: '8px 12px',
          borderRadius: 6,
        },
        arrow: { color: NAVY.dark },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(15, 24, 64, 0.08)' },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid currentColor',
          backgroundColor: 'transparent',
        },
        standardSuccess: { color: '#2F7D5A' },
        standardError:   { color: '#B0322B' },
        standardWarning: { color: '#B8862B' },
        standardInfo:    { color: '#2D5A87' },
      },
    },
  },
});

export const palette = {
  maroon: MAROON,
  navy: NAVY,
  cream: CREAM,
  gold: GOLD,
};

export default theme;
