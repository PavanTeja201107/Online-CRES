import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5500/api',
  withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// response interceptor: auto logout on 401 to keep frontend in-sync with backend session
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      console.error('Unauthorized (401) received from API. Clearing auth.');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // redirect to login
      try { window.location.href = '/'; } catch (e) {}
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
