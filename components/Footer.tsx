'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">TradeVision AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered trading chart analysis for smarter trading decisions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/analyze" className="hover:text-foreground transition-colors">Chart Analysis</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Supported</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>TradingView</li>
              <li>MetaTrader 5</li>
              <li>cTrader</li>
              <li>Deriv (Boom/Crash/Volatility)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Disclaimer</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TradeVision AI. All rights reserved.</p>
          <p>Trading involves risk. AI analysis is not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}
