import axios from './axiosInstance';

// admin login
export const adminLogin = (adminId, password) =>
  axios.post('/auth/admin/login', { adminId, password }).then((r) => r.data);

// student login (OTP send)
export const studentLogin = (studentId, password) =>
  axios.post('/auth/login', { studentId, password }).then((r) => r.data);

// verify OTP (returns token)
export const verifyOtp = (studentId, otp) =>
  axios.post('/auth/verify-otp', { studentId, otp }).then((r) => r.data);

// common password reset (for both admin and student by userId)
export const requestPasswordReset = (userId) =>
  axios.post('/auth/request-reset', { userId }).then((r) => r.data);

export const resetPassword = (userId, otp, newPassword) =>
  axios.post('/auth/reset-password', { userId, otp, newPassword }).then((r) => r.data);
