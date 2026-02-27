'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Check, CheckCircle, Pencil, PenTool, Video, Phone, Gift, Loader2,
  Upload, Play, X, Clock, Calendar, Link2, Trash2, ExternalLink,
} from 'lucide-react';
import type { ArtistCustomization } from '@/types';

const CUSTOMIZATION_TYPES = [
  { value: 'AUTOGRAPH', label: 'Autografo', icon: PenTool },
  { value: 'HANDWRITTEN_LETTER', label: 'Carta manuscrita', icon: Pencil },
  { value: 'VIDEO_GREETING', label: 'Video saludo', icon: Video },
  { value: 'VIDEO_CALL', label: 'Videollamada', icon: Phone },
  { value: 'PRODUCT_PERSONALIZATION', label: 'Personalizacion de producto', icon: Gift },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
];

const custStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

interface PendingCustomization {
  id: string;
  type: string;
  price: number;
  fulfilled: boolean;
  status: string;
  attachmentUrl?: string;
  notes?: string;
  fulfilledAt?: string;
  scheduledDate?: string;
  meetingLink?: string;
  orderItem: {
    order: { id: string; orderNumber: string; createdAt: string; user: { id: string; firstName: string; lastName: string; email: string } };
    artistProduct: { product: { name: string; images?: string[] } };
  };
}

