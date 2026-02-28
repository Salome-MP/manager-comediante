'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Package, Search, X } from 'lucide-react';

interface ArtistProduct {
  id: string;
  artistId: string;
  productId: string;
  salePrice: number;
  artistCommission: number;
  stock: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    manufacturingCost: number;
    suggestedPrice: number;
    images: string[];
    variants: { name: string; options: string[] }[];
    isActive: boolean;
    category?: { name: string };
  };
}

export default function ArtistProductosPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<ArtistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchProducts = useCallback(async () => {
    if (!user?.artistId) return;
    try {
      const { data } = await api.get(`/products/artist/${user.artistId}`);
      setProducts(data.data ?? []);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((ap) => {
      if (ap.product?.category?.name) names.add(ap.product.category.name);
    });
    return Array.from(names).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((ap) => {
      const matchName = !search || ap.product.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || ap.product.category?.name === category;
      return matchName && matchCat;
    });
  }, [products, search, category]);

  const hasFilters = search !== '' || category !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-32 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Mis Productos</h2>
        <p className="mt-1 text-sm text-text-dim">{products.length} productos asignados</p>
      </div>

      {/* Filters */}
      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 w-full sm:min-w-[200px] sm:max-w-sm sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-ghost" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-ghost hover:text-text-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-border-strong bg-overlay-light px-3 text-sm text-text-secondary focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500/20"
          >
            <option value="all">Todas las categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {hasFilters && (
            <Badge variant="secondary" className="bg-navy-500/10 text-navy-400">
              {filtered.length} de {products.length} productos
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-border-default hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                Producto
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                Categoria
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">
                Precio Venta
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">
                Tu Comision
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">
                Stock
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border-default hover:bg-overlay-hover">
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl bg-overlay-light p-4">
                      <Package className="h-8 w-8 text-text-ghost" />
                    </div>
                    <p className="text-sm text-text-dim">
                      {hasFilters
                        ? 'No se encontraron productos con los filtros aplicados.'
                        : 'No tienes productos asignados aun. Contacta al administrador.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ap) => {
                const margin = ap.salePrice - (ap.product?.manufacturingCost || 0);
                const earning = margin * (ap.artistCommission / 100);
                return (
                  <TableRow
                    key={ap.id}
                    className="border-border-default transition-colors hover:bg-overlay-subtle"
                  >
                    <TableCell className="font-medium text-text-primary">
                      {ap.product?.name}
                    </TableCell>
                    <TableCell className="text-text-dim">
                      {ap.product?.category?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-text-primary">
                      S/. {Number(ap.salePrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-emerald-400">
                        S/. {earning.toFixed(2)}
                      </span>
                      <span className="ml-1 text-xs text-text-ghost">
                        ({ap.artistCommission}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                          ap.stock > 5
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : ap.stock > 0
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {ap.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                          ap.product?.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-muted text-text-dim'
                        }`}
                      >
                        {ap.product?.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </div>

    </div>
  );
}
