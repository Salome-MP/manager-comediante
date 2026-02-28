'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Package, Loader2, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';

interface SearchResult {
  id: string;
  salePrice: number;
  isFeatured: boolean;
  customImages: string[];
  reviewStats?: { averageRating: number; totalReviews: number };
  product: {
    name: string;
    images: string[];
    category: { id: string; name: string };
  };
  artist: {
    id: string;
    stageName: string;
    slug: string;
    profileImage?: string;
  };
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" /></div>}>
      <BuscarContent />
    </Suspense>
  );
}

function BuscarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; children?: { id: string; name: string }[] }[]>([]);
  const [artists, setArtists] = useState<{ id: string; stageName: string }[]>([]);

  // Filters
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [artistId, setArtistId] = useState(searchParams.get('artistId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [page, setPage] = useState(1);

  // Load categories and artists on mount
  useEffect(() => {
    api.get('/categories/public').then((res) => setCategories(res.data || [])).catch(() => {});
    api.get('/artists/public').then((res) => setArtists(res.data.data || [])).catch(() => {});
  }, []);

  const doSearch = useCallback(async (p = 1, overrides?: { q?: string; cat?: string; art?: string; min?: string; max?: string }) => {
    const q = overrides?.q ?? query;
    const cat = overrides?.cat ?? categoryId;
    const art = overrides?.art ?? artistId;
    const min = overrides?.min ?? minPrice;
    const max = overrides?.max ?? maxPrice;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cat) params.set('categoryId', cat);
      if (art) params.set('artistId', art);
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
      params.set('page', String(p));
      params.set('limit', '20');

      const { data } = await api.get(`/products/search?${params.toString()}`);
      setResults(data.data || []);
      setTotal(data.total || 0);
      setPage(p);

      // Update URL
      const urlParams = new URLSearchParams();
      if (q) urlParams.set('q', q);
      if (cat) urlParams.set('categoryId', cat);
      if (art) urlParams.set('artistId', art);
      if (min) urlParams.set('minPrice', min);
      if (max) urlParams.set('maxPrice', max);
      router.replace(`/buscar?${urlParams.toString()}`, { scroll: false });
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, categoryId, artistId, minPrice, maxPrice, router]);

  // Initial search from URL params
  useEffect(() => {
    doSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setQuery('');
    setCategoryId('');
    setArtistId('');
    setMinPrice('');
    setMaxPrice('');
  };

  const totalPages = Math.ceil(total / 20);
  const hasFilters = !!(query || categoryId || artistId || minPrice || maxPrice);

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-navy-600 via-navy-700 to-navy-800 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-navy-400/15 blur-3xl" />
          <div className="absolute -top-16 -right-32 w-80 h-80 rounded-full bg-navy-300/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-navy-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
              Merch oficial
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Nuestra{' '}
            <span className="bg-gradient-to-r from-navy-200 via-white to-navy-200 bg-clip-text text-transparent">
              Tienda
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            Encuentra productos exclusivos de tus comediantes favoritos. Merch oficial, envios a todo Latinoamerica.
          </p>
          {!loading && total > 0 && (
            <div className="mt-8 inline-flex items-center gap-3 sm:gap-6 rounded-2xl border border-white/20 bg-white/10 px-4 sm:px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">{total}</span>
                <span className="text-sm text-white/70">
                  {total === 1 ? 'producto' : 'productos'} disponibles
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-ghost" />
            <Input
              placeholder="Buscar por nombre de producto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(1)}
              className="pl-10 border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost"
            />
          </div>
          <Button
            onClick={() => doSearch(1)}
            className="bg-navy-600 hover:bg-navy-500 text-white font-semibold"
          >
            Buscar
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 rounded-xl border border-border-medium bg-surface-card p-4">
          <SlidersHorizontal className="h-4 w-4 text-text-faint" />
          <Select value={categoryId} onValueChange={(v) => { setCategoryId(v === 'all' ? '' : v); }}>
            <SelectTrigger className="h-9 w-full sm:w-44 border-border-strong bg-overlay-light text-sm text-text-secondary">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
              <SelectItem value="all">Todas las categorias</SelectItem>
              {categories.map((c) => (
                c.children && c.children.length > 0 ? (
                  <div key={c.id}>
                    <SelectItem value={c.id} className="font-bold">{c.name}</SelectItem>
                    {c.children.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id} className="pl-6">{sub.name}</SelectItem>
                    ))}
                  </div>
                ) : (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                )
              ))}
            </SelectContent>
          </Select>

          <Select value={artistId} onValueChange={(v) => { setArtistId(v === 'all' ? '' : v); }}>
            <SelectTrigger className="h-9 w-full sm:w-44 border-border-strong bg-overlay-light text-sm text-text-secondary">
              <SelectValue placeholder="Artista" />
            </SelectTrigger>
            <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
              <SelectItem value="all">Todos los artistas</SelectItem>
              {artists.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.stageName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="number"
              placeholder="Min S/."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 w-full sm:w-28 border-border-strong bg-overlay-light text-sm text-text-primary placeholder:text-text-ghost"
            />
            <span className="text-text-ghost">-</span>
            <Input
              type="number"
              placeholder="Max S/."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 w-full sm:w-28 border-border-strong bg-overlay-light text-sm text-text-primary placeholder:text-text-ghost"
            />
          </div>

          <Button
            size="sm"
            onClick={() => doSearch(1)}
            className="bg-navy-600 hover:bg-navy-500 text-white"
          >
            Filtrar
          </Button>

          {hasFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { clearFilters(); doSearch(1, { q: '', cat: '', art: '', min: '', max: '' }); }}
              className="gap-1.5 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary"
            >
              <X className="h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-text-faint">
          {total} {total === 1 ? 'resultado' : 'resultados'}
        </p>

        {/* Results grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-border-medium bg-surface-card py-20 text-center">
            <Package className="mx-auto h-12 w-12 text-text-ghost mb-3" />
            <p className="text-text-muted">No se encontraron productos</p>
            <p className="text-sm text-text-faint mt-1">Intenta con otros terminos o filtros</p>
            {hasFilters && (
              <button
                onClick={() => { clearFilters(); doSearch(1, { q: '', cat: '', art: '', min: '', max: '' }); }}
                className="mt-4 rounded-lg border border-border-medium bg-surface-elevated px-5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((item) => {
              const images = item.customImages?.length > 0 ? item.customImages : item.product.images || [];
              return (
                <Link key={item.id} href={`/producto/${item.id}`}>
                  <div className="group rounded-xl border border-border-medium bg-surface-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-navy-500/30 hover:shadow-lg hover:shadow-navy-500/5">
                    <div className="aspect-square bg-overlay-light relative">
                      {images[0] ? (
                        <img
                          src={images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-10 w-10 text-text-ghost" />
                        </div>
                      )}
                      {item.isFeatured && (
                        <span className="absolute top-2 left-2 rounded-lg bg-navy-600 px-2 py-0.5 text-xs font-medium text-white">
                          Destacado
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-medium text-navy-400">{item.artist.stageName}</p>
                      <p className="mt-1 font-semibold text-text-primary group-hover:text-navy-700 dark:hover:text-navy-200 transition-colors line-clamp-2">
                        {item.product.name}
                      </p>
                      {item.reviewStats && item.reviewStats.totalReviews > 0 && (
                        <div className="mt-1">
                          <StarRating
                            rating={item.reviewStats.averageRating}
                            totalReviews={item.reviewStats.totalReviews}
                          />
                        </div>
                      )}
                      <p className="mt-1 text-xs text-text-faint">{item.product.category?.name}</p>
                      <p className="mt-2 text-lg font-bold text-text-primary">
                        S/. {Number(item.salePrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => doSearch(page - 1)}
              disabled={page <= 1}
              className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary disabled:opacity-40"
            >
              Anterior
            </Button>
            <span className="text-sm text-text-faint">
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => doSearch(page + 1)}
              disabled={page >= totalPages}
              className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary disabled:opacity-40"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
