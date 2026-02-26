'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useChartColors } from '@/hooks/use-chart-colors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, ShoppingBag, Ticket, Link2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  artistProduct?: {
    artistCommission: number;
    product: { name: string; manufacturingCost: number };
  };
  order: {
    orderNumber: string;
    status: string;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  };
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PAID: { label: 'Pagado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  PENDING: { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  SHIPPED: { label: 'Enviado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  DELIVERED: { label: 'Entregado', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
  PROCESSING: { label: 'Procesando', color: 'text-navy-400', bg: 'bg-navy-500/10' },
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-strong bg-surface-tooltip px-4 py-3 shadow-xl shadow-[var(--shadow-color)]">
      <p className="mb-1 text-xs font-medium text-text-dim">{label}</p>
      <p className="text-base font-bold text-text-primary">
        S/. {Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-sidebar p-5 transition-all duration-200 hover:border-border-strong hover:shadow-lg hover:shadow-[var(--shadow-color)]">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${iconBg}`} />
      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-text-dim">
            {label}
          </span>
          <span className="text-3xl font-bold tracking-tight text-text-primary">{value}</span>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-110`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ArtistVentasPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState('month');
  const chartColors = useChartColors();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const [ticketSales, setTicketSales] = useState<any[]>([]);
  const [ticketSalesTotal, setTicketSalesTotal] = useState(0);
  const [ticketSalesPage, setTicketSalesPage] = useState(1);

  useEffect(() => {
    Promise.all([
      api.get('/reports/artist/dashboard'),
      api.get(`/reports/artist/sales-chart?period=${chartPeriod}`),
      api.get(`/reports/artist/sales-detail?page=${salesPage}&limit=10`),
      api.get(`/reports/artist/ticket-sales?page=${ticketSalesPage}&limit=10`),
    ])
      .then(([statsRes, chartRes, salesRes, ticketRes]) => {
        setStats(statsRes.data);
        setChartData(chartRes.data);
        setSales(salesRes.data.data ?? []);
        setSalesTotal(salesRes.data.total ?? 0);
        setTicketSales(ticketRes.data.data ?? []);
        setTicketSalesTotal(ticketRes.data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chartPeriod, salesPage, ticketSalesPage]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-56 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-overlay-light" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  const totalPending = (stats?.pendingEarnings || 0) + (stats?.referralPending || 0);
  const totalEarned = (stats?.totalEarnings || 0) + (stats?.referralEarnings || 0);

  const statCards: StatCardProps[] = [
    {
      label: 'Ganancias totales',
      value: `S/. ${totalEarned.toFixed(2)}`,
      icon: DollarSign,
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-400',
    },
    {
      label: 'Pendiente cobro',
      value: `S/. ${totalPending.toFixed(2)}`,
      icon: TrendingUp,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Productos vendidos',
      value: stats?.totalProducts ?? 0,
      icon: ShoppingBag,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Entradas vendidas',
      value: stats?.totalTickets ?? 0,
      icon: Ticket,
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-400',
    },
    {
      label: 'Referidos pendiente',
      value: `S/. ${(stats?.referralPending || 0).toFixed(2)}`,
      icon: Link2,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
  ];

  const totalPages = Math.ceil(salesTotal / 10);
  const ticketTotalPages = Math.ceil(ticketSalesTotal / 10);
  const totalChartSales = chartData.reduce((acc, d) => acc + Number(d.sales ?? 0), 0);

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Mis Ventas</h2>
        <p className="mt-1 text-sm text-text-dim">
          Resumen de tus ingresos y detalle de ventas
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Chart section */}
      <div className="rounded-2xl border border-border-default bg-surface-sidebar p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Ventas por periodo</h3>
            <p className="mt-0.5 text-sm text-text-dim">
              Total acumulado:{' '}
              <span className="font-semibold text-teal-400">
                S/. {totalChartSales.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-text-dim">
              <span className="h-2 w-2 rounded-full bg-navy-500" />
              Ventas
            </div>
            <Select value={chartPeriod} onValueChange={setChartPeriod}>
              <SelectTrigger className="h-8 w-32 border-border-strong bg-overlay-light text-xs text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="rounded-xl bg-overlay-light p-4">
              <TrendingUp className="h-8 w-8 text-text-ghost" />
            </div>
            <p className="text-sm text-text-dim">No hay datos de ventas para este periodo</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B2A4A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1B2A4A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `S/.${v}`}
                dx={-4}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={chartColors.stroke}
                strokeWidth={2}
                fill="url(#ventasGradient)"
                name="Ventas"
                dot={false}
                activeDot={{ r: 5, fill: chartColors.stroke, stroke: 'var(--surface-sidebar)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sales detail table */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-sidebar">
        <div className="border-b border-border-default px-6 py-4">
          <h3 className="text-base font-semibold text-text-primary">
            Detalle de ventas
          </h3>
          <p className="mt-0.5 text-sm text-text-dim">{salesTotal} items en total</p>
        </div>

        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-border-default hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Pedido</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Producto</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Comprador</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Cant.</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Subtotal</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Comision</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Estado</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow className="border-border-default hover:bg-overlay-hover">
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl bg-overlay-light p-4">
                      <ShoppingBag className="h-8 w-8 text-text-ghost" />
                    </div>
                    <p className="text-sm text-text-dim">Aun no tienes ventas registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((item) => {
                const statusCfg = STATUS_CONFIG[item.order?.status] ?? STATUS_CONFIG['PENDING'];
                return (
                  <TableRow
                    key={item.id}
                    className="border-border-default transition-colors hover:bg-overlay-subtle"
                  >
                    <TableCell className="font-mono text-sm font-semibold text-text-primary">
                      {item.order?.orderNumber}
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {item.artistProduct?.product?.name || '-'}
                    </TableCell>
                    <TableCell className="text-text-dim">
                      {item.order?.user
                        ? `${item.order.user.firstName} ${item.order.user.lastName}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right text-text-secondary">{item.quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-text-primary">
                      S/. {Number(item.totalPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-teal-400">
                      {(() => {
                        const ap = item.artistProduct;
                        if (!ap) return '-';
                        const margin = Number(item.unitPrice) - Number(ap.product?.manufacturingCost || 0);
                        const rate = Number(ap.artistCommission || 0);
                        const commission = Math.max(0, (margin * rate / 100) * item.quantity);
                        return `S/. ${commission.toFixed(2)}`;
                      })()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-text-dim">
                      {item.order?.createdAt
                        ? new Date(item.order.createdAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-border-default px-6 py-4">
            <button
              onClick={() => setSalesPage(p => Math.max(1, p - 1))}
              disabled={salesPage === 1}
              className="rounded-lg border border-border-strong bg-overlay-light px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs text-text-dim">
              Pagina {salesPage} de {totalPages}
            </span>
            <button
              onClick={() => setSalesPage(p => Math.min(totalPages, p + 1))}
              disabled={salesPage >= totalPages}
              className="rounded-lg border border-border-strong bg-overlay-light px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Ticket sales detail table */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-sidebar">
        <div className="border-b border-border-default px-6 py-4">
          <h3 className="text-base font-semibold text-text-primary">
            Entradas vendidas
          </h3>
          <p className="mt-0.5 text-sm text-text-dim">{ticketSalesTotal} entradas en total</p>
        </div>

        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-border-default hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Show</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Comprador</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Precio</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Tu ganancia</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Estado</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ticketSales.length === 0 ? (
              <TableRow className="border-border-default hover:bg-overlay-hover">
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl bg-overlay-light p-4">
                      <Ticket className="h-8 w-8 text-text-ghost" />
                    </div>
                    <p className="text-sm text-text-dim">Aun no tienes entradas vendidas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ticketSales.map((t: any) => {
                const price = Number(t.price);
                const platformFee = Number(t.show?.platformFee || 10);
                const artistEarning = Math.round(price * (100 - platformFee)) / 100;
                const ticketStatusCfg = t.status === 'USED'
                  ? { label: 'Usada', color: 'text-text-muted', bg: 'bg-overlay-light' }
                  : t.status === 'CANCELLED'
                  ? { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/10' }
                  : { label: 'Activa', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };

                return (
                  <TableRow
                    key={t.id}
                    className="border-border-default transition-colors hover:bg-overlay-subtle"
                  >
                    <TableCell className="font-medium text-text-primary">
                      {t.show?.name || '-'}
                    </TableCell>
                    <TableCell className="text-text-dim">
                      {t.user ? `${t.user.firstName} ${t.user.lastName}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-text-primary">
                      S/. {price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-teal-400">
                      S/. {artistEarning.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${ticketStatusCfg.bg} ${ticketStatusCfg.color}`}>
                        {ticketStatusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-text-dim">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {ticketTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-border-default px-6 py-4">
            <button
              onClick={() => setTicketSalesPage(p => Math.max(1, p - 1))}
              disabled={ticketSalesPage === 1}
              className="rounded-lg border border-border-strong bg-overlay-light px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs text-text-dim">
              Pagina {ticketSalesPage} de {ticketTotalPages}
            </span>
            <button
              onClick={() => setTicketSalesPage(p => Math.min(ticketTotalPages, p + 1))}
              disabled={ticketSalesPage >= ticketTotalPages}
              className="rounded-lg border border-border-strong bg-overlay-light px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
