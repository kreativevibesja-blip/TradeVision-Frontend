import { NextRequest, NextResponse } from 'next/server';
import type { DerivAnalysisResult, DerivCandle, DerivZone } from '@/lib/deriv-live';

export const runtime = 'nodejs';

interface AnalyzeRequestBody {
  symbol?: string;
  timeframe?: string;
  candles?: DerivCandle[];
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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const parseJsonBlock = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) ?? trimmed.match(/```\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? candidate.slice(firstBrace, lastBrace + 1) : candidate;
  return JSON.parse(jsonText);
};

const normalizeNumber = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeBias = (value: unknown): DerivAnalysisResult['bias'] => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'buy' || normalized === 'sell' ? normalized : 'none';
};

const normalizeVerdict = (value: unknown): DerivAnalysisResult['verdict'] => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'enter' || normalized === 'avoid' ? normalized : 'wait';
};

const normalizeSetupRating = (value: unknown): DerivAnalysisResult['setupRating'] => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (normalized === 'A+' || normalized === 'B') {
    return normalized;
  }
  if (normalized === 'A') {
    return 'A+';
  }
  return 'avoid';
};

const findZoneWindow = (zone: DerivZone, candles: DerivCandle[]) => {
  const low = Math.min(zone.start, zone.end);
  const high = Math.max(zone.start, zone.end);
  const matching = candles.filter((candle) => candle.low <= high && candle.high >= low);
  const relevant = matching.length > 0 ? matching.slice(-40) : candles.slice(-40);

  return {
    fromTime: relevant[0]?.time ?? candles[Math.max(0, candles.length - 40)]?.time ?? candles[0]?.time,
    toTime: relevant[relevant.length - 1]?.time ?? candles[candles.length - 1]?.time,
  };
};

const normalizeZones = (value: unknown, candles: DerivCandle[]): DerivZone[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((zone) => {
      if (!zone || typeof zone !== 'object') {
        return null;
      }

      const record = zone as Record<string, unknown>;
      const type = record.type === 'demand' || record.type === 'supply' ? record.type : null;
      const start = normalizeNumber(record.start);
      const end = normalizeNumber(record.end);
      if (!type || start == null || end == null) {
        return null;
      }

      const window = findZoneWindow({ type, start, end }, candles);
      return {
        type,
        start,
        end,
        fromTime: normalizeNumber(record.fromTime) ?? window.fromTime,
        toTime: normalizeNumber(record.toTime) ?? window.toTime,
      } as DerivZone;
    })
    .filter((zone): zone is DerivZone => zone !== null)
    .slice(0, 4);
};

const buildPrompt = (symbol: string, timeframe: string, candles: DerivCandle[]) => `You are an advanced trading analyst. Your job is NOT to find trades, but to FILTER OUT low-probability setups and only return high-quality opportunities.

Analyze the provided Deriv synthetic market candle data using multi-strategy confluence including:
- Market structure (HH, HL, LH, LL)
- Supply & Demand
- Fair Value Gaps (FVG)
- Liquidity (equal highs/lows, stop hunts)
- Momentum / displacement
- Price behavior inside zones

====================================================
STEP 1 — DETERMINE CONTEXT
====================================================

- Identify current market condition:
  - Bullish trend
  - Bearish trend
  - Range / consolidation
- Identify recent structure:
  - Higher highs / higher lows OR
  - Lower highs / lower lows
- If market is ranging or unclear:
  - Return NO TRADE

====================================================
STEP 2 — IDENTIFY ZONES (BUT DO NOT TRUST THEM YET)
====================================================

- Detect supply zones, demand zones, and fair value gaps
- Classify each zone internally as fresh, partially mitigated, or heavily mitigated
- Ignore zones that are heavily mitigated or tapped multiple times

====================================================
STEP 3 — FILTER BAD CONDITIONS
====================================================

DO NOT ALLOW A TRADE IF:
- Price is consolidating inside the zone
- Multiple wicks appear inside the zone
- No strong rejection or displacement
- Zone has been tapped multiple times
- Structure is conflicting (no clear direction)

If ANY of the above is true:
- Return NO TRADE

====================================================
STEP 4 — CONFIRMATION LOGIC
====================================================

Only consider a trade if ALL are true:
- Zone is fresh or lightly mitigated
- Price enters the zone and shows strong rejection OR displacement
- Market structure aligns with direction
- Momentum confirms direction
- A simple engulfing candle is NOT enough
- Require a clear momentum shift or break of structure

====================================================
STEP 5 — TRADE SETUP (ONLY IF VALID)
====================================================

If valid, return:
- Bias: buy or sell
- Entry
- Stop Loss
- Take Profit
- Zones

====================================================
STEP 6 — CONFIDENCE SCORE
====================================================

Rate setup:
- A+ = strong confluence, clear trend, strong momentum
- B = valid but weaker confirmation
- avoid = low quality

If not A+ or B:
- DO NOT RETURN TRADE

FINAL RULES:
- If the setup is not clear, clean, and high probability: Return NO TRADE
- You are a filter, not a signal generator
- Use ONLY the candle data below
- Do NOT invent prices outside the candle range

Return STRICT JSON ONLY with this exact shape:
{
  "bias": "buy | sell | none",
  "entry": number | null,
  "stopLoss": number | null,
  "takeProfit": number | null,
  "confidence": number,
  "setupRating": "A+ | B | avoid",
  "marketCondition": "bullish trend | bearish trend | range / consolidation | unclear",
  "verdict": "enter | wait | avoid",
  "reasoning": "2-4 concise sentences",
  "zones": [
    { "type": "demand | supply", "start": number, "end": number }
  ]
}

Symbol: ${symbol}
Timeframe: ${timeframe}
Candles:
${JSON.stringify(candles)}`;

const generateGemini = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Gemini request failed.');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || '';
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
};

const generateOpenAi = async (prompt: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5.1-mini';
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'OpenAI request failed.');
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned an empty response.');
  }

  return text;
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
    const symbol = typeof body.symbol === 'string' ? body.symbol : '';
    const timeframe = typeof body.timeframe === 'string' ? body.timeframe : '';
    const candles = Array.isArray(body.candles) ? body.candles.slice(-150) : [];

    if (!symbol || !timeframe || candles.length < 50) {
      return NextResponse.json({ error: 'Symbol, timeframe, and at least 50 candles are required.' }, { status: 400 });
    }

    const sanitizedCandles = candles
      .map((candle) => ({
        time: Number(candle.time),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
      }))
      .filter((candle) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite));

    if (sanitizedCandles.length < 50) {
      return NextResponse.json({ error: 'Candle payload is invalid.' }, { status: 400 });
    }

    const prompt = buildPrompt(symbol, timeframe, sanitizedCandles);

    let rawResponse = '';
    let lastError: unknown = null;

    const providers = [
      process.env.GEMINI_API_KEY ? () => generateGemini(prompt) : null,
      process.env.OPENAI_API_KEY ? () => generateOpenAi(prompt) : null,
    ].filter((provider): provider is () => Promise<string> => provider !== null);

    if (providers.length === 0) {
      return NextResponse.json({ error: 'No AI provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY to the frontend server env.' }, { status: 500 });
    }

    for (const provider of providers) {
      try {
        rawResponse = await provider();
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!rawResponse) {
      throw lastError instanceof Error ? lastError : new Error('No AI provider returned a response.');
    }

    const parsed = parseJsonBlock(rawResponse) as Record<string, unknown>;
    const latestClose = sanitizedCandles[sanitizedCandles.length - 1]?.close ?? null;
    const normalized: DerivAnalysisResult = {
      bias: normalizeBias(parsed.bias),
      entry: normalizeNumber(parsed.entry),
      stopLoss: normalizeNumber(parsed.stopLoss),
      takeProfit: normalizeNumber(parsed.takeProfit),
      confidence: clamp(normalizeNumber(parsed.confidence) ?? 50, 1, 100),
      setupRating: normalizeSetupRating(parsed.setupRating),
      marketCondition: typeof parsed.marketCondition === 'string' ? parsed.marketCondition : 'unclear',
      verdict: normalizeVerdict(parsed.verdict),
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No high-probability setup found.',
      zones: normalizeZones(parsed.zones, sanitizedCandles),
    };

    if (normalized.setupRating === 'avoid' || normalized.bias === 'none' || normalized.verdict !== 'enter') {
      normalized.entry = null;
      normalized.stopLoss = null;
      normalized.takeProfit = null;
      normalized.verdict = normalized.verdict === 'avoid' ? 'avoid' : 'wait';
    }

    if (normalized.entry == null && latestClose != null && normalized.verdict === 'enter') {
      normalized.entry = latestClose;
    }

    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Analysis failed.' }, { status: 500 });
  }
}
