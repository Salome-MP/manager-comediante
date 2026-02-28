'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { TicketCountdown } from '@/components/ticket-countdown';
import { QRCodeSVG } from 'qrcode.react';

const ticketStatusLabels: Record<string, string> = {
  ACTIVE: 'Activa',
  USED: 'Usada',
  CANCELLED: 'Cancelada',
};

const ticketStatusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  USED: 'bg-overlay-strong text-text-muted border-border-strong',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/20',
};

export default function MisEntradasPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" /></div>}>
      <MisEntradasContent />
    </Suspense>
  );
}

function MisEntradasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadFromStorage } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrTicket, setQrTicket] = useState<any>(null);

  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    loadFromStorage();
    setReady(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (ready && !user) router.push('/login');
  }, [ready, user, router]);

  useEffect(() => {
    if (user) {
      api
        .get('/auth/my-tickets')
        .then((res) => setTickets(res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Payment status banner */}
        {paymentStatus && (
          <div className="mb-6">
            {paymentStatus === 'approved' && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-300">Pago exitoso</p>
                  <p className="text-sm text-emerald-300/70">
                    Tu entrada ha sido confirmada. Revisa tu email para el codigo QR.
                  </p>
                </div>
              </div>
            )}
            {paymentStatus === 'failure' && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <XCircle className="h-6 w-6 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-red-300">Pago no completado</p>
                  <p className="text-sm text-red-300/70">
                    El pago no se pudo procesar. Tu entrada esta pendiente de pago.
                  </p>
                </div>
              </div>
            )}
            {paymentStatus === 'pending' && (
              <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <Clock className="h-6 w-6 flex-shrink-0 text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-300">Pago pendiente</p>
                  <p className="text-sm text-yellow-300/70">
                    Tu pago esta siendo procesado. Te notificaremos cuando se confirme.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Mis Entradas</h1>
            <p className="mt-1 text-text-muted">
              {tickets.length} entrada{tickets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-border-strong bg-overlay-light text-text-secondary hover:bg-overlay-strong hover:text-text-primary"
          >
            <Link href="/mi-cuenta">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mi Cuenta
            </Link>
          </Button>
        </div>

        {/* Tickets list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-border-medium bg-surface-card py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-overlay-light">
              <Ticket className="h-7 w-7 text-text-ghost" />
            </div>
            <p className="text-text-muted">No tienes entradas compradas</p>
            <Button
              asChild
              className="mt-4 bg-navy-600 hover:bg-navy-500 text-white"
            >
              <Link href="/">Explorar shows</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket: any) => {
              const show = ticket.show;
              const isPast = show?.date && new Date(show.date) < new Date();
              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-border-medium bg-surface-card overflow-hidden transition-all duration-200 hover:border-navy-500/20"
                >
                  {/* Show header */}
                  <div className="border-b border-border-medium bg-overlay-light px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-text-primary truncate">
                          {show?.name || 'Show'}
                        </h3>
                        {show?.artist && (
                          <Link
                            href={`/artistas/${show.artist.slug}`}
                            className="text-sm text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
                          >
                            {show.artist.stageName}
                          </Link>
                        )}
                      </div>
                      <Badge
                        className={`border text-xs flex-shrink-0 ${
                          ticketStatusColors[ticket.status] || 'bg-overlay-strong text-text-muted border-border-strong'
                        }`}
                      >
                        {ticketStatusLabels[ticket.status] || ticket.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Ticket details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-text-tertiary">
                      <MapPin className="h-4 w-4 text-text-ghost" />
                      <span>{show?.venue || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-tertiary">
                      <Calendar className="h-4 w-4 text-text-ghost" />
                      <span>
                        {show?.date
                          ? new Date(show.date).toLocaleDateString('es-PE', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </span>
                    </div>

                    <Separator className="bg-border-medium" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-faint">Precio</span>
                      <span className="text-lg font-bold text-text-primary">
                        S/. {Number(ticket.price).toFixed(2)}
                      </span>
                    </div>

                    {/* QR Code button — only for paid tickets */}
                    {ticket.status === 'ACTIVE' && !isPast && ticket.qrCode && ticket.paymentId && (
                      <Button
                        variant="outline"
                        className="w-full border-navy-500/20 bg-navy-500/5 text-navy-600 dark:text-navy-300 hover:bg-navy-500/10 font-semibold"
                        onClick={() => setQrTicket(ticket)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver QR de entrada
                      </Button>
                    )}

                    {ticket.status === 'ACTIVE' && !ticket.paymentId && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR Dialog */}
        <Dialog open={!!qrTicket} onOpenChange={(open) => !open && setQrTicket(null)}>
          <DialogContent className="max-w-sm bg-surface-card border-border-medium">
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
      </div>
    </div>
  );
}
