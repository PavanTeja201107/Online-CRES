import axios from './axiosInstance';

export const submitNomination = (formData) => axios.post('/nominations', formData, { headers: {'Content-Type':'multipart/form-data'}}).then(r=>r.data);
export const listByElection = (electionId) => axios.get(`/nominations/election/${electionId}`).then(r=>r.data);
