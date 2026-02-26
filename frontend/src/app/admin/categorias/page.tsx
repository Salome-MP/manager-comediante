'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Power, Trash2, Tag, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface VariantTemplate {
  name: string;
  options: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string | null;
  variantTemplates?: VariantTemplate[];
  children?: Category[];
  _count?: { products: number };
  createdAt: string;
}

interface CategoryFormData {
  name: string;
  sortOrder: number;
  parentId: string;
  variantTemplates: { name: string; options: string }[];
}

const emptyForm: CategoryFormData = { name: '', sortOrder: 0, parentId: '', variantTemplates: [] };

const inputClass =
  'bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20';
const labelClass = 'text-text-secondary text-sm font-medium';

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {
      toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ---- Create ----
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/categories', {
        name: formData.name.trim(),
        sortOrder: formData.sortOrder,
        parentId: formData.parentId || undefined,
        variantTemplates: formData.variantTemplates
          .filter((v) => v.name.trim() && v.options.trim())
          .map((v) => ({
            name: v.name.trim(),
            options: v.options.split(',').map((o) => o.trim()).filter(Boolean),
          })),
      });
      toast.success('Categoría creada exitosamente');
      setCreateOpen(false);
      setFormData(emptyForm);
      await fetchCategories();
    } catch {
      toast.error('Error al crear la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Edit ----
  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      sortOrder: category.sortOrder,
      parentId: category.parentId || '',
      variantTemplates: (category.variantTemplates ?? []).map((v) => ({
        name: v.name,
        options: v.options.join(', '),
      })),
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingId || !formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/categories/${editingId}`, {
        name: formData.name.trim(),
        sortOrder: formData.sortOrder,
        parentId: formData.parentId || null,
        variantTemplates: formData.variantTemplates
          .filter((v) => v.name.trim() && v.options.trim())
          .map((v) => ({
            name: v.name.trim(),
            options: v.options.split(',').map((o) => o.trim()).filter(Boolean),
          })),
      });
      toast.success('Categoría actualizada exitosamente');
      setEditOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchCategories();
    } catch {
      toast.error('Error al actualizar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Toggle Active ----
  const handleToggleActive = async (category: Category) => {
    try {
      await api.patch(`/categories/${category.id}/toggle-active`);
      toast.success(
        category.isActive ? 'Categoría desactivada' : 'Categoría activada',
      );
      await fetchCategories();
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  // ---- Delete ----
  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la categoría "${category.name}"?`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Categoría eliminada exitosamente');
      await fetchCategories();
    } catch {
      toast.error('Error al eliminar la categoría');
    }
  };

  // ---- Helpers ----
  const resetAndCloseCreate = () => {
    setCreateOpen(false);
    setFormData(emptyForm);
  };

  const resetAndCloseEdit = () => {
    setEditOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const renderStatusBadge = (isActive: boolean) =>
    isActive ? (
      <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
        Activa
      </span>
    ) : (
      <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-inset ring-border-medium">
        Inactiva
      </span>
    );

  const renderActions = (category: Category) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-text-dim hover:bg-overlay-light hover:text-text-primary transition-colors"
        title="Editar"
        onClick={() => openEdit(category)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 transition-colors ${
          category.isActive
            ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
            : 'text-text-ghost hover:bg-overlay-light hover:text-text-dim'
        }`}
        title={category.isActive ? 'Desactivar' : 'Activar'}
        onClick={() => handleToggleActive(category)}
      >
        <Power className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        title="Eliminar"
        onClick={() => handleDelete(category)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Build a flat list of parent categories for the select in the form
  // (only parent categories, i.e. those without parentId)
  const parentOptions = categories;

  const renderVariantTemplates = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className={labelClass}>Plantillas de variantes</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              variantTemplates: [...prev.variantTemplates, { name: '', options: '' }],
            }))
          }
        >
          <Plus className="mr-1 h-3 w-3" /> Agregar variante
        </Button>
      </div>
      {formData.variantTemplates.map((v, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <Input
            placeholder="Nombre (ej: Talla)"
            value={v.name}
            onChange={(e) =>
              setFormData((prev) => {
                const variantTemplates = [...prev.variantTemplates];
                variantTemplates[idx] = { ...variantTemplates[idx], name: e.target.value };
                return { ...prev, variantTemplates };
              })
            }
            className={`${inputClass} flex-1`}
          />
          <Input
            placeholder="Opciones (ej: S, M, L, XL)"
            value={v.options}
            onChange={(e) =>
              setFormData((prev) => {
                const variantTemplates = [...prev.variantTemplates];
                variantTemplates[idx] = { ...variantTemplates[idx], options: e.target.value };
                return { ...prev, variantTemplates };
              })
            }
            className={`${inputClass} flex-[2]`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                variantTemplates: prev.variantTemplates.filter((_, i) => i !== idx),
              }))
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {formData.variantTemplates.length === 0 && (
        <p className="text-xs text-text-dim">Sin plantillas de variantes. Los productos de esta categoria no tendrán variantes por defecto.</p>
      )}
    </div>
  );

  const renderParentSelect = () => (
    <div className="space-y-2">
      <Label className={labelClass}>Categoria padre (opcional)</Label>
      <Select
        value={formData.parentId || 'none'}
        onValueChange={(val) =>
          setFormData((prev) => ({ ...prev, parentId: val === 'none' ? '' : val }))
        }
      >
        <SelectTrigger className={`w-full ${inputClass}`}>
          <SelectValue placeholder="Sin categoria padre" />
        </SelectTrigger>
        <SelectContent className="bg-surface-card border-border-strong text-text-primary">
          <SelectItem value="none" className="focus:bg-overlay-light focus:text-text-primary">
            Sin categoria padre (raiz)
          </SelectItem>
          {parentOptions.map((cat) => (
            <SelectItem
              key={cat.id}
              value={cat.id}
              className="focus:bg-overlay-light focus:text-text-primary"
            >
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Categorias
          </h2>
          <p className="mt-0.5 text-sm text-text-dim">
            Gestiona las categorias y subcategorias de productos
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-navy-600 hover:bg-navy-500 text-white shadow-lg shadow-navy-900/30"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoria
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-overlay-light" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border-default bg-surface-card py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-overlay-light">
            <Tag className="h-6 w-6 text-text-dim" />
          </div>
          <p className="text-sm text-text-dim">No hay categorias registradas</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border-default hover:bg-transparent">
                <TableHead className="text-text-dim font-medium">Nombre</TableHead>
                <TableHead className="text-text-dim font-medium">Slug</TableHead>
                <TableHead className="text-text-dim font-medium">Productos</TableHead>
                <TableHead className="text-text-dim font-medium">Variantes</TableHead>
                <TableHead className="text-text-dim font-medium">Orden</TableHead>
                <TableHead className="text-text-dim font-medium">Estado</TableHead>
                <TableHead className="text-right text-text-dim font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((parent) => (
                <React.Fragment key={parent.id}>
                  {/* Parent row */}
                  <TableRow
                    className="border-border-subtle hover:bg-surface-card transition-colors bg-surface-card"
                  >
                    <TableCell className="font-bold text-text-primary">
                      {parent.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-dim">
                      {parent.slug}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {parent._count?.products ?? 0}
                    </TableCell>
                    <TableCell className="text-text-dim text-xs">
                      {(parent.variantTemplates as VariantTemplate[] | undefined)?.length
                        ? (parent.variantTemplates as VariantTemplate[]).map((v) => v.name).join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-text-secondary">{parent.sortOrder}</TableCell>
                    <TableCell>{renderStatusBadge(parent.isActive)}</TableCell>
                    <TableCell className="text-right">{renderActions(parent)}</TableCell>
                  </TableRow>
                  {/* Children rows */}
                  {parent.children?.map((child) => (
                    <TableRow
                      key={child.id}
                      className="border-border-subtle hover:bg-surface-card transition-colors"
                    >
                      <TableCell className="font-semibold text-text-primary pl-8">
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5 text-text-ghost" />
                          {child.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-text-dim">
                        {child.slug}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {child._count?.products ?? 0}
                      </TableCell>
                      <TableCell className="text-text-dim text-xs">
                        {(child.variantTemplates as VariantTemplate[] | undefined)?.length
                          ? (child.variantTemplates as VariantTemplate[]).map((v) => v.name).join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-text-secondary">{child.sortOrder}</TableCell>
                      <TableCell>{renderStatusBadge(child.isActive)}</TableCell>
                      <TableCell className="text-right">{renderActions(child)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && resetAndCloseCreate()}>
        <DialogContent className="bg-surface-card border-border-strong text-text-primary max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Nueva Categoria</DialogTitle>
            <DialogDescription className="text-text-dim">
              Crea una nueva categoria o subcategoria de productos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-name" className={labelClass}>Nombre</Label>
              <Input
                id="create-name"
                placeholder="Ej: Camisetas"
                className={inputClass}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            {renderParentSelect()}
            {renderVariantTemplates()}
            <div className="space-y-2">
              <Label htmlFor="create-sortOrder" className={labelClass}>Orden</Label>
              <Input
                id="create-sortOrder"
                type="number"
                min={0}
                className={inputClass}
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={resetAndCloseCreate}
              className="border-border-strong text-text-secondary hover:bg-overlay-light hover:text-text-primary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-navy-600 hover:bg-navy-500 text-white"
            >
              {submitting ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && resetAndCloseEdit()}>
        <DialogContent className="bg-surface-card border-border-strong text-text-primary max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Editar Categoria</DialogTitle>
            <DialogDescription className="text-text-dim">
              Modifica los datos de la categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className={labelClass}>Nombre</Label>
              <Input
                id="edit-name"
                placeholder="Ej: Camisetas"
                className={inputClass}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            {renderParentSelect()}
            {renderVariantTemplates()}
            <div className="space-y-2">
              <Label htmlFor="edit-sortOrder" className={labelClass}>Orden</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                min={0}
                className={inputClass}
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={resetAndCloseEdit}
              className="border-border-strong text-text-secondary hover:bg-overlay-light hover:text-text-primary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting}
              className="bg-navy-600 hover:bg-navy-500 text-white"
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
