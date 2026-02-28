'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  DollarSign, CheckCircle, ChevronLeft, ChevronRight, Search, X, Loader2,
  Clock, TrendingUp, Wallet, ChevronDown, Mic, UserCheck,
} from 'lucide-react';
import type {
  Commission, CommissionSummary, ArtistPending, ReferrerPending, BeneficiariesPendingResponse,
} from '@/types';

const LIMIT = 20;

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  artist: { label: 'Producto', color: 'text-navy-400', bg: 'bg-navy-500/10', ring: 'ring-navy-500/20' },
  customization: { label: 'Personalización', color: 'text-pink-400', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20' },
  ticket: { label: 'Entrada', color: 'text-teal-400', bg: 'bg-teal-500/10', ring: 'ring-teal-500/20' },
  referral: { label: 'Referido', color: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCurrency(n: number) {
  return `S/. ${n.toFixed(2)}`;
}

function getOrigin(c: Commission) {
  if (c.order) return c.order.orderNumber;
  if (c.ticket?.show) return c.ticket.show.name;
  return '-';
}

// ─── Summary Cards ──────────────────────────────────────────────

function SummaryCards({ summary, loading }: { summary: CommissionSummary | null; loading: boolean }) {
  const cards = [
    {
      title: 'Total pendiente',
      amount: summary?.pendingAmount ?? 0,
      count: summary?.pendingCount ?? 0,
      icon: Clock,
      accent: 'text-amber-500 dark:text-amber-400',
      bgIcon: 'bg-amber-500/10',
    },
    {
      title: 'Liquidado este mes',
      amount: summary?.paidThisMonthAmount ?? 0,
      count: summary?.paidThisMonthCount ?? 0,
      icon: Wallet,
      accent: 'text-emerald-500 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/10',
    },
    {
      title: 'Generado este mes',
      amount: summary?.generatedThisMonthAmount ?? 0,
      count: summary?.generatedThisMonthCount ?? 0,
      icon: TrendingUp,
      accent: 'text-navy-500 dark:text-navy-400',
      bgIcon: 'bg-navy-500/10',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-border-default bg-surface-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgIcon}`}>
              <card.icon className={`h-5 w-5 ${card.accent}`} />
            </div>
            <p className="text-sm font-medium text-text-dim">{card.title}</p>
          </div>
          {loading ? (
            <div className="mt-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
            </div>
          ) : (
            <>
              <p className={`mt-3 text-2xl font-bold ${card.accent}`}>
                {formatCurrency(card.amount)}
              </p>
              <p className="mt-0.5 text-sm text-text-dim">
                {card.count} comision{card.count !== 1 ? 'es' : ''}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Beneficiary Card (Artist) ───────────────────────────────────

function ArtistCard({
  artist,
  onPay,
  paying,
}: {
  artist: ArtistPending;
  onPay: (id: string, name: string) => void;
  paying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<Commission[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadDetails = async () => {
    if (details.length > 0) {
      setExpanded(!expanded);
      return;
    }
    setLoadingDetails(true);
    setExpanded(true);
    try {
      const { data } = await api.get('/referrals/commissions', {
        params: { artistId: artist.artistId, status: 'PENDING', limit: 50 },
      });
      setDetails(data.data);
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {artist.profileImage ? (
            <img
              src={artist.profileImage}
              alt={artist.stageName}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-500/10 flex-shrink-0">
              <Mic className="h-5 w-5 text-navy-500 dark:text-navy-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{artist.stageName}</p>
            <p className="text-xs text-text-dim">Artista</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-text-primary">{formatCurrency(artist.pendingAmount)}</p>
            <p className="text-xs text-text-dim">{artist.pendingCount} comision{artist.pendingCount !== 1 ? 'es' : ''}</p>
          </div>
          <Button
            size="sm"
            onClick={() => onPay(artist.artistId, artist.stageName)}
            disabled={paying}
            className="bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap"
          >
            {paying ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            )}
            Liquidar {formatCurrency(artist.pendingAmount)}
          </Button>
        </div>
      </div>

      {/* Breakdown by type */}
      {artist.breakdown.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {artist.breakdown.map((b) => {
            const cfg = TYPE_CONFIG[b.type] ?? TYPE_CONFIG['artist'];
            return (
              <span
                key={b.type}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color} ${cfg.ring}`}
              >
                {cfg.label}: {formatCurrency(b.amount)}
              </span>
            );
          })}
        </div>
      )}

      {/* Expand detail */}
      <button
        onClick={loadDetails}
        className="flex w-full items-center justify-center gap-1 border-t border-border-subtle py-2 text-xs font-medium text-text-dim hover:bg-overlay-light transition-colors"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar detalle' : 'Ver detalle'}
      </button>

      {expanded && (
        <div className="border-t border-border-subtle bg-surface-deep">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
            </div>
          ) : details.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-dim">Sin comisiones pendientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-dim">
                    <th className="px-4 py-2 font-medium">Origen</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 text-right font-medium">Monto</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((c) => {
                    const cfg = TYPE_CONFIG[c.type] ?? TYPE_CONFIG['artist'];
                    return (
                      <tr key={c.id} className="border-t border-border-subtle">
                        <td className="px-4 py-2 font-mono text-xs text-text-primary">{getOrigin(c)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-text-primary">{formatCurrency(Number(c.amount))}</td>
                        <td className="px-4 py-2 text-xs text-text-dim">{formatDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Beneficiary Card (Referrer) ─────────────────────────────────

function ReferrerCard({
  referrer,
  onPay,
  paying,
}: {
  referrer: import('@/types').ReferrerPending;
  onPay: (id: string, name: string) => void;
  paying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<Commission[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadDetails = async () => {
    if (details.length > 0) {
      setExpanded(!expanded);
      return;
    }
    setLoadingDetails(true);
    setExpanded(true);
    try {
      const { data } = await api.get('/referrals/commissions', {
        params: { referralId: referrer.referralId, status: 'PENDING', limit: 50 },
      });
      setDetails(data.data);
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 flex-shrink-0">
            <UserCheck className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{referrer.ownerName}</p>
            <p className="text-xs text-text-dim">Referido ({referrer.code})</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-text-primary">{formatCurrency(referrer.pendingAmount)}</p>
            <p className="text-xs text-text-dim">{referrer.pendingCount} comision{referrer.pendingCount !== 1 ? 'es' : ''}</p>
          </div>
          <Button
            size="sm"
            onClick={() => onPay(referrer.referralId, referrer.ownerName)}
            disabled={paying}
            className="bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap"
          >
            {paying ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            )}
            Liquidar {formatCurrency(referrer.pendingAmount)}
          </Button>
        </div>
      </div>

      {/* Breakdown */}
      {referrer.breakdown.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {referrer.breakdown.map((b) => {
            const cfg = TYPE_CONFIG[b.type] ?? TYPE_CONFIG['referral'];
            return (
              <span
                key={b.type}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color} ${cfg.ring}`}
              >
                {cfg.label}: {formatCurrency(b.amount)}
              </span>
            );
          })}
        </div>
      )}

      {/* Expand detail */}
      <button
        onClick={loadDetails}
        className="flex w-full items-center justify-center gap-1 border-t border-border-subtle py-2 text-xs font-medium text-text-dim hover:bg-overlay-light transition-colors"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar detalle' : 'Ver detalle'}
      </button>

      {expanded && (
        <div className="border-t border-border-subtle bg-surface-deep">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
            </div>
          ) : details.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-dim">Sin comisiones pendientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-dim">
                    <th className="px-4 py-2 font-medium">Origen</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 text-right font-medium">Monto</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((c) => {
                    const cfg = TYPE_CONFIG[c.type] ?? TYPE_CONFIG['referral'];
                    return (
                      <tr key={c.id} className="border-t border-border-subtle">
                        <td className="px-4 py-2 font-mono text-xs text-text-primary">{getOrigin(c)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-text-primary">{formatCurrency(Number(c.amount))}</td>
                        <td className="px-4 py-2 text-xs text-text-dim">{formatDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────

function HistoryTab() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: p, limit: LIMIT, status: 'PAID',
      };
      if (typeFilter) params.type = typeFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (searchQuery) params.search = searchQuery;

      const { data } = await api.get('/referrals/commissions', { params });
      setCommissions(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, fromDate, toDate, searchQuery]);

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  function getBeneficiary(c: Commission) {
    if ((c.type === 'artist' || c.type === 'ticket' || c.type === 'customization') && c.artist) {
      return c.artist.stageName;
    }
    if (c.type === 'referral' && c.referral?.owner) {
      return `${c.referral.owner.firstName} ${c.referral.owner.lastName}`;
    }
    return '-';
  }

  const hasFilters = searchQuery || typeFilter || fromDate || toDate;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
          <Input
            placeholder="Buscar por artista, N° orden..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setSearchQuery(searchInput); setPage(1); }
            }}
            className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 pl-9 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Desde</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-40 border-border-strong bg-overlay-light text-text-secondary focus:border-navy-500 focus-visible:ring-navy-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Hasta</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-40 border-border-strong bg-overlay-light text-text-secondary focus:border-navy-500 focus-visible:ring-navy-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Tipo</label>
          <Select
            value={typeFilter || 'all'}
            onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-36 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border-strong text-text-secondary">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="artist">Producto</SelectItem>
              <SelectItem value="customization">Personalización</SelectItem>
              <SelectItem value="ticket">Entrada</SelectItem>
              <SelectItem value="referral">Referido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput(''); setSearchQuery('');
              setTypeFilter(''); setFromDate(''); setToDate(''); setPage(1);
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
                <TableHead className="text-text-dim font-medium">Origen</TableHead>
                <TableHead className="text-text-dim font-medium">Tipo</TableHead>
                <TableHead className="text-text-dim font-medium">Beneficiario</TableHead>
                <TableHead className="text-right text-text-dim font-medium">Monto</TableHead>
                <TableHead className="text-text-dim font-medium">Tasa</TableHead>
                <TableHead className="text-text-dim font-medium">Pagado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
                      <span className="text-sm text-text-dim">Cargando historial...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-overlay-light">
                        <DollarSign className="h-6 w-6 text-text-ghost" />
                      </div>
                      <span className="text-sm text-text-dim">No hay liquidaciones pagadas</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((c) => {
                  const typeCfg = TYPE_CONFIG[c.type] ?? TYPE_CONFIG['artist'];
                  return (
                    <TableRow
                      key={c.id}
                      className="border-border-subtle hover:bg-surface-card transition-colors"
                    >
                      <TableCell className="font-mono text-sm font-medium text-text-primary">
                        {getOrigin(c)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${typeCfg.bg} ${typeCfg.color} ${typeCfg.ring}`}>
                          {typeCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-text-primary font-medium">
                        {getBeneficiary(c)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-text-primary">
                        {formatCurrency(Number(c.amount))}
                      </TableCell>
                      <TableCell className="text-text-dim">
                        {Number(c.rate).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-sm text-text-dim">
                        {c.paidAt ? formatDate(c.paidAt) : '-'}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border-default px-4 py-3">
            <p className="text-xs sm:text-sm text-text-dim">
              Mostrando {(page - 1) * LIMIT + 1} a{' '}
              {Math.min(page * LIMIT, total)} de {total}
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

// ─── Main Page ───────────────────────────────────────────────────

export default function AdminComisionesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      router.replace('/admin');
    }
  }, [currentUser, router]);

  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiariesPendingResponse | null>(null);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const { data } = await api.get('/referrals/commissions/summary');
      setSummary(data);
    } catch { /* ignore */ } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchBeneficiaries = useCallback(async () => {
    setBeneficiariesLoading(true);
    try {
      const { data } = await api.get('/referrals/commissions/beneficiaries-pending');
      setBeneficiaries(data);
    } catch { /* ignore */ } finally {
      setBeneficiariesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchBeneficiaries();
  }, [fetchSummary, fetchBeneficiaries]);

  const handlePayArtist = async (artistId: string, name: string) => {
    if (!window.confirm(`¿Liquidar todas las comisiones pendientes de ${name}?`)) return;
    setPayingId(artistId);
    try {
      const { data } = await api.patch(`/referrals/commissions/pay-all?artistId=${artistId}`);
      toast.success(`${data.paid} comisiones de ${name} liquidadas`);
      fetchSummary();
      fetchBeneficiaries();
    } catch {
      toast.error('Error al procesar la liquidación');
    } finally {
      setPayingId(null);
    }
  };

  const handlePayReferrer = async (referralId: string, name: string) => {
    if (!window.confirm(`¿Liquidar todas las comisiones pendientes de ${name}?`)) return;
    setPayingId(referralId);
    try {
      const { data } = await api.patch(`/referrals/commissions/pay-all?referralId=${referralId}`);
      toast.success(`${data.paid} comisiones de ${name} liquidadas`);
      fetchSummary();
      fetchBeneficiaries();
    } catch {
      toast.error('Error al procesar la liquidación');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Liquidaciones</h2>
        <p className="mt-0.5 text-sm text-text-dim">
          Gestiona los pagos a artistas y referidos
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* Tabs */}
      <Tabs defaultValue="artists" className="space-y-4">
        <TabsList className="bg-overlay-light border border-border-default">
          <TabsTrigger value="artists" className="data-[state=active]:bg-surface-card">
            Artistas
          </TabsTrigger>
          <TabsTrigger value="referrers" className="data-[state=active]:bg-surface-card">
            Referidos
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-surface-card">
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Artistas */}
        <TabsContent value="artists" className="space-y-4">
          {beneficiariesLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
              <span className="text-sm text-text-dim">Cargando artistas...</span>
            </div>
          ) : !beneficiaries || beneficiaries.artists.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-text-dim">
                No hay comisiones de artistas pendientes por liquidar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaries.artists.map((a) => (
                <ArtistCard
                  key={a.artistId}
                  artist={a}
                  onPay={handlePayArtist}
                  paying={payingId === a.artistId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Referidos */}
        <TabsContent value="referrers" className="space-y-4">
          {beneficiariesLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
              <span className="text-sm text-text-dim">Cargando referidos...</span>
            </div>
          ) : !beneficiaries || beneficiaries.referrers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-text-dim">
                No hay comisiones de referidos pendientes por liquidar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaries.referrers.map((r) => (
                <ReferrerCard
                  key={r.referralId}
                  referrer={r}
                  onPay={handlePayReferrer}
                  paying={payingId === r.referralId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
