import React from 'react';
import { TableRow, TableCell, Chip, Button, Tooltip } from '@mui/material';
import { Visibility } from '@mui/icons-material';

const STATUS_COLORS = {
  pending:  { color: 'warning',  label: 'Pending' },
  approved: { color: 'success',  label: 'Approved' },
  rejected: { color: 'error',    label: 'Rejected' },
};

/**
 * LeaveRequestRow — single row in the Leave Approvals table.
 *
 * Props:
 *   row       {object}   Appointment document with populated student field
 *   onView    {function} Called with row when the View button is clicked
 */
const LeaveRequestRow = ({ row, onView }) => {
  const student = row.student || {};
  const leave = row.leaveRequest || {};
  const statusMeta = STATUS_COLORS[leave.status] || { color: 'default', label: leave.status };

  const requestDate = row.createdAt
    ? new Date(row.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <TableRow hover>
      <TableCell>{student.name || '—'}</TableCell>
      <TableCell>{student.studentId || '—'}</TableCell>
      <TableCell>{student.year || '—'}</TableCell>
      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Tooltip title={leave.reason || ''} placement="top">
          <span>{leave.reason || '—'}</span>
        </Tooltip>
      </TableCell>
      <TableCell>{leave.duration ? `${leave.duration} day${leave.duration > 1 ? 's' : ''}` : '—'}</TableCell>
      <TableCell>{requestDate}</TableCell>
      <TableCell>
        <Chip
          label={statusMeta.label}
          color={statusMeta.color}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </TableCell>
      <TableCell>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(row)}
          sx={{ textTransform: 'none' }}
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default LeaveRequestRow;
