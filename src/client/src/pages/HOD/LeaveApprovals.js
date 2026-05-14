import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
  TableRow, TablePagination, Select, MenuItem, FormControl,
  InputLabel, Drawer, Divider, Button, TextField, Alert,
  CircularProgress, Chip, Stack, Skeleton, Avatar,
} from '@mui/material';
import {
  Assignment, CheckCircle, Cancel, Person, MedicalServices,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import LeaveRequestRow from '../../components/HOD/LeaveRequestRow';
import {
  fetchLeaveRequests,
  fetchLeaveRequestDetail,
  submitLeaveDecision,
} from '../../services/hodService';

const STATUS_CHIP = {
  pending:  <Chip label="Pending"  color="warning" size="small" />,
  approved: <Chip label="Approved" color="success" size="small" />,
  rejected: <Chip label="Rejected" color="error"   size="small" />,
};

const LeaveApprovals = () => {
  const qc = useQueryClient();

  // Table state
  const [page, setPage]         = useState(0);
  const [rowsPerPage]           = useState(15);
  const [statusFilter, setStatusFilter] = useState('');

  // Side panel state
  const [selectedId, setSelectedId]   = useState(null);
  const [panelOpen, setPanelOpen]     = useState(false);
  const [action, setAction]           = useState('');
  const [comments, setComments]       = useState('');
  const [decisionError, setDecisionError] = useState('');

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery(
    ['hod-leaves', page, statusFilter],
    () => fetchLeaveRequests({ page: page + 1, limit: rowsPerPage, status: statusFilter || undefined }),
    { keepPreviousData: true }
  );

  const { data: detail, isLoading: detailLoading } = useQuery(
    ['hod-leave-detail', selectedId],
    () => fetchLeaveRequestDetail(selectedId),
    { enabled: !!selectedId }
  );

  // ── Decision mutation ──────────────────────────────────────────────────────
  const mutation = useMutation(
    ({ id, body }) => submitLeaveDecision(id, body),
    {
      onSuccess: (res) => {
        toast.success(`Leave request ${res.appointment?.leaveRequest?.status} successfully`);
        qc.invalidateQueries('hod-leaves');
        qc.invalidateQueries(['hod-leave-detail', selectedId]);
        qc.invalidateQueries('hod-dashboard');
        closePanel();
      },
      onError: (err) => {
        const msg = err.response?.data?.error || 'Failed to submit decision';
        setDecisionError(msg);
      },
    }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openPanel = (row) => {
    setSelectedId(row._id);
    setPanelOpen(true);
    setAction('');
    setComments('');
    setDecisionError('');
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedId(null);
    setAction('');
    setComments('');
    setDecisionError('');
  };

  const handleDecision = () => {
    setDecisionError('');
    if (!action) { setDecisionError('Please select Approve or Reject.'); return; }
    if (action === 'rejected' && !comments.trim()) {
      setDecisionError('Comments are required when rejecting a request.');
      return;
    }
    mutation.mutate({ id: selectedId, body: { action, comments } });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const appt = detail?.appointment;
  const student = appt?.student || {};
  const leave = appt?.leaveRequest || {};
  const isDecided = leave.status && leave.status !== 'pending';

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1e3a8a', width: 48, height: 48 }}>
          <Assignment />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#1A365D">
            Leave Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and action department medical leave requests
          </Typography>
        </Box>
      </Box>

      {/* Filter bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isError && (
          <Alert severity="error" sx={{ m: 2 }}>Failed to load leave requests.</Alert>
        )}
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell><b>Student</b></TableCell>
              <TableCell><b>Roll No.</b></TableCell>
              <TableCell><b>Year</b></TableCell>
              <TableCell><b>Reason</b></TableCell>
              <TableCell><b>Duration</b></TableCell>
              <TableCell><b>Requested On</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Action</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : (data?.items || []).map((row) => (
                  <LeaveRequestRow key={row._id} row={row} onView={openPanel} />
                ))}
            {!isLoading && !data?.items?.length && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)}
        />
      </Paper>

      {/* Detail side panel */}
      <Drawer anchor="right" open={panelOpen} onClose={closePanel}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}
      >
        {detailLoading ? (
          <Box pt={4}><CircularProgress /></Box>
        ) : !appt ? (
          <Alert severity="error">Could not load leave details.</Alert>
        ) : (
          <Box>
            {/* Student info */}
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Avatar sx={{ bgcolor: '#1e3a8a' }}><Person /></Avatar>
              <Box>
                <Typography fontWeight="bold" color="#1A365D">{student.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {student.studentId} · {student.year} Year · {student.department}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Leave details */}
            <Typography variant="subtitle2" fontWeight="bold" color="#1A365D" mb={1}>
              Leave Details
            </Typography>
            <Stack spacing={1} mb={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Duration</Typography>
                <Typography variant="body2" fontWeight={600}>{leave.duration} day{leave.duration > 1 ? 's' : ''}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <span>{STATUS_CHIP[leave.status] || leave.status}</span>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Reason</Typography>
                <Typography variant="body2">{leave.reason || '—'}</Typography>
              </Box>
            </Stack>

            {/* Consultation info */}
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight="bold" color="#1A365D" mb={1} display="flex" alignItems="center" gap={0.5}>
              <MedicalServices fontSize="small" /> Consultation
            </Typography>
            <Stack spacing={0.5} mb={2}>
              <Typography variant="body2">
                <b>Symptoms:</b> {appt.symptoms || '—'}
              </Typography>
              <Typography variant="body2">
                <b>Diagnosis:</b> {appt.diagnosis || '—'}
              </Typography>
              <Typography variant="body2">
                <b>Doctor:</b> {appt.doctor?.name || '—'} {appt.doctor?.specialization ? `(${appt.doctor.specialization})` : ''}
              </Typography>
            </Stack>

            {/* Previous decisions */}
            {detail?.approvalHistory?.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight="bold" color="#1A365D" mb={1}>
                  Decision History
                </Typography>
                {detail.approvalHistory.map((h) => (
                  <Box key={h._id} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={600}>{h.deciderName}</Typography>
                      <Chip label={h.action} color={h.action === 'approved' ? 'success' : 'error'} size="small" />
                    </Box>
                    {h.comments && (
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{h.comments}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(h.decidedAt).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            {/* Decision form — only for pending requests */}
            {!isDecided && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight="bold" color="#1A365D" mb={1}>
                  Your Decision
                </Typography>

                {decisionError && (
                  <Alert severity="error" sx={{ mb: 1.5 }}>{decisionError}</Alert>
                )}

                <Stack direction="row" spacing={1} mb={2}>
                  <Button
                    variant={action === 'approved' ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => setAction('approved')}
                    sx={{ flex: 1, textTransform: 'none' }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant={action === 'rejected' ? 'contained' : 'outlined'}
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setAction('rejected')}
                    sx={{ flex: 1, textTransform: 'none' }}
                  >
                    Reject
                  </Button>
                </Stack>

                <TextField
                  label={action === 'rejected' ? 'Reason for rejection (required)' : 'Comments (optional)'}
                  multiline
                  rows={3}
                  fullWidth
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  required={action === 'rejected'}
                  sx={{ mb: 2 }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  disabled={!action || mutation.isLoading}
                  onClick={handleDecision}
                  sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' }, textTransform: 'none' }}
                >
                  {mutation.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Submit Decision'}
                </Button>
              </>
            )}

            {isDecided && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This leave request has already been {leave.status}.
              </Alert>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default LeaveApprovals;
