/*
 * API: auditApi
 *
 * Provides a function to fetch audit logs from the backend for admin review and monitoring.
 * Uses axios for HTTP requests.
 *
 * Exports:
 *   - getAuditLogs
 *
 * Usage:
 *   import { getAuditLogs } from './auditApi';
 */

import axios from './axiosInstance';

export const getAuditLogs = (params = {}) => axios.get('/audit', { params }).then((r) => r.data);
