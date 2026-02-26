'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  User,
  Package,
  CalendarDays,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Link2,
  Gift,
  Mic,
  BarChart3,
  Megaphone,

  Palette,
  ExternalLink,
  Clock,
} from 'lucide-react';
import MobileSidebar from '@/components/layout/mobile-sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/productos', label: 'Mis Productos', icon: Package },
  { href: '/dashboard/shows', label: 'Mis Shows', icon: CalendarDays },
  { href: '/dashboard/ventas', label: 'Mis Ventas', icon: DollarSign },
  { href: '/dashboard/referidos', label: 'Mis Referidos', icon: Link2 },
  { href: '/dashboard/personalizaciones', label: 'Personalizaciones', icon: Gift },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/comunidad', label: 'Comunidad', icon: Megaphone },
  { href: '/dashboard/landing', label: 'Landing Page', icon: Palette },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loadFromStorage, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setReady(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (ready && (!user || user.role !== 'ARTIST')) {
      router.push('/login');
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
          <p className="text-sm text-text-dim">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (user.isApproved === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-deep">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Cuenta pendiente de aprobacion</h1>
          <p className="text-sm text-text-dim">
            Tu solicitud como artista esta siendo revisada por nuestro equipo.
            Te notificaremos cuando tu cuenta sea activada.
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="border-border-strong text-text-secondary hover:bg-overlay-light"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </Button>
            <Button
              className="bg-navy-600 hover:bg-navy-500 text-white"
              onClick={() => router.push('/')}
            >
              Ir al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentNavItem = navItems.find(
    (i) => i.href === pathname || (i.href !== '/dashboard' && pathname.startsWith(i.href))
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-deep">
      {/* Sidebar — hidden on mobile */}
      <aside
        className={`relative hidden md:flex flex-col border-r border-border-default bg-surface-sidebar transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Sidebar glow top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-navy-500/40 to-transparent" />

        {/* Logo / Brand */}
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-navy-600 to-navy-800 shadow-lg shadow-navy-900/50">
                <Mic className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-text-primary">Artista</span>
                <span className="text-[10px] text-text-dim">Panel del artista</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-navy-600 to-navy-800 shadow-lg shadow-navy-900/50">
              <Mic className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-text-dim hover:text-text-primary"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 py-3">
          {collapsed && (
            <button
              className="mb-1 flex w-full items-center justify-center rounded-md py-2 text-text-dim transition-colors hover:bg-overlay-light hover:text-text-primary"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-navy-600/20 text-navy-600 dark:text-navy-300'
                    : 'text-text-dim hover:bg-overlay-light hover:text-text-secondary'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-navy-500" />
                )}
                <item.icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-navy-400' : 'text-text-ghost group-hover:text-text-tertiary'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* User + logout */}
        <div className="p-2 pb-3">
          {!collapsed && (
            <div className="mb-2 rounded-lg bg-overlay-subtle px-3 py-2">
              <p className="truncate text-xs font-medium text-text-secondary">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-text-ghost">Artista</p>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-dim transition-all hover:bg-red-500/10 hover:text-red-400 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Cerrar sesion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-border-default bg-surface-sidebar px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebar
              navItems={navItems}
              user={user}
              basePath="/dashboard"
              brandLabel="Panel Artista"
              brandIcon={Mic}
              onLogout={() => { logout(); router.push('/login'); }}
            />
            <h1 className="text-sm font-semibold text-text-primary">
              {currentNavItem?.label || 'Panel del Artista'}
            </h1>
            <span className="hidden text-text-ghost sm:block">/</span>
            <span className="hidden text-xs text-text-ghost sm:block">
              Comediantes.com
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-border-default bg-overlay-subtle px-3 py-1.5 text-xs text-text-dim hover:bg-overlay-light hover:text-text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver sitio
            </Link>
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border-default bg-overlay-subtle px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-navy-500 shadow-sm shadow-navy-500/50" />
              <span className="text-xs text-text-dim">
                {user.firstName} {user.lastName}
              </span>
              <span className="rounded bg-navy-500/20 px-1.5 py-0.5 text-[10px] font-medium text-navy-400">
                ARTISTA
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-deep p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
