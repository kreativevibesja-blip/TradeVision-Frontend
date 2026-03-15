const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  getProfile: (token: string) =>
    apiFetch<{ user: any }>('/auth/profile', { token }),

  // Analysis
  uploadChart: (formData: FormData, token: string) =>
    apiFetch<{ imageUrl: string; filename: string; pair: string; timeframe: string }>(
      '/upload-chart',
      { method: 'POST', body: formData, token }
    ),

  analyzeChart: (data: { imageUrl: string; pair: string; timeframe: string }, token: string) =>
    apiFetch<{ analysis: any }>('/analyze-chart', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getAnalyses: (token: string, page = 1) =>
    apiFetch<{ analyses: any[]; total: number; page: number; pages: number }>(
      `/analyses?page=${page}`,
      { token }
    ),

  getAnalysis: (id: string, token: string) =>
    apiFetch<{ analysis: any }>(`/analyses/${encodeURIComponent(id)}`, { token }),

  // Payments
  createPayment: (plan: string, token: string) =>
    apiFetch<{ orderId: string; approveUrl: string }>('/create-payment', {
      method: 'POST',
      body: JSON.stringify({ plan }),
      token,
    }),

  paymentSuccess: (orderId: string, token: string) =>
    apiFetch<{ success: boolean }>('/payment-success', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
      token,
    }),

  // Admin
  admin: {
    getDashboard: (token: string) =>
      apiFetch<any>('/admin/dashboard', { token }),
    getUsers: (token: string, search?: string, page = 1) =>
      apiFetch<any>(`/admin/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`, { token }),
    updateUser: (id: string, data: any, token: string) =>
      apiFetch<any>(`/admin/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    getAnalyses: (token: string, page = 1) =>
      apiFetch<any>(`/admin/analyses?page=${page}`, { token }),
    getPayments: (token: string, page = 1) =>
      apiFetch<any>(`/admin/payments?page=${page}`, { token }),
    getAnalytics: (token: string) =>
      apiFetch<any>('/admin/analytics', { token }),
    getPricingPlans: (token: string) =>
      apiFetch<any>('/admin/pricing-plans', { token }),
    updatePricingPlan: (id: string, data: any, token: string) =>
      apiFetch<any>(`/admin/pricing-plans/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    getSettings: (token: string) =>
      apiFetch<any>('/admin/settings', { token }),
    updateSetting: (data: { key: string; value: any }, token: string) =>
      apiFetch<any>('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    getAnnouncements: (token: string) =>
      apiFetch<any>('/admin/announcements', { token }),
    createAnnouncement: (data: { title: string; content: string }, token: string) =>
      apiFetch<any>('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },
};
