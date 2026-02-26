'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Loader2, Package, Search, X } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

interface OrderUser {
  email: string;
  firstName: string;
  lastName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  createdAt: string;
  user: OrderUser;
  items: unknown[];
}

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; ring: string }> = {
  PENDING: {
    label: 'Pendiente',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  PAID: {
    label: 'Pagado',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
  PROCESSING: {
    label: 'Procesando',
    color: 'text-navy-400',
    bg: 'bg-navy-500/10',
    ring: 'ring-navy-500/20',
  },
  SHIPPED: {
    label: 'Enviado',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    ring: 'ring-orange-500/20',
  },
  DELIVERED: {
    label: 'Entregado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
  },
  REFUNDED: {
    label: 'Reembolsado',
    color: 'text-text-muted',
    bg: 'bg-muted',
    ring: 'ring-border-medium',
  },
};

// Transiciones válidas: solo avanzar en el flujo de fulfillment
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    [],                                    // Debe pagar primero (automático)
  PAID:       ['PROCESSING', 'CANCELLED'],           // Admin empieza a preparar o cancela
  PROCESSING: ['SHIPPED', 'CANCELLED'],              // Admin envía o cancela
  SHIPPED:    ['DELIVERED'],                          // Admin confirma entrega
  DELIVERED:  ['REFUNDED'],                           // Solo reembolso si ya entregó
  CANCELLED:  [],                                    // Estado final
  REFUNDED:   [],                                    // Estado final
};

const LIMIT = 20;

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Date picker parts (editable inputs)
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Build date string from day/month/year parts
  useEffect(() => {
    const d = parseInt(filterDay);
    const m = parseInt(filterMonth);
    const y = parseInt(filterYear);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2099) {
      setDateFilter(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      setPage(1);
    } else {
      setDateFilter('');
    }
  }, [filterDay, filterMonth, filterYear]);

  // ── Fetch orders ────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) {
        params.fromDate = dateFilter;
        params.toDate = dateFilter;
      }
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get<OrdersResponse>('/orders', { params });
      setOrders(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  // ── Update status ───────────────────────────────────────────────────────

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Estado del pedido actualizado');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o,
        ),
      );
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function formatCurrency(amount: number) {
    return `S/. ${Number(amount).toFixed(2)}`;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Pedidos
          </h2>
          <p className="mt-0.5 text-sm text-text-dim">
            Gestiona todos los pedidos de la plataforma
          </p>
        </div>
        <span className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-sm font-medium text-text-dim">
          {total} pedido{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
        <Input
          placeholder="Buscar por N° orden, cliente o email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { setSearchQuery(searchInput); setPage(1); }
          }}
          className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 pl-9 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
              className="text-text-dim hover:text-text-primary p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-text-dim hover:text-text-primary"
            onClick={() => { setSearchQuery(searchInput); setPage(1); }}
          >
            Buscar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Estado</label>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-40 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border-strong text-text-secondary">
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Fecha</label>
          <div className="flex items-center gap-1">
            <Input
              placeholder="DD"
              maxLength={2}
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-[52px] text-center border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus-visible:ring-navy-500/20"
            />
            <span className="text-text-ghost">/</span>
            <Input
              placeholder="MM"
              maxLength={2}
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-[52px] text-center border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus-visible:ring-navy-500/20"
            />
            <span className="text-text-ghost">/</span>
            <Input
              placeholder="AAAA"
              maxLength={4}
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-[68px] text-center border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus-visible:ring-navy-500/20"
            />
          </div>
        </div>
        {(statusFilter || dateFilter || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter(''); setFilterDay(''); setFilterMonth(''); setFilterYear('');
              setSearchInput(''); setSearchQuery(''); setPage(1);
            }}
            className="text-text-dim hover:text-text-primary"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card">
        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-border-default hover:bg-transparent">
              <TableHead className="text-text-dim font-medium">N° Orden</TableHead>
              <TableHead className="text-text-dim font-medium">Cliente</TableHead>
              <TableHead className="text-right text-text-dim font-medium">Total</TableHead>
              <TableHead className="text-text-dim font-medium">Estado</TableHead>
              <TableHead className="text-text-dim font-medium">Fecha</TableHead>
              <TableHead className="text-right text-text-dim font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
                    <span className="text-sm text-text-dim">Cargando pedidos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-overlay-light">
                      <Package className="h-6 w-6 text-text-ghost" />
                    </div>
                    <span className="text-sm text-text-dim">No hay pedidos registrados</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status];
                return (
                  <TableRow
                    key={order.id}
                    className="border-border-subtle hover:bg-surface-card transition-colors"
                  >
                    <TableCell className="font-mono text-sm font-semibold text-text-primary">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">
                          {order.user.firstName} {order.user.lastName}
                        </span>
                        <span className="text-xs text-text-dim">
                          {order.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-text-primary">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusCfg.bg} ${statusCfg.color} ${statusCfg.ring}`}
                      >
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-text-dim">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const nextOptions = NEXT_STATUSES[order.status];
                        if (!nextOptions || nextOptions.length === 0) {
                          const hint =
                            order.status === 'PENDING' ? 'Esperando pago' :
                            order.status === 'CANCELLED' ? 'Cancelado' :
                            order.status === 'REFUNDED' ? 'Reembolsado' :
                            'Entregado';
                          return (
                            <span className="text-xs text-text-ghost italic">{hint}</span>
                          );
                        }
                        if (updatingId === order.id) {
                          return <Loader2 className="ml-auto h-4 w-4 animate-spin text-navy-400" />;
                        }
                        return (
                          <div className="flex items-center justify-end gap-1.5">
                            {nextOptions.map((s) => {
                              const cfg = STATUS_CONFIG[s];
                              return (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(order.id, s)}
                                  className={`h-7 text-xs ${cfg.bg} ${cfg.color} ring-1 ring-inset ${cfg.ring} hover:opacity-80`}
                                >
                                  {cfg.label}
                                </Button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
            <p className="text-sm text-text-dim">
              Mostrando {(page - 1) * LIMIT + 1} a{' '}
              {Math.min(page * LIMIT, total)} de {total} pedidos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border border-border-strong text-text-secondary hover:bg-overlay-light hover:text-text-primary"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <span className="rounded-lg border border-border-default bg-surface-card px-3 py-1 text-sm text-text-dim">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border border-border-strong text-text-secondary hover:bg-overlay-light hover:text-text-primary"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
