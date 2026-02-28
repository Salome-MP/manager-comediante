'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ShoppingBag, User, LogOut, LayoutDashboard, Bell, Package, CheckCheck, Users2, Menu, Ticket } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { user, logout, loadFromStorage } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (user) {
      fetchCart();
      api.get('/notifications/unread-count')
        .then((res) => setUnreadCount(res.data.unreadCount))
        .catch(() => {});
    }
  }, [user, fetchCart]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  }, [notifLoading]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'SUPER_ADMIN' || user.role === 'STAFF') return '/admin';
    if (user.role === 'ARTIST') return '/dashboard';
    return '/mi-cuenta';
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b-2 border-navy-500/30 bg-[var(--navbar-bg-scrolled)] backdrop-blur-xl shadow-lg shadow-navy-900/8'
          : 'border-b border-border-default bg-[var(--navbar-bg)] backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-xl font-black tracking-tight">
            <span className="text-gradient-navy">Comediantes</span>
            <span className="text-text-muted">.com</span>
          </span>
        </Link>

        {/* Mobile menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-overlay-light hover:text-text-primary md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-3/4 max-w-64 p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="text-left text-sm">
                <span className="text-gradient-navy font-black">Comediantes</span>
                <span className="text-text-muted">.com</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                Inicio
              </Link>
              <Link href="/artistas" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                Comediantes
              </Link>
              <Link href="/shows" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                <Ticket className="h-4 w-4" />
                Shows
              </Link>
              <Link href="/buscar" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                <ShoppingBag className="h-4 w-4" />
                Tienda
              </Link>
              {user && (
                <Link href="/comunidades" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                  <Users2 className="h-4 w-4" />
                  Comunidades
                </Link>
              )}
              {user && (
                <>
                  <div className="my-1 h-px bg-border-default" />
                  <Link href="/mi-cuenta" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                    <Package className="h-4 w-4" />
                    Mi Cuenta
                  </Link>
                  {(user.role === 'SUPER_ADMIN' || user.role === 'STAFF' || user.role === 'ARTIST') && (
                    <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                      <LayoutDashboard className="h-4 w-4" />
                      {user.role === 'SUPER_ADMIN' || user.role === 'STAFF' ? 'Panel Admin' : 'Mi Dashboard'}
                    </Link>
                  )}
                </>
              )}
              {!user && (
                <>
                  <div className="my-1 h-px bg-border-default" />
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-overlay-light hover:text-text-primary transition-colors">
                    Iniciar sesion
                  </Link>
                  <Link href="/registro" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-navy-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-navy-500 transition-colors">
                    Registrarse
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Nav links */}
        <nav className="hidden items-center gap-0.5 md:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600"
          >
            Inicio
          </Link>
          <Link
            href="/artistas"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600"
          >
            Comediantes
          </Link>
          <Link
            href="/shows"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600"
          >
            <Ticket className="h-3.5 w-3.5" />
            Shows
          </Link>
          <Link
            href="/buscar"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Tienda
          </Link>
          {user && (
            <Link
              href="/comunidades"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600"
            >
              <Users2 className="h-3.5 w-3.5" />
              Comunidades
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <ThemeToggle />

          {user && (
            <>
              {/* Cart */}
              <Link
                href="/carrito"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600"
              >
                <ShoppingCart className="h-4 w-4" />
                {itemCount() > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-navy-500 text-[10px] font-bold text-white">
                    {itemCount()}
                  </span>
                )}
              </Link>

              {/* Notifications bell */}
              <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(); }}>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary transition-colors duration-150 hover:bg-navy-500/10 hover:text-navy-600">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 max-w-[calc(100vw-2rem)]"
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <p className="text-sm font-semibold text-text-primary">Notificaciones</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-text-faint transition-colors hover:text-navy-400"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Marcar todo leido
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-text-ghost">Cargando...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-text-ghost">
                      No tienes notificaciones
                    </div>
                  ) : (
                    <div className="max-h-[min(18rem,60vh)] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`border-b border-border-default px-3 py-2.5 last:border-b-0 ${
                            !n.isRead ? 'bg-navy-500/5' : ''
                          }`}
                        >
                          <p className={`text-sm ${!n.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-text-faint line-clamp-2">{n.message}</p>
                          <p className="mt-1 text-[10px] text-text-ghost">{timeAgo(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-1"
                >
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  {user.firstName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(user.role === 'SUPER_ADMIN' || user.role === 'STAFF' || user.role === 'ARTIST') && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={getDashboardLink()}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {user.role === 'SUPER_ADMIN' || user.role === 'STAFF' ? 'Panel Admin' : 'Mi Dashboard'}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/mi-cuenta">
                    <Package className="mr-2 h-4 w-4" />
                    Mi Cuenta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href="/login">Iniciar sesion</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-navy-600 text-white transition-all duration-200 hover:bg-navy-500 hover:shadow-lg hover:shadow-navy-500/25"
              >
                <Link href="/registro">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
