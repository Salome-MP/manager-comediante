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
  Mic2,
  ShoppingBag,
  ClipboardList,
  Users,
  CalendarDays,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Minus,
  Ticket,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `S/. ${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  PAID: { label: 'Pagado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  PROCESSING: { label: 'Procesando', color: 'text-navy-400', bg: 'bg-navy-500/10' },
  SHIPPED: { label: 'Enviado', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  DELIVERED: { label: 'Entregado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
  REFUNDED: { label: 'Reembolsado', color: 'text-text-muted', bg: 'bg-muted' },
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
        {formatCurrency(Number(payload[0].value))}
      </p>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  iconColor: string;
  trend?: number | null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconBg,
  iconColor,
  trend,
}: StatCardProps) {
  const trendUp = trend !== null && trend !== undefined && trend > 0;
  const trendFlat = trend === 0 || trend === null || trend === undefined;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 transition-all duration-200 hover:border-border-strong hover:shadow-lg hover:shadow-[var(--shadow-color)] ${gradient}`}
    >
      {/* Background glow */}
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${iconBg}`} />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-text-dim">
            {label}
          </span>
          <span className="text-3xl font-bold tracking-tight text-text-primary">
            {value}
          </span>
          {!trendFlat && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trendUp ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trendUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend!)}% vs mes anterior</span>
            </div>
          )}
          {trendFlat && trend !== null && trend !== undefined && (
            <div className="flex items-center gap-1 text-xs font-medium text-text-dim">
              <Minus className="h-3 w-3" />
              <span>Sin cambios</span>
            </div>
          )}
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

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalArtists: number;
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalShows: number;
  totalTicketsSold: number;
  ticketRevenue: number;
  paidRevenue: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: { firstName: string; lastName: string };
  }[];
}

interface ChartPoint {
  date: string;
  sales: number;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const chartColors = useChartColors();

  useEffect(() => {
    Promise.all([
      api.get('/reports/admin/dashboard'),
      api.get(`/reports/admin/sales-chart?period=${chartPeriod}`),
    ])
      .then(([statsRes, chartRes]) => {
        setStats(statsRes.data);
        setChartData(chartRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chartPeriod]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        {/* Cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-overlay-light"
            />
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="h-80 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      label: 'Artistas',
      value: stats?.totalArtists ?? 0,
      icon: Mic2,
      gradient: '',
      iconBg: 'bg-navy-500/15',
      iconColor: 'text-navy-400',
      trend: null,
    },
    {
      label: 'Productos',
      value: stats?.totalProducts ?? 0,
      icon: ShoppingBag,
      gradient: '',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      trend: null,
    },
    {
      label: 'Pedidos totales',
      value: stats?.totalOrders ?? 0,
      icon: ClipboardList,
      gradient: '',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      trend: null,
    },
    {
      label: 'Usuarios',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      gradient: '',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      trend: null,
    },
    {
      label: 'Shows',
      value: stats?.totalShows ?? 0,
      icon: CalendarDays,
      gradient: '',
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-400',
      trend: null,
    },
    {
      label: 'Entradas vendidas',
      value: stats?.totalTicketsSold ?? 0,
      icon: Ticket,
      gradient: '',
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-400',
      trend: null,
    },
    {
      label: 'Ingresos totales',
      value: `S/. ${(stats?.paidRevenue ?? 0).toFixed(2)}`,
      icon: DollarSign,
      gradient: '',
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-400',
      trend: null,
    },
  ];

  const totalSales = chartData.reduce((acc, d) => acc + Number(d.sales ?? 0), 0);

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Vision general
          </h2>
          <p className="mt-1 text-sm text-text-dim">
            Resumen de actividad y metricas de la plataforma
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-card px-3 py-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/60" />
          <span className="text-xs text-text-dim">Datos en tiempo real</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Chart section */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Ventas del periodo
            </h3>
            <p className="mt-0.5 text-sm text-text-dim">
              Total acumulado:{' '}
              <span className="font-semibold text-teal-400">
                {formatCurrency(totalSales)}
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
            <p className="text-sm text-text-dim">
              No hay datos de ventas para este periodo
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={chartColors.stroke}
                strokeWidth={2}
                fill="url(#salesGradient)"
                name="Ventas"
                dot={false}
                activeDot={{ r: 5, fill: chartColors.stroke, stroke: 'var(--surface-sidebar)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent orders */}
      {(stats?.recentOrders?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Pedidos recientes
              </h3>
              <p className="mt-0.5 text-sm text-text-dim">
                Ultimas transacciones de la plataforma
              </p>
            </div>
            <a
              href="/admin/pedidos"
              className="flex items-center gap-1 text-xs font-medium text-navy-400 transition-colors hover:text-navy-700 dark:hover:text-navy-200"
            >
              Ver todos
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            {stats?.recentOrders?.map((order) => {
              const statusCfg =
                STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING'];
              return (
                <div
                  key={order.id}
                  className="group flex items-center justify-between rounded-xl border border-border-default bg-overlay-subtle px-4 py-3 transition-all duration-150 hover:border-border-medium hover:bg-overlay-light"
                >
                  <div className="flex items-center gap-4">
                    {/* Order icon */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-overlay-light">
                      <ClipboardList className="h-4 w-4 text-text-dim" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-text-primary">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-text-dim">
                        {order.user?.firstName} {order.user?.lastName} &middot;{' '}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`hidden rounded-lg px-2.5 py-1 text-xs font-medium sm:block ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {formatCurrency(Number(order.total))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
