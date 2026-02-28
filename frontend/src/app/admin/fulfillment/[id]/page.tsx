'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, CreditCard, Package, Truck, MapPin, Clock,
  Gift, CheckCircle, AlertCircle, DollarSign, RotateCcw,
} from 'lucide-react';

const STATUS_FLOW = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente', PAID: 'Pagado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};

const statusIcons: Record<string, any> = {
  PAID: CreditCard, PROCESSING: Package, SHIPPED: Truck, DELIVERED: MapPin,
};

const custStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const custStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

const returnStatusColors: Record<string, string> = {
  OPEN: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  REVIEWING: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  RESOLVED: 'bg-overlay-strong text-text-tertiary border-border-strong',
};

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/fulfillment/orders/${id}`);
      setOrder(res.data);
      setCarrier(res.data.carrier || '');
      setTrackingNumber(res.data.trackingNumber || '');
      setNotes(res.data.fulfillmentNotes || '');
    } catch {
      toast.error('Error al cargar la orden');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/fulfillment/orders/${id}/status`, { status: newStatus });
      toast.success(`Orden actualizada a ${statusLabels[newStatus]}`);
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveShipping = async () => {
    if (!carrier || !trackingNumber) {
      toast.error('Completa courier y numero de seguimiento');
      return;
    }
    setUpdating(true);
    try {
      await api.patch(`/fulfillment/orders/${id}/shipping`, { carrier, trackingNumber });
      toast.success('Datos de envio guardados');
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar envio');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await api.patch(`/fulfillment/orders/${id}/notes`, { fulfillmentNotes: notes });
      toast.success('Notas guardadas');
    } catch {
      toast.error('Error al guardar notas');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-text-dim">Orden no encontrada</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/fulfillment">Volver</Link>
        </Button>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  const allCustomizations = order.items.flatMap((item: any) => item.customizations || []);
  const pendingCust = allCustomizations.filter((c: any) => !c.fulfilled);

  const inputClass = "bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Button asChild variant="ghost" size="icon" className="text-text-dim hover:text-text-primary">
          <Link href="/admin/fulfillment"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">{order.orderNumber}</h2>
          <p className="text-sm text-text-dim truncate">
            {order.user.firstName} {order.user.lastName} — {order.user.email}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${
          order.status === 'PAID' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
          order.status === 'PROCESSING' ? 'bg-navy-500/15 text-navy-400 border-navy-500/20' :
          order.status === 'SHIPPED' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' :
          order.status === 'DELIVERED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
          'bg-overlay-strong text-text-tertiary border-border-strong'
        } border`}>
          {statusLabels[order.status]}
        </Badge>
      </div>

      {/* Timeline + Actions */}
      <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
        <h3 className="font-semibold text-text-primary mb-4">Timeline</h3>
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {STATUS_FLOW.map((step, i) => {
            const Icon = statusIcons[step] || Clock;
            const isActive = STATUS_FLOW.indexOf(order.status) >= i;
            const isCurrent = order.status === step;
            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <div className={`h-0.5 w-8 md:w-16 ${isActive ? 'bg-navy-500' : 'bg-border-default'}`} />}
                <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isCurrent ? 'bg-navy-600/20 text-navy-400 ring-1 ring-navy-500/30' :
                  isActive ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-overlay-light text-text-ghost'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{statusLabels[step]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {nextStatus && (
            <Button
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updating}
              className="bg-navy-600 hover:bg-navy-500 text-white"
            >
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Avanzar a {statusLabels[nextStatus]}
            </Button>
          )}
          {(order.status === 'PAID' || order.status === 'PROCESSING') && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={updating}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Cancelar orden
            </Button>
          )}
          {pendingCust.length > 0 && nextStatus === 'SHIPPED' && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {pendingCust.length} personalizacion(es) pendiente(s)
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shipping info */}
        <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-navy-400" /> Datos de envio
          </h3>
          {order.status === 'PROCESSING' && !order.carrier ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-text-dim">Courier *</Label>
                <Input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Ej: Olva Courier"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-dim">Numero de seguimiento *</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ej: OLV-2024-00123"
                  className={inputClass}
                />
              </div>
              <Button onClick={handleSaveShipping} disabled={updating} className="bg-navy-600 hover:bg-navy-500 text-white">
                Guardar datos de envio
              </Button>
            </div>
          ) : order.carrier ? (
            <div className="space-y-2 text-sm">
              <p className="text-text-secondary"><strong>Courier:</strong> {order.carrier}</p>
              <p className="text-text-secondary"><strong>Tracking:</strong> {order.trackingNumber}</p>
              {order.shippedAt && (
                <p className="text-text-dim">Enviado: {new Date(order.shippedAt).toLocaleDateString('es-PE')}</p>
              )}
              {order.deliveredAt && (
                <p className="text-text-dim">Entregado: {new Date(order.deliveredAt).toLocaleDateString('es-PE')}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-ghost">Disponible en estado &quot;En proceso&quot;</p>
          )}

          <Separator className="my-4 bg-border-default" />

          <div className="space-y-2 text-sm">
            <p className="text-text-secondary"><strong>Destinatario:</strong> {order.shippingName}</p>
            <p className="text-text-dim">{order.shippingAddress}, {order.shippingCity}</p>
            {order.shippingPhone && <p className="text-text-dim">Tel: {order.shippingPhone}</p>}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
          <h3 className="font-semibold text-text-primary mb-4">Notas internas</h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas sobre esta orden..."
            rows={4}
            className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500"
          />
          <Button onClick={handleSaveNotes} variant="outline" size="sm" className="mt-2 border-border-strong text-text-secondary hover:bg-overlay-light">
            Guardar notas
          </Button>
        </div>
      </div>

      {/* Items with customizations */}
      <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 text-navy-400" /> Items del pedido
        </h3>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div key={item.id} className="rounded-lg border border-border-default bg-overlay-subtle p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary">
                    {item.quantity}x {item.artistProduct?.product?.name}
                  </p>
                  <p className="text-sm text-text-dim">{item.artistProduct?.artist?.stageName}</p>
                  {item.variantSelection && (
                    <p className="text-xs text-text-ghost mt-0.5">
                      {Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-text-primary">
                  S/. {Number(item.totalPrice).toFixed(2)}
                </span>
              </div>
              {item.customizations?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {item.customizations.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between rounded-md bg-overlay-light px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Gift className="h-3.5 w-3.5 text-text-ghost" />
                        <span className="text-sm text-text-secondary">{c.type.replace(/_/g, ' ')}</span>
                      </div>
                      <Badge className={`border text-[10px] ${custStatusColors[c.status] || 'bg-overlay-strong text-text-tertiary border-border-strong'}`}>
                        {c.fulfilled ? (
                          <><CheckCircle className="mr-1 h-3 w-3" /> {custStatusLabels[c.status] || c.status}</>
                        ) : (
                          custStatusLabels[c.status] || c.status
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Commissions */}
      {order.commissions?.length > 0 && (
        <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-navy-400" /> Comisiones
          </h3>
          <div className="space-y-2">
            {order.commissions.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  {c.type === 'artist'
                    ? `${c.artist?.stageName} (${c.rate}%)`
                    : c.type === 'customization'
                    ? `${c.artist?.stageName || 'Artista'} — Personalización (${c.rate}%)`
                    : `Referido (${c.rate}%)`}
                </span>
                <span className="font-semibold text-text-primary">S/. {Number(c.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns */}
      {order.returnRequests?.length > 0 && (
        <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-navy-400" /> Devoluciones
          </h3>
          <div className="space-y-3">
            {order.returnRequests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border-default bg-overlay-subtle p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{r.reason}</p>
                  <p className="text-xs text-text-ghost">{new Date(r.createdAt).toLocaleDateString('es-PE')}</p>
                </div>
                <Badge className={`border text-xs ${returnStatusColors[r.status]}`}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="rounded-xl border border-border-default bg-surface-card p-4 md:p-6">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-text-dim">
            <span>Subtotal</span><span>S/. {Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descuento</span><span>-S/. {Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-dim">
            <span>Envio</span><span>S/. {Number(order.shippingCost).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-dim">
            <span>IGV</span><span>S/. {Number(order.tax).toFixed(2)}</span>
          </div>
          <Separator className="my-2 bg-border-default" />
          <div className="flex justify-between text-lg font-bold text-text-primary">
            <span>Total</span><span>S/. {Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
