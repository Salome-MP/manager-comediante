'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Users2, MessageCircle, Megaphone, ArrowRight } from 'lucide-react';
import type { CommunityArtist } from '@/types';

export default function ComunidadesPage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();
  const [communities, setCommunities] = useState<CommunityArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setReady(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (ready && !user) {
      router.push('/login');
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (user) {
      api.get('/community/my-communities')
        .then(res => setCommunities(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-surface-deep flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-deep">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-navy-600 via-navy-700 to-navy-800 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-navy-400/15 blur-3xl" />
          <div className="absolute -top-16 -right-32 w-80 h-80 rounded-full bg-navy-300/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-navy-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <Users2 className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
              Conecta con fans
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Mis{' '}
            <span className="bg-gradient-to-r from-navy-200 via-white to-navy-200 bg-clip-text text-transparent">
              Comunidades
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            Comunidades de artistas a las que te has unido. Chatea con otros fans y lee los avisos del artista.
          </p>
          {!loading && communities.length > 0 && (
            <div className="mt-8 inline-flex items-center gap-3 sm:gap-6 rounded-2xl border border-white/20 bg-white/10 px-4 sm:px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">{communities.length}</span>
                <span className="text-sm text-white/70">
                  {communities.length === 1 ? 'comunidad' : 'comunidades'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Communities list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-overlay-light" />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="rounded-2xl border border-border-default bg-surface-sidebar p-12 text-center">
            <Users2 className="h-12 w-12 text-text-ghost mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No estas en ninguna comunidad</h3>
            <p className="text-sm text-text-dim mb-6">
              Visita el perfil de un artista y unete a su comunidad para chatear con otros fans.
            </p>
            <Link
              href="/artistas"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 transition-colors"
            >
              Explorar artistas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/comunidades/${c.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border-medium bg-surface-card p-4 hover:border-navy-500/30 hover:shadow-md hover:shadow-navy-500/5 transition-all duration-200"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {c.profileImage ? (
                    <img
                      src={c.profileImage}
                      alt={c.stageName}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-navy-600/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-navy-400">{c.stageName[0]}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary group-hover:text-navy-700 dark:hover:text-navy-200 transition-colors">
                    {c.stageName}
                  </h3>
                  {c.tagline && (
                    <p className="text-xs text-text-dim truncate mt-0.5">{c.tagline}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-text-ghost">
                      <Users2 className="h-3 w-3" />
                      {c._count.communityMembers} miembros
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-ghost">
                      <MessageCircle className="h-3 w-3" />
                      {c._count.communityMessages} mensajes
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-5 w-5 text-text-ghost group-hover:text-navy-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
