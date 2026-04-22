import { supabase } from '@/lib/supabase';

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
  marketCondition?: 'trending' | 'ranging' | 'breakout' | 'consolidation';
  primaryStrategy?: 'SMC' | 'Supply & Demand' | 'S&R' | 'Pattern' | null;
  confirmations?: string[];
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
  counterTrendPlan?: {
    action: 'enter' | 'wait' | 'avoid';
    bias: 'buy' | 'sell' | 'none';
    entryType: 'instant' | 'confirmation' | 'none';
    entryZone: {
      min: number | null;
      max: number | null;
    } | null;
    confirmation: 'CHoCH' | 'BOS' | 'rejection' | 'none';
    reason: string;
    warning: string;
    invalidationLevel: number | null;
    invalidationReason: string;
    stopLoss: number | null;
    takeProfit1: number | null;
    takeProfit2: number | null;
    takeProfit3: number | null;
    confidence: number;
  } | null;
  leftSidePlan?: {
    action: 'enter' | 'wait' | 'avoid';
    bias: 'buy' | 'sell' | 'none';
    entryType: 'instant' | 'confirmation' | 'none';
    entryZone: {
      min: number | null;
      max: number | null;
    } | null;
    confirmation: 'CHoCH' | 'BOS' | 'rejection' | 'none';
    reason: string;
    warning: string;
    invalidationLevel: number | null;
    invalidationReason: string;
    stopLoss: number | null;
    takeProfit1: number | null;
    takeProfit2: number | null;
    takeProfit3: number | null;
    confidence: number;
  } | null;
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
    setupRating: 'A+' | 'B' | 'avoid';
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
  strategy?: string | null;
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
  // Dual-chart analysis fields
  isDualChart?: boolean;
  htfTimeframe?: string;
  ltfTimeframe?: string;
  htfOriginalImageUrl?: string | null;
  ltfOriginalImageUrl?: string | null;
  htfMarkedImageUrl?: string | null;
  ltfMarkedImageUrl?: string | null;
  htfChartBounds?: {
    minPrice: number;
    maxPrice: number;
    source: 'input' | 'inferred';
  } | null;
  ltfChartBounds?: {
    minPrice: number;
    maxPrice: number;
    source: 'input' | 'inferred';
  } | null;
  provider: 'tradevision';
  createdAt?: string;
}

export interface UploadErrorLogPayload {
  errorType: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'CORRUPTED_FILE' | 'READ_ERROR' | 'EMPTY_IMAGE';
  fileType?: string | null;
  fileSize?: number | null;
  source?: string;
  stage?: string;
  message?: string;
  metadata?: Record<string, unknown> | null;
}

export interface LiveChartMarketCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LiveChartMarketData {
  symbol: string;
  timeframe: string;
  candles: LiveChartMarketCandle[];
  currentPrice: number;
}

export interface DerivLiveChartMarketData {
  symbol: string;
  granularity: number;
  candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
  currentPrice: number;
  source: 'deriv-backend';
}

export interface PublicSupportSettings {
  whatsappNumber: string;
  whatsappMessage: string;
}

export interface AdminAnalysisLog {
  id: string;
  pair: string;
  timeframe: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  outcome: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  bias: string | null;
  confidence: number | null;
  strategy: string | null;
  marketCondition?: AnalysisResult['marketCondition'] | string | null;
  primaryStrategy?: AnalysisResult['primaryStrategy'] | string | null;
  signalType?: AnalysisResult['signalType'] | null;
  counterTrendPlan?: AnalysisResult['counterTrendPlan'] | null;
  leftSidePlan?: AnalysisResult['leftSidePlan'] | null;
  errorMessage: string | null;
  failureReason: string | null;
  modelUsed: string | null;
  usedFallback: boolean;
  createdAt: string;
  user: {
    email: string | null;
    name: string | null;
    subscription: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
  } | null;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
  banned: boolean;
  dailyUsage?: number | null;
  lastUsageReset?: string | null;
  createdAt: string;
  usage?: {
    current: number;
    limit: number;
    period: 'day' | 'month';
  };
  _count?: {
    analyses: number;
    payments: number;
  };
}

export interface PaidSubscriberItem {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  status: 'free' | 'active' | 'expired' | 'cancelled';
  expiresAt: string | null;
  daysLeft: number | null;
}

export interface AdminUserDetails {
  id: string;
  billing: {
    currentPlan: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
    status: 'free' | 'active' | 'expired' | 'cancelled';
    expiresAt: string | null;
    lastPaymentAt: string | null;
    canceledAt: string | null;
    recentPayments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
      paymentMethod: 'PAYPAL' | 'CARD' | 'BANK_TRANSFER' | 'COUPON';
      bankTransferBank: 'SCOTIABANK' | 'NCB' | null;
      plan: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
      verifiedAt: string | null;
      createdAt: string;
    }>;
  };
  goldx: {
    licenseId: string | null;
    hasAccess: boolean;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
    licenseStatus: string | null;
    expiresAt: string | null;
    mt5Account: string | null;
  };
  openTickets: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: string;
  }>;
  openTicketCount: number;
}

