'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Artist, Show, PaginatedResponse } from '@/types';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  MapPin,
  User,
  ShoppingBag,
  ArrowRight,
  Ticket,
  Star,
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Zap,
  Heart,
  PlayCircle,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import Calendar from 'react-calendar';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/calendar.css';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minPurchase?: number;
  expiresAt?: string;
}

interface FeaturedProduct {
  id: string;
  salePrice: number;
  isFeatured: boolean;
  customImages: string[];
  reviewStats?: { averageRating: number; totalReviews: number };
  product: { name: string; images: string[]; category: { name: string } };
  artist: { stageName: string; slug: string };
}

export default function HomePage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showPage, setShowPage] = useState(0);
  const SHOWS_PER_PAGE = 3;

  useEffect(() => {
    api.get<PaginatedResponse<Artist>>('/artists/public?limit=12')
      .then(res => setArtists(res.data.data))
      .catch(() => {});

    api.get<PaginatedResponse<Show>>('/shows/upcoming?limit=6')
      .then(res => setShows(res.data.data))
      .catch(() => {});

    api.get('/products/featured?limit=12')
      .then(res => setProducts(res.data.data ?? res.data ?? []))
      .catch(() => {});

    api.get<Coupon[]>('/coupons/active')
      .then(res => setCoupons(res.data))
      .catch(() => {});
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-base">

      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <section className="relative overflow-hidden bg-surface-deep">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-navy-600/20 blur-[120px]" />
          <div className="absolute -bottom-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-navy-500/10 blur-[100px]" />
          <div className="absolute right-0 top-1/3 h-[350px] w-[350px] rounded-full bg-indigo-600/15 blur-[100px]" />
          <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-navy-600/8 blur-[80px]" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(27,42,74,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,74,0.4) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-10 lg:py-12">
          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow badge */}
            <div className="mb-6 md:mb-8 inline-flex items-center gap-2 rounded-full border border-navy-500/25 bg-navy-500/10 px-4 md:px-5 py-2 text-xs font-semibold text-navy-600 dark:text-navy-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              La plataforma del humor en Latinoamérica
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-text-primary sm:text-5xl md:text-7xl lg:text-8xl">
              El humor que{' '}
              <span className="text-gradient-navy">estás buscando</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg md:text-xl">
              Mercancía oficial, shows en vivo y experiencias únicas con los mejores
              comediantes de Latinoamérica. Todo en un solo lugar.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-13 bg-navy-600 px-8 text-base font-semibold text-white shadow-lg shadow-navy-500/30 transition-all duration-200 hover:bg-navy-500 hover:shadow-navy-500/40 hover:-translate-y-0.5"
              >
                <Link href="/artistas">
                  Explorar comediantes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-13 border-border-strong bg-overlay-light px-8 text-base font-semibold text-text-secondary backdrop-blur-sm transition-all duration-200 hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
              >
                <Link href="/registro">Crear cuenta gratis</Link>
              </Button>
            </div>

            {/* Stats strip */}
            <div className="mx-auto mt-10 md:mt-16 max-w-lg">
              <div className="grid grid-cols-3 divide-x divide-border-medium rounded-2xl border border-border-default bg-surface-card/50 backdrop-blur-sm">
                {[
                  { icon: Mic, value: 'Shows', label: 'en vivo' },
                  { icon: ShoppingBag, value: 'Merch', label: 'oficial' },
                  { icon: Heart, value: 'Fans', label: 'felices' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex flex-col items-center gap-1 px-4 py-5">
                      <Icon className="mb-1 h-4 w-4 text-navy-400" />
                      <p className="text-base font-bold text-text-primary sm:text-lg">{stat.value}</p>
                      <p className="text-xs text-text-faint">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-base to-transparent" />
      </section>

      {/* ================================================================
          MARQUEE — Scrolling text strip
      ================================================================ */}
      <section className="relative overflow-hidden border-y border-navy-300/30 bg-navy-50/60 py-4">
        <div className="marquee-container">
          <div className="marquee-track">
            {[...Array(2)].map((_, copyIdx) => (
              <div key={copyIdx} className="marquee-content" aria-hidden={copyIdx > 0}>
                {[
                  'STAND UP',
                  'COMEDIA',
                  'SHOWS EN VIVO',
                  'MERCH OFICIAL',
                  'HUMOR LATINO',
                  'ENTRADAS',
                  'EXPERIENCIAS',
                  'COMEDIANTES',
                ].map((word, i) => (
                  <span key={`${copyIdx}-${i}`} className="flex items-center gap-6">
                    <span className="cursor-pointer select-none rounded-md px-2 py-1 text-sm font-bold uppercase tracking-[0.2em] text-navy-400/70 transition-all duration-200 hover:bg-navy-600 hover:text-white hover:shadow-lg hover:shadow-navy-600/30 active:scale-95">
                      {word}
                    </span>
                    <Star className="h-3 w-3 fill-navy-500/50 text-navy-500/50" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          ARTISTAS DESTACADOS - CARRUSEL
      ================================================================ */}
      <section className="relative py-12 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          {/* Section header */}
          <div className="mb-8 md:mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy-400">
                Nuestros talentos
              </p>
              <h2 className="text-2xl font-black text-text-primary md:text-4xl">
                Comediantes destacados
              </h2>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <button className="artists-prev flex h-10 w-10 items-center justify-center rounded-full border border-border-medium bg-surface-card text-text-faint transition-all duration-200 hover:border-navy-500/40 hover:bg-navy-500/10 hover:text-navy-400 disabled:opacity-30">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="artists-next flex h-10 w-10 items-center justify-center rounded-full border border-border-medium bg-surface-card text-text-faint transition-all duration-200 hover:border-navy-500/40 hover:bg-navy-500/10 hover:text-navy-400 disabled:opacity-30">
                <ChevronRight className="h-5 w-5" />
              </button>
              <Link
                href="/artistas"
                className="group ml-2 flex items-center gap-1.5 text-sm font-medium text-text-faint transition-colors duration-150 hover:text-navy-400"
              >
                Ver todos
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {artists.length > 0 ? (
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={16}
              slidesPerView={1.3}
              breakpoints={{
                480: { slidesPerView: 2.2 },
                640: { slidesPerView: 2.5 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 4.5 },
              }}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                prevEl: '.artists-prev',
                nextEl: '.artists-next',
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              loop={artists.length > 4}
              className="artists-carousel pb-12"
            >
              {artists.map((artist) => (
                <SwiperSlide key={artist.id}>
                  <Link href={`/artistas/${artist.slug}`} className="block">
                    <div className="card-glow group overflow-hidden rounded-2xl bg-surface-card transition-all duration-300 hover:-translate-y-1">
                      {/* Image */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-surface-elevated">
                        {artist.profileImage ? (
                          <img
                            src={artist.profileImage}
                            alt={artist.stageName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-elevated to-surface-deep">
                            <User className="h-16 w-16 text-navy-100 dark:text-white/10" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Featured badge */}
                        {artist.isFeatured && (
                          <div className="absolute left-3 top-3">
                            <Badge className="border-0 bg-navy-500/90 text-[10px] font-semibold text-white backdrop-blur-sm">
                              <Star className="mr-1 h-2.5 w-2.5 fill-current" />
                              Destacado
                            </Badge>
                          </div>
                        )}

                        {/* Info overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-bold text-white drop-shadow-lg transition-colors group-hover:text-navy-700 dark:hover:text-navy-200">
                            {artist.stageName}
                          </h3>
                          {artist.tagline && (
                            <p className="mt-1 text-xs text-white/60 line-clamp-1">
                              {artist.tagline}
                            </p>
                          )}
                          {artist._count?.followers !== undefined && artist._count.followers > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-white/50">
                              <Users className="h-3 w-3" />
                              <span>{artist._count.followers} seguidores</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA button */}
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-faint">Ver perfil</span>
                          <ArrowRight className="h-4 w-4 text-navy-400 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-card py-20">
              <Mic className="mb-4 h-12 w-12 text-navy-100 dark:text-white/10" />
              <p className="text-sm text-text-ghost">
                Pronto tendremos comediantes en la plataforma.
              </p>
            </div>
          )}

          {/* Mobile ver todos */}
          <div className="mt-4 flex justify-center md:hidden">
            <Button
              variant="outline"
              asChild
              className="border-border-strong bg-transparent text-text-tertiary hover:border-border-accent hover:text-text-primary"
            >
              <Link href="/artistas">Ver todos los comediantes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================================================================
          PROXIMOS SHOWS
      ================================================================ */}
      {shows.length > 0 && (
        <section className="relative overflow-hidden py-12 md:py-28">
          {/* Background accent */}
          <div className="pointer-events-none absolute inset-0 bg-surface-deep">
            <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-navy-600/10 blur-[120px]" />
            <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-indigo-600/8 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4">
            {/* Section header */}
            <div className="mb-8 md:mb-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy-400">
                No te los pierdas
              </p>
              <h2 className="text-2xl font-black text-text-primary md:text-4xl">
                Próximos shows
              </h2>
            </div>

            {/* Two-column layout: calendar left, shows right */}
            <div className="grid gap-6 md:grid-cols-[auto_1fr]">
              {/* Calendar column */}
              <div className="flex flex-col items-center md:items-start">
                <Calendar
                  locale="es-PE"
                  tileContent={({ date, view }: { date: Date; view: string }) => {
                    if (view !== 'month') return null;
                    const hasShow = shows.some((s) => {
                      const sd = new Date(s.date);
                      return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate();
                    });
                    return hasShow ? <div className="calendar-show-dot" /> : null;
                  }}
                  onClickDay={(date: Date) => {
                    const idx = shows.findIndex((s) => {
                      const sd = new Date(s.date);
                      return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate();
                    });
                    if (idx !== -1) {
                      setShowPage(Math.floor(idx / SHOWS_PER_PAGE));
                    }
                  }}
                />
                <div className="mt-4 hidden md:block">
                  <Link
                    href="/shows"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-500"
                  >
                    Ver todos los shows
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Shows list column */}
              <div className="flex flex-col">
                <div className="space-y-3">
                  {shows
                    .slice(showPage * SHOWS_PER_PAGE, showPage * SHOWS_PER_PAGE + SHOWS_PER_PAGE)
                    .map((show) => {
                      const showDate = new Date(show.date);
                      const day = showDate.getDate();
                      const month = showDate
                        .toLocaleDateString('es-PE', { month: 'short' })
                        .toUpperCase()
                        .replace('.', '');
                      return (
                        <Link
                          key={show.id}
                          id={`show-${show.id}`}
                          href={`/shows/${show.slug}`}
                          className="card-glow group flex gap-4 rounded-xl border border-border-default bg-surface-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-500/40 hover:shadow-lg hover:shadow-navy-500/8"
                        >
                          {/* Date badge */}
                          <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-navy-600/15 ring-1 ring-navy-500/20">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">
                              {month}
                            </span>
                            <span className="text-xl font-black leading-tight text-text-primary">
                              {day}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-text-primary transition-colors group-hover:text-navy-600 truncate">
                              {show.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-1.5 text-sm text-text-faint">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-navy-500/60" />
                              <span className="truncate">{show.venue}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-text-ghost">
                              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {showDate.toLocaleDateString('es-PE', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Price + CTA */}
                          <div className="hidden sm:flex flex-col items-end justify-center gap-1.5">
                            {show.ticketPrice && (
                              <span className="text-base font-bold text-text-primary">
                                S/. {Number(show.ticketPrice).toFixed(2)}
                              </span>
                            )}
                            <span className="rounded-md bg-navy-500/10 px-3 py-1 text-xs font-semibold text-navy-500 ring-1 ring-navy-500/20 transition-all duration-150 group-hover:bg-navy-600 group-hover:text-white group-hover:ring-0">
                              Comprar entrada
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                </div>

                {/* Pagination arrows */}
                {shows.length > SHOWS_PER_PAGE && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-text-ghost">
                      {showPage + 1} / {Math.ceil(shows.length / SHOWS_PER_PAGE)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPage((p) => Math.max(0, p - 1))}
                        disabled={showPage === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-medium bg-surface-card text-text-faint transition-all duration-200 hover:border-navy-500/40 hover:bg-navy-500/10 hover:text-navy-400 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowPage((p) => Math.min(Math.ceil(shows.length / SHOWS_PER_PAGE) - 1, p + 1))}
                        disabled={showPage >= Math.ceil(shows.length / SHOWS_PER_PAGE) - 1}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-medium bg-surface-card text-text-faint transition-all duration-200 hover:border-navy-500/40 hover:bg-navy-500/10 hover:text-navy-400 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile ver todos */}
            <div className="mt-6 flex justify-center md:hidden">
              <Link
                href="/shows"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-500"
              >
                Ver todos los shows
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================
          PRODUCTOS EN TENDENCIA - CARRUSEL
      ================================================================ */}
      {products.length > 0 && (
        <section className="py-12 md:py-28">
          <div className="mx-auto max-w-7xl px-4">
            {/* Section header */}
            <div className="mb-8 md:mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy-400">
                  Merch oficial
                </p>
                <h2 className="text-2xl font-black text-text-primary md:text-4xl">
                  Productos en tendencia
                </h2>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <button className="products-prev flex h-10 w-10 items-center justify-center rounded-full border border-border-medium bg-surface-card text-text-faint transition-all duration-200 hover:border-navy-500/40 hover:bg-navy-500/10 hover:text-navy-400 disabled:opacity-30">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="products-next flex h-10 w-10 items-center justify-center rounded-full border border-border-medium bg-surface-card text-text-faint transition-all duration-200 hover:border-navy-500/40 hover:bg-navy-500/10 hover:text-navy-400 disabled:opacity-30">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <Link
                  href="/buscar"
                  className="group ml-2 flex items-center gap-1.5 text-sm font-medium text-text-faint transition-colors duration-150 hover:text-navy-400"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              slidesPerView={1.5}
              breakpoints={{
                480: { slidesPerView: 2.2 },
                640: { slidesPerView: 2.5 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4 },
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                prevEl: '.products-prev',
                nextEl: '.products-next',
              }}
              loop={products.length > 4}
              className="products-carousel"
            >
              {products.map((ap) => {
                const imgSrc = ap.customImages?.[0] || ap.product.images?.[0];
                return (
                  <SwiperSlide key={ap.id}>
                    <Link href={`/producto/${ap.id}`} className="block">
                      <div className="card-glow group overflow-hidden rounded-xl bg-surface-card transition-all duration-300 hover:-translate-y-1">
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-surface-elevated">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={ap.product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-10 w-10 text-navy-100 dark:text-white/15" />
                            </div>
                          )}
                          {/* Category pill */}
                          <div className="absolute left-2.5 top-2.5">
                            <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-text-tertiary backdrop-blur-sm">
                              {ap.product.category.name}
                            </span>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>
                        {/* Info */}
                        <div className="p-3.5">
                          <p className="text-xs font-medium text-navy-400/70">
                            {ap.artist.stageName}
                          </p>
                          <h3 className="mt-0.5 text-sm font-semibold text-text-primary transition-colors group-hover:text-navy-700 dark:hover:text-navy-200 line-clamp-1">
                            {ap.product.name}
                          </h3>
                          {ap.reviewStats && ap.reviewStats.totalReviews > 0 && (
                            <div className="mt-1">
                              <StarRating
                                rating={ap.reviewStats.averageRating}
                                totalReviews={ap.reviewStats.totalReviews}
                              />
                            </div>
                          )}
                          <p className="mt-2 text-base font-bold text-text-primary">
                            S/. {Number(ap.salePrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Mobile ver todos */}
            <div className="mt-4 flex justify-center md:hidden">
              <Button
                variant="outline"
                asChild
                className="border-border-strong bg-transparent text-text-tertiary hover:border-border-accent hover:text-text-primary"
              >
                <Link href="/buscar">Ver todos los productos</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================
          CUPONES ACTIVOS
      ================================================================ */}
      {coupons.length > 0 && (
        <section className="relative overflow-hidden py-12 md:py-28">
          <div className="pointer-events-none absolute inset-0 bg-surface-deep">
            <div className="absolute left-0 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
            <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-navy-600/8 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4">
            <div className="mb-8 md:mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                Ofertas especiales
              </p>
              <h2 className="text-2xl font-black text-text-primary md:text-4xl">
                Cupones de descuento
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-text-faint">
                Copia el código y aplícalo en tu carrito para obtener el descuento.
              </p>
            </div>

            {/* Single coupon — horizontal ticket layout */}
            {coupons.length === 1 && (() => {
              const coupon = coupons[0];
              return (
                <div className="mx-auto max-w-2xl">
                  <div className="group relative transition-all duration-300 hover:-translate-y-1">
                    <div className="relative overflow-hidden rounded-2xl bg-surface-card shadow-sm ring-1 ring-border-default transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10 group-hover:ring-emerald-500/30">
                      {/* Top accent bar */}
                      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />

                      <div className="flex flex-col sm:flex-row">
                        {/* Left — Discount hero */}
                        <div className="flex flex-col items-center justify-center px-8 py-6 sm:py-8">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                              {coupon.discountType === 'percentage'
                                ? `${Number(coupon.discountValue)}%`
                                : `S/${Number(coupon.discountValue).toFixed(0)}`}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-bold text-text-primary">de descuento</p>
                          {coupon.description && (
                            <p className="mt-1 text-center text-xs text-text-faint">{coupon.description}</p>
                          )}
                          {coupon.minPurchase && Number(coupon.minPurchase) > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-500/8 px-3 py-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/15">
                              <ShoppingBag className="h-3 w-3" />
                              Compra mínima: S/. {Number(coupon.minPurchase).toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Perforated divider — horizontal on mobile, vertical on sm+ */}
                        <div className="relative flex items-center sm:flex-col sm:py-6">
                          {/* Mobile: horizontal */}
                          <div className="flex w-full items-center sm:hidden">
                            <div className="absolute -left-3 h-6 w-6 rounded-full bg-surface-deep" />
                            <div className="w-full border-t-2 border-dashed border-border-default" />
                            <div className="absolute -right-3 h-6 w-6 rounded-full bg-surface-deep" />
                          </div>
                          {/* Desktop: vertical */}
                          <div className="hidden h-full items-center sm:flex">
                            <div className="absolute -top-3 h-6 w-6 rounded-full bg-surface-deep" />
                            <div className="h-full border-l-2 border-dashed border-border-default" />
                            <div className="absolute -bottom-3 h-6 w-6 rounded-full bg-surface-deep" />
                          </div>
                        </div>

                        {/* Right — Code section */}
                        <div className="flex flex-1 flex-col justify-center px-8 py-6 sm:py-8">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-ghost">
                            Tu código
                          </p>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-emerald-500/25 bg-emerald-500/5 px-5 py-4 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-[0.98]"
                          >
                            <span className="font-mono text-lg font-black tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                              {coupon.code}
                            </span>
                            {copiedCode === coupon.code ? (
                              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="h-4 w-4" />
                                Copiado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-sm font-medium text-text-ghost transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                <Copy className="h-4 w-4" />
                                Copiar
                              </span>
                            )}
                          </button>
                          {coupon.expiresAt && (
                            <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-text-ghost">
                              <CalendarDays className="h-3 w-3" />
                              Válido hasta {new Date(coupon.expiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Multiple coupons — grid layout */}
            {coupons.length >= 2 && (
              <div className={`mx-auto grid max-w-5xl gap-5 ${coupons.length === 2 ? 'sm:grid-cols-2 max-w-3xl' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="group relative transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-surface-card shadow-sm ring-1 ring-border-default transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10 group-hover:ring-emerald-500/30">
                      {/* Top accent bar */}
                      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />

                      {/* Main content */}
                      <div className="p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                              {coupon.discountType === 'percentage'
                                ? `${Number(coupon.discountValue)}%`
                                : `S/${Number(coupon.discountValue).toFixed(0)}`}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">de descuento</p>
                            {coupon.description && (
                              <p className="mt-0.5 text-xs text-text-faint line-clamp-1">{coupon.description}</p>
                            )}
                          </div>
                        </div>

                        {coupon.minPurchase && Number(coupon.minPurchase) > 0 && (
                          <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-amber-500/8 px-3 py-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/15">
                            <ShoppingBag className="h-3 w-3" />
                            Compra mínima: S/. {Number(coupon.minPurchase).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Perforated divider */}
                      <div className="relative mx-0 flex items-center">
                        <div className="absolute -left-3 h-6 w-6 rounded-full bg-surface-deep" />
                        <div className="w-full border-t-2 border-dashed border-border-default" />
                        <div className="absolute -right-3 h-6 w-6 rounded-full bg-surface-deep" />
                      </div>

                      {/* Code section */}
                      <div className="p-5 pt-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-ghost">
                          Tu código
                        </p>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-emerald-500/25 bg-emerald-500/5 px-4 py-3 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-[0.98]"
                        >
                          <span className="font-mono text-base font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                            {coupon.code}
                          </span>
                          {copiedCode === coupon.code ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="h-4 w-4" />
                              Copiado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-text-ghost transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              <Copy className="h-3.5 w-3.5" />
                              Copiar
                            </span>
                          )}
                        </button>

                        {coupon.expiresAt && (
                          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-text-ghost">
                            <CalendarDays className="h-3 w-3" />
                            Válido hasta {new Date(coupon.expiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================================================================
          QUE ES LA PLATAFORMA / COMO FUNCIONA
      ================================================================ */}
      <section className="relative overflow-hidden py-14 md:py-32">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 bg-surface-deep">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-600/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          {/* What is the platform */}
          <div className="mb-12 md:mb-20 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-navy-400">
              Conoce la plataforma
            </p>
            <h2 className="text-2xl font-black text-text-primary sm:text-3xl md:text-4xl lg:text-5xl">
              ¿Qué es <span className="text-gradient-navy">Comediantes.com</span>?
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-text-muted md:text-lg">
              Somos la primera plataforma que conecta a los fans con sus comediantes favoritos
              de Latinoamérica. Comprá mercancía oficial, asistí a shows en vivo y accedé a
              experiencias exclusivas, todo en un solo lugar.
            </p>

            <div className="mx-auto mt-8 md:mt-12 grid max-w-4xl grid-cols-1 gap-4 md:gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Mic,
                  title: 'Para comediantes',
                  description: 'Monetizá tu humor con tu propia tienda y venta de entradas.',
                },
                {
                  icon: Heart,
                  title: 'Para fans',
                  description: 'Apoyá a tus favoritos comprando su merch oficial y entradas.',
                },
                {
                  icon: Zap,
                  title: 'Sin complicaciones',
                  description: 'Nosotros fabricamos, enviamos y gestionamos. Vos disfrutás.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="card-glow group rounded-2xl bg-surface-card/50 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-surface-card"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-500/10 ring-1 ring-navy-500/20 transition-all duration-300 group-hover:bg-navy-500/20 group-hover:ring-navy-500/40">
                      <Icon className="h-5 w-5 text-navy-400" />
                    </div>
                    <h3 className="text-base font-bold text-text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm text-text-faint">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Separator */}
          <div className="separator-glow mx-auto mb-12 md:mb-20 max-w-xs" />

          {/* How it works */}
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-navy-400">
              Simple y directo
            </p>
            <h2 className="text-2xl font-black text-text-primary md:text-4xl">
              ¿Cómo funciona?
            </h2>
          </div>

          <div className="relative mt-8 md:mt-14">
            {/* Connection line (desktop only) */}
            <div className="pointer-events-none absolute left-0 right-0 top-[60px] hidden h-px bg-gradient-to-r from-transparent via-navy-500/20 to-transparent md:block" />

            <div className="grid gap-4 md:gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Elige tu comediante',
                  description:
                    'Explora los perfiles de tus comediantes favoritos y descubre su contenido, shows y mercancía.',
                  icon: User,
                },
                {
                  step: '02',
                  title: 'Compra su mercancía',
                  description:
                    'Productos oficiales diseñados y aprobados por cada artista. Nosotros nos encargamos del envío.',
                  icon: ShoppingBag,
                },
                {
                  step: '03',
                  title: 'Asiste a sus shows',
                  description:
                    'Compra entradas directamente y recibe tu QR. Vive la experiencia del humor en vivo.',
                  icon: Ticket,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="card-glow group relative rounded-2xl bg-surface-card p-7 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Step number — decorative */}
                    <div className="mb-5 flex items-center justify-between">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-navy-500/10 ring-1 ring-navy-500/20 transition-all duration-300 group-hover:bg-navy-500/20 group-hover:ring-navy-500/40">
                        <Icon className="h-5 w-5 text-navy-400" />
                      </div>
                      <span className="text-5xl font-black text-overlay-light transition-colors duration-300 group-hover:text-overlay-medium">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-faint">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA FINAL
      ================================================================ */}
      <section className="relative overflow-hidden py-14 md:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900/25 via-transparent to-indigo-900/25" />
          <div className="absolute left-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-navy-600/20 blur-[120px]" />
          <div className="absolute right-1/4 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(27,42,74,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,74,0.4) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <div className="mb-6 md:mb-8 inline-flex items-center gap-2 rounded-full border border-navy-500/25 bg-navy-500/10 px-4 md:px-5 py-2 text-xs font-semibold text-navy-600 dark:text-navy-300 backdrop-blur-sm">
            <PlayCircle className="h-3.5 w-3.5" />
            Empieza hoy
          </div>
          <h2 className="text-2xl font-black leading-tight text-text-primary sm:text-4xl md:text-5xl lg:text-6xl">
            Únete a la comunidad del{' '}
            <span className="text-gradient-navy">humor latinoamericano</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-text-muted md:text-lg">
            Crea tu cuenta gratis y comienza a apoyar a tus comediantes favoritos comprando
            su merch y asistiendo a sus shows.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-13 bg-navy-600 px-10 text-base font-semibold text-white shadow-lg shadow-navy-500/30 transition-all duration-200 hover:bg-navy-500 hover:shadow-navy-500/40 hover:-translate-y-0.5"
            >
              <Link href="/registro">
                Comenzar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="h-13 px-10 text-base font-medium text-text-muted transition-all duration-200 hover:bg-overlay-light hover:text-text-primary"
            >
              <Link href="/artistas">Explorar sin cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
