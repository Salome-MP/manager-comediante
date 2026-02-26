'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Check, X, Eye, ImageIcon } from 'lucide-react';

const statusColors: Record<string, string> = {
  OPEN: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  REVIEWING: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  RESOLVED: 'bg-overlay-strong text-text-tertiary border-border-strong',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Abierta', REVIEWING: 'En revision', APPROVED: 'Aprobada', REJECTED: 'Rechazada', RESOLVED: 'Resuelta',
};

export default function DevolucionesPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundOrder, setRefundOrder] = useState(false);
  const [resolving, setResolving] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/returns', { params });
      setReturns(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/returns/${id}`);
      setSelectedReturn(res.data);
      setAdminNotes(res.data.adminNotes || '');
      setRefundOrder(false);
      setDetailOpen(true);
    } catch {
      toast.error('Error al cargar detalle');
    }
  };

  const handleResolve = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedReturn) return;
    setResolving(true);
    try {
      await api.patch(`/returns/${selectedReturn.id}/resolve`, {
        status,
        adminNotes: adminNotes || undefined,
        refundOrder: status === 'APPROVED' ? refundOrder : false,
      });
      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}`);
      setDetailOpen(false);
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al resolver');
    }
    setResolving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Devoluciones</h2>
          <p className="mt-1 text-sm text-text-dim">{total} solicitudes</p>
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === 'ALL' ? '' : v); setLoading(true); }}>
          <SelectTrigger className="w-44 border-border-strong bg-overlay-light text-text-primary">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="OPEN">Abierta</SelectItem>
            <SelectItem value="REVIEWING">En revision</SelectItem>
            <SelectItem value="APPROVED">Aprobada</SelectItem>
            <SelectItem value="REJECTED">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Returns list */}
      {returns.length === 0 ? (
        <div className="rounded-2xl border border-border-default bg-surface-sidebar p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-500/10">
            <RotateCcw className="h-8 w-8 text-navy-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Sin solicitudes</h3>
          <p className="mt-2 text-sm text-text-dim">No hay solicitudes de devolucion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border-default bg-surface-card p-4 transition-all hover:border-overlay-hover cursor-pointer"
              onClick={() => openDetail(r.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-semibold text-navy-600 dark:text-navy-300">
                    {r.order?.orderNumber}
                  </p>
                  <Badge className={`border text-xs ${statusColors[r.status]}`}>
                    {statusLabels[r.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary truncate">{r.reason}</p>
                <p className="text-xs text-text-ghost">
                  {r.user?.firstName} {r.user?.lastName} — {new Date(r.createdAt).toLocaleDateString('es-PE')}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {r.images?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-text-ghost">
                    <ImageIcon className="h-3.5 w-3.5" /> {r.images.length}
                  </span>
                )}
                <Eye className="h-4 w-4 text-text-ghost" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="border-border-strong bg-surface-card text-text-primary max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitud de devolucion</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-navy-400">{selectedReturn.order?.orderNumber}</span>
                <Badge className={`border text-xs ${statusColors[selectedReturn.status]}`}>
                  {statusLabels[selectedReturn.status]}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-text-secondary"><strong>Cliente:</strong> {selectedReturn.user?.firstName} {selectedReturn.user?.lastName}</p>
                <p className="text-text-secondary"><strong>Email:</strong> {selectedReturn.user?.email}</p>
                <p className="text-text-secondary"><strong>Razon:</strong> {selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="text-text-dim">{selectedReturn.description}</p>
                )}
                <p className="text-text-ghost text-xs">
                  Creado: {new Date(selectedReturn.createdAt).toLocaleDateString('es-PE')}
                </p>
              </div>

              {selectedReturn.images?.length > 0 && (
                <div>
                  <Label className="text-xs text-text-dim">Evidencia ({selectedReturn.images.length} fotos)</Label>
                  <div className="mt-1 flex gap-2 overflow-x-auto">
                    {selectedReturn.images.map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`Evidencia ${i + 1}`} className="h-20 w-20 rounded-lg border border-border-default object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Order items */}
              {selectedReturn.order?.items && (
                <div>
                  <Label className="text-xs text-text-dim">Items del pedido</Label>
                  <div className="mt-1 space-y-1">
                    {selectedReturn.order.items.map((item: any) => (
                      <p key={item.id} className="text-sm text-text-secondary">
                        {item.quantity}x {item.artistProduct?.product?.name}
                      </p>
                    ))}
                  </div>
                  <p className="mt-1 font-semibold text-text-primary">Total: S/. {Number(selectedReturn.order.total).toFixed(2)}</p>
                </div>
              )}

              <Separator className="bg-border-default" />

              {/* Resolve form */}
              {(selectedReturn.status === 'OPEN' || selectedReturn.status === 'REVIEWING') && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-dim">Notas del admin</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Notas para el cliente..."
                      rows={3}
                      className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundOrder}
                      onChange={(e) => setRefundOrder(e.target.checked)}
                      className="rounded border-border-strong"
                    />
                    Reembolsar orden (marcar como REFUNDED y cancelar comisiones)
                  </label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleResolve('APPROVED')}
                      disabled={resolving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Check className="mr-2 h-4 w-4" /> Aprobar
                    </Button>
                    <Button
                      onClick={() => handleResolve('REJECTED')}
                      disabled={resolving}
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <X className="mr-2 h-4 w-4" /> Rechazar
                    </Button>
                  </div>
                </div>
              )}

              {/* Already resolved */}
              {selectedReturn.resolvedAt && (
                <div className="rounded-lg bg-overlay-subtle p-3 text-sm">
                  <p className="text-text-dim">
                    Resuelto: {new Date(selectedReturn.resolvedAt).toLocaleDateString('es-PE')}
                  </p>
                  {selectedReturn.adminNotes && (
                    <p className="mt-1 text-text-secondary">Notas: {selectedReturn.adminNotes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
