/**
 * API: studentsApi
 *
 * Provides functions to interact with student-related backend endpoints, including profile retrieval
 * and password reset flows. Uses axios for HTTP requests.
 *
 * Exports:
 *   - getMyProfile, requestPasswordReset, resetPassword
 *
 * Usage:
 *   import { getMyProfile } from './studentsApi';
 */

import axios from './axiosInstance';

export const getMyProfile = () => axios.get('/students/me').then(r=>r.data);

export const requestPasswordReset = (userId) => axios.post('/auth/request-reset', { userId }).then(r=>r.data);
export const resetPassword = (userId, otp, newPassword) => axios.post('/auth/reset-password', { userId, otp, newPassword }).then(r=>r.data);
