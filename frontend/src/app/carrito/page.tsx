'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, Sparkles, Tag, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const customizationLabels: Record<string, string> = {
  AUTOGRAPH: 'Autografo',
  HANDWRITTEN_LETTER: 'Carta a mano',
  VIDEO_GREETING: 'Video saludo',
  VIDEO_CALL: 'Videollamada',
  PRODUCT_PERSONALIZATION: 'Personalizacion',
};

export default function CarritoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cart, fetchCart, updateQuantity, removeItem, clearCart, itemCount } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; couponId: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    setValidatingCoupon(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal: Number(cart.total),
      });
      setCouponApplied({ code: data.code, discount: data.discount, couponId: data.couponId });
      toast.success(`Cupon aplicado: -S/. ${data.discount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cupon no valido');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchCart();
  }, [user, router, fetchCart]);

  if (!user) return null;

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(itemId, newQuantity);
    } catch {
      toast.error('Error al actualizar la cantidad');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success('Producto eliminado del carrito');
    } catch {
      toast.error('Error al eliminar el producto');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Carrito vaciado');
    } catch {
      toast.error('Error al vaciar el carrito');
    }
  };

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-surface-base flex flex-col items-center justify-center px-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-overlay-light ring-1 ring-border-strong">
          <ShoppingCart className="h-10 w-10 text-text-ghost" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-text-primary">Tu carrito esta vacio</h2>
        <p className="mt-2 text-text-muted">Agrega productos de tus comediantes favoritos</p>
        <Button
          asChild
          className="mt-6 bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Link href="/artistas">Explorar comediantes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Back link */}
        <Link
          href="/artistas"
          className="mb-4 md:mb-6 inline-flex items-center gap-1.5 text-sm text-text-faint hover:text-navy-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>

        <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl font-bold text-text-primary">Carrito de compras</h1>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Left column: Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const productImage = item.artistProduct?.product?.images?.[0];
              const productName = item.artistProduct?.product?.name || 'Producto';
              const artistName = item.artistProduct?.artist?.stageName || '';
              const unitPrice = Number(item.artistProduct?.salePrice || 0);
              const customizationsPrice = (item.customizations || []).reduce(
                (sum: number, c: any) => sum + Number(c.price || 0), 0
              );
              const itemTotal = (unitPrice + customizationsPrice) * item.quantity;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border-medium bg-surface-card p-4 transition-all duration-200 hover:border-overlay-hover"
                >
                  <div className="flex gap-3 md:gap-4">
                    {/* Product image */}
                    <div className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-overlay-light">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-text-ghost" />
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">{productName}</h3>
                        {artistName && (
                          <p className="text-sm text-text-muted">{artistName}</p>
                        )}
                        {item.variantSelection && Object.keys(item.variantSelection).length > 0 && (
                          <p className="text-sm text-text-faint">
                            {Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-medium text-text-secondary">
                          S/. {unitPrice.toFixed(2)} c/u
                        </p>
                        {(item.customizations as any[])?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(item.customizations as any[]).map((c: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-navy-500/10 border border-navy-500/20 px-2 py-0.5 text-xs text-navy-600 dark:text-navy-300"
                              >
                                <Sparkles className="h-3 w-3" />
                                {customizationLabels[c.type] || c.type} +S/.{Number(c.price).toFixed(2)}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.personalization && (
                          <p className="mt-1 text-xs text-text-faint italic">
                            &quot;{item.personalization}&quot;
                          </p>
                        )}
                      </div>

                      {/* Item total (mobile only) */}
                      <p className="mt-2 text-base font-bold text-text-primary sm:hidden">
                        S/. {itemTotal.toFixed(2)}
                      </p>

                      {/* Quantity controls */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-border-strong bg-overlay-light">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none text-text-tertiary hover:bg-overlay-strong hover:text-text-primary"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="flex h-8 w-10 items-center justify-center text-sm font-medium text-text-primary">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none text-text-tertiary hover:bg-overlay-strong hover:text-text-primary"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Item total */}
                    <div className="hidden sm:flex flex-col items-end justify-center">
                      <p className="text-lg font-bold text-text-primary">S/. {itemTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column: Order summary */}
          <div>
            <div className="sticky top-4 rounded-xl border border-border-medium bg-surface-card p-4 md:p-6">
              <h2 className="mb-4 md:mb-5 text-lg font-bold text-text-primary">Resumen del pedido</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Productos ({itemCount()})</span>
                  <span className="text-text-primary">S/. {Number(cart.subtotal).toFixed(2)}</span>
                </div>
                {Number(cart.customizationsTotal || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-600 dark:text-navy-300">Personalizaciones</span>
                    <span className="text-navy-600 dark:text-navy-300">S/. {Number(cart.customizationsTotal).toFixed(2)}</span>
                  </div>
                )}

                {/* Coupon input */}
                <div>
                  {couponApplied ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-300">{couponApplied.code}</span>
                        <span className="text-sm text-emerald-400">-S/. {couponApplied.discount.toFixed(2)}</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-text-faint hover:text-red-400 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-ghost" />
                        <Input
                          placeholder="Codigo de cupon"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="pl-9 border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost text-sm h-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary h-9"
                      >
                        {validatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="bg-border-medium" />

                {couponApplied && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400">Descuento</span>
                    <span className="text-emerald-400 font-medium">-S/. {couponApplied.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary text-lg">
                    S/. {(Number(cart.total) - (couponApplied?.discount || 0)).toFixed(2)}
                  </span>
                </div>

                <Button
                  asChild
                  className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Link href={`/checkout${couponApplied ? `?couponId=${couponApplied.couponId}&couponCode=${couponApplied.code}&couponDiscount=${couponApplied.discount}` : ''}`}>Proceder al pago</Link>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  onClick={handleClearCart}
                >
                  Vaciar carrito
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
