'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Package, Ticket, Heart, User, Lock, Loader2, Download, Star,
  Truck, Gift, CheckCircle, Clock, Video, Phone, ExternalLink, AlertTriangle, RotateCcw,
  QrCode, MapPin, Calendar, ChevronLeft, ChevronRight,
  Link2, Copy, Users, DollarSign, MousePointerClick,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { QRCodeSVG } from 'qrcode.react';
import { TicketCountdown } from '@/components/ticket-countdown';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente', PAID: 'Pagado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  PAID: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  PROCESSING: 'bg-navy-500/15 text-navy-600 dark:text-navy-300 border-navy-500/20',
  SHIPPED: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/20',
  REFUNDED: 'bg-overlay-strong text-text-tertiary border-border-strong',
};

const custStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

const custTypeLabels: Record<string, string> = {
  AUTOGRAPH: 'Autografo',
  HANDWRITTEN_LETTER: 'Carta a mano',
  VIDEO_GREETING: 'Video saludo',
  VIDEO_CALL: 'Videollamada',
  PRODUCT_PERSONALIZATION: 'Personalizacion',
};

const custStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const returnStatusLabels: Record<string, string> = {
  OPEN: 'Abierta', REVIEWING: 'En revision', APPROVED: 'Aprobada', REJECTED: 'Rechazada', RESOLVED: 'Resuelta',
};

