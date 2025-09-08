// Universal API util
// Foydalanish: import api from '../services/api';
// await api.get('/category/list');

import { useAuth } from '../context/AuthContext';

const BASE_URL = 'http://localhost:3000/api';

// Oddiy fetch wrapper
async function apiFetch(endpoint, { method = 'GET', body, token, ...options } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...options
  });
  // 401 bo'lsa, logout qilish uchun xabar
  if (res.status === 401) {
    const event = new CustomEvent('token-expired');
    window.dispatchEvent(event);
  }
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.message || 'Server error');
  }
  return data;
}

const api = {
  get: (endpoint, token) => apiFetch(endpoint, { method: 'GET', token }),
  post: (endpoint, body, token) => apiFetch(endpoint, { method: 'POST', body, token }),
  put: (endpoint, body, token) => apiFetch(endpoint, { method: 'PUT', body, token }),
  delete: (endpoint, token) => apiFetch(endpoint, { method: 'DELETE', token })
};

export default api; 