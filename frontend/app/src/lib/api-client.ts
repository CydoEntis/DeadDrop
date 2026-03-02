/*
 * API Client - Axios instance with authentication and CSRF handling
 *
 * This module configures a shared Axios instance used by all API calls. It handles:
 *
 * 1. REQUEST INTERCEPTOR:
 *    - Attaches the JWT access token (Bearer) from the auth store to every request
 *    - Attaches the CSRF token to all state-changing requests (POST, PUT, PATCH, DELETE)
 *
 * 2. RESPONSE INTERCEPTOR:
 *    - Stores CSRF tokens returned by the server for future requests
 *    - On NOT_AUTHENTICATED or USER_NOT_FOUND errors: clears auth and redirects to login
 *    - On 401 (token expired): silently refreshes the access token via /api/auth/refresh
 *      and retries the original request. If refresh fails, clears auth and redirects.
 *
 * 3. TRANSFORM RESPONSE:
 *    - Converts relative avatar URLs to absolute URLs so images load correctly
 *
 * CUSTOMIZATION:
 * - The base URL comes from VITE_API_URL in your .env file
 * - Add endpoints to `isAuthEndpoint` if they should NOT trigger token refresh on 401
 * - ErrorHound interceptor (last line) standardizes error response formats
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { registerErrorHoundInterceptor, ErrorCodes } from "@/lib/errors";
import { useAuthStore } from '../stores/auth.store';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

// Read the CSRF token from the cookie set by the server, falling back to localStorage
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  if (match) {
    try {
      return decodeURIComponent(match[1].trim());
    } catch {
      return match[1].trim();
    }
  }
  return localStorage.getItem('csrfToken');
}

// Read the current access token directly from the Zustand store (outside of React)
function getAccessToken(): string | null {
  const state = useAuthStore.getState();
  return state.accessToken;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5135',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies (refresh token, CSRF) with every request
  transformResponse: [
    ...(axios.defaults.transformResponse as any[]),
    (data) => {
      // Convert relative avatar URLs to absolute so images load from the API server
      if (data?.data?.avatarUrl && !data.data.avatarUrl.startsWith('http')) {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5135';
        data.data.avatarUrl = `${baseURL}${data.data.avatarUrl}`;
      }
      return data;
    },
  ],
});

// REQUEST INTERCEPTOR: Attach auth and CSRF tokens to outgoing requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // CSRF tokens are only needed for state-changing HTTP methods
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle CSRF storage, auth errors, and silent token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Store CSRF tokens from response headers for future requests
    const csrfToken = response.headers['x-xsrf-token'];
    if (csrfToken) {
      localStorage.setItem('csrfToken', csrfToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const errorCode = error.response?.data?.error?.code;

    // If the server says we're not authenticated or user doesn't exist, bail to login
    if (errorCode === ErrorCodes.NOT_AUTHENTICATED || errorCode === ErrorCodes.USER_NOT_FOUND) {
      const clearAuth = useAuthStore.getState().clearAuth;
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Auth endpoints should NOT trigger silent refresh (would cause infinite loops)
    const isAuthEndpoint = requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/refresh') ||
      requestUrl.includes('/api/auth/forgot-password') ||
      requestUrl.includes('/api/auth/reset-password') ||
      requestUrl.includes('/api/auth/verify-email-change') ||
      requestUrl.includes('/api/auth/me') ||
      requestUrl.includes('/api/account');

    // 401 on a non-auth endpoint = access token expired, try refreshing silently
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const response = await apiClient.post('/api/auth/refresh', {});

        if (response.data?.data?.accessToken) {
          const setAccessToken = useAuthStore.getState().setAccessToken;
          setAccessToken(response.data.data.accessToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (token expired or revoked) - send to login
        const clearAuth = useAuthStore.getState().clearAuth;
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ErrorHound interceptor normalizes error responses into a consistent format
registerErrorHoundInterceptor(apiClient);

export default apiClient;
