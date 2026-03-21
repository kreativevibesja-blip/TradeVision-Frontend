const DEFAULT_API_URL = 'http://localhost:4000/api';

const normalizeApiUrl = (value?: string) => {
  const rawValue = value?.trim();
  if (!rawValue) {
    return DEFAULT_API_URL;
  }

  try {
    const parsedUrl = new URL(rawValue);
    const normalizedPath = parsedUrl.pathname === '/' ? '/api' : parsedUrl.pathname.replace(/\/$/, '');
    parsedUrl.pathname = normalizedPath.endsWith('/api') ? normalizedPath : `${normalizedPath}/api`;
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return rawValue.replace(/\/$/, '').endsWith('/api')
      ? rawValue.replace(/\/$/, '')
      : `${rawValue.replace(/\/$/, '')}/api`;
  }
};

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
const API_ORIGIN = API_URL.replace(/\/api$/, '');

export const resolveAssetUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
};

export interface AnalysisResult {
  id: string;
  imageUrl?: string;
  pair: string;
  timeframe: string;
  assetClass?: string | null;
  bias?: string;
  confidence: number;
  currentPrice: number;
  trend: 'bullish' | 'bearish' | 'ranging';
  structure: {
    state?: 'higher highs' | 'lower lows' | 'transition';
    bos: 'bullish' | 'bearish' | 'none';
    choch: 'bullish' | 'bearish' | 'none';
  };
  liquidity: {
    type?: 'buy-side' | 'sell-side' | 'none';
    description?: string;
    sweep: 'above highs' | 'below lows' | 'none';
    liquidityZones: string[];
  };
  zones: {
    supplyZone: {
      min: number | null;
      max: number | null;
      reason?: 'order block' | 'imbalance' | 'previous structure';
    } | null;
    demandZone: {
      min: number | null;
      max: number | null;
      reason?: 'order block' | 'imbalance' | 'previous structure';
    } | null;
  };
  pricePosition?: {
    location: 'premium' | 'discount' | 'equilibrium';
    explanation: string;
  };
  currentPricePosition: 'premium' | 'discount' | 'equilibrium';
  entryPlan?: {
    bias: 'buy' | 'sell' | 'none';
    entryType: 'instant' | 'confirmation' | 'none';
    entryZone: {
      min: number | null;
      max: number | null;
    } | null;
    confirmation: 'CHoCH' | 'BOS' | 'rejection' | 'none';
    reason: string;
  };
  entryLogic: {
    type: 'reversal' | 'continuation' | 'none';
    entryZone: {
      min: number | null;
      max: number | null;
    } | null;
    confirmationRequired: boolean;
    confirmationType: 'bos' | 'choch' | 'rejection' | 'none';
  };
  riskManagement?: {
    invalidationLevel: number | null;
    invalidationReason: string;
  };
  quality?: {
    setupRating: 'A' | 'B' | 'C' | 'avoid';
    confidence: number;
  };
  setupQuality: 'high' | 'medium' | 'low';
  finalVerdict?: {
    action: 'enter' | 'wait' | 'avoid';
    message: string;
  };
  signalType: 'instant' | 'pending' | 'wait';
  reasoning: string;
  entryZone: {
    min: number | null;
    max: number | null;
  } | null;
  confirmation: 'bos' | 'choch' | 'rejection' | 'none';
  confirmationNeeded: boolean;
  message: string;
  recommendation: 'wait' | 'pending' | 'instant';
  invalidationLevel?: number | null;
  invalidationReason?: string;
  originalImageUrl?: string | null;
  markedImageUrl?: string | null;
  hasMarkup?: boolean;
  chartBounds?: {
    minPrice: number;
    maxPrice: number;
    source: 'input' | 'inferred';
  } | null;
  stopLoss?: number | null;
  takeProfit1?: number | null;
  takeProfit2?: number | null;
  takeProfit3?: number | null;
  provider: 'tradevision';
  createdAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  isExpired?: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'ACCOUNT' | 'BILLING' | 'ANALYSIS' | 'BUG' | 'FEATURE' | 'GENERAL';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  whatsappNumber: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  message: string;
  adminNotes: string | null;
  adminResponse: string | null;
  respondedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canReplyByWhatsApp: boolean;
  canReplyByEmail: boolean;
}

