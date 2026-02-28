'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useChartColors } from '@/hooks/use-chart-colors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingBag,
  Ticket,
  Trophy,
  CalendarDays,
  MapPin,
  Loader2,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `S/. ${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
  });
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-strong bg-surface-tooltip px-4 py-3 shadow-xl shadow-[var(--shadow-color)]">
      <p className="mb-1.5 text-xs font-medium text-text-dim">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-text-dim">{p.name}:</span>
          <span className="font-bold text-text-primary">
            {formatCurrency(Number(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 transition-all duration-200 hover:border-border-strong hover:shadow-lg hover:shadow-[var(--shadow-color)]">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${iconBg}`} />
      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-text-dim">
            {label}
          </span>
          <span className="text-2xl font-bold tracking-tight text-text-primary">
            {value}
          </span>
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

// ── Types ───────────────────────────────────────────────────────────────────

interface ReportsSummary {
  totalSales: number;
  platformProfit: number;
  pendingCommissions: number;
  ordersInPeriod: number;
}

interface ChartPoint {
  date: string;
  products: number;
  tickets: number;
  orders: number;
}

interface TopProduct {
  artistProductId: string;
  productName: string;
  artistName: string;
  image: string | null;
  totalQuantity: number;
  totalRevenue: number;
}

interface UpcomingShow {
  id: string;
  name: string;
  artistName: string;
  venue: string;
  date: string;
  capacity: number | null;
  ticketsSold: number;
  occupancy: number;
  ticketPrice: number;
}

interface ShowsSummary {
  upcomingShows: UpcomingShow[];
  totalTicketsSold: number;
  ticketRevenue: number;
  avgOccupancy: number;
}

