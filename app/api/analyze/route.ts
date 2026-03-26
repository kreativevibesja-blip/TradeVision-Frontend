import { NextRequest, NextResponse } from 'next/server';
import { DERIV_ANALYSIS_CANDLE_COUNT } from '@/lib/deriv-live';

export const runtime = 'nodejs';

interface AnalyzeRequestBody {
  symbol?: string;
  timeframe?: string;
  candles?: Array<{ time: number; open: number; high: number; low: number; close: number }>;
}

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
    return rawValue.replace(/\/$/, '').endsWith('/api') ? rawValue.replace(/\/$/, '') : `${rawValue.replace(/\/$/, '')}/api`;
  }
};

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const profileResponse = await fetch(`${normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL)}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Unable to validate user session.' }, { status: 401 });
    }

    const profilePayload = await profileResponse.json() as { user?: { subscription?: string } };
    if (profilePayload.user?.subscription !== 'PRO') {
      return NextResponse.json({ error: 'Pro subscription required.' }, { status: 403 });
    }

    const body = (await request.json()) as AnalyzeRequestBody;
    const symbol = typeof body.symbol === 'string' ? body.symbol.trim() : '';
    const timeframe = typeof body.timeframe === 'string' ? body.timeframe.trim() : '';
    const candles = Array.isArray(body.candles) ? body.candles.slice(-DERIV_ANALYSIS_CANDLE_COUNT) : [];

    if (!symbol || !timeframe || candles.length < 50) {
      return NextResponse.json({ error: 'Symbol, timeframe, and at least 50 candles are required.' }, { status: 400 });
    }

    const backendResponse = await fetch(`${normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL)}/analyze-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source: 'deriv-live',
        symbol,
        timeframe,
        candles,
      }),
      cache: 'no-store',
    });

    const payload = await backendResponse.json().catch(() => ({ error: 'Analysis request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json({ error: payload.error || 'Analysis request failed.' }, { status: backendResponse.status });
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Analysis failed.' }, { status: 500 });
  }
}
