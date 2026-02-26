'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

const REF_KEY = 'comediantes_ref';

/** Reads ?ref= from the URL, persists it in localStorage and tracks the click. */
export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('ref');
    if (!code) return;

    const stored = localStorage.getItem(REF_KEY);
    if (stored === code) return; // already tracked this code

    localStorage.setItem(REF_KEY, code);
    api.post(`/referrals/track/${code}`).catch(() => {});
  }, [searchParams]);

  return null;
}

/** Helper to retrieve (and optionally clear) the stored referral code. */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REF_KEY);
}

export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REF_KEY);
}
