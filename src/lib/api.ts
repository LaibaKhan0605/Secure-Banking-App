/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple robust API client for secure communication with backend APIs
let cachedCsrfToken = '';

// Check if we are running in browser context
const isBrowser = typeof window !== 'undefined';

export async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await fetch('/api/csrf-token');
    if (!res.ok) throw new Error('CSRF handshake rejected');
    const data = await res.json();
    cachedCsrfToken = data.csrfToken;
    return cachedCsrfToken;
  } catch (e) {
    console.warn('Could not establish CSRF security token:', e);
    return '';
  }
}

interface RequestOptions extends RequestInit {
  useApiKey?: string;
}

export async function secureRequest(url: string, options: RequestOptions = {}): Promise<any> {
  const headers = new Headers(options.headers || {});

  // 1. Add JWT Auth if saved in local storage or state
  const token = isBrowser ? localStorage.getItem('sb_auth_token') : null;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 2. Add API Key if supplied or specified
  if (options.useApiKey) {
    headers.set('X-API-KEY', options.useApiKey);
  }

  // 3. Add CSRF token for state-mutating requests (POST/PUT/DELETE)
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!cachedCsrfToken) {
      await fetchCsrfToken();
    }
    if (cachedCsrfToken) {
      headers.set('X-XSRF-TOKEN', cachedCsrfToken);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errData.message || errData.error || 'Request failure'
    };
  }

  return response.json();
}
