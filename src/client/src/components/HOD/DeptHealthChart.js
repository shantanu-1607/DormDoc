import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Box, Typography } from '@mui/material';

/**
 * DeptHealthChart — monthly leave trends line chart.
 *
 * Props:
 *   data  {Array}   monthlyLeaves array from /api/hod/analytics
 *                   Each item: { label: 'YYYY-MM', total, approved, rejected, pending }
 *   title {string}  Optional chart title
 */
const DeptHealthChart = ({ data = [], title = 'Monthly Leave Trends' }) => {
  if (!data.length) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">No trend data available yet.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" fontWeight="bold" color="#1A365D" mb={1}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const [, m] = v.split('-');
              return new Date(0, Number(m) - 1).toLocaleString('default', { month: 'short' });
            }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val, name) => [val, name.charAt(0).toUpperCase() + name.slice(1)]}
          />
          <Legend />
          <Line type="monotone" dataKey="total"    stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
          <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={false} name="Approved" />
          <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={false} name="Rejected" />
          <Line type="monotone" dataKey="pending"  stroke="#f59e0b" strokeWidth={2} dot={false} name="Pending" />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DeptHealthChart;
