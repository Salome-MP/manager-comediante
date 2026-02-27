'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Tag, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    expiresAt: '',
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxUses: '', expiresAt: '' });
    setEditing(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minPurchase: coupon.minPurchase ? String(coupon.minPurchase) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload: any = {
      code: form.code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : undefined,
      maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
      expiresAt: form.expiresAt || undefined,
    };

    try {
      if (editing) {
        await api.patch(`/coupons/${editing.id}`, payload);
        toast.success('Cupon actualizado');
      } else {
        await api.post('/coupons', payload);
        toast.success('Cupon creado');
      }
      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch {
      toast.error('Error al guardar el cupon');
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await api.patch(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? 'Cupon desactivado' : 'Cupon activado');
      fetchCoupons();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const inputClass = "border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Cupones de Descuento</h2>
          <p className="mt-1 text-sm text-text-dim">{coupons.length} cupones</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 bg-navy-600 hover:bg-navy-500 text-white font-semibold">
          <Plus className="h-4 w-4" />
          Crear cupon
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-border-default hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Codigo</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Descuento</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Min. compra</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Usos</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Expira</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Estado</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id} className="border-border-default hover:bg-overlay-subtle">
                <TableCell className="font-mono font-bold text-text-primary">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-navy-400" />
                    {coupon.code}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-teal-400">
                  {coupon.discountType === 'percentage'
                    ? `${Number(coupon.discountValue)}%`
                    : `S/. ${Number(coupon.discountValue).toFixed(2)}`}
                </TableCell>
                <TableCell className="text-text-dim">
                  {coupon.minPurchase ? `S/. ${Number(coupon.minPurchase).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-text-dim">
                  {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                </TableCell>
                <TableCell className="text-text-dim text-sm">
                  {coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin expiracion'}
                </TableCell>
                <TableCell>
                  <Badge className={coupon.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }>
                    {coupon.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-text-dim hover:text-navy-400"
                      onClick={() => handleOpenEdit(coupon)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs ${coupon.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                      onClick={() => handleToggle(coupon)}
                    >
                      {coupon.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border-strong bg-surface-card text-text-primary sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              {editing ? 'Editar cupon' : 'Crear cupon'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Codigo</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ej: DESCUENTO20"
                className={inputClass}
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Descripcion</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Opcional"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Tipo</label>
                <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto fijo (S/.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Valor</label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === 'percentage' ? 'Ej: 20' : 'Ej: 15.00'}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Compra minima (S/.)</label>
                <Input
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Usos maximos</label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Sin limite"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Fecha expiracion</label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.code || !form.discountValue}
                className="bg-navy-600 hover:bg-navy-500 text-white font-semibold"
              >
                {editing ? 'Guardar cambios' : 'Crear cupon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
