'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, Loader2, X, Image as ImageIcon, ShoppingBag, Search } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantTemplate {
  name: string;
  options: string[];
}

interface Category {
  id: string;
  name: string;
  variantTemplates?: VariantTemplate[];
  children?: Category[];
}

interface ProductVariant {
  name: string;
  options: string[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  category: { id: string; name: string };
  manufacturingCost: number;
  suggestedPrice: number;
  images: string[];
  variants: ProductVariant[];
  isActive: boolean;
}

interface Artist {
  id: string;
  stageName: string;
  user?: { firstName?: string; lastName?: string };
}

interface ArtistProduct {
  id: string;
  artistId: string;
  productId: string;
  salePrice: number;
  artistCommission: number;
  stock: number;
  isActive: boolean;
  customImages: string[];
  product: Product;
  artist?: { id: string; stageName: string; slug: string; profileImage: string | null };
}

// ---------------------------------------------------------------------------
// Blank form states
// ---------------------------------------------------------------------------

const blankProductForm = {
  name: '',
  description: '',
  categoryId: '',
  manufacturingCost: 0,
  variants: [] as { name: string; options: string }[],
};

const blankAssignForm = {
  artistId: '',
  productId: '',
  salePrice: 0,
  artistCommission: 50,
  stock: 0,
};

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

const inputClass =
  'bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20';
const labelClass = 'text-text-secondary text-sm font-medium';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProductosPage() {
  // ---- Shared data ----
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  // ---- Tab 1: Productos Base ----
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [productTableSearch, setProductTableSearch] = useState('');
  const [productTableCategory, setProductTableCategory] = useState('all');
  const [createForm, setCreateForm] = useState({ ...blankProductForm });
  const [editForm, setEditForm] = useState({
    ...blankProductForm,
    isActive: true,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // ---- Tab 2: Asignar a Artista ----
  const [artists, setArtists] = useState<Artist[]>([]);
  const [assignForm, setAssignForm] = useState({ ...blankAssignForm });
  const [assignSaving, setAssignSaving] = useState(false);
  const [artistProducts, setArtistProducts] = useState<ArtistProduct[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [artistSearch, setArtistSearch] = useState('');
  const [artistDropOpen, setArtistDropOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productDropOpen, setProductDropOpen] = useState(false);
  const artistDropRef = useRef<HTMLDivElement>(null);
  const productDropRef = useRef<HTMLDivElement>(null);

  // ---- Assign image upload ----
  const [assignImageFiles, setAssignImageFiles] = useState<File[]>([]);
  const [assignImagePreviews, setAssignImagePreviews] = useState<string[]>([]);

  // ---- Tab 3: All assignments ----
  const [allAssignments, setAllAssignments] = useState<ArtistProduct[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [loadingAllAssignments, setLoadingAllAssignments] = useState(false);
  const [assignFilterArtist, setAssignFilterArtist] = useState('all');
  const [assignFilterCategory, setAssignFilterCategory] = useState('all');

  // ---- Image management dialog ----
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageDialogTarget, setImageDialogTarget] = useState<ArtistProduct | null>(null);
  const [imageDialogImages, setImageDialogImages] = useState<string[]>([]);
  const [uploadingAssignImage, setUploadingAssignImage] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch {
      toast.error('Error al cargar categorias');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products', { params: { page: 1, limit: 200 } });
      const payload = res.data;
      setProducts(payload.data ?? []);
      setTotalProducts(payload.total ?? 0);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchArtists = useCallback(async () => {
    try {
      const res = await api.get('/artists', { params: { page: 1, limit: 200 } });
      setArtists(res.data.data ?? []);
    } catch {
      toast.error('Error al cargar artistas');
    }
  }, []);

  const fetchArtistProducts = useCallback(async (artistId: string) => {
    if (!artistId) {
      setArtistProducts([]);
      return;
    }
    setLoadingAssignments(true);
    try {
      const res = await api.get(`/products/artist/${artistId}`);
      setArtistProducts(res.data.data ?? []);
    } catch {
      toast.error('Error al cargar asignaciones del artista');
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchAllAssignments = useCallback(async (artistId?: string, categoryId?: string) => {
    setLoadingAllAssignments(true);
    try {
      const params: Record<string, string> = { page: '1', limit: '200' };
      if (artistId && artistId !== 'all') params.artistId = artistId;
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      const res = await api.get('/products/assignments', { params });
      setAllAssignments(res.data.data ?? []);
      setTotalAssignments(res.data.total ?? 0);
    } catch {
      toast.error('Error al cargar asignaciones');
    } finally {
      setLoadingAllAssignments(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchArtists();
    fetchAllAssignments();
  }, [fetchCategories, fetchProducts, fetchArtists, fetchAllAssignments]);

  // Reload artist assignments when selected artist changes
  useEffect(() => {
    if (assignForm.artistId) {
      fetchArtistProducts(assignForm.artistId);
    } else {
      setArtistProducts([]);
    }
  }, [assignForm.artistId, fetchArtistProducts]);

  // ---------------------------------------------------------------------------
  // Tab 1 handlers
  // ---------------------------------------------------------------------------

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!createForm.categoryId) {
      toast.error('Selecciona una categoria');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: createForm.name.trim(),
        categoryId: createForm.categoryId,
        manufacturingCost: Number(createForm.manufacturingCost),
        suggestedPrice: 0,
      };
      if (createForm.description.trim()) {
        body.description = createForm.description.trim();
      }
      if (createForm.variants.length > 0) {
        body.variants = createForm.variants
          .filter((v) => v.name.trim() && v.options.trim())
          .map((v) => ({
            name: v.name.trim(),
            options: v.options.split(',').map((o) => o.trim()).filter(Boolean),
          }));
      }

      await api.post('/products', body);
      toast.success('Producto creado exitosamente');
      setCreateOpen(false);
      setCreateForm({ ...blankProductForm });
      fetchProducts();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al crear producto';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (product: Product) => {
    setEditId(product.id);
    setEditForm({
      name: product.name,
      description: product.description ?? '',
      categoryId: product.categoryId,
      manufacturingCost: product.manufacturingCost,
      variants: (product.variants ?? []).map((v) => ({
        name: v.name,
        options: v.options.join(', '),
      })),
      isActive: product.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    if (!editForm.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: editForm.name.trim(),
        categoryId: editForm.categoryId,
        manufacturingCost: Number(editForm.manufacturingCost),
        isActive: editForm.isActive,
      };
      if (editForm.description.trim()) {
        body.description = editForm.description.trim();
      }
      body.variants = editForm.variants
        .filter((v) => v.name.trim() && v.options.trim())
        .map((v) => ({
          name: v.name.trim(),
          options: v.options.split(',').map((o) => o.trim()).filter(Boolean),
        }));

      await api.patch(`/products/${editId}`, body);
      toast.success('Producto actualizado');
      setEditOpen(false);
      setEditId(null);
      fetchProducts();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al actualizar producto';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (product: Product) => {
    setDeleteTarget(product);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success('Producto eliminado');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al eliminar producto';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 2 handlers
  // ---------------------------------------------------------------------------

  const handleAssign = async () => {
    if (!assignForm.artistId) {
      toast.error('Selecciona un artista');
      return;
    }
    if (!assignForm.productId) {
      toast.error('Selecciona un producto');
      return;
    }

    setAssignSaving(true);
    try {
      const { data: created } = await api.post('/products/assign', {
        artistId: assignForm.artistId,
        productId: assignForm.productId,
        salePrice: Number(assignForm.salePrice),
        artistCommission: Number(assignForm.artistCommission),
        stock: Number(assignForm.stock),
      });

      // Upload images if any were selected
      if (assignImageFiles.length > 0 && created.id) {
        toast.info(`Subiendo ${assignImageFiles.length} imagen(es)...`);
        for (const file of assignImageFiles) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/upload/artist-product/${created.id}/image`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch {
            toast.error(`Error al subir imagen: ${file.name}`);
          }
        }
      }

      toast.success(
        assignImageFiles.length > 0
          ? `Producto asignado con ${assignImageFiles.length} imagen(es)`
          : 'Producto asignado al artista',
      );
      setAssignForm((prev) => ({
        ...prev,
        productId: '',
        salePrice: 0,
        artistCommission: 50,
        stock: 0,
      }));
      setProductSearch('');
      setAssignImageFiles([]);
      setAssignImagePreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      // Refresh assignments lists
      fetchArtistProducts(assignForm.artistId);
      fetchAllAssignments(assignFilterArtist, assignFilterCategory);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al asignar producto';
      toast.error(message);
    } finally {
      setAssignSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const findCategory = (id: string): Category | undefined => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      const child = cat.children?.find((c) => c.id === id);
      if (child) return child;
    }
    return undefined;
  };

  const applyVariantTemplates = (categoryId: string): { name: string; options: string }[] => {
    const cat = findCategory(categoryId);
    const templates = cat?.variantTemplates;
    if (!templates || templates.length === 0) return [];
    return templates.map((t) => ({ name: t.name, options: t.options.join(', ') }));
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Productos</h2>
        <p className="mt-0.5 text-sm text-text-dim">
          Gestiona el catalogo de productos de la plataforma
        </p>
      </div>

      <Tabs defaultValue="productos-base">
        <TabsList className="bg-overlay-light border border-border-strong">
          <TabsTrigger
            value="productos-base"
            className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:text-navy-300"
          >
            Productos Base
          </TabsTrigger>
          <TabsTrigger
            value="asignar-artista"
            className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:text-navy-300"
          >
            Asignar a Artista
          </TabsTrigger>
          <TabsTrigger
            value="asignaciones"
            className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:text-navy-300"
          >
            Asignaciones
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1 - Productos Base                                          */}
        {/* ================================================================ */}
        <TabsContent value="productos-base" className="space-y-4 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-dim">
              {totalProducts} producto{totalProducts !== 1 ? 's' : ''} en total
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-navy-600 hover:bg-navy-500 text-white shadow-lg shadow-navy-900/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>

          {/* Search & filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
              <Input
                placeholder="Buscar producto por nombre..."
                value={productTableSearch}
                onChange={(e) => setProductTableSearch(e.target.value)}
                className={`${inputClass} pl-9`}
              />
              {productTableSearch && (
                <button
                  type="button"
                  onClick={() => setProductTableSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select
              value={productTableCategory}
              onValueChange={setProductTableCategory}
            >
              <SelectTrigger className={`w-full sm:w-48 ${inputClass}`}>
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                <SelectItem value="all" className="focus:bg-overlay-light focus:text-text-primary">Todas las categorias</SelectItem>
                {categories.map((cat) =>
                  cat.children && cat.children.length > 0 ? (
                    <div key={cat.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-text-dim uppercase tracking-wider">
                        {cat.name}
                      </div>
                      {cat.children.map((sub) => (
                        <SelectItem
                          key={sub.id}
                          value={sub.id}
                          className="pl-6 focus:bg-overlay-light focus:text-text-primary"
                        >
                          {sub.name}
                        </SelectItem>
                      ))}
                    </div>
                  ) : (
                    <SelectItem key={cat.id} value={cat.id} className="focus:bg-overlay-light focus:text-text-primary">
                      {cat.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {(() => {
            const filtered = products.filter((p) => {
              const matchName = !productTableSearch || p.name.toLowerCase().includes(productTableSearch.toLowerCase());
              const matchCat = productTableCategory === 'all' || p.categoryId === productTableCategory;
              return matchName && matchCat;
            });

            return (
          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card">
            {(productTableSearch || productTableCategory !== 'all') && (
              <div className="border-b border-border-default px-4 py-2 text-xs text-text-dim">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                {productTableSearch && <> para &quot;{productTableSearch}&quot;</>}
              </div>
            )}
            <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="border-border-default hover:bg-transparent">
                  <TableHead className="text-text-dim font-medium">Nombre</TableHead>
                  <TableHead className="text-text-dim font-medium">Categoria</TableHead>
                  <TableHead className="text-right text-text-dim font-medium">Costo Fabricacion</TableHead>
                  <TableHead className="text-text-dim font-medium">Estado</TableHead>
                  <TableHead className="text-right text-text-dim font-medium">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-text-dim">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Cargando productos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingBag className="h-8 w-8 text-text-ghost" />
                        <span className="text-sm text-text-dim">
                          {products.length === 0 ? 'No hay productos registrados' : 'No se encontraron productos'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-border-subtle hover:bg-surface-card transition-colors"
                    >
                      <TableCell className="font-medium text-text-primary">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              className="h-9 w-9 rounded-lg object-cover ring-1 ring-border-medium"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-overlay-light ring-1 ring-border-strong">
                              <ImageIcon className="h-4 w-4 text-text-ghost" />
                            </div>
                          )}
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md bg-overlay-light px-2 py-0.5 text-xs text-text-dim">
                          {product.category?.name ?? '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-text-secondary">
                        {fmt(product.manufacturingCost)}
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-inset ring-border-medium">
                            Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-dim hover:bg-overlay-light hover:text-text-primary transition-colors"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            onClick={() => openDelete(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
            );
          })()}

          {/* ---- Create dialog ---- */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-lg bg-surface-card border-border-strong text-text-primary">
              <DialogHeader>
                <DialogTitle className="text-text-primary">Nuevo Producto</DialogTitle>
                <DialogDescription className="text-text-dim">
                  Completa los datos para crear un producto base.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="create-name" className={labelClass}>Nombre *</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Nombre del producto"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="create-description" className={labelClass}>Descripcion</Label>
                  <Textarea
                    id="create-description"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descripcion del producto"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className={labelClass}>Categoria *</Label>
                  <Select
                    value={createForm.categoryId}
                    onValueChange={(val) =>
                      setCreateForm((f) => ({
                        ...f,
                        categoryId: val,
                        variants: applyVariantTemplates(val),
                      }))
                    }
                  >
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                      {categories.map((cat) => (
                        cat.children && cat.children.length > 0 ? (
                          <div key={cat.id}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-text-dim uppercase tracking-wider">
                              {cat.name}
                            </div>
                            {cat.children.map((sub) => (
                              <SelectItem
                                key={sub.id}
                                value={sub.id}
                                className="pl-6 focus:bg-overlay-light focus:text-text-primary"
                              >
                                {sub.name}
                              </SelectItem>
                            ))}
                          </div>
                        ) : (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="focus:bg-overlay-light focus:text-text-primary"
                          >
                            {cat.name}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="create-cost" className={labelClass}>Costo Fabricacion</Label>
                  <Input
                    id="create-cost"
                    type="number"
                    min={0}
                    value={createForm.manufacturingCost}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        manufacturingCost: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className={labelClass}>Variantes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong"
                      onClick={() =>
                        setCreateForm((f) => ({
                          ...f,
                          variants: [...f.variants, { name: '', options: '' }],
                        }))
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" /> Agregar variante
                    </Button>
                  </div>
                  {createForm.variants.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        placeholder="Nombre (ej: Talla)"
                        value={v.name}
                        onChange={(e) =>
                          setCreateForm((f) => {
                            const variants = [...f.variants];
                            variants[idx] = { ...variants[idx], name: e.target.value };
                            return { ...f, variants };
                          })
                        }
                        className={`${inputClass} flex-1`}
                      />
                      <Input
                        placeholder="Opciones (ej: S, M, L)"
                        value={v.options}
                        onChange={(e) =>
                          setCreateForm((f) => {
                            const variants = [...f.variants];
                            variants[idx] = { ...variants[idx], options: e.target.value };
                            return { ...f, variants };
                          })
                        }
                        className={`${inputClass} flex-[2]`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() =>
                          setCreateForm((f) => ({
                            ...f,
                            variants: f.variants.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {createForm.variants.length === 0 && (
                    <p className="text-xs text-text-dim">Sin variantes (ej: llaveros)</p>
                  )}
                </div>

              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                  disabled={saving}
                  className="text-text-secondary hover:bg-overlay-light hover:text-text-primary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="bg-navy-600 hover:bg-navy-500 text-white"
                >
                  {saving ? 'Guardando...' : 'Crear Producto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ---- Edit dialog ---- */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-lg bg-surface-card border-border-strong text-text-primary">
              <DialogHeader>
                <DialogTitle className="text-text-primary">Editar Producto</DialogTitle>
                <DialogDescription className="text-text-dim">
                  Modifica los datos del producto.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name" className={labelClass}>Nombre *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Nombre del producto"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description" className={labelClass}>Descripcion</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descripcion del producto"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className={labelClass}>Categoria *</Label>
                  <Select
                    value={editForm.categoryId}
                    onValueChange={(val) =>
                      setEditForm((f) => {
                        const updated = { ...f, categoryId: val };
                        if (f.variants.length === 0) {
                          updated.variants = applyVariantTemplates(val);
                        }
                        return updated;
                      })
                    }
                  >
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                      {categories.map((cat) => (
                        cat.children && cat.children.length > 0 ? (
                          <div key={cat.id}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-text-dim uppercase tracking-wider">
                              {cat.name}
                            </div>
                            {cat.children.map((sub) => (
                              <SelectItem
                                key={sub.id}
                                value={sub.id}
                                className="pl-6 focus:bg-overlay-light focus:text-text-primary"
                              >
                                {sub.name}
                              </SelectItem>
                            ))}
                          </div>
                        ) : (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="focus:bg-overlay-light focus:text-text-primary"
                          >
                            {cat.name}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-cost" className={labelClass}>Costo Fabricacion</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    min={0}
                    value={editForm.manufacturingCost}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        manufacturingCost: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className={labelClass}>Variantes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong"
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          variants: [...f.variants, { name: '', options: '' }],
                        }))
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" /> Agregar variante
                    </Button>
                  </div>
                  {editForm.variants.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        placeholder="Nombre (ej: Talla)"
                        value={v.name}
                        onChange={(e) =>
                          setEditForm((f) => {
                            const variants = [...f.variants];
                            variants[idx] = { ...variants[idx], name: e.target.value };
                            return { ...f, variants };
                          })
                        }
                        className={`${inputClass} flex-1`}
                      />
                      <Input
                        placeholder="Opciones (ej: S, M, L)"
                        value={v.options}
                        onChange={(e) =>
                          setEditForm((f) => {
                            const variants = [...f.variants];
                            variants[idx] = { ...variants[idx], options: e.target.value };
                            return { ...f, variants };
                          })
                        }
                        className={`${inputClass} flex-[2]`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() =>
                          setEditForm((f) => ({
                            ...f,
                            variants: f.variants.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {editForm.variants.length === 0 && (
                    <p className="text-xs text-text-dim">Sin variantes (ej: llaveros)</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="edit-active" className={labelClass}>Activo</Label>
                  <button
                    id="edit-active"
                    type="button"
                    role="switch"
                    aria-checked={editForm.isActive}
                    onClick={() =>
                      setEditForm((f) => ({ ...f, isActive: !f.isActive }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      editForm.isActive ? 'bg-navy-600' : 'bg-overlay-strong'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        editForm.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                  className="text-text-secondary hover:bg-overlay-light hover:text-text-primary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={saving}
                  className="bg-navy-600 hover:bg-navy-500 text-white"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ---- Delete confirmation dialog ---- */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-md bg-surface-card border-border-strong text-text-primary">
              <DialogHeader>
                <DialogTitle className="text-text-primary">Eliminar Producto</DialogTitle>
                <DialogDescription className="text-text-dim">
                  Esta accion no se puede deshacer. Se eliminara permanentemente el
                  producto{' '}
                  <span className="font-semibold text-text-primary">{deleteTarget?.name}</span>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteOpen(false)}
                  disabled={saving}
                  className="text-text-secondary hover:bg-overlay-light hover:text-text-primary"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-500"
                >
                  {saving ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2 - Asignar a Artista                                       */}
        {/* ================================================================ */}
        <TabsContent value="asignar-artista" className="space-y-6 mt-4">
          {/* Assignment form */}
          <div className="rounded-xl border border-border-default bg-surface-card p-6">
            <h3 className="mb-5 text-base font-semibold text-text-primary">
              Asignar Producto a Artista
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Artist search */}
              <div className="grid gap-2">
                <Label className={labelClass}>Artista *</Label>
                <div className="relative" ref={artistDropRef}>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
                  <Input
                    placeholder="Escribe para buscar artista..."
                    value={artistSearch}
                    onChange={(e) => {
                      setArtistSearch(e.target.value);
                      setArtistDropOpen(true);
                      if (!e.target.value.trim()) {
                        setAssignForm((f) => ({ ...f, artistId: '' }));
                      }
                    }}
                    onFocus={() => setArtistDropOpen(true)}
                    onBlur={() => setTimeout(() => setArtistDropOpen(false), 150)}
                    className={`${inputClass} pl-9`}
                  />
                  {artistDropOpen && artistSearch.trim().length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-strong bg-surface-card shadow-xl max-h-56 overflow-y-auto">
                      {artists
                        .filter((a) => a.stageName.toLowerCase().includes(artistSearch.toLowerCase()))
                        .map((artist) => (
                          <button
                            key={artist.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setAssignForm((f) => ({ ...f, artistId: artist.id }));
                              setArtistSearch(artist.stageName);
                              setArtistDropOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-overlay-light ${
                              assignForm.artistId === artist.id ? 'bg-navy-600/10 text-navy-400' : 'text-text-primary'
                            }`}
                          >
                            {artist.stageName}
                          </button>
                        ))}
                      {artists.filter((a) => a.stageName.toLowerCase().includes(artistSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-sm text-text-dim text-center">No se encontró artista</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product search */}
              <div className="grid gap-2">
                <Label className={labelClass}>Producto *</Label>
                <div className="relative" ref={productDropRef}>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
                  <Input
                    placeholder="Escribe para buscar producto..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductDropOpen(true);
                      if (!e.target.value.trim()) {
                        setAssignForm((f) => ({ ...f, productId: '' }));
                      }
                    }}
                    onFocus={() => setProductDropOpen(true)}
                    onBlur={() => setTimeout(() => setProductDropOpen(false), 150)}
                    className={`${inputClass} pl-9`}
                  />
                  {productDropOpen && productSearch.trim().length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-strong bg-surface-card shadow-xl max-h-56 overflow-y-auto">
                      {products
                        .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setAssignForm((f) => ({ ...f, productId: product.id }));
                              setProductSearch(product.name);
                              setProductDropOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-overlay-light ${
                              assignForm.productId === product.id ? 'bg-navy-600/10 text-navy-400' : 'text-text-primary'
                            }`}
                          >
                            <span className="truncate">{product.name}</span>
                            <span className="shrink-0 text-xs text-text-dim">{product.category?.name}</span>
                          </button>
                        ))}
                      {products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-sm text-text-dim text-center">No se encontró producto</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sale price */}
              <div className="grid gap-2">
                <Label htmlFor="assign-price" className={labelClass}>Precio de Venta</Label>
                <Input
                  id="assign-price"
                  type="number"
                  min={0}
                  value={assignForm.salePrice}
                  onChange={(e) =>
                    setAssignForm((f) => ({
                      ...f,
                      salePrice: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </div>

              {/* Commission */}
              <div className="grid gap-2">
                <Label htmlFor="assign-commission" className={labelClass}>Comision Artista (%)</Label>
                <Input
                  id="assign-commission"
                  type="number"
                  min={0}
                  max={100}
                  value={assignForm.artistCommission}
                  onChange={(e) =>
                    setAssignForm((f) => ({
                      ...f,
                      artistCommission: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </div>

              {/* Stock */}
              <div className="grid gap-2">
                <Label htmlFor="assign-stock" className={labelClass}>Stock</Label>
                <Input
                  id="assign-stock"
                  type="number"
                  min={0}
                  value={assignForm.stock}
                  onChange={(e) =>
                    setAssignForm((f) => ({
                      ...f,
                      stock: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {/* Assign image upload */}
            <div className="mt-4 grid gap-2">
              <Label className={labelClass}>Imagenes personalizadas del artista</Label>
              <p className="text-xs text-text-dim">Sube fotos del producto con el diseño del artista (opcional)</p>
              {assignImagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignImagePreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border-strong"
                    >
                      <img src={preview} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAssignImageFiles((prev) => prev.filter((_, i) => i !== idx));
                          setAssignImagePreviews((prev) => {
                            URL.revokeObjectURL(prev[idx]);
                            return prev.filter((_, i) => i !== idx);
                          });
                        }}
                        className="absolute right-0.5 top-0.5 rounded-md bg-red-500/90 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="assign-image-upload"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAssignImageFiles((prev) => [...prev, file]);
                      setAssignImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
                    }
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('assign-image-upload')?.click()}
                  className="border border-border-strong text-text-secondary hover:bg-overlay-light hover:text-text-primary"
                >
                  <Upload className="mr-2 h-4 w-4" /> Agregar imagen
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleAssign}
                disabled={assignSaving}
                className="bg-navy-600 hover:bg-navy-500 text-white shadow-lg shadow-navy-900/30"
              >
                {assignSaving ? 'Asignando...' : 'Asignar Producto'}
              </Button>
            </div>
          </div>

          {/* Current assignments for selected artist */}
          {assignForm.artistId && (
            <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card">
              <div className="border-b border-border-default px-6 py-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  Productos asignados a{' '}
                  <span className="text-navy-400">
                    {artists.find((a) => a.id === assignForm.artistId)?.stageName ?? 'artista'}
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="border-border-default hover:bg-transparent">
                    <TableHead className="text-text-dim font-medium">Producto</TableHead>
                    <TableHead className="text-text-dim font-medium">Categoria</TableHead>
                    <TableHead className="text-right text-text-dim font-medium">Precio Venta</TableHead>
                    <TableHead className="text-right text-text-dim font-medium">Stock</TableHead>
                    <TableHead className="text-text-dim font-medium">Estado</TableHead>
                    <TableHead className="text-right text-text-dim font-medium">Imagenes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAssignments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-text-dim">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Cargando asignaciones...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : artistProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <span className="text-sm text-text-dim">
                          Este artista no tiene productos asignados
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    artistProducts.map((ap) => {
                      const thumb = ap.customImages?.[0] || ap.product?.images?.[0];
                      return (
                        <TableRow
                          key={ap.id}
                          className="border-border-subtle hover:bg-surface-card transition-colors"
                        >
                          <TableCell className="font-medium text-text-primary">
                            <div className="flex items-center gap-3">
                              {thumb ? (
                                <img src={thumb} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border-medium" />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-overlay-light ring-1 ring-border-strong">
                                  <ImageIcon className="h-4 w-4 text-text-ghost" />
                                </div>
                              )}
                              <span>{ap.product?.name ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-md bg-overlay-light px-2 py-0.5 text-xs text-text-dim">
                              {ap.product?.category?.name ?? '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-text-secondary">
                            {fmt(ap.salePrice)}
                          </TableCell>
                          <TableCell className="text-right text-text-secondary">
                            {ap.stock}
                          </TableCell>
                          <TableCell>
                            {ap.isActive !== false ? (
                              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-inset ring-border-medium">
                                Inactivo
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-text-dim hover:bg-overlay-light hover:text-text-primary transition-colors"
                              onClick={() => {
                                setImageDialogTarget(ap);
                                setImageDialogImages(ap.customImages || []);
                                setImageDialogOpen(true);
                              }}
                            >
                              <ImageIcon className="mr-1 h-4 w-4" />
                              {(ap.customImages?.length || 0)}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3 - Asignaciones (todas)                                    */}
        {/* ================================================================ */}
        <TabsContent value="asignaciones" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-dim">
              {totalAssignments} asignacion{totalAssignments !== 1 ? 'es' : ''} en total
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={assignFilterArtist}
              onValueChange={(val) => {
                setAssignFilterArtist(val);
                fetchAllAssignments(val, assignFilterCategory);
              }}
            >
              <SelectTrigger className={`w-full sm:w-56 ${inputClass}`}>
                <SelectValue placeholder="Todos los artistas" />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                <SelectItem value="all" className="focus:bg-overlay-light focus:text-text-primary">Todos los artistas</SelectItem>
                {artists.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="focus:bg-overlay-light focus:text-text-primary">
                    {a.stageName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={assignFilterCategory}
              onValueChange={(val) => {
                setAssignFilterCategory(val);
                fetchAllAssignments(assignFilterArtist, val);
              }}
            >
              <SelectTrigger className={`w-full sm:w-48 ${inputClass}`}>
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                <SelectItem value="all" className="focus:bg-overlay-light focus:text-text-primary">Todas las categorias</SelectItem>
                {categories.map((cat) =>
                  cat.children && cat.children.length > 0 ? (
                    <div key={cat.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-text-dim uppercase tracking-wider">
                        {cat.name}
                      </div>
                      {cat.children.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id} className="pl-6 focus:bg-overlay-light focus:text-text-primary">
                          {sub.name}
                        </SelectItem>
                      ))}
                    </div>
                  ) : (
                    <SelectItem key={cat.id} value={cat.id} className="focus:bg-overlay-light focus:text-text-primary">
                      {cat.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* All assignments table */}
          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="border-border-default hover:bg-transparent">
                    <TableHead className="text-text-dim font-medium">Producto</TableHead>
                    <TableHead className="text-text-dim font-medium">Artista</TableHead>
                    <TableHead className="text-text-dim font-medium">Categoria</TableHead>
                    <TableHead className="text-right text-text-dim font-medium">Precio</TableHead>
                    <TableHead className="text-right text-text-dim font-medium">Stock</TableHead>
                    <TableHead className="text-text-dim font-medium">Estado</TableHead>
                    <TableHead className="text-right text-text-dim font-medium">Imagenes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAllAssignments ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-text-dim">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Cargando asignaciones...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : allAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingBag className="h-8 w-8 text-text-ghost" />
                          <span className="text-sm text-text-dim">No hay asignaciones</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allAssignments.map((ap) => {
                      const thumb = ap.customImages?.[0] || ap.product?.images?.[0];
                      return (
                        <TableRow key={ap.id} className="border-border-subtle hover:bg-surface-card transition-colors">
                          <TableCell className="font-medium text-text-primary">
                            <div className="flex items-center gap-3">
                              {thumb ? (
                                <img src={thumb} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border-medium" />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-overlay-light ring-1 ring-border-strong">
                                  <ImageIcon className="h-4 w-4 text-text-ghost" />
                                </div>
                              )}
                              <span>{ap.product?.name ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {ap.artist?.stageName ?? '-'}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-md bg-overlay-light px-2 py-0.5 text-xs text-text-dim">
                              {ap.product?.category?.name ?? '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-text-secondary">
                            {fmt(ap.salePrice)}
                          </TableCell>
                          <TableCell className="text-right text-text-secondary">
                            {ap.stock}
                          </TableCell>
                          <TableCell>
                            {ap.isActive !== false ? (
                              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-inset ring-border-medium">
                                Inactivo
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-text-dim hover:bg-overlay-light hover:text-text-primary transition-colors"
                              onClick={() => {
                                setImageDialogTarget(ap);
                                setImageDialogImages(ap.customImages || []);
                                setImageDialogOpen(true);
                              }}
                            >
                              <ImageIcon className="mr-1 h-4 w-4" />
                              {(ap.customImages?.length || 0)}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ================================================================ */}
      {/* Image Management Dialog                                          */}
      {/* ================================================================ */}
      <Dialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) {
            setImageDialogTarget(null);
            setImageDialogImages([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg bg-surface-card border-border-strong text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Gestionar Imagenes</DialogTitle>
            <DialogDescription className="text-text-dim">
              Imagenes personalizadas de{' '}
              <span className="font-semibold text-text-primary">{imageDialogTarget?.product?.name}</span>
              {imageDialogTarget?.artist && (
                <> para <span className="font-semibold text-text-primary">{imageDialogTarget.artist.stageName}</span></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {imageDialogImages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {imageDialogImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border-strong"
                  >
                    <img src={img} alt={`Imagen ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!imageDialogTarget) return;
                        const newImages = imageDialogImages.filter((_, i) => i !== idx);
                        try {
                          await api.patch(`/products/artist-product/${imageDialogTarget.id}`, {
                            customImages: newImages,
                          });
                          setImageDialogImages(newImages);
                          toast.success('Imagen eliminada');
                          // Update local state
                          setArtistProducts((prev) =>
                            prev.map((ap) => ap.id === imageDialogTarget.id ? { ...ap, customImages: newImages } : ap),
                          );
                          setAllAssignments((prev) =>
                            prev.map((ap) => ap.id === imageDialogTarget.id ? { ...ap, customImages: newImages } : ap),
                          );
                        } catch {
                          toast.error('Error al eliminar imagen');
                        }
                      }}
                      className="absolute right-0.5 top-0.5 rounded-md bg-red-500/90 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-ghost">Sin imagenes personalizadas</p>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                id="assign-product-image-upload"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !imageDialogTarget) return;
                  e.target.value = '';
                  setUploadingAssignImage(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const { data } = await api.post(
                      `/upload/artist-product/${imageDialogTarget.id}/image`,
                      formData,
                      { headers: { 'Content-Type': 'multipart/form-data' } },
                    );
                    const newImages = [...imageDialogImages, data.url];
                    setImageDialogImages(newImages);
                    toast.success('Imagen subida');
                    // Update local state
                    setArtistProducts((prev) =>
                      prev.map((ap) => ap.id === imageDialogTarget.id ? { ...ap, customImages: newImages } : ap),
                    );
                    setAllAssignments((prev) =>
                      prev.map((ap) => ap.id === imageDialogTarget.id ? { ...ap, customImages: newImages } : ap),
                    );
                  } catch {
                    toast.error('Error al subir imagen');
                  } finally {
                    setUploadingAssignImage(false);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('assign-product-image-upload')?.click()}
                disabled={uploadingAssignImage}
                className="border border-border-strong text-text-secondary hover:bg-overlay-light hover:text-text-primary"
              >
                {uploadingAssignImage ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Subir imagen</>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setImageDialogOpen(false)}
              className="text-text-secondary hover:bg-overlay-light hover:text-text-primary"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
