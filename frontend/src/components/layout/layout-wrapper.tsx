'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import Footer from './footer';
import ReferralCapture from '@/components/referral-capture';

const AUTH_ROUTES = ['/login', '/registro', '/forgot-password', '/reset-password'];
const PANEL_ROUTES = ['/admin', '/dashboard'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPanelRoute = PANEL_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute || isPanelRoute) {
    return (
      <>
        <Suspense><ReferralCapture /></Suspense>
        {children}
      </>
    );
  }

  return (
    <>
      <Suspense><ReferralCapture /></Suspense>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
