'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, XCircle, Ticket, CalendarDays, Search, X,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';

interface Artist {
  id: string;
  stageName: string;
}

interface Show {
  id: string;
  name: string;
  slug: string;
  venue: string;
  city?: string;
  date: string;
  ticketPrice?: number;
  platformFee?: number;
  totalCapacity?: number;
  ticketsEnabled: boolean;
  status: string;
  artist?: { id: string; stageName: string };
  _count?: { tickets: number };
}

interface ShowsResponse {
  data: Show[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  SCHEDULED: {
    label: 'Programado',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
  COMPLETED: {
    label: 'Completado',
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
};

const inputClass =
  'bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20';
const labelClass = 'text-text-secondary text-sm font-medium';

const LIMIT = 20;

export default function AdminShowsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    artistId: '', name: '', description: '', venue: '', address: '', city: '',
    date: '', ticketPrice: '', totalCapacity: '', platformFee: '10', ticketsEnabled: true,
  });

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchShows = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: LIMIT };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (artistFilter) params.artistId = artistFilter;
      const { data } = await api.get<ShowsResponse>('/shows', { params });
      setShows(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      toast.error('Error al cargar los shows');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, artistFilter]);

  useEffect(() => {
    fetchShows(page);
  }, [fetchShows, page]);

  useEffect(() => {
    api.get('/artists?limit=200').then(res => setArtists(res.data.data)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.artistId || !form.name || !form.venue || !form.date) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setCreating(true);
    try {
      await api.post('/shows', {
        artistId: form.artistId,
        name: form.name,
        description: form.description || undefined,
        venue: form.venue,
        address: form.address || undefined,
        city: form.city || undefined,
        date: new Date(form.date).toISOString(),
        ticketPrice: form.ticketPrice ? parseFloat(form.ticketPrice) : undefined,
        platformFee: form.platformFee ? parseFloat(form.platformFee) : 10,
        totalCapacity: form.totalCapacity ? parseInt(form.totalCapacity) : undefined,
        ticketsEnabled: form.ticketsEnabled,
      });
      toast.success('Show creado');
      setCreateOpen(false);
      setForm({ artistId: '', name: '', description: '', venue: '', address: '', city: '', date: '', ticketPrice: '', totalCapacity: '', platformFee: '10', ticketsEnabled: true });
      fetchShows(1);
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear show');
    }
    setCreating(false);
  };

  const handleCancel = async (show: Show) => {
    const ticketsSold = show._count?.tickets || 0;
    const msg = ticketsSold > 0
      ? `Este show tiene ${ticketsSold} entrada${ticketsSold !== 1 ? 's' : ''} vendida${ticketsSold !== 1 ? 's' : ''}. Al cancelar se cancelarán todas las entradas y los compradores serán notificados.\n\n¿Cancelar este show?`
      : '¿Cancelar este show?';
    if (!window.confirm(msg)) return;
    try {
      const { data } = await api.patch(`/shows/${show.id}/cancel`);
      if (data.paidTicketsToRefund > 0) {
        toast.success(`Show cancelado. ${data.paidTicketsToRefund} entrada${data.paidTicketsToRefund !== 1 ? 's' : ''} pagada${data.paidTicketsToRefund !== 1 ? 's' : ''} pendiente${data.paidTicketsToRefund !== 1 ? 's' : ''} de reembolso.`);
      } else {
        toast.success('Show cancelado');
      }
      fetchShows(page);
    } catch {
      toast.error('Error al cancelar');
    }
  };

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

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

  const hasFilters = searchQuery || statusFilter || artistFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Shows</h2>
          <p className="mt-0.5 text-sm text-text-dim">
            Gestiona todos los shows de la plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-sm font-medium text-text-dim">
            {total} show{total !== 1 ? 's' : ''}
          </span>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-600 hover:bg-navy-500 text-white shadow-lg shadow-navy-900/30">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Show
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-surface-card border-border-strong text-text-primary">
              <DialogHeader>
                <DialogTitle className="text-text-primary">Crear Show</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className={labelClass}>Artista *</Label>
                  <Select value={form.artistId} onValueChange={v => update('artistId', v)}>
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue placeholder="Seleccionar artista" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-card border-border-strong text-text-primary">
                      {artists.map(a => (
                        <SelectItem
                          key={a.id}
                          value={a.id}
                          className="focus:bg-overlay-light focus:text-text-primary"
                        >
                          {a.stageName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Nombre del show *</Label>
                  <Input
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    className={inputClass}
                    placeholder="Nombre del evento"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Descripcion</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="Descripcion del show..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>Lugar *</Label>
                    <Input
                      value={form.venue}
                      onChange={e => update('venue', e.target.value)}
                      className={inputClass}
                      placeholder="Teatro, auditorio..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Ciudad</Label>
                    <Input
                      value={form.city}
                      onChange={e => update('city', e.target.value)}
                      className={inputClass}
                      placeholder="Lima, Arequipa..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Fecha y hora *</Label>
                  <Input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => update('date', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>Precio entrada (S/.)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.ticketPrice}
                      onChange={e => update('ticketPrice', e.target.value)}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Comisión plataforma (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={form.platformFee}
                      onChange={e => update('platformFee', e.target.value)}
                      className={inputClass}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Capacidad total</Label>
                    <Input
                      type="number"
                      value={form.totalCapacity}
                      onChange={e => update('totalCapacity', e.target.value)}
                      className={inputClass}
                      placeholder="500"
                    />
                  </div>
                </div>
                {form.ticketPrice && (
                  <div className="rounded-lg border border-navy-500/20 bg-navy-500/5 px-4 py-3 text-sm">
                    <p className="text-text-dim">
                      Por cada entrada de <span className="font-semibold text-text-primary">S/. {parseFloat(form.ticketPrice || '0').toFixed(2)}</span>:
                    </p>
                    <div className="mt-1 flex gap-4">
                      <span className="text-navy-400">
                        Plataforma: S/. {(parseFloat(form.ticketPrice || '0') * parseFloat(form.platformFee || '10') / 100).toFixed(2)} ({form.platformFee || '10'}%)
                      </span>
                      <span className="text-emerald-400">
                        Artista: S/. {(parseFloat(form.ticketPrice || '0') * (100 - parseFloat(form.platformFee || '10')) / 100).toFixed(2)} ({(100 - parseFloat(form.platformFee || '10')).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-card px-4 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.ticketsEnabled}
                    onClick={() => update('ticketsEnabled', !form.ticketsEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
                      form.ticketsEnabled ? 'bg-navy-600' : 'bg-overlay-strong'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        form.ticketsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <Label className={labelClass}>Venta de entradas habilitada</Label>
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full bg-navy-600 hover:bg-navy-500 text-white"
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear Show'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
        <Input
          placeholder="Buscar por nombre, lugar, ciudad o artista..."
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
            value={statusFilter || 'all'}
            onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-36 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border-strong text-text-secondary">
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Artista</label>
          <Select
            value={artistFilter || 'all'}
            onValueChange={(v) => { setArtistFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-44 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border-strong text-text-secondary max-h-60">
              <SelectItem value="all">Todos</SelectItem>
              {artists.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.stageName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput(''); setSearchQuery('');
              setStatusFilter(''); setArtistFilter(''); setPage(1);
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
              <TableHead className="text-text-dim font-medium">Show</TableHead>
              <TableHead className="text-text-dim font-medium">Artista</TableHead>
              <TableHead className="text-text-dim font-medium">Lugar</TableHead>
              <TableHead className="text-text-dim font-medium">Fecha</TableHead>
              <TableHead className="text-text-dim font-medium">Precio</TableHead>
              <TableHead className="text-text-dim font-medium">Estado</TableHead>
              <TableHead className="text-text-dim font-medium">Entradas</TableHead>
              <TableHead className="text-right text-text-dim font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
                    <span className="text-sm text-text-dim">Cargando shows...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : shows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-overlay-light">
                      <CalendarDays className="h-6 w-6 text-text-ghost" />
                    </div>
                    <span className="text-sm text-text-dim">No hay shows registrados</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              shows.map(show => {
                const statusCfg = STATUS_CONFIG[show.status] ?? STATUS_CONFIG['SCHEDULED'];
                return (
                  <TableRow
                    key={show.id}
                    className="border-border-subtle hover:bg-surface-card transition-colors"
                  >
                    <TableCell className="font-semibold text-text-primary">
                      {show.name}
                    </TableCell>
                    <TableCell className="text-text-dim">
                      {show.artist?.stageName || '-'}
                    </TableCell>
                    <TableCell className="text-text-dim text-sm">
                      {show.venue}{show.city ? `, ${show.city}` : ''}
                    </TableCell>
                    <TableCell className="text-sm text-text-dim">
                      {formatDate(show.date)}
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {show.ticketPrice ? `S/. ${Number(show.ticketPrice).toFixed(2)}` : (
                        <span className="text-text-ghost">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusCfg.bg} ${statusCfg.color} ${statusCfg.ring}`}
                      >
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-text-dim">
                        <Ticket className="h-3.5 w-3.5" />
                        <span className="text-sm">
                          {show._count?.tickets || 0}
                          {show.totalCapacity ? `/${show.totalCapacity}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {show.status === 'SCHEDULED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancel(show)}
                          title="Cancelar show"
                          className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
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
              {Math.min(page * LIMIT, total)} de {total} shows
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
