'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_STORAGE_KEY = 'tradevision_referral_code';

export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearReferralCode(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
}

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim()) {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, ref.trim());
    }
  }, [searchParams]);

  return null;
}
