import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, TablePagination, TextField, InputAdornment,
  Chip, Avatar, Alert, Skeleton, Drawer, Divider,
  CircularProgress, Stack,
} from '@mui/material';
import { Search, People, Person, Warning } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { fetchDepartmentStudents, fetchStudentMedicalSummary } from '../../services/hodService';

const DepartmentStudents = () => {
  const [page, setPage]         = useState(0);
  const [rowsPerPage]           = useState(20);
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Debounce ref — stored in a ref so clearTimeout always sees the latest timer id
  // without triggering re-renders and without polluting window globals.
  const debounceRef = useRef(null);

  // Clean up any pending timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400);
  }, []);

  const { data, isLoading, isError } = useQuery(
    ['hod-students', page, debouncedSearch],
    () => fetchDepartmentStudents({ page: page + 1, limit: rowsPerPage, search: debouncedSearch }),
    { keepPreviousData: true }
  );

  const { data: summary, isLoading: summaryLoading } = useQuery(
    ['hod-student-summary', selectedStudentId],
    () => fetchStudentMedicalSummary(selectedStudentId),
    { enabled: !!selectedStudentId }
  );

  const openSummary = (id) => {
    setSelectedStudentId(id);
    setPanelOpen(true);
  };
  const closePanel = () => {
    setPanelOpen(false);
    setSelectedStudentId(null);
  };

  const profile = summary?.profile || {};
  const apptHistory = summary?.appointments || [];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1e3a8a', width: 48, height: 48 }}>
          <People />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#1A365D">
            Department Students
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Read-only roster — {data?.total ?? '…'} students
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, roll no., or email…"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 360 } }}
        />
      </Paper>

      {/* Table */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isError && (
          <Alert severity="error" sx={{ m: 2 }}>Failed to load student roster.</Alert>
        )}
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Roll No.</b></TableCell>
              <TableCell><b>Year</b></TableCell>
              <TableCell><b>Programme</b></TableCell>
              <TableCell><b>Hostel</b></TableCell>
              <TableCell><b>Blood Group</b></TableCell>
              <TableCell><b>Medical Flags</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : (data?.students || []).map((s) => (
                  <TableRow
                    key={s._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openSummary(s._id)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#1e3a8a', fontSize: 13 }}>
                          {s.name?.charAt(0)}
                        </Avatar>
                        {s.name}
                        {s.isCurrentlyAdmitted && (
                          <Chip label="Admitted" color="warning" size="small" sx={{ ml: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{s.studentId}</TableCell>
                    <TableCell>{s.year}</TableCell>
                    <TableCell>{s.programme || '—'}</TableCell>
                    <TableCell>{s.hostel || '—'}</TableCell>
                    <TableCell>
                      <Chip label={s.bloodGroup || '?'} size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b' }} />
                    </TableCell>
                    <TableCell>
                      {s.chronicConditions?.length > 0 && (
                        <Chip
                          icon={<Warning sx={{ fontSize: 14 }} />}
                          label={`${s.chronicConditions.length} condition${s.chronicConditions.length > 1 ? 's' : ''}`}
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && !data?.students?.length && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  {debouncedSearch ? 'No students match your search.' : 'No students found.'}
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
          rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)}
        />
      </Paper>

      {/* Medical summary side panel (read-only) */}
      <Drawer
        anchor="right"
        open={panelOpen}
        onClose={closePanel}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}
      >
        {summaryLoading ? (
          <Box pt={4}><CircularProgress /></Box>
        ) : !summary ? (
          <Alert severity="error">Could not load student summary.</Alert>
        ) : (
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Avatar sx={{ bgcolor: '#1e3a8a', width: 48, height: 48 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography fontWeight="bold" color="#1A365D" variant="h6">{profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.studentId} · {profile.year} Year
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Quick stats */}
            <Stack direction="row" spacing={1.5} mb={2}>
              {[
                { label: 'Appointments',  val: summary.summary?.totalAppointments },
                { label: 'Leave Requests', val: summary.summary?.totalLeaveRequests },
                { label: 'Approved',       val: summary.summary?.approvedLeaves },
              ].map(({ label, val }) => (
                <Box key={label} sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h5" fontWeight="bold" color="#1A365D">{val ?? 0}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Stack>

            {/* Chronic conditions */}
            {summary.summary?.chronicConditions?.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" color="#1A365D" mb={1}>
                  Chronic Conditions
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {summary.summary.chronicConditions.map((c, i) => (
                    <Chip key={i} label={c} size="small" color="warning" variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Recent appointments */}
            <Typography variant="subtitle2" fontWeight="bold" color="#1A365D" mb={1}>
              Recent Appointments
            </Typography>
            {apptHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No appointments on record.</Typography>
            ) : (
              apptHistory.slice(0, 6).map((a) => (
                <Box key={a._id} sx={{ mb: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={600}>
                      {a.appointmentDate
                        ? new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </Typography>
                    <Chip label={a.status} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{a.symptoms || '—'}</Typography>
                </Box>
              ))
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default DepartmentStudents;
