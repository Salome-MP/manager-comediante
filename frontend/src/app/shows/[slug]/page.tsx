'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MapPin,
  Ticket,
  Users,
  ArrowLeft,
  DollarSign,
} from 'lucide-react';

interface Show {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  venue: string;
  address: string | null;
  city: string | null;
  date: string;
  endDate: string | null;
  image: string | null;
  ticketPrice: number | null;
  totalCapacity: number | null;
  ticketsEnabled: boolean;
  status: string;
  artist: {
    id: string;
    stageName: string;
    slug: string;
    profileImage: string | null;
  };
  _count: { tickets: number };
}

export default function ShowDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, token, loadFromStorage } = useAuthStore();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [alreadyBought, setAlreadyBought] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!slug) return;
    api
      .get<Show>(`/shows/public/${slug}`)
      .then((r) => {
        setShow(r.data);
        // Check if user already has a ticket for this show
        if (token) {
          api.get('/auth/my-tickets')
            .then((res) => {
              const tickets = res.data || [];
              const hasPaid = tickets.some(
                (t: any) => t.showId === r.data.id && t.status === 'ACTIVE' && t.paymentId
              );
              if (hasPaid) setAlreadyBought(true);
            })
            .catch(() => {});
        }
      })
      .catch(() => setError('Show no encontrado'))
      .finally(() => setLoading(false));
  }, [slug, token]);

  const handlePurchase = async () => {
    if (!token) {
      router.push(`/login?redirect=/shows/${slug}`);
      return;
    }
    if (!show) return;
    setPurchasing(true);
    setError('');
    try {
      // 1. Purchase ticket (creates ticket in ACTIVE status without payment)
      const { data: ticket } = await api.post(`/shows/${show.id}/purchase-ticket`);

      // 2. Create MercadoPago preference for the ticket
      const { data: preference } = await api.post(
        `/payments/ticket/${ticket.id}/preference`
      );

      // 3. Redirect to MercadoPago Sandbox checkout
      const payUrl = preference.sandboxInitPoint || preference.initPoint;
      if (payUrl) {
        window.location.href = payUrl;
        return;
      }

      // Fallback: redirect to tickets page if no pay URL
      router.push('/mis-entradas?status=pending');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al procesar la compra');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !show) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  if (!show) return null;

  const showDate = new Date(show.date);
  const isPast = showDate < new Date();
  const isCancelled = show.status === 'CANCELLED';
  const spotsLeft =
    show.totalCapacity != null
      ? show.totalCapacity - show._count.tickets
      : null;
  const soldOut = spotsLeft !== null && spotsLeft <= 0;

  // Artist cannot buy tickets for their own show
  const isOwnShow = user?.role === 'ARTIST' && user?.artistId === show.artist.id;

  const canBuy =
    show.ticketsEnabled && !isPast && !isCancelled && !soldOut && !isOwnShow && !alreadyBought;

  const dayName = showDate.toLocaleDateString('es-PE', { weekday: 'long' });
  const dayNum = showDate.getDate();
  const monthName = showDate.toLocaleDateString('es-PE', { month: 'long' });
  const time = showDate.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Image */}
      <div className="relative h-[320px] md:h-[420px] w-full overflow-hidden bg-surface-card">
        {show.image ? (
          <Image
            src={show.image}
            alt={show.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-surface-card to-surface-deep" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon-sm"
            className="bg-background/60 backdrop-blur-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 -mt-24 relative z-10 pb-20">
        {/* Date badge + Title */}
        <div className="flex items-start gap-5 mb-6">
          {/* Date box */}
          <div className="flex-shrink-0 w-[72px] rounded-xl bg-surface-card border border-border-medium text-center overflow-hidden shadow-lg">
            <div className="bg-primary py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
              {monthName.slice(0, 3)}
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold text-text-primary leading-none">
                {dayNum}
              </div>
              <div className="text-[10px] text-text-tertiary capitalize mt-0.5">
                {dayName}
              </div>
            </div>
          </div>

          <div className="pt-1">
            {(isPast || isCancelled) && (
              <Badge
                variant="outline"
                className={
                  isCancelled
                    ? 'border-red-500/30 text-red-400 mb-2'
                    : 'border-border-medium text-text-ghost mb-2'
                }
              >
                {isCancelled ? 'Cancelado' : 'Finalizado'}
              </Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
              {show.name}
            </h1>

            {/* Artist link */}
            <Link
              href={`/artistas/${show.artist.slug}`}
              className="inline-flex items-center gap-2 mt-2 group"
            >
              {show.artist.profileImage && (
                <Image
                  src={show.artist.profileImage}
                  alt={show.artist.stageName}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              )}
              <span className="text-sm text-primary group-hover:underline font-medium">
                {show.artist.stageName}
              </span>
            </Link>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="flex items-center gap-3 rounded-xl bg-surface-card border border-border-subtle p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Hora</p>
              <p className="text-sm font-semibold text-text-primary">{time}</p>
              {show.endDate && (
                <p className="text-xs text-text-muted">
                  Hasta{' '}
                  {new Date(show.endDate).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-surface-card border border-border-subtle p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
              <MapPin className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Lugar</p>
              <p className="text-sm font-semibold text-text-primary">
                {show.venue}
              </p>
              {(show.address || show.city) && (
                <p className="text-xs text-text-muted">
                  {[show.address, show.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {show.ticketPrice != null && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-card border border-border-subtle p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Precio</p>
                <p className="text-sm font-semibold text-text-primary">
                  S/. {Number(show.ticketPrice).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {show.totalCapacity != null && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-card border border-border-subtle p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Capacidad</p>
                <p className="text-sm font-semibold text-text-primary">
                  {spotsLeft !== null
                    ? `${spotsLeft} lugares disponibles`
                    : `${show.totalCapacity} personas`}
                </p>
                <p className="text-xs text-text-muted">
                  {show._count.tickets} vendidos
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {show.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              Acerca del evento
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {show.description}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Own show notice for artists */}
        {isOwnShow && (
          <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-text-secondary text-center">
            Este es tu show — no puedes comprar entradas para tu propio evento.
          </div>
        )}

        {/* Already bought notice */}
        {alreadyBought && !isPast && !isCancelled && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 text-center">
            Ya compraste una entrada para este show.{' '}
            <Link href="/mis-entradas" className="underline font-medium hover:text-emerald-300">
              Ver mis entradas
            </Link>
          </div>
        )}

        {/* Buy button */}
        {canBuy && (
          <Button
            size="lg"
            className="w-full text-white shadow-lg"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Redirigiendo a Mercado Pago...
              </>
            ) : (
              <>
                <Ticket className="mr-2 h-5 w-5" />
                Comprar entrada
                {show.ticketPrice != null && (
                  <span className="ml-1">
                    — S/. {Number(show.ticketPrice).toFixed(2)}
                  </span>
                )}
              </>
            )}
          </Button>
        )}

        {soldOut && !isPast && !isCancelled && (
          <div className="text-center py-4">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-sm px-4 py-2">
              Entradas agotadas
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
