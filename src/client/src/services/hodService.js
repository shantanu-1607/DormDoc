/**
 * hodService.js — API client for all /api/hod/* endpoints.
 *
 * Axios Authorization header is managed globally by AuthContext (legacy JWT).
 * For Clerk-authenticated HODs the header is absent; the backend dev bypass
 * handles this in development. Production Clerk↔JWT bridging is handled
 * server-side during auth sync.
 */
import axios from 'axios';

const BASE = '/api/hod';

export const fetchDashboardStats = () =>
  axios.get(`${BASE}/dashboard`).then((r) => r.data);

export const fetchLeaveRequests = (params) =>
  axios.get(`${BASE}/leave-requests`, { params }).then((r) => r.data);

export const fetchLeaveRequestDetail = (id) =>
  axios.get(`${BASE}/leave-requests/${id}`).then((r) => r.data);

export const submitLeaveDecision = (id, body) =>
  axios.put(`${BASE}/leave-requests/${id}/decision`, body).then((r) => r.data);

export const fetchDepartmentStudents = (params) =>
  axios.get(`${BASE}/students`, { params }).then((r) => r.data);

export const fetchStudentMedicalSummary = (studentId) =>
  axios.get(`${BASE}/students/${studentId}/medical-summary`).then((r) => r.data);

export const fetchActiveCases = () =>
  axios.get(`${BASE}/active-cases`).then((r) => r.data);

export const fetchAnalytics = () =>
  axios.get(`${BASE}/analytics`).then((r) => r.data);

export const downloadMonthlyReport = async (year, month) => {
  const response = await axios.get(`${BASE}/reports/monthly`, {
    params: { year, month },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `hod-report-${year}-${String(month).padStart(2, '0')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
