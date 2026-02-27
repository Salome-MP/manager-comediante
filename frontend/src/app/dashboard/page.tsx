'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useChartColors } from '@/hooks/use-chart-colors';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  CalendarDays,
  Users,
  Ticket,
  DollarSign,
  Gift,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Minus,
  ClipboardList,
  Megaphone,
  Mail,
  Loader2,
  Send,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  REFUNDED: { label: 'Reembolsado', color: 'text-text-dim', bg: 'bg-muted' },
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
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-card p-5 transition-all duration-200 hover:border-border-strong hover:shadow-lg hover:shadow-[var(--shadow-color)]">
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const chartColors = useChartColors();

  // Blast dialog state
  const [blastOpen, setBlastOpen] = useState(false);
  const [blastTitle, setBlastTitle] = useState('');
  const [blastMessage, setBlastMessage] = useState('');
  const [blastSendEmail, setBlastSendEmail] = useState(false);
  const [blastSending, setBlastSending] = useState(false);

  const handleSendBlast = async () => {
    if (!blastTitle.trim() || !blastMessage.trim() || !user?.artistId) return;
    setBlastSending(true);
    try {
      const { data } = await api.post(`/artists/${user.artistId}/blast`, {
        title: blastTitle,
        message: blastMessage,
        sendEmail: blastSendEmail,
      });
      toast.success(`Notificacion enviada a ${data.notificationsSent} seguidores${data.emailsSent > 0 ? ` (${data.emailsSent} emails)` : ''}`);
      setBlastOpen(false);
      setBlastTitle('');
      setBlastMessage('');
      setBlastSendEmail(false);
    } catch {
      toast.error('Error al enviar la notificacion');
    } finally {
      setBlastSending(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/reports/artist/dashboard'),
      api.get(`/reports/artist/sales-chart?period=${chartPeriod}`),
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
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-overlay-light" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  const totalEarned = (stats?.totalEarnings || 0) + (stats?.referralEarnings || 0);
  const totalPending = (stats?.pendingEarnings || 0) + (stats?.referralPending || 0);

  const statCards: StatCardProps[] = [
    {
      label: 'Productos',
      value: stats?.assignedProducts ?? 0,
      icon: ShoppingBag,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Shows',
      value: stats?.totalShows ?? 0,
      icon: CalendarDays,
      iconBg: 'bg-navy-500/15',
      iconColor: 'text-navy-400',
    },
    {
      label: 'Seguidores',
      value: stats?.totalFollowers ?? 0,
      icon: Users,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Entradas vendidas',
      value: stats?.totalTickets ?? 0,
      icon: Ticket,
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-400',
    },
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
    ...(stats?.referralPending > 0 || stats?.referralEarnings > 0 ? [{
      label: 'Referidos pendiente',
      value: `S/. ${(stats?.referralPending || 0).toFixed(2)}`,
      icon: Link2,
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-400',
    }] : []),
  ];

  const totalSales = chartData.reduce((acc, d) => acc + Number(d.sales ?? 0), 0);

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Bienvenido, {user?.firstName}
          </h2>
          <p className="mt-1 text-sm text-text-dim">
            Resumen de actividad y metricas de tu cuenta de artista
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setBlastOpen(true)}
            className="gap-2 bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25"
          >
            <Megaphone className="h-4 w-4" />
            Notificar seguidores
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-card px-3 py-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/60" />
            <span className="text-xs text-text-dim">Datos en tiempo real</span>
          </div>
        </div>
      </div>

      {/* Blast dialog */}
      <Dialog open={blastOpen} onOpenChange={setBlastOpen}>
        <DialogContent className="border-border-strong bg-surface-card text-text-primary sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-text-primary">
              <Megaphone className="h-5 w-5 text-navy-400" />
              Notificar a tus seguidores
            </DialogTitle>
            <DialogDescription className="text-text-dim">
              Envia un mensaje a todos tus seguidores ({stats?.totalFollowers ?? 0}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Titulo</label>
              <Input
                placeholder="Ej: Nuevo show este viernes!"
                value={blastTitle}
                onChange={(e) => setBlastTitle(e.target.value)}
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Mensaje</label>
              <Textarea
                placeholder="Escribe tu mensaje para tus seguidores..."
                value={blastMessage}
                onChange={(e) => setBlastMessage(e.target.value)}
                rows={4}
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border-strong bg-overlay-light px-4 py-3 transition-colors hover:bg-overlay-medium">
              <input
                type="checkbox"
                checked={blastSendEmail}
                onChange={(e) => setBlastSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-navy-600"
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-text-dim" />
                <span className="text-sm text-text-secondary">Enviar tambien por email</span>
              </div>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setBlastOpen(false)}
                className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendBlast}
                disabled={blastSending || !blastTitle.trim() || !blastMessage.trim()}
                className="gap-2 bg-navy-600 hover:bg-navy-500 text-white font-semibold disabled:opacity-50"
              >
                {blastSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {blastSending ? 'Enviando...' : 'Enviar notificacion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending customizations alert */}
      {stats?.pendingCustomizations > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <Gift className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">
              Tienes {stats.pendingCustomizations} personalizacion(es) pendiente(s)
            </p>
            <Link
              href="/dashboard/personalizaciones"
              className="flex items-center gap-1 text-xs text-amber-500 transition-colors hover:text-amber-400"
            >
              Ver pendientes
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Chart section */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Mis Ventas</h3>
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
                <linearGradient id="artistSalesGradient" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#artistSalesGradient)"
                name="Ventas"
                dot={false}
                activeDot={{ r: 5, fill: chartColors.stroke, stroke: 'var(--surface-sidebar)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        {(stats?.recentOrders?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-border-default bg-surface-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Ventas recientes</h3>
                <p className="mt-0.5 text-sm text-text-dim">Ultimas transacciones</p>
              </div>
              <Link
                href="/dashboard/ventas"
                className="flex items-center gap-1 text-xs font-medium text-navy-400 transition-colors hover:text-navy-700 dark:hover:text-navy-200"
              >
                Ver todas
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {stats?.recentOrders?.map((order: any) => {
                const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING'];
                return (
                  <div
                    key={order.id}
                    className="group flex items-center justify-between rounded-xl border border-border-subtle bg-overlay-subtle px-4 py-3 transition-all duration-150 hover:border-overlay-medium hover:bg-overlay-light"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-overlay-light">
                        <ClipboardList className="h-4 w-4 text-text-dim" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-text-primary">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-text-dim">
                          {order.user?.firstName} {order.user?.lastName}
                          {order.createdAt && (
                            <> &middot; {formatDate(order.createdAt)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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

        {/* Upcoming shows */}
        {(stats?.upcomingShows?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-border-default bg-surface-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Proximos shows</h3>
                <p className="mt-0.5 text-sm text-text-dim">Shows programados</p>
              </div>
              <Link
                href="/dashboard/shows"
                className="flex items-center gap-1 text-xs font-medium text-navy-400 transition-colors hover:text-navy-700 dark:hover:text-navy-200"
              >
                Ver todos
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {stats?.upcomingShows?.map((show: any) => (
                <div
                  key={show.id}
                  className="group flex items-center justify-between rounded-xl border border-border-subtle bg-overlay-subtle px-4 py-3 transition-all duration-150 hover:border-overlay-medium hover:bg-overlay-light"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-navy-500/10">
                      <CalendarDays className="h-4 w-4 text-navy-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{show.name}</p>
                      <p className="text-xs text-text-dim">
                        {show.venue} &middot;{' '}
                        {new Date(show.date).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-overlay-light px-2.5 py-1">
                    <Ticket className="h-3 w-3 text-text-dim" />
                    <span className="text-xs font-medium text-text-secondary">
                      {show._count?.tickets || 0} entradas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
