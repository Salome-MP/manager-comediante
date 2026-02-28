'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useChartColors } from '@/hooks/use-chart-colors';
import { Loader2, ShoppingBag, Users, Star, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Analytics {
  topProducts: { productId: string; name: string; image?: string; totalQuantity: number; totalRevenue: number }[];
  followersChart: { month: string; newFollowers: number }[];
  totalFollowers: number;
  totalBuyers: number;
  averageOrderValue: number;
  totalReviews: number;
  averageRating: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-strong bg-surface-tooltip px-4 py-3 shadow-xl shadow-[var(--shadow-color)]">
      <p className="mb-1 text-xs font-medium text-text-dim">{label}</p>
      <p className="text-base font-bold text-text-primary">{payload[0].value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const chartColors = useChartColors();

  useEffect(() => {
    api.get('/reports/artist/analytics')
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-overlay-light" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-overlay-light" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-dim">No se pudieron cargar los analytics</p>
      </div>
    );
  }

  const conversionRate = analytics.totalFollowers > 0
    ? ((analytics.totalBuyers / analytics.totalFollowers) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Analytics</h2>
        <p className="mt-1 text-sm text-text-dim">Metricas avanzadas de tu cuenta de artista</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 transition-all duration-200 hover:border-border-strong">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-text-dim">Ticket promedio</span>
              <span className="text-2xl font-bold text-text-primary">S/. {analytics.averageOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15">
              <DollarSign className="h-5 w-5 text-teal-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 transition-all duration-200 hover:border-border-strong">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-text-dim">Tasa conversion</span>
              <span className="text-2xl font-bold text-text-primary">{conversionRate}%</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-500/15">
              <TrendingUp className="h-5 w-5 text-navy-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 transition-all duration-200 hover:border-border-strong">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-text-dim">Reseñas</span>
              <span className="text-2xl font-bold text-text-primary">{analytics.totalReviews}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          {analytics.averageRating > 0 && (
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-3 w-3 ${s <= Math.round(analytics.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-text-ghost'}`} />
              ))}
              <span className="ml-1 text-xs text-text-dim">{analytics.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 transition-all duration-200 hover:border-border-strong">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-text-dim">Compradores</span>
              <span className="text-2xl font-bold text-text-primary">{analytics.totalBuyers}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Followers growth chart */}
      {analytics.followersChart.length > 0 && (
        <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
          <h3 className="mb-1 text-base font-semibold text-text-primary">Nuevos seguidores por mes</h3>
          <p className="mb-4 text-sm text-text-dim">Ultimos 6 meses</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.followersChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.1)' }} />
              <Bar dataKey="newFollowers" fill="#1B2A4A" radius={[6, 6, 0, 0]} name="Nuevos seguidores" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top products */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-6">
        <h3 className="mb-1 text-base font-semibold text-text-primary">Productos mas vendidos</h3>
        <p className="mb-4 text-sm text-text-dim">Top 5 por ingresos</p>
        {analytics.topProducts.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <ShoppingBag className="h-8 w-8 text-text-ghost" />
            <p className="text-sm text-text-dim">Aun no hay ventas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.topProducts.map((p, idx) => (
              <div key={p.productId} className="flex items-center gap-4 rounded-xl bg-overlay-subtle px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-500/15 text-sm font-bold text-navy-400">
                  {idx + 1}
                </span>
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-overlay-light">
                    <ShoppingBag className="h-4 w-4 text-text-ghost" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-dim">{p.totalQuantity} vendidos</p>
                </div>
                <span className="text-sm font-bold text-teal-400">S/. {p.totalRevenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
