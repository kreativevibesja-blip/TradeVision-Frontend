'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';

export function Footer() {
  const pathname = usePathname();
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv';

  if (isLiveWorkspace) {
    return null;
  }

  return (
    <footer className="border-t border-[rgba(255,223,112,0.12)] bg-[rgba(5,5,5,0.72)] backdrop-blur-2xl">
      <div className="border-b border-[rgba(255,223,112,0.08)] md:hidden">
        <div className="page-shell py-4 text-[11px] text-muted-foreground">
          <p className="rounded-2xl border border-[rgba(255,223,112,0.12)] bg-white/[0.03] px-4 py-3 text-center leading-relaxed">
            TradeVision AI delivers premium chart intelligence. It does not replace your own risk management or execution judgment.
          </p>
        </div>
      </div>

      <div className="page-shell py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            <div className="space-y-4">
              <BrandLogo href="/" />
              <p className="text-sm text-muted-foreground">
                Institutional trading intelligence built for chart analysis, execution planning, and mobile-first access.
              </p>
            </div>

            <div className="min-w-0">
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/analyze" className="transition-colors hover:text-foreground">Chart Analysis</Link></li>
                <li><Link href="/trade-examples" className="transition-colors hover:text-foreground">Trade Quality Examples</Link></li>
                <li><Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link></li>
                <li><Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="mb-4 font-semibold">Supported</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>TradingView</li>
                <li>Deriv (Boom/Crash/Volatility)</li>
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy-policy" className="transition-colors hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="transition-colors hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="transition-colors hover:text-foreground">Disclaimer</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-[rgba(255,223,112,0.08)] pt-5 text-sm text-muted-foreground sm:mt-10 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <p>&copy; {new Date().getFullYear()} TradeVision AI. All rights reserved.</p>
            <p>Trading involves risk. AI analysis is not financial advice.</p>
          </div>
        </div>
    </footer>
  );
}
