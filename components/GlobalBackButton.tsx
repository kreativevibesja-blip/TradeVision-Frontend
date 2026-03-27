'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getFallbackRoute(pathname: string): string | null {
  if (pathname === '/') {
    return null;
  }

  if (pathname === '/checkout') {
    return '/pricing';
  }

  if (pathname.startsWith('/admin/')) {
    return '/admin';
  }

  if (pathname === '/admin') {
    return '/dashboard';
  }

  return '/';
}

export function GlobalBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv';

  const fallbackRoute = useMemo(() => getFallbackRoute(pathname), [pathname]);

  if (!fallbackRoute || isLiveWorkspace) {
    return null;
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackRoute);
  };

  return (
    <div className="fixed left-3 top-[4.75rem] z-40 md:left-4 lg:left-6">
      <Button variant="outline" size="sm" className="gap-2 bg-background/85 backdrop-blur-xl border-white/10 shadow-lg" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  );
}