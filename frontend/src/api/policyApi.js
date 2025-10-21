
import axios from './axiosInstance';

// Fetch a specific policy by name (default: Voting Policy)
export const getPolicy = (name = 'Voting Policy') => axios.get(`/policy?name=${encodeURIComponent(name)}`).then(r => r.data);
export const acceptPolicy = (name = 'Voting Policy') => axios.post('/policy/accept', { name }).then(r => r.data);
