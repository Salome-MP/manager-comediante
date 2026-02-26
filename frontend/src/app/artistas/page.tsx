'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User, Search, Star, Users, ShoppingBag, X } from 'lucide-react';

interface PublicArtist {
  id: string;
  stageName: string;
  slug: string;
  tagline?: string;
  profileImage?: string;
  isFeatured: boolean;
  _count?: { followers: number };
}

function ArtistCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-border-medium animate-pulse">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-muted rounded-lg w-3/4" />
        <div className="h-4 bg-muted/70 rounded-lg w-full" />
        <div className="h-4 bg-muted/70 rounded-lg w-2/3" />
        <div className="h-3 bg-muted/50 rounded-lg w-1/3 mt-4" />
      </div>
    </div>
  );
}

export default function ArtistasPage() {
  const [artists, setArtists] = useState<PublicArtist[]>([]);
  const [filtered, setFiltered] = useState<PublicArtist[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/artists/public?limit=100')
      .then(res => {
        setArtists(res.data.data);
        setFiltered(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(artists);
    } else {
      setFiltered(
        artists.filter(a =>
          a.stageName.toLowerCase().includes(search.toLowerCase()) ||
          (a.tagline && a.tagline.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, artists]);

  const featuredCount = artists.filter(a => a.isFeatured).length;

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-navy-600 via-navy-700 to-navy-800 pt-16 pb-12">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-navy-400/15 blur-3xl" />
          <div className="absolute -top-16 -right-32 w-80 h-80 rounded-full bg-navy-300/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-navy-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <Star className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
              Plataforma Oficial
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Nuestros{' '}
            <span className="bg-gradient-to-r from-navy-200 via-white to-navy-200 bg-clip-text text-transparent">
              Comediantes
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            Encuentra a tus favoritos, explora su merch exclusivo y consigue entradas para sus shows en vivo.
          </p>

          {/* Stats strip */}
          {!loading && artists.length > 0 && (
            <div className="mt-8 inline-flex items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">{artists.length}</span>
                <span className="text-sm text-white/70">artistas</span>
              </div>
              {featuredCount > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4 bg-white/30" />
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-300" />
                    <span className="text-sm font-semibold text-white">{featuredCount}</span>
                    <span className="text-sm text-white/70">destacados</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o descripcion..."
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
            {search && !loading && (
              <p className="mt-2 text-center text-xs text-text-muted">
                {filtered.length === 0
                  ? 'Sin resultados para tu busqueda'
                  : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border-medium bg-surface-card">
              <Search className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              {search ? 'Sin resultados' : 'No hay artistas disponibles'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              {search
                ? `No encontramos comediantes que coincidan con "${search}". Intenta con otro termino.`
                : 'Pronto habra mas comediantes disponibles en la plataforma.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-6 rounded-lg border border-border-medium bg-surface-card px-5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-elevated hover:text-text-primary"
              >
                Limpiar busqueda
              </button>
            )}
          </div>
        )}

        {/* Artist Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((artist, index) => (
              <Link
                key={artist.id}
                href={`/artistas/${artist.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border-medium bg-surface-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-500/40 hover:shadow-xl hover:shadow-navy-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/50"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Image container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {artist.profileImage ? (
                    <img
                      src={artist.profileImage}
                      alt={artist.stageName}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-100 to-navy-200 dark:from-navy-700 dark:to-navy-800">
                      <User className="h-20 w-20 text-navy-400" />
                    </div>
                  )}

                  {/* Gradient overlay — always visible at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Hover glow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Featured badge */}
                  {artist.isFeatured && (
                    <div className="absolute left-3 top-3">
                      <Badge className="gap-1 border-amber-400/30 bg-amber-400/20 text-amber-300 backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Destacado
                      </Badge>
                    </div>
                  )}

                  {/* Followers — shown inside image at bottom */}
                  {(artist._count?.followers ?? 0) > 0 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                      <Users className="h-3 w-3 text-white" />
                      <span className="text-xs font-medium text-white">
                        {artist._count!.followers.toLocaleString('es-PE')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-text-primary transition-colors duration-200 group-hover:text-navy-500 dark:group-hover:text-navy-700 dark:hover:text-navy-200 leading-tight">
                    {artist.stageName}
                  </h3>

                  {artist.tagline && (
                    <p className="mt-1.5 text-sm text-text-tertiary line-clamp-2 leading-relaxed">
                      {artist.tagline}
                    </p>
                  )}

                  {/* CTA row */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-xs text-text-muted">Ver tienda</span>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border-medium bg-surface-elevated text-text-tertiary transition-all duration-200 group-hover:border-navy-500/60 group-hover:bg-navy-500/20 group-hover:text-navy-500 dark:group-hover:text-navy-700 dark:hover:text-navy-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
