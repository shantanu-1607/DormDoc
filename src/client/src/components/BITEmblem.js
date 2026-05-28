import React from 'react';
import { Box } from '@mui/material';

const BITEmblem = ({ size = 120, sx = {}, alt = 'Birla Institute of Technology, Mesra' }) => (
  <Box
    component="img"
    src="/assets/bit_logo.png"
    alt={alt}
    sx={{
      width: size,
      height: size,
      objectFit: 'contain',
      display: 'block',
      filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.18))',
      transition: 'transform 220ms ease, filter 220ms ease',
      '&:hover': {
        transform: 'scale(1.04)',
        filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.24))',
      },
      ...sx,
    }}
  />
);

export default BITEmblem;
