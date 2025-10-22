/**
 * API: policyApi
 *
 * Provides functions to fetch and accept policies from the backend, such as the Voting Policy.
 * Uses axios for HTTP requests.
 *
 * Exports:
 *   - getPolicy, acceptPolicy
 *
 * Usage:
 *   import { getPolicy, acceptPolicy } from './policyApi';
 */

import axios from './axiosInstance';

// Fetch a specific policy by name (default: Voting Policy)
export const getPolicy = async (name = 'Voting Policy') => {
	// The backend returns an array of both policies, so filter for the requested one
	const res = await axios.get('/policy');
	const arr = res.data;
	if (Array.isArray(arr)) {
		return arr.find(p => p.name === name) || {};
	}
	return {};
};
export const acceptPolicy = (name = 'Voting Policy') => axios.post('/policy/accept', { name }).then(r => r.data);
