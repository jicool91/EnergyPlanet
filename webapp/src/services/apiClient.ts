/**
 * API Client (Axios)
 */

import axios from 'axios';
import { authStore } from '../store/authStore';

declare global {
  interface Window {
    __ENERGY_PLANET_API_URL__?: string;
  }
}

const LOCAL_FALLBACK = 'http://localhost:3000/api/v1';
const PRODUCTION_BACKEND = 'https://backgame-production.up.railway.app/api/v1';

function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_URL?.trim();
  if (explicit) {
    return explicit;
  }

  if (typeof window !== 'undefined') {
    const override = window.__ENERGY_PLANET_API_URL__?.trim();
    if (override) {
      return override;
    }

    const { protocol, host, hostname } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return LOCAL_FALLBACK;
    }

    // Production on Railway - use explicit backend URL
    if (hostname.includes('railway.app')) {
      return PRODUCTION_BACKEND;
    }

    if (host) {
      return `${protocol}//${host}/api/v1`;
    }
  }

  return LOCAL_FALLBACK;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  config => {
    const token = authStore.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStore.refreshToken;
        if (!refreshToken) {
          authStore.clearTokens();
          authStore.requestBootstrapRetry();
          return Promise.reject(error);
        }
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        authStore.setAccessToken(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, trigger bootstrap retry
        authStore.clearTokens();
        authStore.requestBootstrapRetry();
      }
    }

    return Promise.reject(error);
  }
);
