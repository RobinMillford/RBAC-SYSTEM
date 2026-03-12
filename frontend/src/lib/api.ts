import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true, // Send httpOnly cookies on refresh requests
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Transparently unwrap the standard backend response envelope:
 *   { success: true, data: <actual payload>, timestamp: '...' }
 * so that all existing call-sites continue to work via `response.data.<field>`.
 */
api.interceptors.response.use((response) => {
  if (
    response.data !== null &&
    typeof response.data === 'object' &&
    response.data.success === true &&
    'data' in response.data
  ) {
    response.data = response.data.data;
  }
  return response;
});

export default api;
