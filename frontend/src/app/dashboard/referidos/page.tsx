'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Copy, Link2, Users, DollarSign, MousePointerClick } from 'lucide-react';
import type { Referral } from '@/types';

export default function DashboardReferidosPage() {
  const { user } = useAuthStore();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReferral = useCallback(async () => {
    try {
      const { data } = await api.get('/referrals/my-referral');
      setReferral(data);
    } catch { /* no referral yet */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReferral();
  }, [fetchReferral]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/referrals/generate');
      toast.success('Codigo de referido generado!');
      fetchReferral();
    } catch {
      toast.error('Error al generar codigo');
    }
    setGenerating(false);
  };

  const copyCode = () => {
    if (referral?.code) {
      navigator.clipboard.writeText(referral.code);
      toast.success('Codigo copiado!');
    }
  };

  const copyLink = () => {
    if (referral?.code) {
      const link = `${window.location.origin}?ref=${referral.code}`;
      navigator.clipboard.writeText(link);
      toast.success('Enlace copiado!');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-overlay-light" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-overlay-light" />
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-overlay-light" />
      </div>
    );
  }

  const statItems = referral
    ? [
        {
          label: 'Referidos',
          value: referral.referredUsers?.length || 0,
          icon: Users,
          iconBg: 'bg-blue-500/15',
          iconColor: 'text-blue-400',
        },
        {
          label: 'Clicks totales',
          value: referral.totalClicks,
          icon: MousePointerClick,
          iconBg: 'bg-navy-500/15',
          iconColor: 'text-navy-400',
        },
        {
          label: 'Total ganado',
          value: `S/. ${(referral.totalEarnings || 0).toFixed(2)}`,
          icon: DollarSign,
          iconBg: 'bg-teal-500/15',
          iconColor: 'text-teal-400',
        },
        {
          label: 'Pendiente',
          value: `S/. ${(referral.pendingEarnings || 0).toFixed(2)}`,
          icon: DollarSign,
          iconBg: 'bg-amber-500/15',
          iconColor: 'text-amber-400',
        },
      ]
    : [];

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Mis Referidos</h2>
        <p className="mt-1 text-sm text-text-dim">
          Comparte tu codigo y gana comisiones por cada venta
        </p>
      </div>

      {!referral ? (
        <div className="rounded-2xl border border-border-default bg-surface-sidebar p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-500/10">
            <Link2 className="h-8 w-8 text-navy-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Aun no tienes un codigo de referido
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-dim">
            Genera tu codigo unico y comparte con tus amigos para ganar comisiones en cada compra.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 bg-navy-600 text-white hover:bg-navy-500"
          >
            {generating ? 'Generando...' : 'Generar mi codigo'}
          </Button>
        </div>
      ) : (
        <>
          {/* Code & Link */}
          <div className="rounded-2xl border border-border-default bg-surface-sidebar p-6">
            <h3 className="mb-5 text-base font-semibold text-text-primary">Tu codigo de referido</h3>
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
                  onClick={copyCode}
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
                  onClick={copyLink}
                  title="Copiar enlace"
                  className="border-border-strong bg-overlay-light text-text-dim hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-text-dim">
                Comision por referido:{' '}
                <span className="font-semibold text-navy-400">{referral.commissionRate}%</span>{' '}
                del subtotal de cada compra.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-sidebar p-5 transition-all duration-200 hover:border-border-strong"
              >
                <div
                  className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${stat.iconBg}`}
                />
                <div className="relative flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-widest text-text-dim">
                      {stat.label}
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-text-primary">
                      {stat.value}
                    </span>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} transition-transform duration-200 group-hover:scale-110`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Commissions Table */}
          {referral.commissions && referral.commissions.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-sidebar">
              <div className="border-b border-border-default px-6 py-4">
                <h3 className="text-base font-semibold text-text-primary">Historial de comisiones</h3>
                <p className="mt-0.5 text-sm text-text-dim">
                  {referral.commissions.length} registros
                </p>
              </div>
              <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="border-border-default hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                      Pedido
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                      Monto
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                      Fecha
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referral.commissions.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border-default transition-colors hover:bg-overlay-subtle"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-text-primary">
                        {c.order?.orderNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-text-primary">
                        S/. {Number(c.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                            c.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {c.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </TableCell>
                      <TableCell className="text-text-dim">
                        {new Date(c.createdAt).toLocaleDateString('es-PE')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
