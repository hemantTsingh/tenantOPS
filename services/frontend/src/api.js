import axios from 'axios';

const API = axios.create({
  baseURL: window.location.port === '3000' 
    ? `http://${window.location.hostname}:4000`
    : '',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
