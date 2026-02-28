'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Ticket, Search, MapPin, Clock, Calendar, X, Users } from 'lucide-react';

interface ShowArtist {
  id: string;
  stageName: string;
  slug: string;
  profileImage?: string | null;
}

interface UpcomingShow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  venue: string;
  address?: string | null;
  city?: string | null;
  date: string;
  image?: string | null;
  ticketPrice?: number | null;
  totalCapacity?: number | null;
  ticketsEnabled: boolean;
  status: string;
  artist: ShowArtist;
  _count: { tickets: number };
}

function ShowCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-border-medium animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded-lg w-3/4" />
        <div className="h-4 bg-muted/70 rounded-lg w-full" />
        <div className="h-4 bg-muted/70 rounded-lg w-2/3" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 bg-muted/50 rounded-lg w-1/3" />
          <div className="h-7 bg-muted/50 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatMonthShort(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
}

function formatDay(dateStr: string) {
  return new Date(dateStr).getDate().toString();
}

export default function ShowsPage() {
  const [shows, setShows] = useState<UpcomingShow[]>([]);
  const [artists, setArtists] = useState<ShowArtist[]>([]);
  const [filtered, setFiltered] = useState<UpcomingShow[]>([]);
  const [search, setSearch] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const artistInputRef = useRef<HTMLInputElement>(null);
  const artistDropdownRef = useRef<HTMLDivElement>(null);

  // Close artist dropdown on click outside
  useEffect(() => {
    if (!artistDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (artistDropdownRef.current && !artistDropdownRef.current.contains(e.target as Node)) {
        setArtistDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [artistDropdownOpen]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/shows/upcoming?limit=200'),
      api.get('/artists/public?limit=100'),
    ]).then(([showsResult, artistsResult]) => {
      if (showsResult.status === 'fulfilled') {
        setShows(showsResult.value.data.data || showsResult.value.data);
      }
      if (artistsResult.status === 'fulfilled') {
        setArtists(artistsResult.value.data.data || []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = shows;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.venue.toLowerCase().includes(q) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          s.artist.stageName.toLowerCase().includes(q),
      );
    }

    if (artistQuery) {
      const q = artistQuery.toLowerCase();
      result = result.filter((s) =>
        s.artist.stageName.toLowerCase().includes(q),
      );
    }

    setFiltered(result);
  }, [search, artistQuery, shows]);

  // Artists that actually have upcoming shows
  const artistsWithShows = artists.filter((a) =>
    shows.some((s) => s.artist.id === a.id),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-navy-600 via-navy-700 to-navy-800 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-navy-400/15 blur-3xl" />
          <div className="absolute -top-16 -right-32 w-80 h-80 rounded-full bg-navy-300/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-navy-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <Ticket className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
              Eventos en vivo
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Proximos{' '}
            <span className="bg-gradient-to-r from-navy-200 via-white to-navy-200 bg-clip-text text-transparent">
              Shows
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            No te pierdas los mejores shows de comedia en vivo. Compra tus
            entradas y vive la experiencia.
          </p>

          {!loading && shows.length > 0 && (
            <div className="mt-8 inline-flex items-center gap-3 sm:gap-6 rounded-2xl border border-white/20 bg-white/10 px-4 sm:px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  {shows.length}
                </span>
                <span className="text-sm text-white/70">
                  {shows.length === 1 ? 'show' : 'shows'} disponibles
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por show, venue, ciudad o artista..."
                className="h-11 w-full rounded-xl border-border-medium bg-surface-card pl-11 pr-10 text-text-primary placeholder:text-text-muted focus-visible:border-navy-500/60 focus-visible:ring-navy-500/20 transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative sm:w-56" ref={artistDropdownRef}>
              <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                ref={artistInputRef}
                value={artistQuery}
                onChange={(e) => {
                  setArtistQuery(e.target.value);
                  setArtistDropdownOpen(true);
                }}
                onFocus={() => setArtistDropdownOpen(true)}
                placeholder="Todos los artistas"
                className="h-11 w-full rounded-xl border-border-medium bg-surface-card pl-11 pr-10 text-text-primary placeholder:text-text-muted focus-visible:border-navy-500/60 focus-visible:ring-navy-500/20 transition-all duration-200"
              />
              {artistQuery && (
                <button
                  onClick={() => {
                    setArtistQuery('');
                    setArtistDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {artistDropdownOpen && (() => {
                const suggestions = artistsWithShows.filter((a) =>
                  !artistQuery || a.stageName.toLowerCase().includes(artistQuery.toLowerCase())
                );
                return (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-xl border border-border-strong bg-surface-card shadow-xl shadow-[var(--shadow-color)]">
                    {suggestions.length > 0 ? (
                      <div className="max-h-52 overflow-y-auto py-1">
                        {suggestions.map((a) => (
                          <button
                            key={a.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setArtistQuery(a.stageName);
                              setArtistDropdownOpen(false);
                              artistInputRef.current?.blur();
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-overlay-light"
                          >
                            {a.profileImage ? (
                              <img src={a.profileImage} alt={a.stageName} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-500/15 text-xs font-bold text-navy-600 dark:text-navy-300">
                                {a.stageName[0]}
                              </div>
                            )}
                            {a.stageName}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-3 text-center text-sm text-text-muted">Sin resultados</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          {(search || artistQuery) && !loading && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <p className="text-xs text-text-muted">
                {filtered.length === 0
                  ? 'Sin resultados para tu busqueda'
                  : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setArtistQuery('');
                }}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-text-muted transition-colors hover:bg-overlay-light hover:text-text-primary"
              >
                <X className="h-3 w-3" />
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShowCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border-medium bg-surface-card">
              <Ticket className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              {search || artistQuery
                ? 'Sin resultados'
                : 'No hay shows programados'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              {search || artistQuery
                ? 'No encontramos shows que coincidan con tu busqueda. Intenta con otros filtros.'
                : 'Pronto habra mas shows disponibles. Vuelve a revisar pronto.'}
            </p>
            {(search || artistQuery) && (
              <button
                onClick={() => {
                  setSearch('');
                  setArtistQuery('');
                }}
                className="mt-6 rounded-lg border border-border-medium bg-surface-card px-5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-elevated hover:text-text-primary"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Show Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((show, index) => {
              const spotsLeft =
                show.totalCapacity != null
                  ? show.totalCapacity - (show._count?.tickets ?? 0)
                  : null;
              const soldOut = spotsLeft !== null && spotsLeft <= 0;

              return (
                <Link
                  key={show.id}
                  href={`/shows/${show.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border-medium bg-surface-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-500/40 hover:shadow-xl hover:shadow-navy-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/50"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* Image container */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {show.image ? (
                      <img
                        src={show.image}
                        alt={show.name}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-100 to-navy-200 dark:from-navy-700 dark:to-navy-800">
                        <Ticket className="h-12 w-12 text-navy-400" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Date badge */}
                    <div className="absolute bottom-3 left-3 flex flex-col items-center rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-sm border border-white/10">
                      <span className="text-[10px] font-bold uppercase leading-none text-navy-300">
                        {formatMonthShort(show.date)}
                      </span>
                      <span className="text-lg font-bold leading-tight text-white">
                        {formatDay(show.date)}
                      </span>
                    </div>

                    {/* Sold out badge */}
                    {soldOut && (
                      <div className="absolute top-3 right-3">
                        <Badge className="border-red-400/30 bg-red-500/80 text-white backdrop-blur-sm">
                          Agotado
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-4">
                    <h3 className="text-base font-bold text-text-primary leading-tight line-clamp-1 transition-colors duration-200 group-hover:text-navy-500">
                      {show.name}
                    </h3>

                    {/* Artist */}
                    <div className="mt-2 flex items-center gap-2">
                      {show.artist.profileImage ? (
                        <img
                          src={show.artist.profileImage}
                          alt={show.artist.stageName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-500/15 text-[10px] font-bold text-navy-600 dark:text-navy-300">
                          {show.artist.stageName[0]}
                        </div>
                      )}
                      <span className="text-sm text-text-secondary truncate">
                        {show.artist.stageName}
                      </span>
                    </div>

                    {/* Venue + city */}
                    <div className="mt-2 flex items-center gap-1.5 text-text-tertiary">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs truncate">
                        {show.venue}
                        {show.city ? `, ${show.city}` : ''}
                      </span>
                    </div>

                    {/* Date & time */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-text-tertiary">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs">
                        {formatDate(show.date)} · {formatTime(show.date)}
                      </span>
                    </div>

                    {/* Price + spots + CTA */}
                    <div className="mt-3 flex items-center justify-between border-t border-border-default pt-3">
                      <div>
                        {show.ticketPrice != null && show.ticketPrice > 0 ? (
                          <span className="text-sm font-bold text-text-primary">
                            S/ {Number(show.ticketPrice).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-green-500">
                            Gratis
                          </span>
                        )}
                        {spotsLeft !== null && !soldOut && (
                          <span className="ml-2 text-xs text-text-muted">
                            {spotsLeft} lugar{spotsLeft !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200 ${
                          soldOut
                            ? 'bg-muted text-text-muted'
                            : 'bg-navy-500/15 text-navy-600 dark:text-navy-300 group-hover:bg-navy-500/25'
                        }`}
                      >
                        {soldOut ? 'Agotado' : 'Comprar'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
