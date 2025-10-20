import axios from './axiosInstance';

export const getPolicy = () => axios.get('/policy').then(r => r.data);
export const listPolicies = () => axios.get('/policy/list').then(r => r.data);
export const getPolicyById = (id) => axios.get(`/policy/${id}`).then(r => r.data);
export const acceptPolicy = (policy_id) => axios.post('/policy/accept', { policy_id }).then(r => r.data);
