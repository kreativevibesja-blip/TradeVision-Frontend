'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/92 backdrop-blur-xl md:hidden">
        <div className="page-shell flex min-h-14 items-center justify-between gap-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="truncate font-semibold text-foreground">TradeVision AI</span>
          </div>
          <p className="max-w-[12rem] text-right leading-tight">AI analysis is not financial advice.</p>
        </div>
      </div>

      <div className="hidden border-t border-white/10 bg-background/50 backdrop-blur-xl md:block">
        <div className="page-shell py-10 sm:py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gradient sm:text-xl">TradeVision AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered trading chart analysis for smarter trading decisions.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/analyze" className="transition-colors hover:text-foreground">Chart Analysis</Link></li>
                <li><Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link></li>
                <li><Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Supported</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>TradingView</li>
                <li>MetaTrader 5</li>
                <li>cTrader</li>
                <li>Deriv (Boom/Crash/Volatility)</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer transition-colors hover:text-foreground">Privacy Policy</li>
                <li className="cursor-pointer transition-colors hover:text-foreground">Terms of Service</li>
                <li className="cursor-pointer transition-colors hover:text-foreground">Disclaimer</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start gap-3 border-t border-white/10 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>&copy; {new Date().getFullYear()} TradeVision AI. All rights reserved.</p>
            <p>Trading involves risk. AI analysis is not financial advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
