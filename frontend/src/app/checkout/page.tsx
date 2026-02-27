'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CreditCard, Loader2, Tag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const SHIPPING_COST = 15;

const customizationLabels: Record<string, string> = {
  AUTOGRAPH: 'Autografo',
  HANDWRITTEN_LETTER: 'Carta a mano',
  VIDEO_GREETING: 'Video saludo',
  VIDEO_CALL: 'Videollamada',
  PRODUCT_PERSONALIZATION: 'Personalizacion',
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadFromStorage } = useAuthStore();
  const { cart, fetchCart, clearCart } = useCartStore();
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Coupon from cart
  const couponId = searchParams.get('couponId') || '';
  const couponCode = searchParams.get('couponCode') || '';
  const couponDiscount = Number(searchParams.get('couponDiscount') || 0);

  // Shipping form state
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [invoiceType, setInvoiceType] = useState('');
  const [ruc, setRuc] = useState('');

  useEffect(() => {
    loadFromStorage();
    setHydrated(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchCart();
  }, [hydrated, user, router, fetchCart]);

  useEffect(() => {
    if (!hydrated) return;
    if (user && cart && cart.items.length === 0) {
      router.replace('/carrito');
    }
  }, [hydrated, user, cart, router]);

  if (!user || !cart || cart.items.length === 0) return null;

  const productsSubtotal = Number(cart.subtotal);
  const customizationsTotal = Number(cart.customizationsTotal || 0);
  const subtotal = productsSubtotal + customizationsTotal;
  const discountedSubtotal = subtotal - couponDiscount;
  const igv = (discountedSubtotal + SHIPPING_COST) * 0.18;
  const total = discountedSubtotal + SHIPPING_COST + igv;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingName || !shippingAddress || !shippingCity) {
      toast.error('Completa los campos obligatorios de envio');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        shippingName,
        shippingAddress,
        shippingCity,
      };
      if (shippingState) payload.shippingState = shippingState;
      if (shippingZip) payload.shippingZip = shippingZip;
      if (shippingPhone) payload.shippingPhone = shippingPhone;
      if (invoiceType) payload.invoiceType = invoiceType;
      if (invoiceType === 'FACTURA' && ruc) payload.ruc = ruc;
      if (couponId) payload.couponId = couponId;

      // 1. Create order
      const { data: order } = await api.post('/orders', payload);

      // 2. Create MercadoPago preference and redirect to checkout
      setPaymentLoading(true);
      try {
        const { data: preference } = await api.post(
          `/payments/order/${order.id}/preference`
        );
        // Use sandboxInitPoint for test environment, initPoint for production
        const payUrl = preference.sandboxInitPoint || preference.initPoint;
        if (payUrl) {
          await clearCart();
          window.location.href = payUrl;
          return;
        }
      } catch {
        // If preference creation fails, redirect to confirmation with pending status
      }

      await clearCart();
      router.push(`/confirmacion/${order.id}?status=pending`);
    } catch {
      toast.error('Error al crear el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
      setPaymentLoading(false);
    }
  };

  const inputClass = "bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2";
  const labelClass = "text-text-secondary text-sm font-medium";

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Back link */}
        <Link
          href="/carrito"
          className="mb-4 md:mb-6 inline-flex items-center gap-1.5 text-sm text-text-faint hover:text-navy-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>

        <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl font-bold text-text-primary">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* Left column: Shipping form */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border-medium bg-surface-card p-4 md:p-6">
                <h2 className="mb-4 md:mb-6 text-lg font-bold text-text-primary">Datos de envio</h2>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="shippingName" className={labelClass}>Nombre completo *</Label>
                    <Input
                      id="shippingName"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      placeholder="Nombre del destinatario"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="shippingAddress" className={labelClass}>Direccion *</Label>
                    <Input
                      id="shippingAddress"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Calle, numero, departamento"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="shippingCity" className={labelClass}>Ciudad *</Label>
                      <Input
                        id="shippingCity"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="Lima, Arequipa, etc."
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="shippingState" className={labelClass}>Departamento</Label>
                      <Input
                        id="shippingState"
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        placeholder="Departamento (opcional)"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="shippingZip" className={labelClass}>Codigo postal</Label>
                      <Input
                        id="shippingZip"
                        value={shippingZip}
                        onChange={(e) => setShippingZip(e.target.value)}
                        placeholder="Codigo postal (opcional)"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="shippingPhone" className={labelClass}>Telefono</Label>
                      <Input
                        id="shippingPhone"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="Numero de contacto (opcional)"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <Separator className="bg-border-medium" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="invoiceType" className={labelClass}>Tipo de comprobante</Label>
                      <Select value={invoiceType} onValueChange={setInvoiceType}>
                        <SelectTrigger className="w-full bg-overlay-light border-border-strong text-text-primary focus:ring-navy-500/20">
                          <SelectValue placeholder="Seleccionar (opcional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                          <SelectItem value="BOLETA" className="focus:bg-overlay-strong focus:text-text-primary">Boleta</SelectItem>
                          <SelectItem value="FACTURA" className="focus:bg-overlay-strong focus:text-text-primary">Factura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {invoiceType === 'FACTURA' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="ruc" className={labelClass}>RUC</Label>
                        <Input
                          id="ruc"
                          value={ruc}
                          onChange={(e) => setRuc(e.target.value)}
                          placeholder="Numero de RUC"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Right column: Order summary */}
            <div>
              <div className="sticky top-4 rounded-xl border border-border-medium bg-surface-card p-4 md:p-6">
                <h2 className="mb-4 md:mb-5 text-lg font-bold text-text-primary">Resumen del pedido</h2>

                {/* Item list */}
                <div className="space-y-3 mb-4">
                  {cart.items.map((item) => {
                    const productName = item.artistProduct?.product?.name || 'Producto';
                    const unitPrice = Number(item.artistProduct?.salePrice || 0);
                    const customizationsPrice = (item.customizations || []).reduce(
                      (sum, c) => sum + Number(c.price || 0), 0
                    );
                    const itemTotal = (unitPrice + customizationsPrice) * item.quantity;

                    return (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-3">
                            <p className="font-medium text-text-primary">{productName}</p>
                            <p className="text-text-faint">Cant: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-text-primary whitespace-nowrap">
                            S/. {itemTotal.toFixed(2)}
                          </p>
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="mt-1 ml-2 space-y-0.5">
                            {(item.customizations as any[]).map((c: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-navy-600 dark:text-navy-300">
                                  <Sparkles className="h-3 w-3" />
                                  {customizationLabels[c.type] || c.type}
                                </span>
                                <span className="text-navy-600 dark:text-navy-300">
                                  +S/. {Number(c.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Separator className="bg-border-medium mb-4" />

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Productos</span>
                    <span className="text-text-primary">S/. {productsSubtotal.toFixed(2)}</span>
                  </div>
                  {customizationsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-navy-600 dark:text-navy-300">Personalizaciones</span>
                      <span className="text-navy-600 dark:text-navy-300">S/. {customizationsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Tag className="h-3.5 w-3.5" />
                        Cupón {couponCode}
                      </span>
                      <span className="text-emerald-400 font-medium">-S/. {couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Envio</span>
                    <span className="text-text-primary">S/. {SHIPPING_COST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">IGV (18%)</span>
                    <span className="text-text-primary">S/. {igv.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="bg-border-medium mb-4" />

                <div className="flex justify-between text-lg font-bold mb-5">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary">S/. {total.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                  disabled={isSubmitting || paymentLoading}
                >
                  {paymentLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo a Mercado Pago...</>
                  ) : isSubmitting ? (
                    'Procesando...'
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4" /> Pagar con Mercado Pago</>
                  )}
                </Button>

                <p className="mt-3 text-center text-xs text-text-ghost">
                  Seras redirigido a Mercado Pago para completar tu pago de forma segura.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