export interface BillingSummary {
  currentPlan: 'FREE' | 'PRO';
  status: 'free' | 'active' | 'expired' | 'cancelled';
  expiresAt: string | null;
  lastPaymentAt: string | null;
  canceledAt: string | null;
  canCancel: boolean;
  canRenew: boolean;
  recentPayments: Array<{
    id: string;
    paypalOrderId: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    plan: 'FREE' | 'PRO';
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: 'FREE' | 'PRO';
  price: number;
  features: string[];
  dailyLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

  getActiveAnnouncements: () =>
    apiFetch<{ announcements: Announcement[] }>('/admin/public-announcements'),

  getPublicPricingPlans: () =>
    apiFetch<{ plans: PricingPlan[] }>('/admin/public-pricing-plans'),

  // Analysis
  analyzeChartUpload: (formData: FormData, token: string) =>
    apiFetch<{ analysis: AnalysisResult }>('/analyze-chart', { method: 'POST', body: formData, token }),

  getAnalyses: (token: string, page = 1) =>
    apiFetch<{ analyses: AnalysisResult[]; total: number; page: number; pages: number }>(
      `/analyses?page=${page}`,
      { token }
    ),

  getAnalysis: (id: string, token: string) =>
    apiFetch<{ analysis: AnalysisResult }>(`/analyses/${encodeURIComponent(id)}`, { token }),

  // Payments
  getPayPalClientToken: (token: string) =>
    apiFetch<{ clientToken: string }>('/paypal-client-token', { token }),
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
  getBillingSummary: (token: string) =>
    apiFetch<{ billing: BillingSummary }>('/billing-summary', { token }),
  cancelSubscription: (token: string) =>
    apiFetch<{ success: boolean; billing: BillingSummary }>('/cancel-subscription', {
      method: 'POST',
      token,
    }),

  // Tickets
  createTicket: (
    data: {
      subject: string;
      category: TicketCategory;
      priority: TicketPriority;
      message: string;
      whatsappNumber?: string;
    },
    token: string
  ) =>
    apiFetch<{ ticket: SupportTicket }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  getMyTickets: (token: string, page = 1) =>
    apiFetch<{ tickets: SupportTicket[]; total: number; page: number; pages: number }>(`/tickets/mine?page=${page}`, { token }),

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
    getAnalytics: (token: string, range?: { from?: string; to?: string }) => {
      const params = new URLSearchParams();
      if (range?.from) params.set('from', range.from);
      if (range?.to) params.set('to', range.to);
      const query = params.toString();
      return apiFetch<any>(`/admin/analytics${query ? `?${query}` : ''}`, { token });
    },
    getPricingPlans: (token: string) =>
      apiFetch<any>('/admin/pricing-plans', { token }),
    createPricingPlan: (data: any, token: string) =>
      apiFetch<any>('/admin/pricing-plans', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updatePricingPlan: (id: string, data: any, token: string) =>
      apiFetch<any>(`/admin/pricing-plans/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    deletePricingPlan: (id: string, token: string) =>
      apiFetch<any>(`/admin/pricing-plans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
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
      apiFetch<{ announcements: Announcement[] }>('/admin/announcements', { token }),
    createAnnouncement: (data: { title: string; content: string; durationValue?: number; durationUnit?: 'hours' | 'days' }, token: string) =>
      apiFetch<{ announcement: Announcement }>('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    getTickets: (
      token: string,
      filters?: { page?: number; search?: string; status?: TicketStatus | 'ALL'; priority?: TicketPriority | 'ALL'; dateRange?: '7d' | '30d' | '90d' | 'all' }
    ) => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.search) params.set('search', filters.search);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.priority && filters.priority !== 'ALL') params.set('priority', filters.priority);
      if (filters?.dateRange) params.set('dateRange', filters.dateRange);
      const query = params.toString();
      return apiFetch<{ tickets: SupportTicket[]; total: number; page: number; pages: number }>(`/admin/tickets${query ? `?${query}` : ''}`, { token });
    },
    getOpenTicketCount: (token: string) =>
      apiFetch<{ count: number }>('/admin/tickets/count', { token }),
    updateTicket: (
      id: string,
      data: { status?: TicketStatus; adminNotes?: string; adminResponse?: string },
      token: string
    ) =>
      apiFetch<{ ticket: SupportTicket }>(`/admin/tickets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    deleteAnnouncement: (id: string, token: string) =>
      apiFetch<{ success: boolean }>(`/admin/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token,
      }),
  },
};
