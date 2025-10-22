/**
 * API: notificationsApi
 *
 * Provides a function to fetch notifications for the current user from the backend.
 * Uses axios for HTTP requests.
 *
 * Exports:
 *   - getMyNotifications
 *
 * Usage:
 *   import { getMyNotifications } from './notificationsApi';
 */

import axios from './axiosInstance';

export const getMyNotifications = () => axios.get('/notifications/mine').then(r=>r.data);
