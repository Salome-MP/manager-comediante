'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Category } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Filter, ArrowLeft, Loader2 } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';

interface ArtistPublic {
  id: string;
  stageName: string;
  slug: string;
  profileImage?: string;
}

interface ShopArtistProduct {
  id: string;
  salePrice: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  customImages: string[];
  reviewStats?: { averageRating: number; totalReviews: number };
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    images: string[];
    variants: { name: string; options: string[] }[];
    category: { id: string; name: string };
  };
}

export default function ArtistShopPage() {
  const params = useParams();
  const [artist, setArtist] = useState<ArtistPublic | null>(null);
  const [products, setProducts] = useState<ShopArtistProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Fetch artist info
  useEffect(() => {
    if (!params.slug) return;

    api.get<ArtistPublic>(`/artists/public/${params.slug}`)
      .then(res => setArtist(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get<Category[]>('/categories/public')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, [params.slug]);

  // Fetch products when artist or category changes
  const fetchProducts = useCallback(async (artistId: string, categoryId: string | null) => {
    setProductsLoading(true);
    try {
      let url = `/products/artist/${artistId}?page=1&limit=50`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }
      const res = await api.get<{ data: ShopArtistProduct[]; total: number }>(url);
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (artist?.id) {
      fetchProducts(artist.id, selectedCategory);
    }
  }, [artist?.id, selectedCategory, fetchProducts]);

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-base">
        <p className="text-text-muted">Artista no encontrado</p>
      </div>
    );
  }

  // Render category buttons for sidebar and mobile
  const renderCategoryButtons = (isMobile: boolean) => {
    const btnBase = isMobile ? 'shrink-0' : 'w-full justify-start';
    const variant = (isSelected: boolean) => isSelected ? 'default' : (isMobile ? 'outline' : 'ghost');
    const selectedClass = isMobile
      ? 'bg-navy-600 hover:bg-navy-500 text-white border-transparent'
      : 'bg-navy-600 hover:bg-navy-500 text-white';
    const unselectedClass = isMobile
      ? 'border-border-strong bg-overlay-light text-text-tertiary hover:bg-overlay-strong hover:text-text-primary'
      : 'text-text-muted hover:bg-overlay-light hover:text-text-primary';

    return (
      <>
        <Button
          variant={variant(selectedCategory === null) as any}
          size="sm"
          className={`${btnBase} ${selectedCategory === null ? selectedClass : unselectedClass}`}
          onClick={() => handleCategoryFilter(null)}
        >
          Todos
        </Button>
        {categories.map((parent) => (
          <div key={parent.id} className={isMobile ? 'flex gap-2 shrink-0' : ''}>
            {parent.children && parent.children.length > 0 ? (
              <>
                {/* Parent category - clickable, filters all its subcategories */}
                {!isMobile && (
                  <Button
                    variant={variant(selectedCategory === parent.id) as any}
                    size="sm"
                    className={`mt-3 ${btnBase} font-bold ${selectedCategory === parent.id ? selectedClass : unselectedClass}`}
                    onClick={() => handleCategoryFilter(parent.id)}
                  >
                    {parent.name}
                  </Button>
                )}
                {isMobile && (
                  <Button
                    variant={variant(selectedCategory === parent.id) as any}
                    size="sm"
                    className={`${btnBase} font-bold ${selectedCategory === parent.id ? selectedClass : unselectedClass}`}
                    onClick={() => handleCategoryFilter(parent.id)}
                  >
                    {parent.name}
                  </Button>
                )}
                {/* Subcategories */}
                {parent.children.map((sub) => (
                  <Button
                    key={sub.id}
                    variant={variant(selectedCategory === sub.id) as any}
                    size="sm"
                    className={`${btnBase} ${!isMobile ? 'pl-4 text-[13px]' : ''} ${selectedCategory === sub.id ? selectedClass : unselectedClass}`}
                    onClick={() => handleCategoryFilter(sub.id)}
                  >
                    {sub.name}
                  </Button>
                ))}
              </>
            ) : (
              <Button
                variant={variant(selectedCategory === parent.id) as any}
                size="sm"
                className={`${btnBase} ${selectedCategory === parent.id ? selectedClass : unselectedClass}`}
                onClick={() => handleCategoryFilter(parent.id)}
              >
                {parent.name}
              </Button>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/artistas/${artist.slug}`}
            className="inline-flex items-center gap-2 text-sm text-text-faint hover:text-navy-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al perfil de {artist.stageName}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">
            Tienda de {artist.stageName}
          </h1>
          <p className="mt-1 text-text-muted">
            {total} {total === 1 ? 'producto' : 'productos'} disponibles
          </p>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar - Desktop */}
          <aside className="hidden w-52 shrink-0 md:block">
            <div className="sticky top-24">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-navy-400">
                <Filter className="h-3.5 w-3.5" />
                Categorias
              </div>
              <div className="space-y-1">
                {renderCategoryButtons(false)}
              </div>
            </div>
          </aside>

          {/* Category filters - Mobile horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
            {renderCategoryButtons(true)}
          </div>

          {/* Product grid */}
          <div className="flex-1">
            {productsLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-overlay-light">
                  <ShoppingBag className="h-8 w-8 text-text-ghost" />
                </div>
                <p className="mt-4 text-text-muted">No se encontraron productos</p>
                {selectedCategory && (
                  <Button
                    variant="ghost"
                    className="mt-2 text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-500/10"
                    onClick={() => handleCategoryFilter(null)}
                  >
                    Ver todos los productos
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((ap) => {
                  const imageUrl = ap.customImages?.[0] || ap.product.images?.[0];

                  return (
                    <Link key={ap.id} href={`/producto/${ap.id}`} className="group">
                      <div className="overflow-hidden rounded-xl border border-border-medium bg-surface-card transition-all duration-300 hover:border-navy-500/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--shadow-color)]">
                        <div className="aspect-square bg-overlay-light overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={ap.product.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-12 w-12 text-navy-200 dark:text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <Badge
                            variant="outline"
                            className="mb-1.5 border-border-strong text-text-faint text-xs"
                          >
                            {ap.product.category.name}
                          </Badge>
                          <h3 className="text-sm font-semibold text-text-primary line-clamp-2">
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
                          <p className="mt-0.5 text-xs text-text-faint">
                            Producto Original {artist.stageName}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm font-bold text-text-primary">
                              S/. {Number(ap.salePrice).toFixed(2)}
                            </p>
                            <span className="text-xs font-medium text-navy-400 group-hover:text-navy-700 dark:hover:text-navy-200 transition-colors">
                              Ver detalle
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