export interface LivePlatformMetrics {
  currentVisitors: number;
  totalVisitorsToday: number;
  activeAnalyses: number;
  totalAnalysesToday: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeSubscribers: number;
  totalAnalyses: number;
  totalRevenue: number;
  liveMetrics: LivePlatformMetrics;
}

export interface AdminAnalyticsResponse {
  userGrowth: Array<{ createdAt: string; _count?: number }>;
  analysesPerDay: Array<{ createdAt: string; _count?: number }>;
  revenueData: Array<{ createdAt: string; _sum?: { amount?: number } }>;
  liveMetrics: LivePlatformMetrics;
  range: {
    from: string;
    to: string;
  };
}

export type AnnouncementType = 'update' | 'maintenance' | 'discount' | 'new_feature' | 'security' | 'event';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  isExpired?: boolean;
  expiresAt?: string | null;
  type: AnnouncementType;
  couponCode?: string | null;
  targetPlan?: 'PRO' | 'TOP_TIER' | null;
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
  currentPlan: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
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
    paymentMethod: 'PAYPAL' | 'CARD' | 'BANK_TRANSFER' | 'COUPON';
    bankTransferBank: 'SCOTIABANK' | 'NCB' | null;
    plan: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
    verifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface AdminPayment {
  id: string;
  userId: string;
  paypalOrderId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'PAYPAL' | 'CARD' | 'BANK_TRANSFER' | 'COUPON';
  bankTransferBank: 'SCOTIABANK' | 'NCB' | null;
  plan: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string | null;
    name: string | null;
  } | null;
}

export type AdminPaymentStatusFilter = AdminPayment['status'] | 'ALL';
export type AdminPaymentPlanFilter = AdminPayment['plan'] | 'ALL';
export type AdminPaymentMethodFilter = AdminPayment['paymentMethod'] | 'ALL';
export type AdminPaymentDateRangeFilter = '7d' | '30d' | '90d' | 'all';
export type AdminPaymentScope = 'COMPLETED_CHECKOUTS' | 'BANK_TRANSFERS' | 'ALL_PAYMENTS';

export interface PricingPlan {
  id: string;
  name: string;
  tier: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
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

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

const resolveAuthToken = async (token?: string | null) => {
  if (!supabase) {
    return token ?? null;
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return token ?? null;
    }

    if (!session) {
      return token ?? null;
    }

    const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
    if (expiresAt && expiresAt <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        return refreshed.session.access_token;
      }
    }

    return session.access_token || token || null;
  } catch {
    return token ?? null;
  }
};