interface TopArtist {
  id: string;
  stageName: string;
  profileImage?: string;
  totalSales: number;
  totalRevenue: number; // artist commission
  platformProfit: number;
  _count: { artistProducts: number; shows: number; followers: number };
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminReportesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      router.replace('/admin');
    }
  }, [currentUser, router]);

  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [showsSummary, setShowsSummary] = useState<ShowsSummary | null>(null);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const chartColors = useChartColors();

  // Load all data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/admin/reports-summary?period=${period}`),
      api.get(`/reports/admin/sales-chart?period=${period}`),
      api.get('/reports/admin/top-products?limit=8'),
      api.get('/reports/admin/shows-summary'),
      api.get('/reports/admin/top-artists?limit=10'),
    ])
      .then(([summaryRes, chartRes, productsRes, showsRes, artistsRes]) => {
        setSummary(summaryRes.data);
        setChartData(chartRes.data);
        setTopProducts(productsRes.data);
        setShowsSummary(showsRes.data);
        setTopArtists(artistsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  const maxProductQty = topProducts.length > 0
    ? Math.max(...topProducts.map((p) => p.totalQuantity))
    : 1;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Reportes
          </h2>
          <p className="mt-1 text-sm text-text-dim">
            Resumen financiero y rendimiento de la plataforma
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-9 w-36 border-border-strong bg-overlay-light text-xs text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
            <SelectItem value="year">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Section 1: Summary Cards ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ventas totales"
          value={formatCurrency(summary?.totalSales ?? 0)}
          icon={DollarSign}
          iconBg="bg-teal-500/15"
          iconColor="text-teal-400"
        />
        <StatCard
          label="Ganancia plataforma"
          value={formatCurrency(summary?.platformProfit ?? 0)}
          icon={TrendingUp}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <StatCard
          label="Por liquidar"
          value={formatCurrency(summary?.pendingCommissions ?? 0)}
          icon={Clock}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
        <StatCard
          label="Pedidos del periodo"
          value={String(summary?.ordersInPeriod ?? 0)}
          icon={ShoppingBag}
          iconBg="bg-navy-500/15"
          iconColor="text-navy-400"
        />
      </div>

      {/* ── Section 2: Revenue Chart (stacked areas) ────────────────────── */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Ingresos por periodo
            </h3>
            <p className="mt-0.5 text-sm text-text-dim">
              Desglose de productos y entradas
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-navy-500" />
              Productos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Entradas
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="rounded-xl bg-overlay-light p-4">
              <TrendingUp className="h-8 w-8 text-text-ghost" />
            </div>
            <p className="text-sm text-text-dim">No hay datos para este periodo</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rptProductsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B2A4A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1B2A4A" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="rptTicketsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
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
                dataKey="products"
                stackId="1"
                stroke="#1B2A4A"
                strokeWidth={2}
                fill="url(#rptProductsGrad)"
                name="Productos"
                dot={false}
                activeDot={{ r: 4, fill: '#1B2A4A', stroke: 'var(--surface-sidebar)', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="tickets"
                stackId="1"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#rptTicketsGrad)"
                name="Entradas"
                dot={false}
                activeDot={{ r: 4, fill: '#14b8a6', stroke: 'var(--surface-sidebar)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section 3: Top Products (horizontal bar chart) ──────────────── */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <ShoppingBag className="h-5 w-5 text-navy-400" />
            Productos mas vendidos
          </h3>
          <p className="mt-0.5 text-sm text-text-dim">
            Top 8 por unidades vendidas
          </p>
        </div>

        {topProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-ghost">
            No hay datos de productos aun
          </p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.artistProductId} className="flex items-center gap-4">
                {/* Rank */}
                <span className="w-5 text-right text-xs font-bold text-text-dim">
                  {i + 1}
                </span>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {product.productName}
                    </span>
                    <span className="shrink-0 text-xs text-text-dim">
                      {product.artistName}
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-overlay-light">
                    <div
                      className="h-full rounded-full bg-navy-500 transition-all duration-500"
                      style={{
                        width: `${Math.max((product.totalQuantity / maxProductQty) * 100, 4)}%`,
                      }}
                    />
                  </div>
                </div>
                {/* Stats */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-text-primary">
                    {product.totalQuantity} uds
                  </p>
                  <p className="text-xs text-text-dim">
                    {formatCurrency(product.totalRevenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4: Shows & Tickets ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Upcoming shows */}
        <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6 lg:col-span-2">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <CalendarDays className="h-5 w-5 text-pink-400" />
              Proximos shows
            </h3>
            <p className="mt-0.5 text-sm text-text-dim">
              Shows programados con ocupacion
            </p>
          </div>

          {(!showsSummary?.upcomingShows?.length) ? (
            <p className="py-8 text-center text-sm text-text-ghost">
              No hay shows programados
            </p>
          ) : (
            <div className="space-y-3">
              {showsSummary.upcomingShows.map((show) => (
                <div
                  key={show.id}
                  className="rounded-xl border border-border-default bg-overlay-subtle p-4 transition-all hover:border-border-medium hover:bg-overlay-light"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">
                        {show.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-dim">
                        <span>{show.artistName}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {show.venue}
                        </span>
                        <span>{formatDate(show.date)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-text-primary">
                        {show.ticketsSold}
                        {show.capacity ? `/${show.capacity}` : ''}
                      </p>
                      <p className="text-xs text-text-dim">entradas</p>
                    </div>
                  </div>
                  {/* Occupancy bar */}
                  {show.capacity && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-overlay-light">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            show.occupancy >= 80
                              ? 'bg-emerald-500'
                              : show.occupancy >= 50
                              ? 'bg-amber-500'
                              : 'bg-navy-500'
                          }`}
                          style={{ width: `${Math.min(show.occupancy, 100)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-medium text-text-dim">
                        {show.occupancy}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Ticket stats */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
            <Ticket className="mb-2 h-6 w-6 text-teal-400" />
            <p className="text-3xl font-bold text-text-primary">
              {showsSummary?.totalTicketsSold ?? 0}
            </p>
            <p className="mt-1 text-xs text-text-dim">Entradas vendidas</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
            <DollarSign className="mb-2 h-6 w-6 text-emerald-400" />
            <p className="text-3xl font-bold text-text-primary">
              {formatCurrency(showsSummary?.ticketRevenue ?? 0)}
            </p>
            <p className="mt-1 text-xs text-text-dim">Ingresos entradas</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
            <TrendingUp className="mb-2 h-6 w-6 text-navy-400" />
            <p className="text-3xl font-bold text-text-primary">
              {showsSummary?.avgOccupancy ?? 0}%
            </p>
            <p className="mt-1 text-xs text-text-dim">Ocupacion promedio</p>
          </div>
        </div>
      </div>

      {/* ── Section 5: Top Artists Table ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Trophy className="h-5 w-5 text-amber-400" />
            Top Artistas
          </h3>
          <p className="mt-0.5 text-sm text-text-dim">
            Rendimiento por artista y ganancia de la plataforma
          </p>
        </div>

        {topArtists.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-ghost">
            No hay datos de artistas aun
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-text-dim">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Artista</th>
                  <th className="pb-3 pr-4 text-right">Ventas generadas</th>
                  <th className="pb-3 pr-4 text-right">Comision artista</th>
                  <th className="pb-3 text-right">Ganancia plataforma</th>
                </tr>
              </thead>
              <tbody>
                {topArtists.map((artist, i) => (
                  <tr
                    key={artist.id}
                    className="border-b border-border-default/50 transition-colors hover:bg-overlay-subtle"
                  >
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-500/15 text-amber-400'
                            : i === 1
                            ? 'bg-muted text-text-muted'
                            : i === 2
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'bg-overlay-light text-text-dim'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-500/15 text-xs font-bold text-navy-600 dark:text-navy-300 ring-1 ring-navy-500/20">
                          {artist.stageName?.[0] || '?'}
                        </div>
                        <span className="font-semibold text-text-primary">
                          {artist.stageName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-text-primary">
                      {formatCurrency(artist.totalSales)}
                    </td>
                    <td className="py-3 pr-4 text-right text-text-secondary">
                      {formatCurrency(artist.totalRevenue)}
                    </td>
                    <td className={`py-3 text-right font-semibold ${
                      artist.platformProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(artist.platformProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
