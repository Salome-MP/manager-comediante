'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StarRating } from '@/components/ui/star-rating';
import { ShoppingCart, Minus, Plus, ArrowLeft, Sparkles, Loader2, Star, Send, Heart, Package, RotateCcw, Shield, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Customization {
  type: string;
  price: number;
  description?: string;
  isActive: boolean;
}

interface ProductVariant {
  name: string;
  options: string[];
}

interface ProductDetail {
  id: string;
  salePrice: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  customImages: string[];
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    images: string[];
    variants: ProductVariant[];
    category: { id: string; name: string };
  };
  artist: {
    id: string;
    stageName: string;
    slug: string;
    profileImage?: string;
    customizations?: Customization[];
  };
}

interface RelatedProduct {
  id: string;
  salePrice: number;
  isFeatured: boolean;
  customImages: string[];
  reviewStats?: { averageRating: number; totalReviews: number };
  product: {
    name: string;
    images: string[];
    category: { name: string };
  };
  artist: {
    stageName: string;
    slug: string;
  };
}

const customizationLabels: Record<string, string> = {
  AUTOGRAPH: 'Autografo en el producto',
  HANDWRITTEN_LETTER: 'Carta escrita a mano',
  VIDEO_GREETING: 'Video saludo personalizado',
  VIDEO_CALL: 'Videollamada con el artista',
  PRODUCT_PERSONALIZATION: 'Personalizacion del producto',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, isLoading: cartLoading } = useCartStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [variantSelection, setVariantSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Set<string>>(new Set());
  const [personalization, setPersonalization] = useState('');

  // Wishlist
  const [wishlisted, setWishlisted] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    if (!params.id) return;

    api.get<ProductDetail>(`/products/artist-product/${params.id}`)
      .then(res => {
        setProduct(res.data);
        // Auto-select first option for each variant
        const variants = res.data.product.variants;
        if (variants?.length > 0) {
          const initial: Record<string, string> = {};
          for (const v of variants) {
            if (v.options.length > 0) initial[v.name] = v.options[0];
          }
          setVariantSelection(initial);
        }
        // Fetch artist customizations
        if (res.data.artist?.id) {
          api.get(`/artists/${res.data.artist.id}/customizations`)
            .then(cRes => setCustomizations(cRes.data.filter((c: Customization) => c.isActive)))
            .catch(() => {});
        }
        // Fetch reviews
        api.get(`/reviews/product/${params.id}`)
          .then(rRes => {
            setReviews(rRes.data.data || []);
            setReviewStats({ averageRating: rRes.data.averageRating, totalReviews: rRes.data.totalReviews });
          })
          .catch(() => {});
        // Check wishlist
        if (user) {
          api.get(`/wishlist/check/${params.id}`)
            .then(wRes => setWishlisted(wRes.data.wishlisted))
            .catch(() => {});
        }
        // Fetch related products
        api.get(`/products/artist-product/${params.id}/related?limit=8`)
          .then(rRes => setRelatedProducts(rRes.data || []))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const getAllImages = (): string[] => {
    if (!product) return [];
    const images: string[] = [];
    if (product.customImages?.length > 0) images.push(...product.customImages);
    if (product.product.images?.length > 0) images.push(...product.product.images);
    return images;
  };

  const allImages = getAllImages();
  const isOutOfStock = !product || product.stock <= 0;

  const toggleCustomization = (type: string) => {
    setSelectedCustomizations(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const customizationsTotal = customizations
    .filter(c => selectedCustomizations.has(c.type))
    .reduce((sum, c) => sum + Number(c.price), 0);

  const unitTotal = product ? Number(product.salePrice) + customizationsTotal : 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product && next > product.stock) return product.stock;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      toast.error('Inicia sesion para agregar al carrito');
      router.push('/login');
      return;
    }
    // Validate all variants are selected
    const variants = product.product.variants || [];
    for (const v of variants) {
      if (!variantSelection[v.name]) {
        toast.error(`Selecciona: ${v.name}`);
        return;
      }
    }
    try {
      const selectedCusts = customizations
        .filter(c => selectedCustomizations.has(c.type))
        .map(c => ({ type: c.type, price: Number(c.price) }));
      await addItem(
        product.id,
        quantity,
        variants.length > 0 ? variantSelection : undefined,
        personalization || undefined,
        selectedCusts.length > 0 ? selectedCusts : undefined,
      );
      toast.success('Producto agregado al carrito');
    } catch {
      toast.error('Error al agregar al carrito');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Inicia sesion para guardar favoritos');
      return;
    }
    if (!product) return;
    try {
      const { data } = await api.post(`/wishlist/toggle/${product.id}`);
      setWishlisted(data.wishlisted);
      toast.success(data.wishlisted ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    } catch {
      toast.error('Error al actualizar favoritos');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Inicia sesión para dejar una reseña');
      return;
    }
    if (!product) return;
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/reviews/product/${product.id}`, {
        rating: newRating,
        comment: newComment || undefined,
      });
      setReviews(prev => [data, ...prev]);
      setReviewStats(prev => ({
        totalReviews: prev.totalReviews + 1,
        averageRating: ((prev.averageRating * prev.totalReviews) + newRating) / (prev.totalReviews + 1),
      }));
      setNewComment('');
      setNewRating(5);
      toast.success('Reseña publicada');
    } catch {
      toast.error('Ya dejaste una reseña o hubo un error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-surface-base">
        <p className="text-text-muted">Producto no encontrado</p>
        <Button
          variant="outline"
          asChild
          className="border-border-strong bg-overlay-light text-text-primary hover:bg-overlay-strong"
        >
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <Link
          href={`/artistas/${product.artist.slug}/tienda`}
          className="mb-4 md:mb-6 inline-flex items-center gap-2 text-sm text-text-faint hover:text-navy-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda de {product.artist.stageName}
        </Link>

        {/* ===== GRID: Images + Product Info ===== */}
        <div className="mt-4 md:mt-6 grid gap-6 md:gap-8 md:grid-cols-2">
          {/* Images */}
          <div>
            <div className="overflow-hidden rounded-xl border border-border-medium bg-surface-card">
              <div className="aspect-square flex items-center justify-center">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[selectedImage]}
                    alt={product.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingCart className="h-16 w-16 text-navy-200 dark:text-white/20" />
                )}
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                      selectedImage === idx
                        ? 'border-navy-500'
                        : 'border-border-strong hover:border-border-hover'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.product.name} - ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <Link
              href={`/artistas/${product.artist.slug}`}
              className="text-sm font-medium text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
            >
              {product.artist.stageName}
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-text-primary md:text-3xl">
              {product.product.name}
            </h1>
            <Badge
              variant="outline"
              className="mt-3 border-border-strong text-text-tertiary"
            >
              {product.product.category.name}
            </Badge>

            {/* Review summary inline */}
            {reviewStats.totalReviews > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= Math.round(reviewStats.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-text-ghost'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {reviewStats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-text-faint">
                  ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            <p className="mt-4 text-3xl font-bold text-text-primary">
              S/. {Number(product.salePrice).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-text-faint">
              Producto Original {product.artist.stageName}
            </p>

            <Separator className="my-6 bg-border-medium" />

            {/* Variant selectors */}
            {product.product.variants?.length > 0 && product.product.variants.map((variant) => (
              <div key={variant.name} className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-text-secondary">{variant.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((option) => (
                    <Button
                      key={option}
                      variant={variantSelection[variant.name] === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVariantSelection(prev => ({ ...prev, [variant.name]: option }))}
                      className={
                        variantSelection[variant.name] === option
                          ? 'bg-navy-600 hover:bg-navy-500 text-white border-transparent'
                          : 'border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary hover:border-border-accent'
                      }
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-text-secondary">Cantidad</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border-strong bg-overlay-light">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="h-9 w-9 rounded-r-none text-text-tertiary hover:bg-overlay-strong hover:text-text-primary"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-lg font-semibold text-text-primary">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={isOutOfStock || quantity >= product.stock}
                    className="h-9 w-9 rounded-l-none text-text-tertiary hover:bg-overlay-strong hover:text-text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {isOutOfStock ? (
              <p className="mb-4 text-sm font-semibold text-red-400">Agotado</p>
            ) : (
              <p className="mb-4 text-sm text-text-faint">
                {product.stock} {product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                size="lg"
                disabled={isOutOfStock || cartLoading}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartLoading ? 'Agregando...' : isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleToggleWishlist}
                className={`border-border-strong px-3 transition-all duration-200 ${
                  wishlisted
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                    : 'bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary'
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Customization options */}
            {customizations.length > 0 && (
              <div className="mt-8">
                <Separator className="mb-6 bg-border-medium" />
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Personalizaciones
                </h3>
                <div className="space-y-2">
                  {customizations.map((c) => {
                    const isSelected = selectedCustomizations.has(c.type);
                    return (
                      <button
                        key={c.type}
                        type="button"
                        onClick={() => toggleCustomization(c.type)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-navy-500/50 bg-navy-500/10'
                            : 'border-border-medium bg-overlay-light hover:border-border-hover'
                        }`}
                      >
                        <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? 'border-navy-500 bg-navy-600'
                            : 'border-border-strong bg-overlay-light'
                        }`}>
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">
                            {customizationLabels[c.type] || c.type}
                          </p>
                          {c.description && (
                            <p className="text-xs text-text-faint">{c.description}</p>
                          )}
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${isSelected ? 'text-navy-400' : 'text-emerald-400'}`}>
                          + S/. {Number(c.price).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}

                  {/* Personalization text input */}
                  {selectedCustomizations.has('PRODUCT_PERSONALIZATION') && (
                    <div className="mt-2 space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">
                        Texto de personalizacion (nombre, frase, etc.)
                      </label>
                      <input
                        type="text"
                        value={personalization}
                        onChange={(e) => setPersonalization(e.target.value)}
                        placeholder="Ej: Para mi amigo Juan"
                        className="w-full rounded-lg border border-border-strong bg-overlay-light px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-ghost focus:border-navy-500 focus:ring-1 focus:ring-navy-500/20"
                      />
                    </div>
                  )}

                  {selectedCustomizations.size > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-navy-500/10 border border-navy-500/20 px-3 py-2">
                      <span className="text-sm text-navy-600 dark:text-navy-300">Total con personalizaciones</span>
                      <span className="text-lg font-bold text-text-primary">
                        S/. {(unitTotal * quantity).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== TABS SECTION ===== */}
        <div className="mt-10 md:mt-14">
          <Tabs defaultValue="descripcion">
            <TabsList variant="line" className="w-full justify-start border-b border-border-medium pb-0 gap-0">
              <TabsTrigger value="descripcion" className="px-5 py-3 text-sm font-semibold">
                Descripcion
              </TabsTrigger>
              <TabsTrigger value="resenas" className="px-5 py-3 text-sm font-semibold">
                Reseñas {reviewStats.totalReviews > 0 && `(${reviewStats.totalReviews})`}
              </TabsTrigger>
              <TabsTrigger value="devoluciones" className="px-5 py-3 text-sm font-semibold">
                Devoluciones
              </TabsTrigger>
            </TabsList>

            {/* Tab: Descripcion */}
            <TabsContent value="descripcion" className="pt-6">
              <div className="max-w-3xl space-y-6">
                {product.product.description ? (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-text-primary">Acerca de este producto</h3>
                    <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                      {product.product.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-text-faint">Este producto no tiene descripcion detallada.</p>
                )}

                <Separator className="bg-border-medium" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border-medium bg-surface-card p-4">
                    <p className="text-xs font-medium text-text-faint uppercase tracking-wide">Categoria</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{product.product.category.name}</p>
                  </div>
                  <div className="rounded-lg border border-border-medium bg-surface-card p-4">
                    <p className="text-xs font-medium text-text-faint uppercase tracking-wide">Artista</p>
                    <Link
                      href={`/artistas/${product.artist.slug}`}
                      className="mt-1 block text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors"
                    >
                      {product.artist.stageName}
                    </Link>
                  </div>
                </div>

                {product.product.variants?.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-text-secondary">Variantes disponibles</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.product.variants.map((v) => (
                        <div key={v.name} className="rounded-lg border border-border-medium bg-surface-card px-3 py-2">
                          <p className="text-xs font-medium text-text-faint">{v.name}</p>
                          <p className="text-sm text-text-primary">{v.options.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Reseñas */}
            <TabsContent value="resenas" className="pt-6">
              <div className="max-w-3xl">
                {/* Review summary */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6">
                  <h2 className="text-xl font-bold text-text-primary">Reseñas</h2>
                  {reviewStats.totalReviews > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= Math.round(reviewStats.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-text-ghost'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-text-primary">
                        {reviewStats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-text-faint">
                        ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'reseña' : 'reseñas'})
                      </span>
                    </div>
                  )}
                </div>

                {/* Write review form */}
                {user && (
                  <div className="mb-6 md:mb-8 rounded-xl border border-border-medium bg-surface-card p-4 md:p-5">
                    <h3 className="mb-3 text-sm font-semibold text-text-secondary">Deja tu reseña</h3>
                    <div className="mb-3 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(s)}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              s <= (hoverRating || newRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-text-ghost'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-text-faint">
                        {newRating} de 5
                      </span>
                    </div>
                    <Textarea
                      placeholder="Escribe tu comentario (opcional)..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="mb-3 border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost resize-none"
                    />
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="gap-2 bg-navy-600 hover:bg-navy-500 text-white font-semibold"
                      size="sm"
                    >
                      {submittingReview ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Publicar reseña
                    </Button>
                  </div>
                )}

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <div className="rounded-xl border border-border-medium bg-surface-card py-12 text-center">
                    <Star className="mx-auto h-8 w-8 text-text-ghost mb-2" />
                    <p className="text-text-faint">Aún no hay reseñas. ¡Sé el primero!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review: any) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-border-medium bg-surface-card p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600/20 text-xs font-bold text-navy-600 dark:text-navy-300">
                              {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                            </div>
                            <span className="text-sm font-medium text-text-primary">
                              {review.user?.firstName} {review.user?.lastName}
                            </span>
                          </div>
                          <span className="text-xs text-text-faint">
                            {new Date(review.createdAt).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-text-ghost'}`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-text-muted leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}

                    {reviews.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-medium bg-surface-card py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-overlay-light hover:text-text-primary"
                      >
                        {showAllReviews ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Mostrar menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Ver todas las reseñas ({reviews.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Devoluciones */}
            <TabsContent value="devoluciones" className="pt-6">
              <div className="max-w-3xl space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border-medium bg-surface-card p-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-500/10">
                      <RotateCcw className="h-6 w-6 text-navy-500" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">Devoluciones</h4>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">
                      Tienes hasta 30 dias para solicitar una devolucion si el producto presenta defectos de fabricacion.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border-medium bg-surface-card p-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-500/10">
                      <Shield className="h-6 w-6 text-navy-500" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">Garantia</h4>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">
                      Todos nuestros productos cuentan con garantia de calidad. Si recibes un producto dañado, lo reemplazamos sin costo.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border-medium bg-surface-card p-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-500/10">
                      <Truck className="h-6 w-6 text-navy-500" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">Envios</h4>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">
                      Envios a todo Latinoamerica. El tiempo de entrega varia segun la ubicacion (5-15 dias habiles).
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border-medium bg-surface-card p-5">
                  <h3 className="mb-3 text-sm font-semibold text-text-primary">Politica de devoluciones</h3>
                  <ul className="space-y-2 text-sm text-text-muted leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-500" />
                      El producto debe estar en su empaque original y sin uso.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-500" />
                      Los productos personalizados (autografos, cartas, videos) no admiten devolucion.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-500" />
                      Para iniciar una devolucion, contacta a nuestro equipo de soporte con tu numero de pedido.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-500" />
                      El reembolso se procesa dentro de los 10 dias habiles posteriores a la recepcion del producto devuelto.
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ===== RECOMMENDED PRODUCTS ===== */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 md:mt-16">
            <Separator className="mb-8 bg-border-medium" />
            <h2 className="mb-6 text-xl font-bold text-text-primary">
              Tambien te puede interesar
            </h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {relatedProducts.map((item) => {
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
                      <div className="p-3 md:p-4">
                        <p className="text-xs font-medium text-navy-400">{item.artist.stageName}</p>
                        <p className="mt-1 text-sm font-semibold text-text-primary group-hover:text-navy-700 dark:group-hover:text-navy-200 transition-colors line-clamp-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