export default function DashboardPersonalizacionesPage() {
  const { user } = useAuthStore();
  const [customizations, setCustomizations] = useState<ArtistCustomization[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingCustomization[]>([]);
  const [historyItems, setHistoryItems] = useState<PendingCustomization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Video call config state
  const [vcMeetingLink, setVcMeetingLink] = useState('');
  const [vcDuration, setVcDuration] = useState('30');
  const [vcMaxPerWeek, setVcMaxPerWeek] = useState('5');
  const [vcSlots, setVcSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [savingVc, setSavingVc] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.artistId) return;
    try {
      const [cusRes, pendRes, histRes] = await Promise.all([
        api.get(`/artists/${user.artistId}/customizations`),
        api.get(`/artists/${user.artistId}/customizations/pending`),
        api.get(`/artists/${user.artistId}/customizations/history`),
      ]);
      setCustomizations(cusRes.data);
      setPendingItems(pendRes.data);
      setHistoryItems(histRes.data);

      // Load video call config
      const vcConfig = (cusRes.data as ArtistCustomization[]).find((c) => c.type === 'VIDEO_CALL');
      if (vcConfig) {
        setVcMeetingLink(vcConfig.meetingLink || '');
        setVcDuration(String(vcConfig.callDuration || 30));
        setVcMaxPerWeek(String(vcConfig.maxPerWeek || 5));
        setVcSlots((vcConfig.availabilitySlots as any) || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user?.artistId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = async (c: ArtistCustomization) => {
    if (!editForm.price || !user?.artistId) {
      toast.error('Ingresa un precio');
      return;
    }
    setEditSaving(true);
    try {
      await api.post(`/artists/${user.artistId}/customizations`, {
        type: c.type,
        price: parseFloat(editForm.price),
        description: editForm.description || undefined,
        isActive: c.isActive,
      });
      toast.success('Personalizacion actualizada');
      setEditingId(null);
      fetchData();
    } catch {
      toast.error('Error al actualizar');
    }
    setEditSaving(false);
  };

  const handleToggleActive = async (c: ArtistCustomization) => {
    if (!user?.artistId) return;
    setTogglingId(c.id);
    try {
      await api.post(`/artists/${user.artistId}/customizations`, {
        type: c.type,
        price: Number(c.price),
        description: c.description || undefined,
        isActive: !c.isActive,
      });
      toast.success(c.isActive ? 'Desactivado' : 'Activado');
      fetchData();
    } catch {
      toast.error('Error al cambiar estado');
    }
    setTogglingId(null);
  };

  const handleStart = async (customizationId: string) => {
    if (!user?.artistId) return;
    try {
      await api.patch(`/artists/${user.artistId}/customizations/${customizationId}/start`);
      toast.success('Marcado como en progreso');
      fetchData();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleFulfill = async (customizationId: string, body: any = {}) => {
    if (!user?.artistId) return;
    try {
      await api.patch(`/artists/${user.artistId}/customizations/${customizationId}/fulfill`, body);
      toast.success('Marcado como cumplido');
      fetchData();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleUploadAndFulfill = async (customizationId: string, file: File, notes?: string) => {
    if (!user?.artistId) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post(`/upload/artists/${user.artistId}/customization`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const attachmentUrl = uploadRes.data.url;

      await handleFulfill(customizationId, { attachmentUrl, notes });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir archivo. Intenta de nuevo.');
    }
  };

  const handleSaveVcConfig = async () => {
    if (!user?.artistId) return;
    setSavingVc(true);
    try {
      await api.patch(`/artists/${user.artistId}/video-call-config`, {
        meetingLink: vcMeetingLink || undefined,
        callDuration: parseInt(vcDuration),
        maxPerWeek: parseInt(vcMaxPerWeek),
        availabilitySlots: vcSlots.map(s => ({ ...s, dayOfWeek: Number(s.dayOfWeek) })),
      });
      toast.success('Configuracion guardada');
    } catch {
      toast.error('Error al guardar configuracion');
    }
    setSavingVc(false);
  };

  const getTypeLabel = (type: string) =>
    CUSTOMIZATION_TYPES.find((t) => t.value === type)?.label || type;

  const getTypeIcon = (type: string) => {
    const ct = CUSTOMIZATION_TYPES.find((t) => t.value === type);
    return ct ? ct.icon : Gift;
  };

  const hasVideoCall = customizations.some((c) => c.type === 'VIDEO_CALL' && c.isActive);

  const inputClass = "bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus-visible:ring-navy-500/20";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-40 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-overlay-light" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Personalizaciones</h2>
          <p className="mt-1 text-sm text-text-dim">Configura tus servicios y cumple pedidos</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="border border-border-default bg-surface-card">
          <TabsTrigger
            value="pending"
            className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:data-[state=active]:text-navy-300"
          >
            Pendientes ({pendingItems.length})
            {pendingItems.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                {pendingItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:data-[state=active]:text-navy-300"
          >
            Mis Servicios ({customizations.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:data-[state=active]:text-navy-300"
          >
            Historial ({historyItems.length})
          </TabsTrigger>
          {hasVideoCall && (
            <TabsTrigger
              value="videocall"
              className="text-text-dim data-[state=active]:bg-navy-600/20 data-[state=active]:text-navy-600 dark:data-[state=active]:text-navy-300"
            >
              <Phone className="mr-1.5 h-3.5 w-3.5" /> Config Videollamada
            </TabsTrigger>
          )}
        </TabsList>

        {/* Pending tab — type-specific forms */}
        <TabsContent value="pending" className="mt-4">
          {pendingItems.length === 0 ? (
            <div className="rounded-2xl border border-border-default bg-surface-card p-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Todo al dia</h3>
              <p className="mt-2 text-sm text-text-dim">No tienes personalizaciones pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <PendingItemCard
                  key={item.id}
                  item={item}
                  onStart={handleStart}
                  onFulfill={handleFulfill}
                  onUploadAndFulfill={handleUploadAndFulfill}
                  getTypeLabel={getTypeLabel}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Services tab */}
        <TabsContent value="services" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customizations.map((c) => {
                const Icon = getTypeIcon(c.type);
                const isEditing = editingId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-surface-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--shadow-color)] ${
                      c.isActive ? 'border-border-default hover:border-border-strong' : 'border-border-default/50 opacity-70'
                    }`}
                  >
                    <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-navy-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c.isActive ? 'bg-navy-500/10' : 'bg-overlay-light'}`}>
                        <Icon className={`h-5 w-5 ${c.isActive ? 'text-navy-400' : 'text-text-ghost'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-text-primary">{getTypeLabel(c.type)}</h4>
                          {!isEditing && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-text-ghost hover:text-text-primary"
                              onClick={() => { setEditingId(c.id); setEditForm({ price: String(Number(c.price)), description: c.description || '' }); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-medium text-text-ghost">Precio (S/.)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                                className="h-8 bg-overlay-light border-border-strong text-text-primary text-sm focus:border-navy-500 focus-visible:ring-navy-500/20"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-medium text-text-ghost">Descripcion</Label>
                              <Textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                                className="bg-overlay-light border-border-strong text-text-primary text-sm placeholder:text-text-ghost focus:border-navy-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={editSaving}
                                onClick={() => handleEdit(c)}
                                className="bg-navy-600 text-white hover:bg-navy-500 text-xs"
                              >
                                {editSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                className="text-text-dim text-xs"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {c.description && (
                              <p className="mt-0.5 text-sm text-text-dim line-clamp-2">{c.description}</p>
                            )}
                            <p className="mt-2 text-xl font-bold text-text-primary">S/. {Number(c.price).toFixed(2)}</p>
                          </>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                            c.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-overlay-light text-text-ghost'
                          }`}>
                            {c.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={togglingId === c.id}
                            onClick={() => handleToggleActive(c)}
                            className={`h-7 text-xs ${c.isActive ? 'text-text-dim hover:text-red-400' : 'text-navy-400 hover:text-navy-300'}`}
                          >
                            {togglingId === c.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                            {c.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="mt-4">
          {historyItems.length === 0 ? (
            <div className="rounded-2xl border border-border-default bg-surface-card p-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-500/10">
                <Clock className="h-8 w-8 text-navy-400" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Sin historial</h3>
              <p className="mt-2 text-sm text-text-dim">Aun no has completado personalizaciones.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <div key={item.id} className="rounded-xl border border-border-default bg-surface-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                          <TypeIcon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{getTypeLabel(item.type)}</p>
                          <p className="text-xs text-text-dim">
                            {item.orderItem.artistProduct.product.name} — {item.orderItem.order.orderNumber}
                          </p>
                          <p className="text-xs text-text-ghost">
                            Cliente: {item.orderItem.order.user.firstName} {item.orderItem.order.user.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="border bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">
                          <CheckCircle className="mr-0.5 h-2.5 w-2.5" /> Completado
                        </Badge>
                        {item.fulfilledAt && (
                          <p className="mt-1 text-[10px] text-text-ghost">
                            {new Date(item.fulfilledAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {(item.notes || item.attachmentUrl) && (
                      <div className="mt-2 ml-12 space-y-1">
                        {item.notes && (
                          <p className="text-xs text-text-dim italic">"{item.notes}"</p>
                        )}
                        {item.attachmentUrl && (
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-navy-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Ver archivo enviado
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Video call config tab */}
        {hasVideoCall && (
          <TabsContent value="videocall" className="mt-4">
            <div className="rounded-2xl border border-border-default bg-surface-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-navy-400" /> Configuracion de videollamada
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-dim">Link de Meet/Zoom</Label>
                    <Input
                      value={vcMeetingLink}
                      onChange={(e) => setVcMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxx-xxx"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-dim">Duracion (minutos)</Label>
                    <Select value={vcDuration} onValueChange={setVcDuration}>
                      <SelectTrigger className="border-border-strong bg-overlay-light text-text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
                        {[15, 30, 45, 60].map((d) => (
                          <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-dim">Max por semana</Label>
                    <Input
                      type="number"
                      value={vcMaxPerWeek}
                      onChange={(e) => setVcMaxPerWeek(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-text-dim">Horarios disponibles</Label>
                  {vcSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={String(slot.dayOfWeek)}
                        onValueChange={(v) => {
                          const updated = [...vcSlots];
                          updated[idx] = { ...updated[idx], dayOfWeek: parseInt(v) };
                          setVcSlots(updated);
                        }}
                      >
                        <SelectTrigger className="w-32 border-border-strong bg-overlay-light text-text-primary text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border-strong bg-surface-tooltip text-text-secondary">
                          {DAYS_OF_WEEK.map((d) => (
                            <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const updated = [...vcSlots];
                          updated[idx] = { ...updated[idx], startTime: e.target.value };
                          setVcSlots(updated);
                        }}
                        className={`w-28 text-xs ${inputClass}`}
                      />
                      <span className="text-text-ghost text-xs">a</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const updated = [...vcSlots];
                          updated[idx] = { ...updated[idx], endTime: e.target.value };
                          setVcSlots(updated);
                        }}
                        className={`w-28 text-xs ${inputClass}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                        onClick={() => setVcSlots(vcSlots.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVcSlots([...vcSlots, { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' }])}
                    className="border-border-strong text-text-secondary hover:bg-overlay-light text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Agregar horario
                  </Button>
                </div>
              </div>

              <Separator className="my-4 bg-border-default" />
              <Button onClick={handleSaveVcConfig} disabled={savingVc} className="bg-navy-600 text-white hover:bg-navy-500">
                {savingVc ? 'Guardando...' : 'Guardar configuracion'}
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ─── Pending Item Card Component ────────────────────────────────────

function PendingItemCard({
  item,
  onStart,
  onFulfill,
  onUploadAndFulfill,
  getTypeLabel,
  getTypeIcon,
}: {
  item: PendingCustomization;
  onStart: (id: string) => void;
  onFulfill: (id: string, body?: any) => Promise<void>;
  onUploadAndFulfill: (id: string, file: File, notes?: string) => Promise<void>;
  getTypeLabel: (type: string) => string;
  getTypeIcon: (type: string) => any;
}) {
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const Icon = getTypeIcon(item.type);
  const isInProgress = item.status === 'IN_PROGRESS';

  const handleSubmitFulfill = async (body?: any) => {
    setSubmitting(true);
    try {
      await onFulfill(item.id, body);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUpload = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      await onUploadAndFulfill(item.id, file, notes || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-default bg-surface-card p-4 transition-all hover:border-border-strong">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-navy-500/10">
          <Icon className="h-5 w-5 text-navy-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary">{getTypeLabel(item.type)}</span>
            <Badge className={`border text-[10px] ${custStatusColors[item.status] || ''}`}>
              {item.status === 'PENDING' ? 'Pendiente' : item.status === 'IN_PROGRESS' ? 'En progreso' : item.status}
            </Badge>
            <span className="text-xs text-text-ghost">S/. {Number(item.price).toFixed(2)}</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {item.orderItem.artistProduct.product.name}
          </p>
          <p className="text-xs text-text-dim">
            Cliente: {item.orderItem.order.user.firstName} {item.orderItem.order.user.lastName}
          </p>
          <p className="text-xs text-text-ghost">
            Pedido: {item.orderItem.order.orderNumber} — {new Date(item.orderItem.order.createdAt).toLocaleDateString('es-PE')}
          </p>
          {/* Deadline only for physical customizations */}
          {(item.type === 'AUTOGRAPH' || item.type === 'HANDWRITTEN_LETTER' || item.type === 'PRODUCT_PERSONALIZATION') && (() => {
            const orderDate = new Date(item.orderItem.order.createdAt);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            const deadlineDays = 5;
            const remaining = deadlineDays - diffDays;
            return (
              <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                remaining <= 0 ? 'text-red-400' : remaining <= 2 ? 'text-amber-400' : 'text-text-dim'
              }`}>
                <Clock className="h-3 w-3" />
                {remaining <= 0
                  ? `Vencido hace ${Math.abs(remaining)} dia(s) — entregar a oficina cuanto antes`
                  : remaining === 1
                  ? 'Ultimo dia para entregar a oficina'
                  : `${remaining} dias para entregar a oficina`}
              </div>
            );
          })()}

          <Separator className="my-3 bg-border-default" />

          {/* Type-specific forms */}
          {item.type === 'AUTOGRAPH' && (
            <div className="space-y-2">
              <p className="text-xs text-text-dim">Firma el producto y marcalo como completado.</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas para el cliente (opcional)"
                rows={2}
                className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500 text-sm"
              />
              <Button size="sm" disabled={submitting} onClick={() => handleSubmitFulfill({ notes: notes || undefined })}
                className="bg-navy-600 text-white hover:bg-navy-500 text-xs">
                {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />} Marcar como firmado
              </Button>
            </div>
          )}

          {item.type === 'HANDWRITTEN_LETTER' && (
            <div className="space-y-2">
              <p className="text-xs text-text-dim">Escribe la carta a mano e incluyela en el paquete del pedido.</p>
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={submitting}
                onClick={() => fileRef.current?.click()}
                className="border-border-strong text-text-secondary hover:bg-overlay-light text-xs"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {file ? file.name : 'Subir foto como evidencia (opcional)'}
              </Button>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas internas (opcional)"
                rows={2}
                className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500 text-sm"
              />
              <Button
                size="sm"
                disabled={submitting}
                onClick={() => file ? handleSubmitUpload() : handleSubmitFulfill({ notes: notes || undefined })}
                className="bg-navy-600 text-white hover:bg-navy-500 text-xs"
              >
                {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                {submitting ? 'Guardando...' : 'Carta lista para envio'}
              </Button>
            </div>
          )}

          {item.type === 'VIDEO_GREETING' && (
            <div className="space-y-2">
              <p className="text-xs text-text-dim">Graba un video saludo y subelo (max 100MB).</p>
              <input
                type="file"
                accept="video/*"
                ref={fileRef}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-overlay-light p-6 cursor-pointer hover:border-navy-500/30 transition-colors ${submitting ? 'pointer-events-none opacity-50' : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-navy-400" />
                    <span className="text-sm text-text-secondary">{file.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-400"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-text-ghost mb-2" />
                    <p className="text-sm text-text-dim">Click para subir video</p>
                    <p className="text-[10px] text-text-ghost">MP4, WEBM, MOV — Max 100MB</p>
                  </>
                )}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mensaje para el cliente (opcional)"
                rows={2}
                className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500 text-sm"
              />
              <Button
                size="sm"
                disabled={!file || submitting}
                onClick={handleSubmitUpload}
                className="bg-navy-600 text-white hover:bg-navy-500 text-xs disabled:opacity-40"
              >
                {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                {submitting ? 'Subiendo...' : 'Enviar video al cliente'}
              </Button>
              {!file && !submitting && (
                <p className="text-[10px] text-text-ghost">Sube un video para poder enviar</p>
              )}
            </div>
          )}

          {item.type === 'VIDEO_CALL' && (
            <div className="space-y-2">
              {item.scheduledDate ? (() => {
                const scheduled = new Date(item.scheduledDate);
                const hasPassed = scheduled <= new Date();
                return (
                  <>
                    <div className={`rounded-lg border p-3 ${hasPassed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-navy-500/10 border-navy-500/20'}`}>
                      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                        <Calendar className={`h-4 w-4 ${hasPassed ? 'text-emerald-400' : 'text-navy-400'}`} />
                        {scheduled.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {!hasPassed && (
                        <p className="mt-1 text-[10px] text-text-ghost">Podras marcarla como realizada cuando llegue la fecha</p>
                      )}
                      {item.meetingLink && (
                        <a href={item.meetingLink} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-navy-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-500 transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          Abrir link de reunion
                        </a>
                      )}
                    </div>
                    {hasPassed && (
                      <>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notas (opcional)"
                          rows={2}
                          className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500 text-sm"
                        />
                        <Button
                          size="sm"
                          disabled={submitting}
                          onClick={() => handleSubmitFulfill({ notes: notes || undefined })}
                          className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs"
                        >
                          {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />} Marcar como realizada
                        </Button>
                      </>
                    )}
                  </>
                );
              })() : (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <Clock className="mx-auto h-6 w-6 text-amber-400 mb-1" />
                  <p className="text-xs font-medium text-amber-400">Esperando que el cliente elija horario</p>
                  <p className="text-[10px] text-text-ghost mt-0.5">El cliente vera tus horarios disponibles en su cuenta</p>
                </div>
              )}
            </div>
          )}

          {item.type === 'PRODUCT_PERSONALIZATION' && (
            <div className="space-y-2">
              <p className="text-xs text-text-dim">Personaliza el producto segun lo solicitado.</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                rows={2}
                className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500 text-sm"
              />
              <Button size="sm" disabled={submitting} onClick={() => handleSubmitFulfill({ notes: notes || undefined })}
                className="bg-navy-600 text-white hover:bg-navy-500 text-xs">
                {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />} Marcar como completado
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
