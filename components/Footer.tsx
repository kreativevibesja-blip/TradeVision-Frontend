'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv' || pathname.startsWith('/dashboard/live-charts/');

  if (isLiveWorkspace) {
    return null;
  }

  return (
    <footer className="border-t border-border bg-card/86 text-card-foreground backdrop-blur-2xl">
      <div className="page-shell py-5">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
          <Link href="/privacy-policy" className="transition-colors hover:text-foreground">Privacy</Link>
          <Link href="/terms-of-service" className="transition-colors hover:text-foreground">Terms</Link>
          <Link href="/disclaimer" className="transition-colors hover:text-foreground">Disclaimer</Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">FAQ</Link>
          <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
          &copy; {new Date().getFullYear()} TradeVision AI. Trading involves risk.
        </p>
      </div>
    </footer>
  );
}
