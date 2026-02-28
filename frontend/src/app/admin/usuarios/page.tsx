'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type Role = 'SUPER_ADMIN' | 'STAFF' | 'ARTIST' | 'USER';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

// ── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; ring: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
  },
  STAFF: {
    label: 'Staff',
    color: 'text-navy-400',
    bg: 'bg-navy-500/10',
    ring: 'ring-navy-500/20',
  },
  ARTIST: {
    label: 'Artista',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
  USER: {
    label: 'Usuario',
    color: 'text-text-muted',
    bg: 'bg-muted',
    ring: 'ring-border-medium',
  },
};

const LIMIT = 20;

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      router.replace('/admin');
    }
  }, [currentUser, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // ── Fetch users ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: LIMIT };
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter;
      const { data } = await api.get<UsersResponse>('/users', { params });
      setUsers(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  // ── Toggle active ───────────────────────────────────────────────────────

  async function handleToggleActive(userId: string) {
    setTogglingId(userId);
    try {
      await api.patch(`/users/${userId}/toggle-active`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isActive: !u.isActive } : u,
        ),
      );
      toast.success('Estado del usuario actualizado');
    } catch {
      toast.error('Error al actualizar el estado del usuario');
    } finally {
      setTogglingId(null);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

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

  const hasFilters = searchQuery || roleFilter || statusFilter;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Usuarios
          </h2>
          <p className="mt-0.5 text-sm text-text-dim">
            Gestiona los usuarios registrados en la plataforma
          </p>
        </div>
        <span className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-sm font-medium text-text-dim">
          {total} usuario{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim pointer-events-none" />
        <Input
          placeholder="Buscar por nombre o email..."
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
          <label className="text-xs font-medium text-text-dim">Rol</label>
          <Select
            value={roleFilter || 'all'}
            onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-36 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border-strong text-text-secondary">
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(ROLE_CONFIG) as Role[]).map((r) => (
                <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-dim">Estado</label>
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-32 border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-medium focus:ring-navy-500/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border-strong text-text-secondary">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput(''); setSearchQuery('');
              setRoleFilter(''); setStatusFilter(''); setPage(1);
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
              <TableHead className="text-text-dim font-medium">Nombre</TableHead>
              <TableHead className="text-text-dim font-medium">Email</TableHead>
              <TableHead className="text-text-dim font-medium">Rol</TableHead>
              <TableHead className="text-text-dim font-medium">Estado</TableHead>
              <TableHead className="text-text-dim font-medium">Fecha de registro</TableHead>
              <TableHead className="text-right text-text-dim font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
                    <span className="text-sm text-text-dim">Cargando usuarios...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-overlay-light">
                      <Users className="h-6 w-6 text-text-ghost" />
                    </div>
                    <span className="text-sm text-text-dim">No hay usuarios registrados</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const roleCfg = ROLE_CONFIG[user.role];
                const isToggling = togglingId === user.id;

                return (
                  <TableRow
                    key={user.id}
                    className="border-border-subtle hover:bg-surface-card transition-colors"
                  >
                    <TableCell>
                      <span className="font-medium text-text-primary">
                        {user.firstName} {user.lastName}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-dim text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${roleCfg.bg} ${roleCfg.color} ${roleCfg.ring}`}
                      >
                        {roleCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                          Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-text-dim">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role === 'SUPER_ADMIN' ? (
                        <span className="text-xs text-text-ghost">—</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user.id)}
                          disabled={isToggling}
                          className={
                            user.isActive
                              ? 'border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                              : 'border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                          }
                        >
                          {isToggling ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : user.isActive ? (
                            <UserX className="mr-1 h-4 w-4" />
                          ) : (
                            <UserCheck className="mr-1 h-4 w-4" />
                          )}
                          {user.isActive ? 'Desactivar' : 'Activar'}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border-default px-4 py-3">
            <p className="text-xs sm:text-sm text-text-dim">
              Mostrando {(page - 1) * LIMIT + 1} a{' '}
              {Math.min(page * LIMIT, total)} de {total} usuarios
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
