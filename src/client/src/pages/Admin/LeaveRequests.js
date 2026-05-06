import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assignment,
  Person,
  School,
  Phone,
  Email,
  AccessTime,
  CheckCircle,
  Cancel,
  Warning,
  Visibility,
  Download,
  Print,
  FilterList,
  Search,
  Refresh,
  MedicalServices,
  LocalHospital,
  CalendarToday,
  Description,
  AttachFile,
  ExpandMore,
  Pending,
  Approved,
  Rejected,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const LeaveRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const queryClient = useQueryClient();

  // Fetch leave requests
  const { data: leaveRequests, isLoading, error } = useQuery(
    'leaveRequests',
    async () => {
      const response = await axios.get('/api/admin/leave-requests');
      return response.data;
    },
    {
      select: (data) => Array.isArray(data) ? data : [],
      retry: 1,
    }
  );

  // Update leave request mutation
  const updateRequestMutation = useMutation(
    async ({ requestId, action, notes }) => {
      const response = await axios.put(`/api/admin/leave-requests/${requestId}`, {
        status: action,
        adminNotes: notes,
        reviewedAt: new Date().toISOString(),
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leaveRequests');
        toast.success('Leave request updated successfully!');
        setOpenAction(false);
        setOpenDetails(false);
        setSelectedRequest(null);
        setAdminNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update request');
      },
    }
  );

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setOpenDetails(true);
  };

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setOpenAction(true);
  };

  const handleSubmitAction = () => {
    if (selectedRequest && actionType) {
      updateRequestMutation.mutate({
        requestId: selectedRequest._id,
        action: actionType,
        notes: adminNotes,
      });
    }
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedRequest(null);
  };

  const handleCloseAction = () => {
    setOpenAction(false);
    setSelectedRequest(null);
    setActionType('');
    setAdminNotes('');
  };

  // Filter requests
  const filteredRequests = (leaveRequests || []).filter((request) => {
    const matchesSearch = request.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.studentRollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || request.status === filterStatus;
    const matchesDate = !filterDate || new Date(request.createdAt).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      default: return <Warning />;
    }
  };

  const getStatusChip = (status) => {
    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    
    return (
      <Chip
        icon={getStatusIcon(status)}
        label={statusLabels[status] || status}
        color={getStatusColor(status)}
        size="small"
      />
    );
  };

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load leave requests. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Leave Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage student leave applications based on prescriptions
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              const dataStr = JSON.stringify(leaveRequests, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `leave-requests-${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries('leaveRequests')}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Pending />
                </Avatar>
                <Box>
                  <Typography variant="h4">{pendingRequests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{approvedRequests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Cancel />
                </Avatar>
                <Box>
                  <Typography variant="h4">{rejectedRequests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h4">{filteredRequests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Filter by Date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterDate('');
                }}
                fullWidth
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for different status */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={pendingRequests.length} color="warning">
                  Pending
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={approvedRequests.length} color="success">
                  Approved
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={rejectedRequests.length} color="error">
                  Rejected
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Prescription</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                let requestsToShow = [];
                switch (tabValue) {
                  case 0: requestsToShow = pendingRequests; break;
                  case 1: requestsToShow = approvedRequests; break;
                  case 2: requestsToShow = rejectedRequests; break;
                  default: requestsToShow = filteredRequests;
                }
                
                return requestsToShow.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {request.studentName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {request.studentName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.studentRollNo}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {request.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.duration} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.prescriptionId ? 'Attached' : 'None'}
                        color={request.prescriptionId ? 'success' : 'default'}
                        size="small"
                        icon={request.prescriptionId ? <AttachFile /> : <Warning />}
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusChip(request.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDetails(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleAction(request, 'approved')}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleAction(request, 'rejected')}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6">Leave Request Details</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRequest?.studentName} - {selectedRequest?.studentRollNo}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student Name"
                  value={selectedRequest.studentName}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  value={selectedRequest.studentRollNo}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedRequest.studentEmail}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedRequest.studentPhone}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  value={selectedRequest.duration}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedRequest.status}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  value={selectedRequest.reason}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Student Notes"
                  multiline
                  rows={2}
                  value={selectedRequest.studentNotes || 'No additional notes'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {selectedRequest.prescriptionId && (
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Prescription Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        Prescription ID: {selectedRequest.prescriptionId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Medical condition and prescribed medications are attached to this leave request.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}
              {selectedRequest.adminNotes && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Admin Notes"
                    multiline
                    rows={2}
                    value={selectedRequest.adminNotes}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button
                color="success"
                onClick={() => handleAction(selectedRequest, 'approved')}
              >
                Approve
              </Button>
              <Button
                color="error"
                onClick={() => handleAction(selectedRequest, 'rejected')}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={openAction} onClose={handleCloseAction} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Admin Notes"
            multiline
            rows={4}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder={`Add notes for ${actionType === 'approved' ? 'approval' : 'rejection'}...`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAction}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'approved' ? 'success' : 'error'}
            onClick={handleSubmitAction}
            disabled={updateRequestMutation.isLoading}
          >
            {updateRequestMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              actionType === 'approved' ? 'Approve' : 'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveRequests;