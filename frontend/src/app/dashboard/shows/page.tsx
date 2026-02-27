'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, XCircle, Eye, Ticket, CalendarDays, Pencil, Image as ImageIcon, Upload, Search, X } from 'lucide-react';

interface Show {
  id: string;
  name: string;
  slug: string;
  description?: string;
  venue: string;
  city?: string;
  date: string;
  image?: string;
  ticketPrice?: number;
  platformFee?: number;
  totalCapacity?: number;
  ticketsEnabled: boolean;
  status: string;
  _count?: { tickets: number };
}

interface TicketBuyer {
  id: string;
  qrCode: string;
  status: string;
  price: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Programado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  COMPLETED: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Activo', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  USED: { label: 'Usado', color: 'text-text-dim', bg: 'bg-muted' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const emptyForm = {
  name: '',
  description: '',
  venue: '',
  city: '',
  date: '',
  ticketPrice: '',
  totalCapacity: '',
  ticketsEnabled: true,
  publishAt: '',
};

export default function ArtistShowsPage() {
  const { user } = useAuthStore();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editShowId, setEditShowId] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editCurrentImage, setEditCurrentImage] = useState<string | null>(null);

  // Ticket viewers dialog state
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketBuyer[]>([]);
  const [selectedShowName, setSelectedShowName] = useState('');


  const fetchShows = useCallback(async () => {
    if (!user?.artistId) return;
    try {
      const { data } = await api.get(`/shows/artist/${user.artistId}`);
      setShows(Array.isArray(data) ? data : data.data ?? []);
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const filtered = useMemo(() => {
    return shows.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.venue.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [shows, search, statusFilter]);

  const hasFilters = search !== '' || statusFilter !== 'all';

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const uploadShowCover = async (showId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/upload/show/${showId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleCreate = async () => {
    if (!user?.artistId) return;
    if (!form.name || !form.venue || !form.date) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post('/shows', {
        artistId: user.artistId,
        name: form.name,
        description: form.description || undefined,
        venue: form.venue,
        city: form.city || undefined,
        date: new Date(form.date).toISOString(),
        ticketPrice: form.ticketPrice ? parseFloat(form.ticketPrice) : undefined,
        totalCapacity: form.totalCapacity ? parseInt(form.totalCapacity) : undefined,
        ticketsEnabled: form.ticketsEnabled,
        publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
      });

      if (createImageFile && data.id) {
        await uploadShowCover(data.id, createImageFile);
      }

      toast.success('Show creado exitosamente');
      setCreateOpen(false);
      setForm(emptyForm);
      setCreateImageFile(null);
      setCreateImagePreview(null);
      fetchShows();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el show');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Estas seguro de cancelar este show?')) return;
    try {
      await api.patch(`/shows/${id}/cancel`);
      toast.success('Show cancelado');
      fetchShows();
    } catch {
      toast.error('Error al cancelar el show');
    }
  };

  const handleOpenEdit = (show: Show) => {
    setEditShowId(show.id);
    setEditForm({
      name: show.name,
      description: show.description || '',
      venue: show.venue,
      city: show.city || '',
      date: new Date(show.date).toISOString().slice(0, 16),
      ticketPrice: show.ticketPrice ? String(show.ticketPrice) : '',
      totalCapacity: show.totalCapacity ? String(show.totalCapacity) : '',
      ticketsEnabled: show.ticketsEnabled,
      publishAt: '',
    });
    setEditCurrentImage(show.image || null);
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editShowId) return;
    if (!editForm.name || !editForm.venue || !editForm.date) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setEditing(true);
    try {
      await api.patch(`/shows/${editShowId}`, {
        name: editForm.name,
        description: editForm.description || undefined,
        venue: editForm.venue,
        city: editForm.city || undefined,
        date: new Date(editForm.date).toISOString(),
        ticketPrice: editForm.ticketPrice ? parseFloat(editForm.ticketPrice) : undefined,
        totalCapacity: editForm.totalCapacity ? parseInt(editForm.totalCapacity) : undefined,
        ticketsEnabled: editForm.ticketsEnabled,
      });

      if (editImageFile) {
        await uploadShowCover(editShowId, editImageFile);
      }

      toast.success('Show actualizado');
      setEditOpen(false);
      fetchShows();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al actualizar el show');
    } finally {
      setEditing(false);
    }
  };

  const updateEdit = (field: string, value: string | boolean) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const handleViewTickets = async (show: Show) => {
    setSelectedShowName(show.name);
    setTicketsOpen(true);
    setTicketsLoading(true);
    setTickets([]);
    try {
      const { data } = await api.get(`/shows/${show.id}/tickets`);
      setTickets(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toast.error('Error al cargar las entradas');
    } finally {
      setTicketsLoading(false);
    }
  };

  const isShowPast = (show: Show) => {
    return show.status === 'COMPLETED' || new Date(show.date) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-32 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Mis Shows</h2>
          <p className="mt-1 text-sm text-text-dim">{shows.length} shows registrados</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-600 text-white hover:bg-navy-500">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Show
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border-strong bg-surface-card text-text-primary">
            <DialogHeader>
              <DialogTitle className="text-text-primary">Crear Nuevo Show</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Nombre del show *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Nombre de tu show"
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Descripcion</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe tu show..."
                  rows={3}
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              {/* Cover image */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Imagen de portada</Label>
                {createImagePreview ? (
                  <div className="relative">
                    <img src={createImagePreview} alt="Portada" className="h-40 w-full rounded-xl border border-border-default object-cover" />
                    <button
                      type="button"
                      onClick={() => { setCreateImageFile(null); setCreateImagePreview(null); }}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-overlay-light transition-colors hover:border-navy-500/50 hover:bg-overlay-hover">
                    <Upload className="mb-2 h-6 w-6 text-text-ghost" />
                    <span className="text-sm text-text-dim">Click para subir imagen</span>
                    <span className="text-[11px] text-text-ghost">JPG, PNG. Se mostrara en la pagina del show</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreateImageFile(file);
                          setCreateImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-dim">Lugar *</Label>
                  <Input
                    value={form.venue}
                    onChange={(e) => update('venue', e.target.value)}
                    placeholder="Nombre del local"
                    className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-dim">Ciudad</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    placeholder="Ciudad"
                    className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Fecha y hora *</Label>
                <Input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  className="border-border-strong bg-overlay-light text-text-primary focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-dim">Precio entrada (S/.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.ticketPrice}
                    onChange={(e) => update('ticketPrice', e.target.value)}
                    placeholder="0.00"
                    className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-dim">Capacidad total</Label>
                  <Input
                    type="number"
                    value={form.totalCapacity}
                    onChange={(e) => update('totalCapacity', e.target.value)}
                    placeholder="100"
                    className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border-default bg-overlay-subtle px-3 py-2.5">
                <input
                  type="checkbox"
                  id="ticketsEnabled"
                  checked={form.ticketsEnabled}
                  onChange={(e) => update('ticketsEnabled', e.target.checked)}
                  className="h-4 w-4 accent-navy-500"
                />
                <Label htmlFor="ticketsEnabled" className="cursor-pointer text-text-secondary">
                  Venta de entradas habilitada
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Programar publicacion (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={form.publishAt}
                  onChange={(e) => update('publishAt', e.target.value)}
                  className="border-border-strong bg-overlay-light text-text-primary focus:border-navy-500 focus:ring-navy-500/20"
                />
                <p className="text-[11px] text-text-ghost">Deja vacio para publicar inmediatamente</p>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-navy-600 text-white hover:bg-navy-500"
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear Show'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      {shows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-ghost" />
            <Input
              placeholder="Buscar por nombre o lugar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-ghost hover:text-text-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-border-strong bg-overlay-light px-3 text-sm text-text-secondary focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500/20"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {hasFilters && (
            <Badge variant="secondary" className="bg-navy-500/10 text-navy-400">
              {filtered.length} de {shows.length} shows
            </Badge>
          )}
        </div>
      )}

      {/* Shows Table */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-border-default hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Show</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Fecha</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Lugar</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Precio</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Tu ganancia</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Estado</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Entradas</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border-default hover:bg-overlay-hover">
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl bg-overlay-light p-4">
                      <CalendarDays className="h-8 w-8 text-text-ghost" />
                    </div>
                    <p className="text-sm text-text-dim">
                      {hasFilters
                        ? 'No se encontraron shows con los filtros aplicados.'
                        : 'No tienes shows registrados. Crea tu primer show.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((show) => {
                const statusCfg = STATUS_CONFIG[show.status] ?? STATUS_CONFIG['SCHEDULED'];
                return (
                  <TableRow
                    key={show.id}
                    className="border-border-default transition-colors hover:bg-overlay-subtle"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border-default bg-overlay-light">
                          {show.image ? (
                            <img src={show.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-text-ghost" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-text-primary">{show.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-dim">
                      {new Date(show.date).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-text-dim">
                      {show.venue}
                      {show.city ? `, ${show.city}` : ''}
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {show.ticketPrice
                        ? `S/. ${Number(show.ticketPrice).toFixed(2)}`
                        : <span className="text-text-ghost">-</span>}
                    </TableCell>
                    <TableCell>
                      {show.ticketPrice ? (() => {
                        const price = Number(show.ticketPrice);
                        const fee = Number(show.platformFee ?? 10);
                        const artistCut = price * (100 - fee) / 100;
                        const ticketsSold = show._count?.tickets || 0;
                        return (
                          <div className="text-sm">
                            <span className="font-medium text-emerald-400">S/. {artistCut.toFixed(2)}</span>
                            <span className="text-text-ghost">/entrada</span>
                            {ticketsSold > 0 && (
                              <div className="text-xs text-text-dim">
                                Total: S/. {(artistCut * ticketsSold).toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      })() : <span className="text-text-ghost">-</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTickets(show)}
                          title="Ver compradores"
                          className="h-8 w-8 text-text-dim hover:bg-overlay-light hover:text-text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {show.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(show)}
                              title="Editar show"
                              className="h-8 w-8 text-text-dim hover:bg-navy-500/10 hover:text-navy-400"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(show.id)}
                              title="Cancelar show"
                              className="h-8 w-8 text-text-dim hover:bg-red-500/10 hover:text-red-400"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Edit Show Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border-strong bg-surface-card text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Editar Show</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Nombre del show *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => updateEdit('name', e.target.value)}
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Descripcion</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => updateEdit('description', e.target.value)}
                rows={3}
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
              />
            </div>
            {/* Cover image */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Imagen de portada</Label>
              {(editImagePreview || editCurrentImage) ? (
                <div className="relative">
                  <img src={editImagePreview || editCurrentImage!} alt="Portada" className="h-40 w-full rounded-xl border border-border-default object-cover" />
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <label className="cursor-pointer rounded-lg bg-black/60 p-1.5 text-white hover:bg-black/80">
                      <Pencil className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditImageFile(file);
                            setEditImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-overlay-light transition-colors hover:border-navy-500/50 hover:bg-overlay-hover">
                  <Upload className="mb-2 h-6 w-6 text-text-ghost" />
                  <span className="text-sm text-text-dim">Click para subir imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditImageFile(file);
                        setEditImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Lugar *</Label>
                <Input
                  value={editForm.venue}
                  onChange={(e) => updateEdit('venue', e.target.value)}
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Ciudad</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => updateEdit('city', e.target.value)}
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Fecha y hora *</Label>
              <Input
                type="datetime-local"
                value={editForm.date}
                onChange={(e) => updateEdit('date', e.target.value)}
                className="border-border-strong bg-overlay-light text-text-primary focus:border-navy-500 focus:ring-navy-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Precio entrada (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.ticketPrice}
                  onChange={(e) => updateEdit('ticketPrice', e.target.value)}
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Capacidad total</Label>
                <Input
                  type="number"
                  value={editForm.totalCapacity}
                  onChange={(e) => updateEdit('totalCapacity', e.target.value)}
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border-default bg-overlay-subtle px-3 py-2.5">
              <input
                type="checkbox"
                id="editTicketsEnabled"
                checked={editForm.ticketsEnabled}
                onChange={(e) => updateEdit('ticketsEnabled', e.target.checked)}
                className="h-4 w-4 accent-navy-500"
              />
              <Label htmlFor="editTicketsEnabled" className="cursor-pointer text-text-secondary">
                Venta de entradas habilitada
              </Label>
            </div>
            <Button
              onClick={handleEdit}
              className="w-full bg-navy-600 text-white hover:bg-navy-500"
              disabled={editing}
            >
              {editing ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Buyers Dialog */}
      <Dialog open={ticketsOpen} onOpenChange={setTicketsOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-border-strong bg-surface-card text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Compradores — {selectedShowName}
            </DialogTitle>
          </DialogHeader>
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
                <p className="text-sm text-text-dim">Cargando entradas...</p>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="rounded-xl bg-overlay-light p-4">
                <Ticket className="h-8 w-8 text-text-ghost" />
              </div>
              <p className="text-sm text-text-dim">
                Aun no hay entradas vendidas para este show.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="border-border-default hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Nombre</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Email</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Precio</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Estado</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Fecha de compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const ticketCfg = TICKET_STATUS_CONFIG[ticket.status] ?? TICKET_STATUS_CONFIG['ACTIVE'];
                  return (
                    <TableRow key={ticket.id} className="border-border-default hover:bg-overlay-subtle">
                      <TableCell className="font-medium text-text-primary">
                        {ticket.user
                          ? `${ticket.user.firstName} ${ticket.user.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-text-dim">{ticket.user?.email || '-'}</TableCell>
                      <TableCell className="font-medium text-text-primary">
                        S/. {Number(ticket.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${ticketCfg.bg} ${ticketCfg.color}`}
                        >
                          {ticketCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-text-dim">
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
