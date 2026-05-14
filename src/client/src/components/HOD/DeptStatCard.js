import React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';

/**
 * DeptStatCard — reusable stat card used on the HOD dashboard.
 *
 * Props:
 *   label    {string}   Card label
 *   value    {number|string}  Stat value; rendered large
 *   color    {string}   Left-border accent color
 *   loading  {boolean}  Shows skeleton when true
 */
const DeptStatCard = ({ label, value, color = '#3b82f6', loading = false }) => (
  <Card elevation={3} sx={{ borderRadius: 3, borderLeft: `6px solid ${color}` }}>
    <CardContent>
      <Typography color="text.secondary" gutterBottom fontSize={14}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={60} height={56} />
      ) : (
        <Box display="flex" alignItems="baseline" gap={0.5}>
          <Typography variant="h3" color="#1A365D" fontWeight="bold">
            {value ?? '—'}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export default DeptStatCard;
