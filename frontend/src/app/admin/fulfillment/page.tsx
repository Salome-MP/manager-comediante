'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Truck, CreditCard, ArrowRight, Gift, RefreshCw } from 'lucide-react';

interface BoardOrder {
  id: string;
  orderNumber: string;
  total: number;
  createdAt: string;
  user: { firstName: string; lastName: string };
  items: {
    id: string;
    quantity: number;
    artistProduct: { product: { name: string }; artist: { stageName: string } };
    customizations: { id: string; type: string; fulfilled: boolean; status: string }[];
  }[];
}

interface Stats {
  paid: number;
  processing: number;
  shipped: number;
  pendingCustomizations: number;
}

const columns = [
  { key: 'PAID', label: 'Pagados', icon: CreditCard, color: 'bg-blue-500' },
  { key: 'PROCESSING', label: 'En proceso', icon: Package, color: 'bg-navy-500' },
  { key: 'SHIPPED', label: 'Enviados', icon: Truck, color: 'bg-indigo-500' },
] as const;

export default function FulfillmentPage() {
  const [board, setBoard] = useState<Record<string, BoardOrder[]>>({ PAID: [], PROCESSING: [], SHIPPED: [] });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [boardRes, statsRes] = await Promise.all([
        api.get('/fulfillment/board'),
        api.get('/fulfillment/stats'),
      ]);
      setBoard(boardRes.data);
      setStats(statsRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Fulfillment</h2>
          <p className="mt-1 text-sm text-text-dim">Gestiona el envio de pedidos</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchData(); }}
          className="border-border-strong text-text-secondary hover:bg-overlay-light"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Pagados', value: stats.paid, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'En proceso', value: stats.processing, color: 'text-navy-400', bg: 'bg-navy-500/10' },
            { label: 'Enviados', value: stats.shipped, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Personalizaciones pendientes', value: stats.pendingCustomizations, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border-default bg-surface-card p-3 sm:p-4">
              <p className="text-sm text-text-dim">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {columns.map((col) => {
          const orders = board[col.key] || [];
          return (
            <div key={col.key} className="rounded-xl border border-border-default bg-surface-card">
              <div className="flex items-center gap-2 border-b border-border-default p-4">
                <col.icon className="h-4 w-4 text-text-dim" />
                <h3 className="font-semibold text-text-primary">{col.label}</h3>
                <Badge className={`ml-auto ${col.color} text-white text-xs`}>
                  {orders.length}
                </Badge>
              </div>
              <div className="max-h-[600px] space-y-3 overflow-y-auto p-4">
                {orders.length === 0 ? (
                  <p className="text-center text-sm text-text-ghost py-8">Sin ordenes</p>
                ) : (
                  orders.map((order) => {
                    const pendingCust = order.items.flatMap((i) =>
                      i.customizations.filter((c) => !c.fulfilled)
                    );
                    return (
                      <Link key={order.id} href={`/admin/fulfillment/${order.id}`}>
                        <div className="group rounded-lg border border-border-default bg-surface-card p-3 transition-all hover:border-navy-500/30 hover:shadow-md cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-navy-600 dark:text-navy-300">
                              {order.orderNumber}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-text-ghost opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            {order.user.firstName} {order.user.lastName}
                          </p>
                          <p className="text-xs text-text-ghost">
                            {new Date(order.createdAt).toLocaleDateString('es-PE', {
                              day: '2-digit', month: 'short',
                            })}
                          </p>
                          <div className="mt-2 space-y-0.5">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-xs text-text-dim truncate">
                                {item.quantity}x {item.artistProduct.product.name}
                                <span className="text-text-ghost"> — {item.artistProduct.artist.stageName}</span>
                              </p>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-semibold text-sm text-text-primary">
                              S/. {Number(order.total).toFixed(2)}
                            </span>
                            {pendingCust.length > 0 && (
                              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">
                                <Gift className="mr-1 h-3 w-3" />
                                {pendingCust.length} pendiente{pendingCust.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
