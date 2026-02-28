'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, ArrowLeft, Loader2, Download, CreditCard, Package, Truck, MapPin, Gift, ExternalLink, Phone, Video } from 'lucide-react';
import { toast } from 'sonner';
import { TicketCountdown } from '@/components/ticket-countdown';

const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Pendiente', icon: Clock },
  { key: 'PAID', label: 'Pagado', icon: CreditCard },
  { key: 'PROCESSING', label: 'En proceso', icon: Package },
  { key: 'SHIPPED', label: 'Enviado', icon: Truck },
  { key: 'DELIVERED', label: 'Entregado', icon: MapPin },
];

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start justify-between">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex flex-1 flex-col items-center relative">
            {/* Connector line */}
            {idx > 0 && (
              <div
                className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                  idx <= currentIdx ? 'bg-navy-500' : 'bg-border-medium'
                }`}
                style={{ zIndex: 0 }}
              />
            )}
            {/* Icon circle */}
            <div
              className={`relative z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-navy-600 ring-2 ring-navy-500/30'
                  : isCurrent
                  ? 'bg-navy-600 ring-4 ring-navy-500/20 shadow-lg shadow-navy-500/30'
                  : 'bg-overlay-light ring-1 ring-border-medium'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-white" />
              ) : (
                <Icon className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-text-ghost'}`} />
              )}
            </div>
            {/* Label */}
            <p
              className={`mt-2 text-center text-[10px] sm:text-xs font-medium ${
                isCompleted || isCurrent ? 'text-text-primary' : 'text-text-ghost'
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmacionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    if (params.id) {
      api
        .get<Order>(`/orders/${params.id}`)
        .then((res) => setOrder(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 bg-surface-base">
        <p className="text-lg text-text-muted">Pedido no encontrado</p>
        <Button
          asChild
          className="mt-4 bg-navy-600 hover:bg-navy-500 text-white"
        >
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente de pago',
    PAID: 'Pagado',
    PROCESSING: 'En proceso',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
    PAID: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    PROCESSING: 'bg-navy-500/15 text-navy-600 dark:text-navy-300 border-navy-500/20',
    SHIPPED: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20',
    DELIVERED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/20',
    REFUNDED: 'bg-overlay-strong text-text-tertiary border-border-strong',
  };

  // Determine header based on payment status
  let headerIcon = (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
      <CheckCircle className="h-10 w-10 text-emerald-400" />
    </div>
  );
  let headerTitle = 'Pedido confirmado';
  let headerMessage = 'Gracias por tu compra. Te enviaremos una notificacion cuando tu pedido sea procesado.';

  if (paymentStatus === 'failure') {
    headerIcon = (
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
    );
    headerTitle = 'Pago no completado';
    headerMessage = 'El pago no se pudo procesar. Tu pedido fue creado pero esta pendiente de pago.';
  } else if (paymentStatus === 'pending') {
    headerIcon = (
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/15 ring-1 ring-yellow-500/30">
        <Clock className="h-10 w-10 text-yellow-400" />
      </div>
    );
    headerTitle = 'Pago pendiente';
    headerMessage = 'Tu pago esta siendo procesado. Te notificaremos cuando se confirme.';
  } else if (paymentStatus === 'approved' || order.status === 'PAID') {
    headerIcon = (
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
      </div>
    );
    headerTitle = 'Pago exitoso';
    headerMessage = 'Tu pago ha sido confirmado. Pronto procesaremos tu pedido.';
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
        <div className="text-center mb-8">
          {headerIcon}
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-text-primary">{headerTitle}</h1>
          <p className="mt-2 text-text-muted">{headerMessage}</p>
        </div>

        <div className="rounded-xl border border-border-medium bg-surface-card p-4 sm:p-6 space-y-5">
          {/* Order details */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-faint">Numero de pedido</p>
              <p className="text-lg font-bold text-text-primary">{order.orderNumber}</p>
            </div>
            <Badge className={`border ${statusColors[order.status] || 'bg-overlay-strong text-text-tertiary border-border-strong'}`}>
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-faint">Fecha</p>
              <p className="font-medium text-text-primary">
                {new Date(order.createdAt).toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-text-faint">Total</p>
              <p className="text-lg font-bold text-text-primary">S/. {Number(order.total).toFixed(2)}</p>
            </div>
          </div>

          {order.paymentId && (
            <div className="text-sm">
              <p className="text-text-faint">ID de pago (Mercado Pago)</p>
              <p className="font-mono text-xs text-text-secondary">{order.paymentId}</p>
            </div>
          )}

          {/* Order tracking timeline */}
          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <>
              <Separator className="bg-border-medium" />
              <div>
                <h3 className="mb-4 font-semibold text-text-primary">Seguimiento del pedido</h3>
                <OrderTimeline status={order.status} />
              </div>
            </>
          )}

          {/* Tracking info */}
          {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.carrier && (
            <>
              <Separator className="bg-border-medium" />
              <div>
                <h3 className="mb-3 font-semibold text-text-primary flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-400" /> Datos de envio
                </h3>
                <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3 space-y-1 text-sm">
                  <p className="text-text-secondary"><strong>Courier:</strong> {order.carrier}</p>
                  <p className="text-text-secondary"><strong>Tracking:</strong> {order.trackingNumber}</p>
                  {order.shippedAt && (
                    <p className="text-text-ghost text-xs">Enviado: {new Date(order.shippedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  )}
                  {order.deliveredAt && (
                    <p className="text-text-ghost text-xs">Entregado: {new Date(order.deliveredAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Customizations status */}
          {order.items && order.items.some((item) => item.customizations && item.customizations.length > 0) && (
            <>
              <Separator className="bg-border-medium" />
              <div>
                <h3 className="mb-3 font-semibold text-text-primary flex items-center gap-2">
                  <Gift className="h-4 w-4 text-navy-400" /> Personalizaciones
                </h3>
                <div className="space-y-2">
                  {order.items?.flatMap((item) =>
                    (item.customizations || []).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg bg-overlay-subtle border border-border-default p-3">
                        <div className="flex items-center gap-2">
                          {c.type === 'VIDEO_CALL' ? <Phone className="h-4 w-4 text-text-ghost" /> :
                           c.type === 'VIDEO_GREETING' ? <Video className="h-4 w-4 text-text-ghost" /> :
                           <Gift className="h-4 w-4 text-text-ghost" />}
                          <div>
                            <span className="text-sm text-text-secondary">{c.type.replace(/_/g, ' ')}</span>
                            {c.notes && <p className="text-xs text-text-ghost">{c.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.fulfilled && c.attachmentUrl && (
                            <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-navy-400 hover:underline">
                              <ExternalLink className="h-3 w-3" /> Ver
                            </a>
                          )}
                          {c.type === 'VIDEO_CALL' && c.scheduledDate && (
                            <span className="text-xs text-text-ghost">
                              {new Date(c.scheduledDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {c.type === 'VIDEO_CALL' && c.meetingLink && (
                            <a href={c.meetingLink} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-navy-400 hover:underline">Meet</a>
                          )}
                          <Badge className={`border text-[10px] ${
                            c.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                            c.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                            'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {c.fulfilled ? <><CheckCircle className="mr-0.5 h-2.5 w-2.5" /> Completado</> :
                             c.status === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-border-medium" />

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-text-primary">Productos</h3>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const productName =
                    item.artistProduct?.product?.name || 'Producto';
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium text-text-primary">{productName}</p>
                        <p className="text-text-faint">
                          Cant: {item.quantity}
                          {item.variantSelection && Object.keys(item.variantSelection).length > 0
                            ? ` | ${Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(', ')}`
                            : ''}
                        </p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-xs text-navy-400">
                            + {item.customizations.length} personalizacion(es)
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-text-primary">
                        S/. {Number(item.totalPrice).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Download receipt */}
          {(order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
            <>
              <Separator className="bg-border-medium" />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary gap-2"
                  onClick={async () => {
                    try {
                      const res = await api.get(`/orders/${order.id}/receipt`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${order.orderNumber}.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch {
                      toast.error('Error al descargar la boleta');
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Descargar boleta / factura
                </Button>
              </div>
            </>
          )}

          {/* Retry payment button for pending orders */}
          {order.status === 'PENDING' && (
            <>
              <Separator className="bg-border-medium" />
              <div className="text-center space-y-3">
                {order.expiresAt && (
                  <div className="flex justify-center">
                    <TicketCountdown
                      expiresAt={order.expiresAt}
                      onExpired={() => setOrder((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev)}
                    />
                  </div>
                )}
                <p className="text-sm text-text-faint">
                  El pago no se completo. Puedes intentar de nuevo.
                </p>
                <Button
                  className="bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25"
                  onClick={async () => {
                    try {
                      const { data } = await api.post(`/payments/order/${order.id}/preference`);
                      const payUrl = data.sandboxInitPoint || data.initPoint;
                      if (payUrl) {
                        window.location.href = payUrl;
                      } else {
                        toast.error('No se pudo generar el link de pago');
                      }
                    } catch (err: any) {
                      if (err?.response?.status === 400) {
                        toast.error(err.response.data?.message || 'El pedido ha expirado');
                        setOrder((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
                      } else {
                        toast.error('Error al generar el pago');
                      }
                    }
                  }}
                >
                  Reintentar pago
                </Button>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary"
                    onClick={async () => {
                      try {
                        await api.patch(`/orders/${order.id}/simulate-payment`);
                        toast.success('Pago simulado exitosamente');
                        window.location.reload();
                      } catch {
                        toast.error('Error al simular pago');
                      }
                    }}
                  >
                    Simular pago (modo pruebas)
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            asChild
            className="bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
