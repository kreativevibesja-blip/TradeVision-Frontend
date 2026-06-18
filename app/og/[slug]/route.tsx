import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const cardTitles: Record<string, string> = {
  'tradevision-ai-home.png': 'AI Trading Chart Analysis & Trading Mentor',
  'tradevision-ai-features.png': 'AI Chart Analysis, Trade Radar & Orion AI',
  'tradevision-ai-community.png': 'Trading Feed, Community Rooms & Shared Analysis',
  'tradevision-ai-orion.png': 'Orion AI Trading Mentor',
  'tradevision-ai-trade-radar.png': 'Trade Radar Setup Monitoring',
};

export function GET(_request: Request, { params }: { params: { slug: string } }) {
  const title = cardTitles[params.slug] || 'TradeVision AI';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F7F9FC',
          color: '#111827',
          padding: 64,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 34, fontWeight: 900 }}>V</div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>TradeVision AI</div>
        </div>
        <div>
          <div style={{ color: '#2563EB', fontSize: 28, fontWeight: 800, marginBottom: 20 }}>AI-powered trading intelligence</div>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, maxWidth: 920 }}>{title}</div>
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: '#4B5563', maxWidth: 900 }}>
            Upload trading charts, review market structure, monitor setups with Trade Radar, and learn with Orion AI.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 24, color: '#2563EB', fontWeight: 800 }}>
          <span>AI Chart Analysis</span>
          <span>Trade Radar</span>
          <span>Orion AI</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
