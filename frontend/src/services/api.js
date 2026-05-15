import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

// Incidents
export const getIncidents = (params) => API.get('/incidents', { params });
export const getIncident = (id) => API.get(`/incidents/${id}`);
export const createIncident = (data) => API.post('/incidents', data);
export const updateIncident = (id, data) => API.put(`/incidents/${id}`, data);
export const deleteIncident = (id) => API.delete(`/incidents/${id}`);
export const getMyIncidents = () => API.get('/incidents/mine');

// Comments
export const getComments = (incidentId) => API.get(`/incidents/${incidentId}/comments`);
export const addComment = (incidentId, data) => API.post(`/incidents/${incidentId}/comments`, data);

// Users
export const getUsers = () => API.get('/users');
export const updateUser = (id, data) => API.put(`/users/${id}`, data);

// Stats
export const getStats = () => API.get('/stats');

// Chat
export const sendChatMessage = (data) => API.post('/chat/message', data);
export const getChatHistory = () => API.get('/chat/history');

export default API;