const returnStatusColors: Record<string, string> = {
  OPEN: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  REVIEWING: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  RESOLVED: 'bg-overlay-strong text-text-tertiary border-border-strong',
};

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [myReturns, setMyReturns] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [generatingReferral, setGeneratingReferral] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // QR dialog
  const [qrTicket, setQrTicket] = useState<any>(null);

  // Return request dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Video call booking dialog
  const [vcDialogOpen, setVcDialogOpen] = useState(false);
  const [vcCustomization, setVcCustomization] = useState<{ id: string; artistId: string; artistName: string } | null>(null);
  const [vcSlots, setVcSlots] = useState<{ date: string; duration: number }[]>([]);
  const [vcLoadingSlots, setVcLoadingSlots] = useState(false);
  const [vcSelectedSlot, setVcSelectedSlot] = useState<string | null>(null);
  const [vcBooking, setVcBooking] = useState(false);
  const [vcSelectedDay, setVcSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    loadFromStorage();
    setReady(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (ready && !user) router.push('/login');
  }, [ready, user, router]);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, ticketsRes, artistsRes, wishlistRes, returnsRes] = await Promise.all([
        api.get('/auth/my-orders?limit=50'),
        api.get('/auth/my-tickets'),
        api.get('/auth/followed-artists'),
        api.get('/wishlist'),
        api.get('/returns/my-returns').catch(() => ({ data: [] })),
      ]);
      setOrders(ordersRes.data.data || []);
      setTickets(ticketsRes.data || []);
      setFollowedArtists(artistsRes.data || []);
      setWishlist(wishlistRes.data || []);
      setMyReturns(returnsRes.data || []);
    } catch { /* ignore */ }
    // Fetch referral separately (may 404 if none)
    try {
      const refRes = await api.get('/referrals/my-referral');
      setReferral(refRes.data);
    } catch { /* no referral yet */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      fetchData();
    }
  }, [user, fetchData]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { firstName, lastName, phone: phone || undefined });
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar perfil');
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      toast.error('Contraseña actual incorrecta');
    }
    setSavingPassword(false);
  };

  const openVcBooking = async (customizationId: string, artistId: string, artistName: string) => {
    setVcCustomization({ id: customizationId, artistId, artistName });
    setVcSelectedSlot(null);
    setVcSelectedDay(null);
    setVcDialogOpen(true);
    setVcLoadingSlots(true);
    try {
      const res = await api.get(`/artists/${artistId}/video-call-slots`);
      setVcSlots(res.data || []);
    } catch {
      setVcSlots([]);
    }
    setVcLoadingSlots(false);
  };

  const handleBookSlot = async () => {
    if (!vcCustomization || !vcSelectedSlot) return;
    setVcBooking(true);
    try {
      await api.post(`/artists/${vcCustomization.artistId}/video-call-slots/book`, {
        orderCustomizationId: vcCustomization.id,
        slotDate: vcSelectedSlot,
      });
      toast.success('Videollamada agendada');
      setVcDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al agendar');
    }
    setVcBooking(false);
  };

  const handleSubmitReturn = async () => {
    if (!returnReason) {
      toast.error('Indica el motivo de la devolucion');
      return;
    }
    setSubmittingReturn(true);
    try {
      await api.post('/returns', {
        orderId: returnOrderId,
        reason: returnReason,
        description: returnDescription || undefined,
      });
      toast.success('Solicitud de devolucion enviada');
      setReturnDialogOpen(false);
      setReturnReason('');
      setReturnDescription('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar solicitud');
    }
    setSubmittingReturn(false);
  };

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  const inputClass = "bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2 disabled:opacity-40";
  const labelClass = "text-text-secondary text-sm font-medium";

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Mi Cuenta</h1>
          <p className="mt-1 text-text-muted">Hola, {user.firstName}</p>
        </div>

        <Tabs defaultValue="orders">
          <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-overlay-light border border-border-medium p-1 w-max md:w-auto">
              <TabsTrigger
                value="orders"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <Package className="h-4 w-4" />
                Pedidos ({orders.length})
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <Ticket className="h-4 w-4" />
                Entradas ({tickets.length})
              </TabsTrigger>
              <TabsTrigger
                value="artists"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <Heart className="h-4 w-4" />
                Artistas ({followedArtists.length})
              </TabsTrigger>
              <TabsTrigger
                value="wishlist"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <Star className="h-4 w-4" />
                Favoritos ({wishlist.length})
              </TabsTrigger>
              <TabsTrigger
                value="returns"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                Devoluciones ({myReturns.length})
              </TabsTrigger>
              <TabsTrigger
                value="referral"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <Link2 className="h-4 w-4" />
                Referidos
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="gap-1.5 md:gap-2 text-text-muted data-[state=active]:bg-navy-600 data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
              >
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-overlay-light">
                  <Package className="h-7 w-7 text-text-ghost" />
                </div>
                <p className="text-text-muted">No tienes pedidos aun</p>
                <Button asChild className="mt-4 bg-navy-600 hover:bg-navy-500 text-white">
                  <Link href="/">Explorar artistas</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border-medium bg-surface-card p-4 transition-all duration-200 hover:border-overlay-hover"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-text-primary">{order.orderNumber}</p>
                        <p className="text-sm text-text-faint">
                          {new Date(order.createdAt).toLocaleDateString('es-PE', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-lg font-bold text-text-primary">
                          S/. {Number(order.total).toFixed(2)}
                        </p>
                        <Badge className={`border text-xs ${statusColors[order.status] || 'bg-overlay-strong text-text-tertiary border-border-strong'}`}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Countdown for pending unpaid orders */}
                    {order.status === 'PENDING' && !order.paymentId && order.expiresAt && (
                      <div className="mt-3">
                        <TicketCountdown
                          expiresAt={order.expiresAt}
                          onExpired={() => {
                            setOrders((prev) =>
                              prev.map((o: any) =>
                                o.id === order.id ? { ...o, status: 'CANCELLED' } : o
                              )
                            );
                          }}
                        />
                      </div>
                    )}

                    {/* Tracking info */}
                    {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.carrier && (
                      <div className="mt-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-indigo-400" />
                          <span className="font-medium text-text-secondary">
                            {order.carrier} — {order.trackingNumber}
                          </span>
                        </div>
                        {order.shippedAt && (
                          <p className="mt-1 text-xs text-text-ghost">
                            Enviado: {new Date(order.shippedAt).toLocaleDateString('es-PE')}
                          </p>
                        )}
                        {order.deliveredAt && (
                          <p className="text-xs text-text-ghost">
                            Entregado: {new Date(order.deliveredAt).toLocaleDateString('es-PE')}
                          </p>
                        )}
                      </div>
                    )}

                    <Separator className="my-3 bg-border-medium" />
                    <div className="space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id}>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">
                              {item.artistProduct?.product?.name || 'Producto'} x{item.quantity}
                            </span>
                            <span className="text-text-muted">
                              S/. {Number(item.totalPrice).toFixed(2)}
                            </span>
                          </div>
                          {/* Customizations status */}
                          {item.customizations?.length > 0 && (
                            <div className="mt-2 mb-2 space-y-2">
                              {item.customizations.map((c: any) => (
                                <div key={c.id} className="rounded-lg border border-border-default bg-surface-deep p-2.5">
                                  <div className="flex items-center gap-2">
                                    <Gift className="h-3.5 w-3.5 text-navy-400" />
                                    <span className="text-xs font-medium text-text-secondary">{custTypeLabels[c.type] || c.type}</span>
                                    <Badge className={`border text-[10px] ${custStatusColors[c.status] || ''}`}>
                                      {c.fulfilled ? <CheckCircle className="mr-0.5 h-2.5 w-2.5" /> : null}
                                      {custStatusLabels[c.status] || c.status}
                                    </Badge>
                                  </div>
                                  {c.notes && (
                                    <p className="mt-1.5 text-xs text-text-dim italic">"{c.notes}"</p>
                                  )}
                                  {/* VIDEO_CALL specific states */}
                                  {c.type === 'VIDEO_CALL' && !c.scheduledDate && !c.fulfilled && (
                                    <div className="mt-1.5 space-y-1.5">
                                      <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Tienes una videollamada pendiente de agendar.
                                      </p>
                                      <Button
                                        size="sm"
                                        className="bg-navy-600 text-white hover:bg-navy-500 text-xs gap-1.5"
                                        onClick={() => openVcBooking(c.id, item.artistProduct?.artist?.id, item.artistProduct?.artist?.stageName)}
                                      >
                                        <Calendar className="h-3.5 w-3.5" />
                                        Elegir horario
                                      </Button>
                                    </div>
                                  )}
                                  {c.type === 'VIDEO_CALL' && c.scheduledDate && !c.fulfilled && (
                                    <div className="mt-1.5 space-y-1.5">
                                      <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="h-3 w-3 text-navy-400" />
                                        <span className="font-medium text-text-primary">
                                          {new Date(c.scheduledDate).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      {c.meetingLink && (
                                        <a href={c.meetingLink} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 rounded-md bg-navy-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-500 transition-colors">
                                          <Phone className="h-3.5 w-3.5" />
                                          Unirme a la llamada
                                        </a>
                                      )}
                                      <p className="text-xs text-blue-600 dark:text-blue-400">
                                        La llamada esta agendada. Te notificaremos cuando sea el momento.
                                      </p>
                                    </div>
                                  )}
                                  {c.type === 'VIDEO_CALL' && c.fulfilled && (
                                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                      Videollamada completada.
                                    </p>
                                  )}
                                  {/* Non-VIDEO_CALL pending/in-progress states */}
                                  {c.type !== 'VIDEO_CALL' && c.status === 'PENDING' && (
                                    <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                                      El artista aun no ha completado esta personalizacion. Te notificaremos cuando este listo.
                                    </p>
                                  )}
                                  {c.type !== 'VIDEO_CALL' && c.status === 'IN_PROGRESS' && (
                                    <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
                                      El artista esta trabajando en tu personalizacion.
                                    </p>
                                  )}
                                  {c.fulfilled && c.attachmentUrl && (
                                    <a
                                      href={c.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 flex items-center gap-1.5 rounded-md bg-navy-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-500 transition-colors w-fit"
                                    >
                                      {c.type === 'VIDEO_GREETING' ? <Video className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                      {c.type === 'VIDEO_GREETING' ? 'Ver mi video' : c.type === 'HANDWRITTEN_LETTER' ? 'Ver mi carta' : 'Ver contenido'}
                                    </a>
                                  )}
                                  {c.fulfilled && !c.attachmentUrl && (c.type === 'AUTOGRAPH' || c.type === 'PRODUCT_PERSONALIZATION' || c.type === 'HANDWRITTEN_LETTER') && (
                                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                      Completado. Se incluira con tu pedido.
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary text-xs"
                      >
                        <Link href={`/confirmacion/${order.id}`}>Ver detalle</Link>
                      </Button>
                      {order.status !== 'PENDING' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary text-xs gap-1.5"
                          onClick={async () => {
                            try {
                              const res = await api.get(`/orders/${order.id}/receipt`, { responseType: 'blob' });
                              const url = window.URL.createObjectURL(new Blob([res.data]));
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${order.orderNumber}.pdf`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch {
                              toast.error('Error al descargar la boleta');
                            }
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Boleta
                        </Button>
                      )}
                      {order.status === 'DELIVERED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs gap-1.5"
                          onClick={() => {
                            setReturnOrderId(order.id);
                            setReturnDialogOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Reportar problema
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TICKETS TAB */}
          <TabsContent value="tickets">
            {tickets.length === 0 ? (
              <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-overlay-light">
                  <Ticket className="h-7 w-7 text-text-ghost" />
                </div>
                <p className="text-text-muted">No tienes entradas compradas</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {tickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-border-medium bg-surface-card p-4 transition-all duration-200 hover:border-overlay-hover"
                  >
                    <h3 className="font-bold text-text-primary">{ticket.show?.name}</h3>
                    <p className="text-sm text-text-muted">{ticket.show?.artist?.stageName}</p>
                    <div className="mt-3 space-y-1 text-sm text-text-tertiary">
                      <p>Lugar: {ticket.show?.venue}</p>
                      <p>
                        Fecha:{' '}
                        {ticket.show?.date
                          ? new Date(ticket.show.date).toLocaleDateString('es-PE', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : '-'}
                      </p>
                      <p className="text-text-primary font-semibold">
                        Precio: S/. {Number(ticket.price).toFixed(2)}
                      </p>
                    </div>
                    {ticket.qrCode && ticket.status === 'ACTIVE' && ticket.paymentId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full border-navy-500/20 bg-navy-500/5 text-navy-600 dark:text-navy-300 hover:bg-navy-500/10 font-semibold"
                        onClick={() => setQrTicket(ticket)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver QR de entrada
                      </Button>
                    )}
                    {ticket.status === 'ACTIVE' && !ticket.paymentId && (
                      <div className="mt-3 space-y-2">
                        {ticket.expiresAt && (
                          <TicketCountdown
                            expiresAt={ticket.expiresAt}
                            onExpired={() => {
                              setTickets((prev) =>
                                prev.map((t) =>
                                  t.id === ticket.id ? { ...t, status: 'CANCELLED' } : t
                                )
                              );
                            }}
                          />
                        )}
                        <Button
                          className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold text-sm"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { data } = await api.post(
                                `/payments/ticket/${ticket.id}/preference`
                              );
                              const payUrl =
                                data.sandboxInitPoint || data.initPoint;
                              if (payUrl) {
                                window.location.href = payUrl;
                              }
                            } catch (err: any) {
                              if (err?.response?.status === 400) {
                                setTickets((prev) =>
                                  prev.map((t) =>
                                    t.id === ticket.id ? { ...t, status: 'CANCELLED' } : t
                                  )
                                );
                              }
                            }
                          }}
                        >
                          Completar pago
                        </Button>
                      </div>
                    )}
                    <Badge
                      className={`mt-3 border text-xs ${
                        ticket.status === 'ACTIVE' && !ticket.paymentId
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20'
                          : ticket.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                          : ticket.status === 'USED'
                          ? 'bg-overlay-strong text-text-muted border-border-strong'
                          : 'bg-red-500/15 text-red-300 border-red-500/20'
                      }`}
                    >
                      {ticket.status === 'ACTIVE' && !ticket.paymentId
                        ? 'Pendiente de pago'
                        : ticket.status === 'ACTIVE'
                        ? 'Activa'
                        : ticket.status === 'USED'
                        ? 'Usada'
                        : 'Cancelada'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FOLLOWED ARTISTS TAB */}
          <TabsContent value="artists">
            {followedArtists.length === 0 ? (
              <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-overlay-light">
                  <Heart className="h-7 w-7 text-text-ghost" />
                </div>
                <p className="text-text-muted">No sigues a ningun artista aun</p>
                <Button asChild className="mt-4 bg-navy-600 hover:bg-navy-500 text-white">
                  <Link href="/">Explorar artistas</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {followedArtists.map((artist: any) => (
                  <Link key={artist.id} href={`/artistas/${artist.slug}`}>
                    <div className="group rounded-xl border border-border-medium bg-surface-card p-4 cursor-pointer transition-all duration-200 hover:border-navy-500/30 hover:bg-surface-elevated">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-600/20 ring-1 ring-navy-500/20 text-lg font-bold text-navy-600 dark:text-navy-300">
                          {artist.stageName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary group-hover:text-navy-700 dark:group-hover:text-navy-200 transition-colors">
                            {artist.stageName}
                          </p>
                          {artist.tagline && (
                            <p className="text-sm text-text-faint">{artist.tagline}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* WISHLIST TAB */}
          <TabsContent value="wishlist">
            {wishlist.length === 0 ? (
              <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-overlay-light">
                  <Star className="h-7 w-7 text-text-ghost" />
                </div>
                <p className="text-text-muted">No tienes productos en favoritos</p>
                <Button asChild className="mt-4 bg-navy-600 hover:bg-navy-500 text-white">
                  <Link href="/">Explorar productos</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.map((item: any) => {
                  const ap = item.artistProduct;
                  const images = ap?.customImages?.length > 0 ? ap.customImages : ap?.product?.images || [];
                  return (
                    <Link key={item.id} href={`/producto/${ap?.id}`}>
                      <div className="group rounded-xl border border-border-medium bg-surface-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-navy-500/30 hover:shadow-lg hover:shadow-navy-500/5">
                        <div className="aspect-square bg-overlay-light">
                          {images[0] ? (
                            <img src={images[0]} alt={ap?.product?.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-10 w-10 text-text-ghost" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs font-medium text-navy-400">{ap?.artist?.stageName}</p>
                          <p className="mt-1 font-semibold text-text-primary group-hover:text-navy-700 dark:group-hover:text-navy-200 transition-colors">
                            {ap?.product?.name}
                          </p>
                          <p className="mt-1 text-lg font-bold text-text-primary">
                            S/. {Number(ap?.salePrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* RETURNS TAB */}
          <TabsContent value="returns">
            {myReturns.length === 0 ? (
              <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-overlay-light">
                  <RotateCcw className="h-7 w-7 text-text-ghost" />
                </div>
                <p className="text-text-muted">No tienes solicitudes de devolucion</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReturns.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-border-medium bg-surface-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold text-navy-600 dark:text-navy-300">
                          {r.order?.orderNumber}
                        </p>
                        <p className="text-sm text-text-secondary mt-0.5">{r.reason}</p>
                        {r.description && <p className="text-xs text-text-ghost">{r.description}</p>}
                      </div>
                      <Badge className={`border text-xs ${returnStatusColors[r.status]}`}>
                        {returnStatusLabels[r.status]}
                      </Badge>
                    </div>
                    {r.adminNotes && (
                      <div className="mt-2 rounded-lg bg-overlay-subtle p-2 text-xs text-text-dim">
                        Respuesta: {r.adminNotes}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-text-ghost">
                      {new Date(r.createdAt).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REFERRAL TAB */}
          <TabsContent value="referral">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
              </div>
            ) : !referral ? (
              <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-500/10">
                  <Link2 className="h-8 w-8 text-navy-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Programa de referidos
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
                  Comparte tu codigo unico con amigos. Cuando compren usando tu enlace, ganas una comision por cada venta.
                </p>
                <Button
                  onClick={async () => {
                    setGeneratingReferral(true);
                    try {
                      await api.post('/referrals/generate');
                      toast.success('Codigo de referido generado!');
                      const refRes = await api.get('/referrals/my-referral');
                      setReferral(refRes.data);
                    } catch {
                      toast.error('Error al generar codigo');
                    }
                    setGeneratingReferral(false);
                  }}
                  disabled={generatingReferral}
                  className="mt-6 bg-navy-600 text-white hover:bg-navy-500"
                >
                  {generatingReferral ? 'Generando...' : 'Generar mi codigo'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Code & Link */}
                <div className="rounded-xl border border-border-medium bg-surface-card p-4 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-text-primary">Tu codigo de referido</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        value={referral.code}
                        readOnly
                        className="max-w-xs border-border-strong bg-overlay-light text-center font-mono text-lg font-bold text-text-primary"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(referral.code);
                          toast.success('Codigo copiado!');
                        }}
                        title="Copiar codigo"
                        className="border-border-strong bg-overlay-light text-text-dim hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${referral.code}`}
                        readOnly
                        className="border-border-strong bg-overlay-light font-mono text-sm text-text-dim"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const link = `${window.location.origin}?ref=${referral.code}`;
                          navigator.clipboard.writeText(link);
                          toast.success('Enlace copiado!');
                        }}
                        title="Copiar enlace"
                        className="border-border-strong bg-overlay-light text-text-dim hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-text-muted">
                      Comision por referido:{' '}
                      <span className="font-semibold text-navy-500 dark:text-navy-400">{referral.commissionRate}%</span>{' '}
                      del subtotal de cada compra.
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Referidos', value: referral.referredUsers?.length || 0, icon: Users, iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
                    { label: 'Clicks totales', value: referral.totalClicks, icon: MousePointerClick, iconBg: 'bg-navy-500/15', iconColor: 'text-navy-400' },
                    { label: 'Total ganado', value: `S/. ${(referral.totalEarnings || 0).toFixed(2)}`, icon: DollarSign, iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400' },
                    { label: 'Pendiente', value: `S/. ${(referral.pendingEarnings || 0).toFixed(2)}`, icon: DollarSign, iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-xl border border-border-medium bg-surface-card p-5 transition-all duration-200 hover:border-border-strong"
                    >
                      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${stat.iconBg}`} />
                      <div className="relative flex items-start justify-between">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium uppercase tracking-widest text-text-muted">{stat.label}</span>
                          <span className="text-2xl font-bold tracking-tight text-text-primary">{stat.value}</span>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                          <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commissions Table */}
                {referral.commissions && referral.commissions.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-border-medium bg-surface-card">
                    <div className="border-b border-border-medium px-4 sm:px-6 py-4">
                      <h3 className="text-base font-semibold text-text-primary">Historial de comisiones</h3>
                      <p className="mt-0.5 text-sm text-text-muted">{referral.commissions.length} registros</p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[640px]">
                        <TableHeader>
                          <TableRow className="border-border-medium hover:bg-transparent">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pedido</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">Monto</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">Estado</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referral.commissions.map((c: any) => (
                            <TableRow key={c.id} className="border-border-medium transition-colors hover:bg-overlay-subtle">
                              <TableCell className="font-mono text-sm font-semibold text-text-primary">{c.order?.orderNumber}</TableCell>
                              <TableCell className="font-semibold text-text-primary">S/. {Number(c.amount).toFixed(2)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                                  c.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {c.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                </span>
                              </TableCell>
                              <TableCell className="text-text-muted">{new Date(c.createdAt).toLocaleDateString('es-PE')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border-medium bg-surface-card p-4 md:p-6">
                <h2 className="mb-4 md:mb-5 flex items-center gap-2 text-lg font-bold text-text-primary">
                  <User className="h-5 w-5 text-navy-400" />
                  Datos personales
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Email</Label>
                    <Input value={user.email} disabled className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Nombre</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Apellido</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Telefono</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" className={inputClass} />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 transition-all duration-200"
                  >
                    {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border-medium bg-surface-card p-4 md:p-6">
                <h2 className="mb-4 md:mb-5 flex items-center gap-2 text-lg font-bold text-text-primary">
                  <Lock className="h-5 w-5 text-navy-400" />
                  Cambiar contraseña
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Contraseña actual</Label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Nueva contraseña</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" className={inputClass} />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 transition-all duration-200"
                  >
                    {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Dialog */}
      <Dialog open={!!qrTicket} onOpenChange={(open) => !open && setQrTicket(null)}>
        <DialogContent className="max-w-sm border-border-medium bg-surface-card">
          <DialogHeader>
            <DialogTitle className="text-center text-text-primary">
              {qrTicket?.show?.name || 'Entrada'}
            </DialogTitle>
          </DialogHeader>
          {qrTicket && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl bg-white p-4 sm:p-5 max-w-[calc(100vw-6rem)]">
                <QRCodeSVG
                  value={`${window.location.origin}/entrada/${qrTicket.qrCode}`}
                  size={200}
                  className="w-full h-auto max-w-[200px]"
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-text-secondary">
                  Presenta este QR en la entrada del evento
                </p>
                {qrTicket.show?.venue && (
                  <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {qrTicket.show.venue}
                  </p>
                )}
                {qrTicket.show?.date && (
                  <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(qrTicket.show.date).toLocaleDateString('es-PE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="border-border-strong bg-surface-card text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Reportar problema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-dim">Motivo *</Label>
              <Input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ej: Producto defectuoso"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-dim">Descripcion</Label>
              <Textarea
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                placeholder="Detalla el problema (opcional)"
                rows={3}
                className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-ghost focus:border-navy-500"
              />
            </div>
            <Button
              onClick={handleSubmitReturn}
              disabled={submittingReturn}
              className="w-full bg-navy-600 text-white hover:bg-navy-500"
            >
              {submittingReturn ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Call Booking Dialog */}
      <Dialog open={vcDialogOpen} onOpenChange={setVcDialogOpen}>
        <DialogContent className="border-border-strong bg-surface-card text-text-primary max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <Phone className="h-5 w-5 text-navy-400" />
              Agendar videollamada
            </DialogTitle>
          </DialogHeader>
          {vcCustomization && (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Elige un horario para tu videollamada con <span className="font-semibold text-text-primary">{vcCustomization.artistName}</span>
              </p>

              {vcLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
                </div>
              ) : vcSlots.length === 0 ? (
                <div className="rounded-lg bg-overlay-light p-4 text-center">
                  <Clock className="mx-auto h-8 w-8 text-text-ghost mb-2" />
                  <p className="text-sm text-text-muted">No hay horarios disponibles por ahora.</p>
                  <p className="text-xs text-text-ghost mt-1">El artista actualizara su disponibilidad pronto.</p>
                </div>
              ) : (() => {
                // Group slots by day
                const slotsByDay: Record<string, { date: string; duration: number }[]> = {};
                vcSlots.forEach((slot) => {
                  const dayKey = new Date(slot.date).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'short' });
                  if (!slotsByDay[dayKey]) slotsByDay[dayKey] = [];
                  slotsByDay[dayKey].push(slot);
                });
                const dayKeys = Object.keys(slotsByDay);
                const activeDayKey = vcSelectedDay || dayKeys[0];
                const activeSlots = slotsByDay[activeDayKey] || [];
                const currentDayIdx = dayKeys.indexOf(activeDayKey);

                return (
                  <div className="space-y-3">
                    {/* Slots disponibles badge */}
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-navy-500/10 px-3 py-2 text-xs text-navy-600 dark:text-navy-300">
                      <Calendar className="h-3.5 w-3.5" />
                      <span><span className="font-bold">{vcSlots.length}</span> horarios disponibles en {dayKeys.length} {dayKeys.length === 1 ? 'dia' : 'dias'}</span>
                    </div>

                    {/* Day selector */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { if (currentDayIdx > 0) setVcSelectedDay(dayKeys[currentDayIdx - 1]); }}
                        disabled={currentDayIdx <= 0}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-default text-text-dim hover:bg-overlay-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex-1 text-center">
                        <p className="text-sm font-semibold text-text-primary capitalize">{activeDayKey}</p>
                        <p className="text-[11px] text-text-dim">{activeSlots.length} {activeSlots.length === 1 ? 'horario disponible' : 'horarios disponibles'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (currentDayIdx < dayKeys.length - 1) setVcSelectedDay(dayKeys[currentDayIdx + 1]); }}
                        disabled={currentDayIdx >= dayKeys.length - 1}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-default text-text-dim hover:bg-overlay-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Day pills - scrollable */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                      {dayKeys.map((dayKey) => {
                        const isActive = dayKey === activeDayKey;
                        const firstSlot = slotsByDay[dayKey][0];
                        const d = new Date(firstSlot.date);
                        return (
                          <button
                            key={dayKey}
                            type="button"
                            onClick={() => { setVcSelectedDay(dayKey); setVcSelectedSlot(null); }}
                            className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-xs transition-all ${
                              isActive
                                ? 'border-navy-500 bg-navy-500/10 text-navy-600 dark:text-navy-300'
                                : 'border-border-default text-text-dim hover:border-border-strong hover:bg-overlay-light'
                            }`}
                          >
                            <span className="font-bold uppercase text-[10px]">{d.toLocaleDateString('es-PE', { weekday: 'short' })}</span>
                            <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                            <span className="text-[10px] opacity-70">{slotsByDay[dayKey].length}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Time slots for selected day */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {activeSlots.map((slot) => {
                        const d = new Date(slot.date);
                        const isSelected = vcSelectedSlot === slot.date;
                        return (
                          <button
                            key={slot.date}
                            type="button"
                            onClick={() => setVcSelectedSlot(slot.date)}
                            className={`flex flex-col items-center rounded-lg border px-2 py-2.5 text-sm transition-all ${
                              isSelected
                                ? 'border-navy-500 bg-navy-500/10 text-text-primary ring-1 ring-navy-500/30'
                                : 'border-border-default text-text-secondary hover:border-border-strong hover:bg-overlay-light'
                            }`}
                          >
                            <span className="font-semibold">
                              {d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-text-ghost">{slot.duration} min</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {vcSlots.length > 0 && (
                <Button
                  onClick={handleBookSlot}
                  disabled={!vcSelectedSlot || vcBooking}
                  className="w-full bg-navy-600 text-white hover:bg-navy-500 disabled:opacity-40"
                >
                  {vcBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                  {vcBooking ? 'Agendando...' : 'Confirmar horario'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