const sendRequest = async (endpoint: string, fetchOptions: RequestInit, token?: string | null) => {
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const method = (fetchOptions.method || 'GET').toUpperCase();

  return fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    cache: fetchOptions.cache ?? (method === 'GET' ? 'no-store' : undefined),
  });
};

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const resolvedToken = await resolveAuthToken(token);
  let response = await sendRequest(endpoint, fetchOptions, resolvedToken);

  if (response.status === 401 && supabase) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) {
        response = await sendRequest(endpoint, fetchOptions, data.session.access_token);
      }
    } catch {
      // Let the original 401 handling below surface the failure.
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface ScannerPanelsStreamPayload {
  results: ScanResult[];
  potentials: ScannerPotentialTrade[];
  generatedAt: string;
}

export async function openScannerPanelsStream(
  token: string,
  handlers: {
    onPanels: (payload: ScannerPanelsStreamPayload) => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
  },
) {
  const resolvedToken = await resolveAuthToken(token);
  const response = await fetch(`${API_URL}/scanner/stream`, {
    method: 'GET',
    headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {},
    signal: handlers.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Scanner stream failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBlock = (block: string) => {
    const eventLine = block.split('\n').find((line) => line.startsWith('event:'));
    const dataLines = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());

    if (!eventLine || dataLines.length === 0) {
      return;
    }

    const eventName = eventLine.slice(6).trim();
    const rawData = dataLines.join('\n');

    if (eventName === 'scanner-panels') {
      handlers.onPanels(JSON.parse(rawData) as ScannerPanelsStreamPayload);
      return;
    }

    if (eventName === 'scanner-error' && handlers.onError) {
      try {
        const payload = JSON.parse(rawData) as { message?: string };
        handlers.onError(new Error(payload.message || 'Scanner stream update failed'));
      } catch {
        handlers.onError(new Error('Scanner stream update failed'));
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      processBlock(block);
    }
  }
}

export const api = {
  heartbeatVisitor: (data: { sessionId: string; currentPath?: string }) =>
    apiFetch<{ success: boolean }>('/visitors/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data),
      keepalive: true,
    }),

  getProfile: (token: string) =>
    apiFetch<{ user: any }>('/auth/profile', { token }),

  getActiveAnnouncements: () =>
    apiFetch<{ announcements: Announcement[] }>('/admin/public-announcements'),

  getPublicPricingPlans: () =>
    apiFetch<{ plans: PricingPlan[] }>('/admin/public-pricing-plans'),

  getPublicSupportSettings: () =>
    apiFetch<PublicSupportSettings>('/admin/public-support-settings'),

  logUploadError: (payload: UploadErrorLogPayload) =>
    apiFetch<{ success: boolean }>('/upload-errors', {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true,
    }),

  // Analysis
  analyzeChartUpload: (formData: FormData, token: string) =>
    apiFetch<{ analysis?: AnalysisResult; queued?: boolean; jobId?: string; analysisId?: string; message?: string }>('/analyze-chart', { method: 'POST', body: formData, token }),

  analyzeLiveChart: (
    payload: {
      source: 'tradingview-live' | 'deriv-live';
      symbol: string;
      timeframe: string;
      candles?: Array<{ time: number; open: number; high: number; low: number; close: number }>;
    },
    token: string
  ) =>
    apiFetch<{ analysis?: AnalysisResult; queued?: boolean; jobId?: string; analysisId?: string; message?: string }>('/analyze-chart', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),

  getLiveChartMarketData: (symbol: string, timeframe: string, token: string) =>
    apiFetch<{ marketData: LiveChartMarketData }>(
      `/live-chart-market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`,
      { token }
    ),

  getDerivLiveChartMarketData: (symbol: string, granularity: number, token: string, limit = 500) =>
    apiFetch<{ marketData: DerivLiveChartMarketData }>(
      `/deriv-live-chart-market-data?symbol=${encodeURIComponent(symbol)}&granularity=${encodeURIComponent(String(granularity))}&limit=${encodeURIComponent(String(limit))}`,
      { token }
    ),

  getAnalyses: (token: string, page = 1) =>
    apiFetch<{ analyses: AnalysisResult[]; total: number; page: number; pages: number }>(
      `/analyses?page=${page}`,
      { token }
    ),

  getAnalysis: (id: string, token: string) =>
    apiFetch<{ analysis: AnalysisResult }>(`/analyses/${encodeURIComponent(id)}`, { token }),

  // Queue
  getQueueStatus: (jobId: string, token: string) =>
    apiFetch<{
      jobId: string;
      analysisId: string | null;
      status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
      position: number;
      estimatedWait: number;
      result: AnalysisResult | null;
      error: string | null;
      createdAt: string;
    }>(`/queue-status?id=${encodeURIComponent(jobId)}`, { token }),

  cancelQueueJob: (jobId: string, token: string) =>
    apiFetch<{ success: boolean; status: 'cancelled' }>('/queue-cancel', {
      method: 'POST',
      body: JSON.stringify({ id: jobId }),
      token,
    }),

  // Coupons
  validateCoupon: (code: string, token: string) =>
    apiFetch<{ valid: boolean; discount?: { type: string; value: number }; couponId?: string; message: string }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
      token,
    }),

  // Payments
  getPayPalClientToken: (token: string) =>
    apiFetch<{ clientToken: string }>('/paypal-client-token', { token }),
  createPayment: (plan: string, token: string, couponCode?: string, method: 'PAYPAL' | 'CARD' = 'PAYPAL') =>
    apiFetch<{ orderId: string | null; approveUrl: string | null; freeActivation?: boolean }>('/create-payment', {
      method: 'POST',
      body: JSON.stringify({ plan, method, ...(couponCode ? { couponCode } : {}) }),
      token,
    }),
  createBankTransferRequest: (plan: string, bank: 'SCOTIABANK' | 'NCB', token: string, couponCode?: string) =>
    apiFetch<{
      success: boolean;
      payment: {
        id: string;
        referenceId: string;
        bankTransferBank: 'SCOTIABANK' | 'NCB';
        createdAt: string;
        amount: number;
        currency: string;
      };
    }>('/bank-transfer-request', {
      method: 'POST',
      body: JSON.stringify({ plan, bank, ...(couponCode ? { couponCode } : {}) }),
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
      apiFetch<AdminDashboardStats>('/admin/dashboard', { token }),
    getUsers: (
      token: string,
      options?: {
        search?: string;
        page?: number;
        subscription?: 'FREE' | 'PRO' | 'TOP_TIER' | 'VIP_AUTO_TRADER';
        createdFrom?: string;
        createdTo?: string;
      }
    ) => {
      const params = new URLSearchParams();
      params.set('page', String(options?.page ?? 1));
      if (options?.search) {
        params.set('search', options.search);
      }
      if (options?.subscription) {
        params.set('subscription', options.subscription);
      }
      if (options?.createdFrom) {
        params.set('createdFrom', options.createdFrom);
      }
      if (options?.createdTo) {
        params.set('createdTo', options.createdTo);
      }

      return apiFetch<{ users: AdminUserListItem[]; total: number; page: number; pages: number }>(`/admin/users?${params.toString()}`, { token });
    },
    getUserDetails: (id: string, token: string) =>
      apiFetch<{ user: AdminUserDetails }>(`/admin/users/${encodeURIComponent(id)}`, { token }),
    resetUserUsage: (id: string, token: string) =>
      apiFetch<{ user: AdminUserListItem; resetAt: string }>(`/admin/users/${encodeURIComponent(id)}/reset-usage`, {
        method: 'POST',
        token,
      }),
    updateUser: (id: string, data: any, token: string) =>
      apiFetch<any>(`/admin/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
      grantGoldxAccess: (id: string, token: string) =>
        apiFetch<{ success: boolean; created: boolean; licenseKey: string | null; message: string }>(`/goldx/admin/users/${encodeURIComponent(id)}/grant`, {
          method: 'POST',
          token,
        }),
    getPaidSubscribers: (token: string) =>
      apiFetch<{ subscribers: PaidSubscriberItem[] }>('/admin/subscribers', { token }),
    sendRenewalReminder: (userId: string, token: string) =>
      apiFetch<{ success: boolean }>(`/admin/subscribers/${encodeURIComponent(userId)}/send-renewal`, {
        method: 'POST',
        token,
      }),
    getAnalyses: (token: string, page = 1, search?: string) =>
      apiFetch<{ analyses: AdminAnalysisLog[]; total: number; page: number; pages: number }>(
        `/admin/analyses?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
        { token }
      ),
    getAnalysisById: (token: string, id: string) =>
      apiFetch<{ analysis: AnalysisResult }>(`/admin/analyses/${encodeURIComponent(id)}`, { token }),
    getPayments: (
      token: string,
      options: {
        page?: number;
        plan?: AdminPaymentPlanFilter;
        status?: AdminPaymentStatusFilter;
        paymentMethod?: AdminPaymentMethodFilter;
        dateRange?: AdminPaymentDateRangeFilter;
        scope?: AdminPaymentScope;
      } = {}
    ) => {
      const params = new URLSearchParams();
      params.set('page', String(options.page ?? 1));
      if (options.scope) params.set('scope', options.scope);
      if (options.plan && options.plan !== 'ALL') params.set('plan', options.plan);
      if (options.status && options.status !== 'ALL') params.set('status', options.status);
      if (options.paymentMethod && options.paymentMethod !== 'ALL') params.set('paymentMethod', options.paymentMethod);
      if (options.dateRange) params.set('dateRange', options.dateRange);
      return apiFetch<{ payments: AdminPayment[]; total: number; page: number; pages: number }>(`/admin/payments?${params.toString()}`, { token });
    },
    updatePaymentStatus: (id: string, status: 'COMPLETED' | 'FAILED', token: string) =>
      apiFetch<{ payment: AdminPayment }>(`/admin/payments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      }),
    sendPaymentReminder: (id: string, token: string, opts?: { couponCode?: string; discountLabel?: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/admin/payments/${encodeURIComponent(id)}/send-reminder`, {
        method: 'POST',
        body: JSON.stringify(opts || {}),
        token,
      }),
    getAnalytics: (token: string, range?: { from?: string; to?: string }) => {
      const params = new URLSearchParams();
      if (range?.from) params.set('from', range.from);
      if (range?.to) params.set('to', range.to);
      const query = params.toString();
      return apiFetch<AdminAnalyticsResponse>(`/admin/analytics${query ? `?${query}` : ''}`, { token });
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
    createAnnouncement: (data: { title: string; content: string; durationValue?: number; durationUnit?: 'hours' | 'days'; type?: AnnouncementType; couponCode?: string; targetPlan?: 'PRO' | 'TOP_TIER' }, token: string) =>
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
    createTicket: (
      data: {
        userId: string;
        whatsappNumber?: string;
        subject: string;
        category: TicketCategory;
        priority: TicketPriority;
        message: string;
        adminNotes?: string;
      },
      token: string
    ) =>
      apiFetch<{ ticket: SupportTicket }>('/admin/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
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
    replyToTicket: (id: string, message: string, token: string) =>
      apiFetch<{ ticket: SupportTicket; emailSent: boolean }>(`/admin/tickets/${encodeURIComponent(id)}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
        token,
      }),
    deleteAnnouncement: (id: string, token: string) =>
      apiFetch<{ success: boolean }>(`/admin/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token,
      }),
    getCoupons: (token: string) =>
      apiFetch<{ coupons: any[] }>('/admin/coupons', { token }),
    createCoupon: (data: { code: string; type: string; value: number; maxUses: number; perUserLimit: number; expiresAt?: string | null }, token: string) =>
      apiFetch<{ coupon: any }>('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    toggleCoupon: (id: string, token: string) =>
      apiFetch<{ coupon: any }>(`/admin/coupons/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
        token,
      }),
    deleteCoupon: (id: string, token: string) =>
      apiFetch<{ success: boolean }>(`/admin/coupons/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token,
      }),

    // ── Admin Referrals ──
    getReferralDashboard: (token: string) =>
      apiFetch<AdminReferralDashboard>('/admin/referrals/dashboard', { token }),
    getReferrals: (token: string, page = 1) =>
      apiFetch<{ referrals: AdminReferral[]; total: number; page: number; pages: number }>(
        `/admin/referrals/list?page=${page}`,
        { token }
      ),
    getCommissions: (token: string, page = 1, status?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      return apiFetch<{ commissions: AdminCommission[]; total: number; page: number; pages: number }>(
        `/admin/referrals/commissions?${params.toString()}`,
        { token }
      );
    },
    updateCommission: (id: string, status: string, token: string) =>
      apiFetch<{ commission: AdminCommission }>(`/admin/referrals/commissions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      }),
    getPayouts: (token: string, page = 1, status?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      return apiFetch<{ payouts: AdminPayout[]; total: number; page: number; pages: number }>(
        `/admin/referrals/payouts?${params.toString()}`,
        { token }
      );
    },
    updatePayout: (id: string, status: string, token: string) =>
      apiFetch<{ payout: AdminPayout }>(`/admin/referrals/payouts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      }),
    updateReferralSettings: (data: Partial<ReferralSettings>, token: string) =>
      apiFetch<{ success: boolean }>('/admin/referrals/settings', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),

    // ── Email Campaigns ──
    getEmailCampaigns: (token: string, page = 1) =>
      apiFetch<{ campaigns: EmailCampaign[]; total: number; page: number; pages: number }>(
        `/admin/email-campaigns?page=${page}`,
        { token }
      ),
    getEmailCampaignById: (id: string, token: string) =>
      apiFetch<{ campaign: EmailCampaign; logs: EmailLog[] }>(
        `/admin/email-campaigns/${encodeURIComponent(id)}`,
        { token }
      ),
    createEmailCampaign: (
      data: { name: string; subject: string; htmlContent: string; audience: string; singleEmail?: string; templateKey?: string },
      token: string
    ) =>
      apiFetch<{ campaign: EmailCampaign }>('/admin/email-campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    sendEmailCampaign: (id: string, token: string) =>
      apiFetch<{ success: boolean; sentCount: number; failedCount: number }>(
        `/admin/email-campaigns/${encodeURIComponent(id)}/send`,
        { method: 'POST', token }
      ),
    sendTestCampaignEmail: (data: { subject: string; htmlContent: string }, token: string) =>
      apiFetch<{ success: boolean; sentTo: string }>('/admin/email-campaigns/test', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    retryFailedEmails: (id: string, token: string) =>
      apiFetch<{ success: boolean; retriedOk: number; retriedFail: number }>(
        `/admin/email-campaigns/${encodeURIComponent(id)}/retry`,
        { method: 'POST', token }
      ),
    getEmailTemplates: (token: string) =>
      apiFetch<{ templates: EmailTemplateMeta[] }>('/admin/email-templates', { token }),
    previewEmailTemplate: (key: string, token: string) =>
      apiFetch<{ subject: string; html: string }>(
        `/admin/email-templates/${encodeURIComponent(key)}/preview`,
        { token }
      ),
    searchUsers: (query: string, token: string) =>
      apiFetch<{ users: SearchedUser[] }>(
        `/admin/users/search?query=${encodeURIComponent(query)}`,
        { token }
      ),
  },

  // ── Referral (User) ──
  referral: {
    getMyCode: (token: string) =>
      apiFetch<{ referralCode: ReferralCode; discountPercent: number }>('/referrals/my-code', { token }),
    getMyDiscount: (token: string) =>
      apiFetch<{ discountPercent: number }>('/referrals/my-discount', { token }),
    updateMyCode: (code: string, token: string) =>
      apiFetch<{ referralCode: ReferralCode }>('/referrals/my-code', {
        method: 'PATCH',
        body: JSON.stringify({ code }),
        token,
      }),
    getDashboard: (token: string) =>
      apiFetch<UserReferralDashboard>('/referrals/dashboard', { token }),
    requestPayout: (paypalEmail: string, token: string) =>
      apiFetch<{ payout: PayoutRecord }>('/referrals/request-payout', {
        method: 'POST',
        body: JSON.stringify({ paypalEmail }),
        token,
      }),
    validateCode: (code: string, token: string) =>
      apiFetch<{ valid: boolean; discountPercent?: number; message: string }>('/referrals/validate-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
        token,
      }),
    applyCode: (code: string, token: string) =>
      apiFetch<{ applied: boolean; discountPercent?: number; message: string }>('/referrals/apply-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
        token,
      }),
  },

  // ── Scanner ──
  scanner: {
    getStatus: (token: string) =>
      apiFetch<ScannerStatusResponse>('/scanner/status', { token }),

    toggle: (sessionType: ScannerSessionType, enabled: boolean, token: string) =>
      apiFetch<{ session: ScannerSession }>('/scanner/toggle', {
        method: 'POST',
        body: JSON.stringify({ sessionType, enabled }),
        token,
      }),

    triggerScan: (token: string) =>
      apiFetch<{ results: ScanResult[]; alerts: ScannerAlert[] }>('/scanner/scan', {
        method: 'POST',
        token,
      }),

    getResults: (token: string, sessionType?: ScannerSessionType, limit?: number, scope?: 'all' | 'current' | 'history') => {
      const params = new URLSearchParams();
      if (sessionType) params.set('sessionType', sessionType);
      if (limit) params.set('limit', String(limit));
      if (scope) params.set('scope', scope);
      const query = params.toString();
      return apiFetch<{ results: ScanResult[] }>(`/scanner/results${query ? `?${query}` : ''}`, { token });
    },

    getReplay: (scanResultId: string, token: string) =>
      apiFetch<{ replay: ScannerTradeReplay }>(`/scanner/results/${encodeURIComponent(scanResultId)}/replay`, { token }),

    getAlerts: (token: string, unreadOnly = false) =>
      apiFetch<{ alerts: ScannerAlert[] }>(`/scanner/alerts${unreadOnly ? '?unreadOnly=true' : ''}`, { token }),

    markAlertsRead: (alertIds: string[], token: string) =>
      apiFetch<{ success: boolean }>('/scanner/alerts/read', {
        method: 'POST',
        body: JSON.stringify({ alertIds }),
        token,
      }),

    getSummary: (token: string, sessionType?: ScannerSessionType) =>
      apiFetch<{ summary: ScannerSessionSummary }>(`/scanner/summary${sessionType ? `?sessionType=${sessionType}` : ''}`, { token }),

    getPotentials: (token: string, limit = 12) =>
      apiFetch<{ potentials: ScannerPotentialTrade[] }>(`/scanner/potentials?limit=${encodeURIComponent(String(limit))}`, { token }),

    checkProximity: (token: string) =>
      apiFetch<{ alerts: ScannerAlert[] }>('/scanner/check-proximity', {
        method: 'POST',
        token,
      }),

    expireSession: (sessionType: ScannerSessionType, token: string) =>
      apiFetch<{ success: boolean }>('/scanner/expire', {
        method: 'POST',
        body: JSON.stringify({ sessionType }),
        token,
      }),
  },

  // ── Command Center ──
  commandCenter: {
    getSnapshot: (tradeId: string, token: string, currentPrice?: number) => {
      const params = new URLSearchParams();
      if (currentPrice != null) params.set('currentPrice', String(currentPrice));
      const query = params.toString();
      return apiFetch<{ commandCenter: CommandCenterSnapshot }>(
        `/trade/${encodeURIComponent(tradeId)}/command-center${query ? `?${query}` : ''}`,
        { token }
      );
    },
  },

  // ── Trade Radar ──
  radar: {
    list: (token: string) =>
      apiFetch<{ trades: TrackedTrade[] }>('/radar', { token }),
    add: (tradeId: string, token: string) =>
      apiFetch<{ tracked: TrackedTrade }>('/radar/add', {
        method: 'POST',
        body: JSON.stringify({ tradeId }),
        token,
      }),
    remove: (id: string, token: string) =>
      apiFetch<{ success: boolean }>(`/radar/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token,
      }),
  },

  // ── GoldX ──
  goldx: {
    getPlan: () =>
      apiFetch<GoldxPlan>('/goldx/plan'),
    getMyStatus: (token: string) =>
      apiFetch<GoldxUserStatus>('/goldx/me', { token }),
    downloadEa: (token: string) =>
      apiFetch<{ success: boolean; downloadUrl: string }>('/goldx/download-ea', { token }),
    createSetupRequest: (payload: { mt5Login: string; server: string; email: string; note?: string }, token: string) =>
      apiFetch<{ success: boolean }>('/goldx/setup-request', {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      }),
    setMode: (mode: string, token: string) =>
      apiFetch<{ success: boolean; mode: string }>('/goldx/me/mode', {
        method: 'POST',
        body: JSON.stringify({ mode }),
        token,
      }),
    setSessionMode: (sessionMode: 'day' | 'night' | 'hybrid' | 'all', token: string) =>
      apiFetch<{ success: boolean; sessionMode: 'day' | 'night' | 'hybrid' | 'all'; sessionStatus: 'day' | 'night' | 'asian' | 'london' | 'newYork' | 'closed' }>('/goldx/set-session-mode', {
        method: 'POST',
        body: JSON.stringify({ sessionMode }),
        token,
      }),
    cancelSubscription: (token: string) =>
      apiFetch<{ success: boolean }>('/goldx/me/cancel', {
        method: 'POST',
        token,
      }),
    createPayment: (token: string) =>
      apiFetch<{ orderId: string; planId: string }>('/goldx/payment/create', {
        method: 'POST',
        token,
      }),
    capturePayment: (orderId: string, planId: string, token: string) =>
      apiFetch<{ success: boolean; subscriptionId: string; licenseKey: string; message: string }>('/goldx/payment/capture', {
        method: 'POST',
        body: JSON.stringify({ orderId, planId }),
        token,
      }),
    admin: {
      getDashboard: (token: string) =>
        apiFetch<GoldxAdminDashboard>('/goldx/admin/dashboard', { token }),
      getLicenses: (token: string) =>
        apiFetch<GoldxAdminLicense[]>('/goldx/admin/licenses', { token }),
      getSubscriptions: (token: string) =>
        apiFetch<GoldxAdminSubscription[]>('/goldx/admin/subscriptions', { token }),
      revokeLicense: (licenseId: string, token: string) =>
        apiFetch<{ success: boolean }>(`/goldx/admin/licenses/${encodeURIComponent(licenseId)}/revoke`, {
          method: 'POST',
          token,
        }),
      extendLicense: (licenseId: string, days: number, token: string) =>
        apiFetch<{ success: boolean }>(`/goldx/admin/licenses/${encodeURIComponent(licenseId)}/extend`, {
          method: 'POST',
          body: JSON.stringify({ days }),
          token,
        }),
      getAuditLogs: (token: string, limit = 100, offset = 0) =>
        apiFetch<GoldxAuditLog[]>(`/goldx/admin/audit-logs?limit=${limit}&offset=${offset}`, { token }),
      getSettings: (token: string) =>
        apiFetch<Record<string, unknown>>('/goldx/admin/settings', { token }),
      updateSettings: (key: string, value: Record<string, unknown>, token: string) =>
        apiFetch<{ success: boolean }>('/goldx/admin/settings', {
          method: 'POST',
          body: JSON.stringify({ key, value }),
          token,
        }),
      getTradeHistory: (token: string, limit = 100, offset = 0) =>
        apiFetch<GoldxTradeHistoryEntry[]>(`/goldx/admin/trade-history?limit=${limit}&offset=${offset}`, { token }),
      getSetupRequests: (token: string) =>
        apiFetch<GoldxAdminSetupRequest[]>('/goldx/admin/setup-requests', { token }),
      updateSetupRequest: (requestId: string, payload: { status?: 'pending' | 'in_progress' | 'completed'; internalNotes?: string | null }, token: string) =>
        apiFetch<{ success: boolean }>(`/goldx/admin/setup-requests/${encodeURIComponent(requestId)}`, {
          method: 'POST',
          body: JSON.stringify(payload),
          token,
        }),
    },
  },
};

// ── Referral Types ──

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  totalEarnings: number;
  totalReferrals: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'qualified' | 'paid';
  createdAt: string;
  qualifiedAt: string | null;
}

export interface CommissionRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralId: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  paidAt: string | null;
}

export interface PayoutRecord {
  id: string;
  userId: string;
  paypalEmail: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  createdAt: string;
  processedAt: string | null;
}

export interface ReferralStats {
  totalEarnings: number;
  pendingBalance: number;
  approvedBalance: number;
  paidBalance: number;
  totalReferrals: number;
  qualifiedReferrals: number;
  conversionRate: number;
}

export interface EnrichedCommission extends CommissionRecord {
  referredUser: { email: string; name: string | null } | null;
}

export interface UserReferralDashboard {
  referralCode: ReferralCode | null;
  stats: ReferralStats;
  commissions: EnrichedCommission[];
  payouts: PayoutRecord[];
  discountPercent: number;
}

export interface AdminReferralDashboard {
  stats: {
    totalReferrals: number;
    pendingReferrals: number;
    qualifiedReferrals: number;
    commissionsOwed: number;
    commissionsPaid: number;
  };
  settings: ReferralSettings;
}

export interface ReferralSettings {
  discountPercent: number;
  commissionPercent: number;
  minPayout: number;
  enabled: boolean;
  commissionDelayDays: number;
}

export interface AdminReferral extends ReferralRecord {
  referrer: { email: string; name: string | null; subscription: string } | null;
  referredUser: { email: string; name: string | null; subscription: string } | null;
}

export interface AdminCommission extends CommissionRecord {
  referrer: { email: string; name: string | null } | null;
  referredUser: { email: string; name: string | null } | null;
}

export interface AdminPayout extends PayoutRecord {
  user: { email: string; name: string | null } | null;
}

// ── Email Campaign Types ──

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  audience: 'all' | 'free' | 'pro' | 'single';
  singleEmail: string | null;
  templateKey: string | null;
  status: 'draft' | 'sent' | 'sending';
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  campaignId: string;
  userEmail: string;
  status: 'sent' | 'failed';
  errorMessage: string | null;
  sentAt: string;
}

export interface EmailTemplateMeta {
  key: string;
  label: string;
  subject: string;
}

export interface SearchedUser {
  id: string;
  email: string;
  name: string | null;
  subscription: string;
}

// ── Scanner Types ──

type SignalDirection = 'buy' | 'sell';

export type ScannerSessionType = 'london' | 'newyork' | 'volatility';
export type ScanResultStatus = 'active' | 'triggered' | 'closed' | 'invalidated' | 'expired';
export type ScannerAlertType = 'info' | 'trade' | 'warning';
export type ScanMarketRegime = 'range' | 'trend' | 'reversal';
export type ScannerReplayOutcome = 'open' | 'tp' | 'sl';
export type ScannerReplayCandle = [number, number, number, number, number];

export interface ScanResultConfirmationMap {
  liquiditySweep: boolean;
  engulfing: boolean;
  rejection: boolean;
  bos: boolean;
  poiReclaim: boolean;
  emaAligned: boolean;
  zoneReaction: boolean;
  displacement: boolean;
  momentum: boolean;
  edgeBase: boolean;
  breakerBlock: boolean;
  fvgReaction: boolean;
  equalLevelSweep: boolean;
  premiumDiscount: boolean;
  ote: boolean;
  mss: boolean;
}

export type ScanResultConfirmations = ScanResultConfirmationMap | string[];

export interface ScannerSession {
  id: string;
  userId: string;
  sessionType: ScannerSessionType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  id: string;
  userId: string;
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  slReason?: string | null;
  takeProfit: number;
  takeProfit2: number | null;
  confidenceScore: number;
  marketRegime: ScanMarketRegime;
  strategy: string | null;
  confirmations: ScanResultConfirmations;
  sessionType: ScannerSessionType;
  status: ScanResultStatus;
  closeReason: 'tp' | 'sl' | 'be' | null;
  triggeredAt: string | null;
  closedAt: string | null;
  rank: number | null;
  createdAt: string;
  currentPrice?: number | null;
  snapshotUrl?: string | null;
}

export interface ScannerTradeReplay {
  id: string;
  scanResultId: string;
  userId: string;
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2: number | null;
  triggeredAt: string;
  closedAt: string | null;
  outcome: ScannerReplayOutcome;
  preEntryCandles: ScannerReplayCandle[];
  replayCandles: ScannerReplayCandle[];
  createdAt: string;
  updatedAt: string;
}

export interface ScannerAlert {
  id: string;
  userId: string;
  scanResultId: string | null;
  message: string;
  type: ScannerAlertType;
  read: boolean;
  createdAt: string;
}

export interface ScannerStatusResponse {
  sessions: ScannerSession[];
  activeWindows: ScannerSessionType[];
  londonActive: boolean;
  newyorkActive: boolean;
  volatilityActive: boolean;
  symbols: string[];
  timeframe: string;
}

export interface ScannerSessionSummary {
  total: number;
  triggered: number;
  closed: number;
  invalidated: number;
  active: number;
}

export interface ScannerPotentialTrade {
  symbol: string;
  sessionType: ScannerSessionType;
  direction: SignalDirection;
  currentPrice: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2: number | null;
  activationProbability: number;
  marketRegime: ScanMarketRegime;
  strategy: string;
  narrative: string;
  fulfilledConditions: string[];
  requiredTriggers: string[];
  contextLabels: string[];
}

// ── Command Center Types ──

export type TradeState = 'READY' | 'WAIT' | 'INVALID' | 'TRIGGERED' | 'ACTIVE' | 'CLOSED';

export type LiveStatusMessage =
  | 'approaching entry'
  | 'entry triggered'
  | 'momentum strong'
  | 'momentum fading'
  | 'approaching TP'
  | 'exit warning'
  | 'wait for confirmation'
  | 'price in entry zone'
  | 'watching structure';

export interface CommandCenterEntryZone {
  min: number;
  max: number;
}

export interface ConfidenceReason {
  label: string;
  status: boolean;
}

export interface CommandCenterConfidence {
  score: number;
  reasons: ConfidenceReason[];
}

export interface CommandCenterTiming {
  message: string;
  candlesEstimate: string;
  conditions: string[];
}

export interface CommandCenterSltp {
  slInstruction: string;
  tpLevels: { label: string; price: number }[];
}

export interface CommandCenterInvalidation {
  isInvalid: boolean;
  reason: string;
}

export interface CommandCenterTrade {
  id: string;
  pair: string;
  timeframe: string;
  direction: 'buy' | 'sell';
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number | null;
  takeProfit3: number | null;
  confirmation: string;
  reasoning: string;
  confidence: number;
  createdAt: string;
}

export interface CommandCenterSnapshot {
  trade: CommandCenterTrade;
  state: TradeState;
  entryZone: CommandCenterEntryZone;
  confidence: CommandCenterConfidence;
  timing: CommandCenterTiming;
  sltp: CommandCenterSltp;
  liveStatus: LiveStatusMessage;
  invalidation: CommandCenterInvalidation;
  currentPrice: number;
  updatedAt: string;
}

// ── Trade Radar Types ──

export type TrackedTradeState = 'TRACKING' | 'READY' | 'ACTIVE' | 'INVALID' | 'EXPIRED';

export interface TrackedTrade {
  id: string;
  userId: string;
  analysisId: string | null;
  symbol: string;
  direction: 'buy' | 'sell';
  entryZoneMin: number;
  entryZoneMax: number;
  stopLoss: number;
  takeProfit1: number;
  confidence: number;
  conditions: string[];
  state: TrackedTradeState;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── GoldX Types ──

export interface GoldxPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  isActive: boolean;
}

export interface GoldxUserStatus {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
  license: {
    id: string;
    status: string;
    mt5Account: string | null;
    expiresAt: string;
    createdAt: string;
  } | null;
  accountState: {
    mode: string;
    sessionMode: 'day' | 'night' | 'hybrid' | 'all';
    sessionStatus: 'day' | 'night' | 'asian' | 'london' | 'newYork' | 'closed';
    tradesToday: number;
    profitToday: number;
    drawdownToday: number;
    lastTradeAt: string | null;
  } | null;
  onboardingState: {
    hasDownloadedEa: boolean;
    hasConnectedMt5: boolean;
    setupCompleted: boolean;
  };
  setupRequest: {
    id: string;
    server: string;
    email: string;
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: string;
    updatedAt: string;
  } | null;
  latestGrant: {
    licenseKey: string;
    issuedAt: string;
    expiresAt: string;
  } | null;
}

export interface GoldxAdminDashboard {
  totalLicenses: number;
  activeLicenses: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

export interface GoldxAdminLicense {
  id: string;
  userId: string;
  licenseHash: string;
  mt5Account: string | null;
  deviceId: string | null;
  status: string;
  expiresAt: string;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface GoldxAdminSubscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface GoldxAuditLog {
  id: string;
  licenseId: string | null;
  userId: string | null;
  event: string;
  ipAddress: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface GoldxTradeHistoryEntry {
  id: string;
  licenseId: string;
  mt5Account: string;
  symbol: string;
  direction: string;
  entryPrice: number | null;
  slPrice: number | null;
  tpPrice: number | null;
  lotSize: number | null;
  mode: string;
  outcome: string | null;
  profit: number | null;
  openedAt: string;
  closedAt: string | null;
}

export interface GoldxAdminSetupRequest {
  id: string;
  userId: string;
  mt5LoginMasked: string;
  server: string;
  emailMasked: string;
  notePreview: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  internalNotesPreview: string | null;
  createdAt: string;
  updatedAt: string;
}
