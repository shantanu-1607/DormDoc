import React from 'react';
import { Box } from '@mui/material';

const BITEmblem = ({ size = 120, sx = {} }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))',
        },
        ...sx
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
        }}
      >
        {/* Outer red ring with gradient */}
        <defs>
          <radialGradient id="redGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: '#E53E3E', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#C41E3A', stopOpacity: 1 }} />
          </radialGradient>
          <radialGradient id="gearGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: '#A0A0A0', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#808080', stopOpacity: 1 }} />
          </radialGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="url(#redGradient)"
          stroke="#fff"
          strokeWidth="2"
        />
        
        {/* Inner white ring */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
        />
        
        {/* Central grey gear with gradient */}
        <circle
          cx="60"
          cy="60"
          r="35"
          fill="url(#gearGradient)"
        />
        
        {/* Gear teeth */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const x1 = 60 + 35 * Math.cos(angle);
          const y1 = 60 + 35 * Math.sin(angle);
          const x2 = 60 + 40 * Math.cos(angle);
          const y2 = 60 + 40 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#808080"
              strokeWidth="3"
            />
          );
        })}
        
        {/* Atomic symbol */}
        <g transform="translate(60, 45)">
          <circle cx="0" cy="0" r="3" fill="#000" />
          <ellipse cx="0" cy="0" rx="8" ry="4" fill="none" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="0" cy="0" rx="8" ry="4" fill="none" stroke="#000" strokeWidth="1.5" transform="rotate(60)" />
          <ellipse cx="0" cy="0" rx="8" ry="4" fill="none" stroke="#000" strokeWidth="1.5" transform="rotate(120)" />
        </g>
        
        {/* Open book with gradient */}
        <g transform="translate(60, 75)">
          <rect x="-8" y="-2" width="16" height="4" fill="url(#goldGradient)" stroke="#000" strokeWidth="0.5" />
          <rect x="-6" y="-1" width="2" height="2" fill="#000" />
          <rect x="-2" y="-1" width="2" height="2" fill="#000" />
          <rect x="2" y="-1" width="2" height="2" fill="#000" />
        </g>
        
        {/* Hindi text - बिरला प्रौद्योगिकी संस्थान */}
        <text
          x="60"
          y="20"
          textAnchor="middle"
          fill="#fff"
          fontSize="8"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          बिरला प्रौद्योगिकी संस्थान
        </text>
        
        {/* English text - BIRLA INSTITUTE OF TECHNOLOGY */}
        <text
          x="60"
          y="35"
          textAnchor="middle"
          fill="#fff"
          fontSize="7"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          BIRLA INSTITUTE OF TECHNOLOGY
        </text>
        
        {/* Sanskrit motto - सा विद्या या विमुक्तये */}
        <text
          x="60"
          y="105"
          textAnchor="middle"
          fill="#fff"
          fontSize="6"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          सा विद्या या विमुक्तये
        </text>
        
        {/* RANCHI */}
        <text
          x="60"
          y="115"
          textAnchor="middle"
          fill="#fff"
          fontSize="6"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          RANCHI
        </text>
      </svg>
    </Box>
  );
};

export default BITEmblem;
