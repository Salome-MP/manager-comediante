'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { TicketVerification } from '@/types';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Loader2,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; color: string; bg: string }> = {
  ACTIVE_PAID: {
    icon: CheckCircle,
    label: 'Entrada Válida',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  ACTIVE_UNPAID: {
    icon: Clock,
    label: 'Pendiente de Pago',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  USED: {
    icon: ShieldCheck,
    label: 'Entrada Ya Utilizada',
    color: 'text-text-muted',
    bg: 'bg-overlay-light border-border-strong',
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Entrada Cancelada',
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
  },
};

function getStatusKey(ticket: TicketVerification): string {
  if (ticket.status === 'USED') return 'USED';
  if (ticket.status === 'CANCELLED') return 'CANCELLED';
  if (ticket.status === 'ACTIVE' && ticket.isPaid) return 'ACTIVE_PAID';
  return 'ACTIVE_UNPAID';
}

export default function EntradaVerifyPage() {
  const params = useParams();
  const code = params.code as string;
  const { user, loadFromStorage } = useAuthStore();

  const [ticket, setTicket] = useState<TicketVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [markSuccess, setMarkSuccess] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!code) return;
    api
      .get(`/shows/tickets/verify/${encodeURIComponent(code)}`)
      .then((res) => setTicket(res.data))
      .catch((err) => {
        setError(
          err.response?.data?.message || 'No se pudo verificar la entrada'
        );
      })
      .finally(() => setLoading(false));
  }, [code]);

  const canMarkUsed =
    user &&
    ['SUPER_ADMIN', 'STAFF', 'ARTIST'].includes(user.role) &&
    ticket &&
    ticket.status === 'ACTIVE' &&
    ticket.isPaid &&
    !markSuccess;

  const handleMarkUsed = async () => {
    if (!code) return;
    setMarking(true);
    try {
      await api.post('/shows/validate-ticket', { qrCode: code });
      setMarkSuccess(true);
      setTicket((prev) => (prev ? { ...prev, status: 'USED' } : prev));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al marcar la entrada');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
        <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-surface-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            Entrada No Encontrada
          </h1>
          <p className="mt-2 text-text-muted">
            {error || 'El código QR no corresponde a ninguna entrada válida.'}
          </p>
          <Button asChild className="mt-6 bg-navy-600 hover:bg-navy-500 text-white">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusKey = getStatusKey(ticket);
  const config = statusConfig[statusKey];
  const StatusIcon = config.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Status hero */}
        <div
          className={`rounded-xl border p-6 text-center ${config.bg}`}
        >
          <StatusIcon className={`mx-auto h-14 w-14 ${config.color}`} />
          <h1 className={`mt-3 text-2xl font-bold ${config.color}`}>
            {config.label}
          </h1>
        </div>

        {/* Ticket details */}
        <div className="rounded-xl border border-border-medium bg-surface-card p-5 space-y-4">
          {/* Show name */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-ghost">
              Show
            </p>
            <p className="mt-1 text-lg font-bold text-text-primary">
              {ticket.show.name}
            </p>
          </div>

          {/* Artist */}
          <div className="flex items-center gap-3">
            {ticket.show.artist.profileImage ? (
              <img
                src={ticket.show.artist.profileImage}
                alt={ticket.show.artist.stageName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-500/10">
                <Ticket className="h-5 w-5 text-navy-400" />
              </div>
            )}
            <div>
              <p className="text-xs text-text-ghost">Artista</p>
              <p className="font-semibold text-text-primary">
                {ticket.show.artist.stageName}
              </p>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-ghost" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {ticket.show.venue}
              </p>
              {(ticket.show.address || ticket.show.city) && (
                <p className="text-xs text-text-muted">
                  {[ticket.show.address, ticket.show.city]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 flex-shrink-0 text-text-ghost" />
            <p className="text-sm text-text-primary">
              {new Date(ticket.show.date).toLocaleDateString('es-PE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Buyer */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 flex-shrink-0 text-text-ghost" />
            <div>
              <p className="text-xs text-text-ghost">Comprador</p>
              <p className="text-sm font-medium text-text-primary">
                {ticket.buyerName}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 flex-shrink-0 text-text-ghost" />
            <div>
              <p className="text-xs text-text-ghost">Precio</p>
              <p className="text-sm font-bold text-text-primary">
                S/. {Number(ticket.price).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Mark as used button (staff only) */}
        {canMarkUsed && (
          <Button
            onClick={handleMarkUsed}
            disabled={marking}
            className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold"
          >
            {marking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Marcar como Usada
              </>
            )}
          </Button>
        )}

        {markSuccess && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-500">
            Entrada marcada como usada exitosamente
          </div>
        )}
      </div>
    </div>
  );
}
