'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Power, Mic2, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

interface ArtistUser {
  email: string;
  firstName: string;
  lastName: string;
}

interface Artist {
  id: string;
  stageName: string;
  slug: string;
  tagline?: string;
  biography?: string;
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  commissionRate: number;
  createdAt: string;
  user: ArtistUser;
  _count?: {
    artistProducts: number;
    shows: number;
    followers: number;
  };
}

interface CreateArtistForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  stageName: string;
  tagline: string;
  biography: string;
}

interface EditArtistForm {
  firstName: string;
  lastName: string;
  stageName: string;
  tagline: string;
  biography: string;
}

const emptyCreateForm: CreateArtistForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  stageName: '',
  tagline: '',
  biography: '',
};

const emptyEditForm: EditArtistForm = {
  firstName: '',
  lastName: '',
  stageName: '',
  tagline: '',
  biography: '',
};

// Clases compartidas para inputs en modals oscuros
const inputClass =
  'bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20';
const labelClass = 'text-text-secondary text-sm font-medium';

export default function AdminArtistasPage() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateArtistForm>(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditArtistForm>(emptyEditForm);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [updating, setUpdating] = useState(false);

  // Toggling active state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filter & search
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Approve/Reject
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/artists', { params: { limit: 100 } });
      setArtists(res.data.data);
    } catch {
      toast.error('Error al cargar los artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  // --- Create ---
  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName || !createForm.stageName) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      setCreating(true);
      const body: Record<string, unknown> = {
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        stageName: createForm.stageName,
      };
      if (createForm.tagline.trim()) body.tagline = createForm.tagline.trim();
      if (createForm.biography.trim()) body.biography = createForm.biography.trim();

      await api.post('/artists', body);
      toast.success('Artista creado exitosamente');
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      fetchArtists();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al crear el artista');
    } finally {
      setCreating(false);
    }
  };

  // --- Edit ---
  const openEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setEditForm({
      firstName: artist.user.firstName,
      lastName: artist.user.lastName,
      stageName: artist.stageName,
      tagline: artist.tagline || '',
      biography: artist.biography || '',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingArtist) return;
    if (!editForm.stageName) {
      toast.error('El nombre artístico es obligatorio');
      return;
    }

    try {
      setUpdating(true);
      const body: Record<string, unknown> = {
        stageName: editForm.stageName,
      };
      if (editForm.tagline.trim()) body.tagline = editForm.tagline.trim();
      else body.tagline = null;
      if (editForm.biography.trim()) body.biography = editForm.biography.trim();
      else body.biography = null;
      await api.patch(`/artists/${editingArtist.id}`, body);
      toast.success('Artista actualizado exitosamente');
      setEditOpen(false);
      setEditingArtist(null);
      setEditForm(emptyEditForm);
      fetchArtists();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al actualizar el artista');
    } finally {
      setUpdating(false);
    }
  };

  // --- Toggle active ---
  const handleToggleActive = async (artist: Artist) => {
    try {
      setTogglingId(artist.id);
      await api.patch(`/artists/${artist.id}/toggle-active`);
      toast.success(
        artist.isActive
          ? `${artist.stageName} desactivado`
          : `${artist.stageName} activado`,
      );
      fetchArtists();
    } catch {
      toast.error('Error al cambiar el estado del artista');
    } finally {
      setTogglingId(null);
    }
  };

  const handleApprove = async (artist: Artist) => {
    try {
      setApprovingId(artist.id);
      await api.patch(`/artists/${artist.id}/approve`);
      toast.success(`${artist.stageName} aprobado exitosamente`);
      fetchArtists();
    } catch {
      toast.error('Error al aprobar el artista');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (artist: Artist) => {
    if (!confirm(`¿Estás seguro de rechazar a ${artist.stageName}? Se eliminará su perfil de artista.`)) return;
    try {
      setApprovingId(artist.id);
      await api.patch(`/artists/${artist.id}/reject`);
      toast.success(`${artist.stageName} rechazado`);
      fetchArtists();
    } catch {
      toast.error('Error al rechazar el artista');
    } finally {
      setApprovingId(null);
    }
  };

  const filteredArtists = artists.filter((a) => {
    const matchFilter = filter === 'pending' ? !a.isApproved : true;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q
      || a.stageName.toLowerCase().includes(q)
      || a.user.email.toLowerCase().includes(q)
      || `${a.user.firstName} ${a.user.lastName}`.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const pendingCount = artists.filter((a) => !a.isApproved).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Artistas</h2>
          <p className="mt-0.5 text-sm text-text-dim">
            Gestiona los artistas registrados en la plataforma
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-navy-600/20 text-navy-600 dark:text-navy-300'
                  : 'bg-overlay-light text-text-dim hover:text-text-secondary'
              }`}
            >
              Todos ({artists.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-overlay-light text-text-dim hover:text-text-secondary'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-600 hover:bg-navy-500 text-white shadow-lg shadow-navy-900/30">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Artista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-surface-card border-border-strong text-text-primary">
            <DialogHeader>
              <DialogTitle className="text-text-primary">Crear nuevo artista</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email" className={labelClass}>Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className={inputClass}
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password" className={labelClass}>Contrasena *</Label>
                  <Input
                    id="create-password"
                    type="password"
                    placeholder="Min. 6 caracteres"
                    className={inputClass}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-firstName" className={labelClass}>Nombre *</Label>
                  <Input
                    id="create-firstName"
                    placeholder="Nombre"
                    className={inputClass}
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-lastName" className={labelClass}>Apellido *</Label>
                  <Input
                    id="create-lastName"
                    placeholder="Apellido"
                    className={inputClass}
                    value={createForm.lastName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-stageName" className={labelClass}>Nombre artistico *</Label>
                <Input
                  id="create-stageName"
                  placeholder="Nombre artistico"
                  className={inputClass}
                  value={createForm.stageName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, stageName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-tagline" className={labelClass}>Tagline</Label>
                <Input
                  id="create-tagline"
                  placeholder="Frase corta descriptiva"
                  className={inputClass}
                  value={createForm.tagline}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, tagline: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-biography" className={labelClass}>Biografia</Label>
                <Textarea
                  id="create-biography"
                  placeholder="Biografia del artista..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={createForm.biography}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, biography: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-navy-600 hover:bg-navy-500 text-white"
              >
                {creating ? 'Creando...' : 'Crear Artista'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
        <Input
          placeholder="Buscar por nombre artístico, email o nombre real..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 pl-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count when filtering */}
      {(searchQuery || filter === 'pending') && !loading && (
        <p className="text-xs text-text-dim">
          {filteredArtists.length} resultado{filteredArtists.length !== 1 ? 's' : ''}
          {searchQuery && <> para &quot;{searchQuery}&quot;</>}
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-overlay-light" />
          ))}
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border-default bg-surface-card py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-overlay-light">
            <Mic2 className="h-6 w-6 text-text-dim" />
          </div>
          <p className="text-sm text-text-dim">
            {artists.length === 0 ? 'No hay artistas registrados' : 'No se encontraron artistas'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card">
          <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-border-default hover:bg-transparent">
                <TableHead className="text-text-dim font-medium">Nombre artistico</TableHead>
                <TableHead className="text-text-dim font-medium">Email</TableHead>
                <TableHead className="text-text-dim font-medium">Estado</TableHead>
                <TableHead className="text-right text-text-dim font-medium">Seguidores</TableHead>
                <TableHead className="text-text-dim font-medium">Fecha de creacion</TableHead>
                <TableHead className="text-right text-text-dim font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtists.map((artist) => (
                <TableRow
                  key={artist.id}
                  className="border-border-subtle hover:bg-surface-card transition-colors"
                >
                  <TableCell className="font-semibold text-text-primary">
                    {artist.stageName}
                  </TableCell>
                  <TableCell className="text-text-dim">{artist.user.email}</TableCell>
                  <TableCell>
                    {!artist.isApproved ? (
                      <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        Pendiente
                      </span>
                    ) : artist.isActive ? (
                      <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-inset ring-border-medium">
                        Inactivo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-text-secondary">
                    {artist._count?.followers ?? 0}
                  </TableCell>
                  <TableCell className="text-text-dim text-sm">
                    {formatDate(artist.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!artist.isApproved ? (
                        isSuperAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                              disabled={approvingId === artist.id}
                              onClick={() => handleApprove(artist)}
                              title="Aprobar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                              disabled={approvingId === artist.id}
                              onClick={() => handleReject(artist)}
                              title="Rechazar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )
                      ) : (
                        isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 transition-colors ${
                              artist.isActive
                                ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                                : 'text-text-ghost hover:bg-overlay-light hover:text-text-dim'
                            }`}
                            disabled={togglingId === artist.id}
                            onClick={() => handleToggleActive(artist)}
                            title={artist.isActive ? 'Desactivar' : 'Activar'}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-dim hover:bg-overlay-light hover:text-text-primary transition-colors"
                        onClick={() => openEdit(artist)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) {
          setEditingArtist(null);
          setEditForm(emptyEditForm);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-surface-card border-border-strong text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Editar artista</DialogTitle>
          </DialogHeader>
          {editingArtist && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className={labelClass}>Nombre</Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Nombre"
                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                    value={editForm.firstName}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className={labelClass}>Apellido</Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Apellido"
                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                    value={editForm.lastName}
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stageName" className={labelClass}>Nombre artistico *</Label>
                <Input
                  id="edit-stageName"
                  placeholder="Nombre artistico"
                  className={inputClass}
                  value={editForm.stageName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, stageName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tagline" className={labelClass}>Tagline</Label>
                <Input
                  id="edit-tagline"
                  placeholder="Frase corta descriptiva"
                  className={inputClass}
                  value={editForm.tagline}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tagline: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-biography" className={labelClass}>Biografia</Label>
                <Textarea
                  id="edit-biography"
                  placeholder="Biografia del artista..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={editForm.biography}
                  onChange={(e) =>
                    setEditForm({ ...editForm, biography: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleEdit}
                disabled={updating}
                className="w-full bg-navy-600 hover:bg-navy-500 text-white"
              >
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
