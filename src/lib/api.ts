import { MarketState, Agent } from './types';

const API_URL = '/api';

/**
 * Helper to fetch with auth token
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('echelon_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Authentication API
 */
export const authApi = {
    register: (data: any) => fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    login: (data: any) => fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    me: () => fetchWithAuth('/auth/me'),
};

/**
 * Simulation API
 */
export const simulationApi = {
    create: (data: any) => fetchWithAuth('/simulation/create', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    get: (id: string) => fetchWithAuth(`/simulation/${id}`),
    list: () => fetchWithAuth('/simulation/user/list'),
};

/**
 * Report API
 */
export const reportApi = {
    generate: (data: any) => fetchWithAuth('/report/generate', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
