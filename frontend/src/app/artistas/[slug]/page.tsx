'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
const ArtistLanyard = dynamic(() => import('@/components/artist/artist-lanyard'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] animate-pulse rounded-xl bg-muted" />
  ),
});
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  MapPin,
  ShoppingBag,
  User,
  Heart,
  Image as ImageIcon,
  Users,
  Package,
  Ticket,
  ExternalLink,
  Star,
  Play,
  Clock,
  ArrowRight,
  Sparkles,
  Users2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Calendar from 'react-calendar';
import '@/styles/calendar.css';

interface MediaItem {
  id: string;
  type: string;
  url?: string;
  title?: string;
  content?: string;
  createdAt?: string;
}

interface LandingConfig {
  accentColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  layout?: 'default' | 'compact' | 'wide';
  showBio?: boolean;
  showStats?: boolean;
  showGallery?: boolean;
  showServices?: boolean;
  bioPosition?: 'sidebar' | 'top';
}

interface ArtistProfile {
  id: string;
  stageName: string;
  slug: string;
  tagline?: string;
  biography?: string;
  profileImage?: string;
  bannerImage?: string;
  socialLinks?: { instagram?: string; tiktok?: string; youtube?: string; twitter?: string; facebook?: string };
  landingConfig?: LandingConfig;
  _count?: { followers: number };
  artistProducts: Array<{
    id: string;
    salePrice: number;
    isFeatured: boolean;
    customImages: string[];
    product: { name: string; slug: string; images: string[]; category: { name: string } };
  }>;
  shows: Array<{
    id: string;
    name: string;
    slug: string;
    venue: string;
    date: string;
    ticketPrice: number;
    ticketsEnabled: boolean;
    status: string;
    mediaItems?: MediaItem[];
  }>;
  mediaItems: MediaItem[];
  customizations: Array<{ type: string; price: number; description?: string }>;
}

const customizationLabels: Record<string, string> = {
  AUTOGRAPH: 'Autografo en producto',
  HANDWRITTEN_LETTER: 'Carta escrita a mano',
  VIDEO_GREETING: 'Video saludo personalizado',
  VIDEO_CALL: 'Videollamada con el artista',
  PRODUCT_PERSONALIZATION: 'Personalizacion de producto',
};

const customizationIcons: Record<string, React.ReactNode> = {
  AUTOGRAPH: <Star className="h-5 w-5" />,
  HANDWRITTEN_LETTER: <Sparkles className="h-5 w-5" />,
  VIDEO_GREETING: <Play className="h-5 w-5" />,
  VIDEO_CALL: <Users className="h-5 w-5" />,
  PRODUCT_PERSONALIZATION: <Package className="h-5 w-5" />,
};

function SocialIcon({ platform }: { platform: string }) {
  const cls = "h-4 w-4";
  switch (platform) {
    case 'instagram':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return <span className="text-[10px] font-bold">{platform.slice(0, 2).toUpperCase()}</span>;
  }
}

export default function ArtistProfilePage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [expandedShowGallery, setExpandedShowGallery] = useState<string | null>(null);
  const [communityMember, setCommunityMember] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);

  useEffect(() => {
    if (params.slug) {
      api.get(`/artists/public/${params.slug}`)
        .then(res => setArtist(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [params.slug]);

  useEffect(() => {
    if (user && artist) {
      api.get('/auth/followed-artists')
        .then(res => {
          const follows = res.data || [];
          setFollowing(follows.some((a: any) => a.id === artist.id));
        })
        .catch(() => {});
    }
  }, [user, artist]);

  useEffect(() => {
    if (user && artist) {
      api.get(`/community/${artist.id}/is-member`)
        .then(res => setCommunityMember(res.data.isMember))
        .catch(() => {});
    }
  }, [user, artist]);

  const handleJoinCommunity = async () => {
    if (!user) {
      toast.error('Inicia sesion para unirte a la comunidad');
      return;
    }
    if (!artist) return;
    setCommunityLoading(true);
    try {
      if (communityMember) {
        await api.delete(`/community/${artist.id}/leave`);
        setCommunityMember(false);
        toast.success('Saliste de la comunidad');
      } else {
        await api.post(`/community/${artist.id}/join`);
        setCommunityMember(true);
        toast.success('Te uniste a la comunidad');
      }
    } catch {
      toast.error('Error al procesar la solicitud');
    }
    setCommunityLoading(false);
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Inicia sesion para seguir artistas');
      return;
    }
    if (!artist) return;
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/artists/${artist.id}/follow`);
      setFollowing(data.following);
      toast.success(data.following ? 'Ahora sigues a este artista' : 'Dejaste de seguir a este artista');
    } catch {
      toast.error('Error al seguir artista');
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-border-strong border-t-navy-500 animate-spin" />
          <p className="text-sm text-text-dim tracking-widest uppercase">Cargando perfil</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <User className="h-16 w-16 text-text-muted mx-auto" />
          <p className="text-text-dim text-lg">Artista no encontrado</p>
          <Button variant="outline" asChild className="border-border-medium text-text-secondary hover:bg-surface-elevated">
            <Link href="/artistas">Ver todos los artistas</Link>
          </Button>
        </div>
      </div>
    );
  }

  const galleryImages = artist.mediaItems?.filter(m => m.type === 'image' && m.url) || [];
  const galleryVideos = artist.mediaItems?.filter(m => m.type === 'video' && m.url) || [];
  const galleryAll = [...galleryImages, ...galleryVideos];
  const socialEntries = Object.entries(artist.socialLinks || {}).filter(([, v]) => !!v);
  const upcomingShows = artist.shows.filter(s => new Date(s.date) >= new Date() && s.status !== 'CANCELLED');
  const cancelledShows = artist.shows.filter(s => s.status === 'CANCELLED');
  const pastShows = artist.shows.filter(s => (new Date(s.date) < new Date() || s.status === 'COMPLETED') && s.status !== 'CANCELLED');

  // Landing config
  const lc = artist.landingConfig || {};
  const gFrom = lc.gradientFrom || '#1B2A4A';
  const gTo = lc.gradientTo || '#d946ef';
  const accent = lc.accentColor || gFrom;
  const layout = lc.layout || 'default';
  const showBio = lc.showBio !== false;
  const showStats = lc.showStats !== false;
  const showGallery = lc.showGallery !== false;
  const showServices = lc.showServices !== false;
  const bioPosition = lc.bioPosition || 'sidebar';

  const socialHrefs: Record<string, (v: string) => string> = {
    instagram: (v) => `https://instagram.com/${v}`,
    tiktok: (v) => `https://tiktok.com/@${v}`,
    youtube: (v) => v,
    twitter: (v) => `https://twitter.com/${v}`,
    facebook: (v) => `https://facebook.com/${v}`,
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* ============================================================
          HERO SECTION — banner + perfil + stats
      ============================================================ */}
      <section className="relative">

        {/* Banner con gradiente */}
        <div className="relative h-72 md:h-96 w-full overflow-hidden">
          {artist.bannerImage ? (
            <img
              src={artist.bannerImage}
              alt={`Banner de ${artist.stageName}`}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-navy-400 via-navy-600 to-navy-800" />
          )}
          {/* Gradiente oscuro sobre el banner */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        </div>

        {/* Contenido del perfil superpuesto al banner */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="-mt-20 md:-mt-28 relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:gap-8 pb-8">

            {/* Avatar con ring de color */}
            <div className="relative shrink-0 self-center md:self-auto">
              <div className="relative h-32 w-32 md:h-44 md:w-44">
                <div className="absolute inset-0 rounded-full p-[3px]" style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}>
                  <div className="h-full w-full rounded-full bg-background p-[3px]">
                    {artist.profileImage ? (
                      <img
                        src={artist.profileImage}
                        alt={artist.stageName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-muted flex items-center justify-center">
                        <User className="h-16 w-16 text-text-dim" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info del artista */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <Badge className="mb-2 text-[11px] tracking-widest uppercase" style={{ backgroundColor: `${accent}33`, color: accent, borderColor: `${accent}4d` }}>
                  Comediante
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-text-primary leading-none">
                  {artist.stageName}
                </h1>
                {artist.tagline && (
                  <p className="mt-2 text-base md:text-lg text-text-secondary font-light">
                    {artist.tagline}
                  </p>
                )}
              </div>

              {/* Stats pill */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {artist._count && (
                  <div className="flex items-center gap-1.5 text-sm text-text-dim">
                    <Users className="h-4 w-4 text-navy-400" />
                    <span className="font-semibold text-text-primary">{artist._count.followers.toLocaleString()}</span>
                    <span>seguidores</span>
                  </div>
                )}
                {artist.artistProducts.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-text-dim">
                    <Package className="h-4 w-4 text-navy-400" />
                    <span className="font-semibold text-text-primary">{artist.artistProducts.length}</span>
                    <span>{artist.artistProducts.length === 1 ? 'producto' : 'productos'}</span>
                  </div>
                )}
                {upcomingShows.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-text-dim">
                    <Ticket className="h-4 w-4 text-pink-400" />
                    <span className="font-semibold text-text-primary">{upcomingShows.length}</span>
                    <span>{upcomingShows.length === 1 ? 'show proximo' : 'shows proximos'}</span>
                  </div>
                )}
              </div>

              {/* Social links */}
              {socialEntries.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {socialEntries.map(([platform, value]) => (
                    <a
                      key={platform}
                      href={socialHrefs[platform]?.(value as string) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-border-strong bg-overlay-light px-3 py-1.5 text-xs text-text-dim hover:border-border-accent hover:bg-overlay-strong hover:text-text-primary transition-all duration-200"
                    >
                      <SocialIcon platform={platform} />
                      <span className="capitalize">{platform}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-center md:justify-end gap-3 shrink-0">
              <Button
                onClick={handleFollow}
                disabled={followLoading}
                className={
                  following
                    ? 'bg-overlay-strong border border-border-accent text-text-primary hover:bg-overlay-hover hover:border-border-hover transition-all duration-200'
                    : 'text-white border-0 shadow-lg transition-all duration-200'
                }
                style={!following ? { background: `linear-gradient(135deg, ${gFrom}, ${gTo})`, boxShadow: `0 10px 25px -5px ${gFrom}40` } : undefined}
                size="lg"
              >
                <Heart
                  className={`mr-2 h-4 w-4 transition-all duration-200 ${following ? 'fill-red-400 text-red-400' : ''}`}
                />
                {following ? 'Siguiendo' : 'Seguir'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-border-accent text-text-primary bg-overlay-light hover:bg-overlay-strong hover:border-border-hover transition-all duration-200"
              >
                <Link href={`/artistas/${artist.slug}/tienda`}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Tienda
                </Link>
              </Button>
              <Button
                onClick={handleJoinCommunity}
                disabled={communityLoading}
                variant="outline"
                size="lg"
                className={
                  communityMember
                    ? 'bg-navy-600/20 border-navy-500/30 text-navy-600 dark:text-navy-300 hover:bg-navy-600/10 hover:border-navy-500/20 transition-all duration-200'
                    : 'border-border-accent text-text-primary bg-overlay-light hover:bg-overlay-strong hover:border-border-hover transition-all duration-200'
                }
              >
                <Users2 className="mr-2 h-4 w-4" />
                {communityMember ? 'En comunidad' : 'Unirse a comunidad'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-border-default" />

      {/* ============================================================
          CONTENIDO PRINCIPAL — bio + tabs
      ============================================================ */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Bio at top if configured */}
        {showBio && bioPosition === 'top' && artist.biography && (
          <div className="mb-8 rounded-xl bg-surface-card border border-border-default p-6 backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-3">
              Sobre el artista
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {artist.biography}
            </p>
          </div>
        )}

        <div className={layout === 'compact' ? 'max-w-3xl mx-auto' : layout === 'wide' ? 'grid gap-10 lg:grid-cols-[1fr_280px]' : 'grid gap-10 lg:grid-cols-[1fr_320px]'}>

          {/* Columna principal — tabs */}
          <div className="space-y-6">
            <Tabs defaultValue={artist.artistProducts.length > 0 ? 'productos' : artist.shows.length > 0 ? 'shows' : galleryAll.length > 0 ? 'galeria' : 'productos'}>
              <TabsList className="bg-surface-card border border-border-default h-11 gap-1">
                {artist.artistProducts.length > 0 && (
                  <TabsTrigger
                    value="productos"
                    className="data-[state=active]:bg-white data-[state=active]:text-foreground text-text-dim data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Package className="mr-1.5 h-3.5 w-3.5" />
                    Productos
                    <Badge className="ml-2 bg-overlay-strong text-text-secondary text-[10px] px-1.5 py-0 h-4 border-0">
                      {artist.artistProducts.length}
                    </Badge>
                  </TabsTrigger>
                )}
                {artist.shows.length > 0 && (
                  <TabsTrigger
                    value="shows"
                    className="data-[state=active]:bg-white data-[state=active]:text-foreground text-text-dim data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Ticket className="mr-1.5 h-3.5 w-3.5" />
                    Shows
                    <Badge className="ml-2 bg-overlay-strong text-text-secondary text-[10px] px-1.5 py-0 h-4 border-0">
                      {artist.shows.length}
                    </Badge>
                  </TabsTrigger>
                )}
                {showGallery && galleryAll.length > 0 && (
                  <TabsTrigger
                    value="galeria"
                    className="data-[state=active]:bg-white data-[state=active]:text-foreground text-text-dim data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                    Galeria
                    <Badge className="ml-2 bg-overlay-strong text-text-secondary text-[10px] px-1.5 py-0 h-4 border-0">
                      {galleryAll.length}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* TAB: PRODUCTOS */}
              {artist.artistProducts.length > 0 && (
                <TabsContent value="productos" className="mt-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">Merch oficial</h2>
                      <p className="text-sm text-text-dim mt-0.5">Productos exclusivos de {artist.stageName}</p>
                    </div>
                    <Link
                      href={`/artistas/${artist.slug}/tienda`}
                      className="flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors duration-200 group"
                    >
                      Ver tienda completa
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {artist.artistProducts.map((ap) => {
                      const imageUrl = ap.customImages?.[0] || ap.product.images?.[0];
                      return (
                        <Link key={ap.id} href={`/producto/${ap.id}`} className="group h-full">
                          <div className="relative h-full flex flex-col overflow-hidden rounded-xl bg-surface-card border border-border-default transition-all duration-300 hover:border-border-hover hover:shadow-xl hover:shadow-[var(--shadow-color)] hover:-translate-y-1">
                            <div className="aspect-square overflow-hidden bg-muted">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={ap.product.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ShoppingBag className="h-10 w-10 text-text-ghost" />
                                </div>
                              )}
                              {ap.isFeatured && (
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-amber-500/90 text-black text-[10px] font-bold border-0 px-2">
                                    Destacado
                                  </Badge>
                                </div>
                              )}
                              {/* Overlay al hacer hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                <span className="text-xs text-white font-medium flex items-center gap-1">
                                  Ver producto <ArrowRight className="h-3 w-3" />
                                </span>
                              </div>
                            </div>
                            <div className="p-3 flex flex-col flex-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] border-border-strong text-text-dim bg-transparent px-1.5 py-0 h-4 w-fit"
                              >
                                {ap.product.category.name}
                              </Badge>
                              <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 mt-1">
                                {ap.product.name}
                              </h3>
                              <p className="text-xs text-text-ghost mt-1">
                                {artist.stageName}
                              </p>
                              <p className="text-sm font-bold text-text-primary mt-auto pt-1.5">
                                S/. {Number(ap.salePrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </TabsContent>
              )}

              {/* TAB: SHOWS */}
              {artist.shows.length > 0 && (
                <TabsContent value="shows" className="mt-6">
                  {/* Interactive calendar */}
                  {upcomingShows.length > 0 && (
                    <div className="mb-8 flex flex-col items-center">
                      <Calendar
                        locale="es-PE"
                        value={calendarDate}
                        onClickDay={(date: Date) => {
                          const hasShow = artist.shows.some((s) => {
                            const sd = new Date(s.date);
                            return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate();
                          });
                          setCalendarDate(hasShow ? date : null);
                        }}
                        tileContent={({ date, view }: { date: Date; view: string }) => {
                          if (view !== 'month') return null;
                          const hasShow = artist.shows.some((s) => {
                            const sd = new Date(s.date);
                            return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate();
                          });
                          return hasShow ? <div className="calendar-show-dot" /> : null;
                        }}
                      />
                      {calendarDate && (
                        <button
                          className="mt-2 text-xs text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
                          onClick={() => setCalendarDate(null)}
                        >
                          Limpiar filtro
                        </button>
                      )}
                    </div>
                  )}

                  {/* Upcoming shows */}
                  {upcomingShows.length > 0 && (
                    <>
                      <div className="mb-5">
                        <h2 className="text-lg font-bold text-text-primary">Proximos shows</h2>
                        <p className="text-sm text-text-dim mt-0.5">Fechas en vivo de {artist.stageName}</p>
                      </div>
                      <div className="space-y-3 mb-8">
                        {upcomingShows
                          .filter((s) => {
                            if (!calendarDate) return true;
                            const sd = new Date(s.date);
                            return sd.getFullYear() === calendarDate.getFullYear() && sd.getMonth() === calendarDate.getMonth() && sd.getDate() === calendarDate.getDate();
                          })
                          .map((show) => {
                          const showDate = new Date(show.date);
                          const monthStr = showDate.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
                          const dayStr = showDate.getDate();
                          const weekdayStr = showDate.toLocaleDateString('es-PE', { weekday: 'long' });
                          const timeStr = showDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={show.id}
                              className="relative overflow-hidden rounded-xl border bg-surface-cardborder-border-medium hover:border-border-hover hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-200"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: `linear-gradient(to bottom, ${gFrom}, ${gTo})` }} />
                              <div className="flex items-center gap-4 p-4 pl-6">
                                <div className="shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-gradient-to-b from-surface-elevated to-surface-card border border-border-strong text-center">
                                  <span className="text-[10px] font-bold text-navy-400 tracking-widest leading-none">{monthStr}</span>
                                  <span className="text-2xl font-black text-text-primary leading-tight">{dayStr}</span>
                                  <div className="h-px w-8 bg-border-strong my-0.5" />
                                  <span className="text-[9px] text-text-dim leading-none capitalize">{weekdayStr.slice(0, 3)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-text-primary text-base leading-snug truncate">{show.name}</h3>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs text-text-dim">
                                      <MapPin className="h-3 w-3 text-text-dim shrink-0" />
                                      {show.venue}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-text-dim">
                                      <Clock className="h-3 w-3 text-text-dim shrink-0" />
                                      {timeStr}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right space-y-2">
                                  {show.ticketPrice && (
                                    <p className="font-bold text-text-primary text-base">S/. {Number(show.ticketPrice).toFixed(2)}</p>
                                  )}
                                  {show.ticketsEnabled && (
                                    <Button
                                      size="sm"
                                      className="text-white border-0 shadow-md text-xs"
                                      style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                                      asChild
                                    >
                                      <Link href={`/shows/${show.slug}`}>
                                        <Ticket className="mr-1.5 h-3 w-3" />
                                        Comprar entrada
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Cancelled shows */}
                  {cancelledShows.length > 0 && (
                    <>
                      <div className="mb-5">
                        <h2 className="text-lg font-bold text-text-primary">Shows cancelados</h2>
                      </div>
                      <div className="space-y-3 mb-8">
                        {cancelledShows.map((show) => {
                          const showDate = new Date(show.date);
                          const monthStr = showDate.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
                          const dayStr = showDate.getDate();
                          const weekdayStr = showDate.toLocaleDateString('es-PE', { weekday: 'long' });
                          const timeStr = showDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={show.id}
                              className="relative overflow-hidden rounded-xl border bg-surface-card border-red-500/20 opacity-70 transition-all duration-200"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-red-500" />
                              <div className="flex items-center gap-4 p-4 pl-6">
                                <div className="shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-gradient-to-b from-surface-elevated to-surface-card border border-red-500/30 text-center">
                                  <span className="text-[10px] font-bold text-red-400 tracking-widest leading-none">{monthStr}</span>
                                  <span className="text-2xl font-black text-text-dim leading-tight line-through">{dayStr}</span>
                                  <div className="h-px w-8 bg-border-strong my-0.5" />
                                  <span className="text-[9px] text-text-ghost leading-none capitalize">{weekdayStr.slice(0, 3)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-text-dim text-base leading-snug truncate line-through">{show.name}</h3>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs text-text-ghost">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      {show.venue}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-text-ghost">
                                      <Clock className="h-3 w-3 shrink-0" />
                                      {timeStr}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10">
                                    Cancelado
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Past shows */}
                  {pastShows.length > 0 && (
                    <>
                      <div className="mb-5">
                        <h2 className="text-lg font-bold text-text-primary">Shows pasados</h2>
                        <p className="text-sm text-text-dim mt-0.5">Historial de presentaciones</p>
                      </div>
                      <div className="space-y-3">
                        {pastShows.map((show) => {
                          const showDate = new Date(show.date);
                          const monthStr = showDate.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
                          const dayStr = showDate.getDate();
                          const weekdayStr = showDate.toLocaleDateString('es-PE', { weekday: 'long' });
                          const timeStr = showDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                          const showMedia = show.mediaItems?.filter(m => m.url) || [];
                          const isExpanded = expandedShowGallery === show.id;

                          return (
                            <div
                              key={show.id}
                              className="relative overflow-hidden rounded-xl border bg-surface-card border-border-default transition-all duration-200"
                            >
                              <div className="flex items-center gap-4 p-4 pl-5">
                                <div className="shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-gradient-to-b from-surface-elevated to-surface-card border border-border-strong text-center">
                                  <span className="text-[10px] font-bold text-text-dim tracking-widest leading-none">{monthStr}</span>
                                  <span className="text-2xl font-black text-text-dim leading-tight">{dayStr}</span>
                                  <div className="h-px w-8 bg-border-strong my-0.5" />
                                  <span className="text-[9px] text-text-ghost leading-none capitalize">{weekdayStr.slice(0, 3)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-text-dim text-base leading-snug truncate">{show.name}</h3>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs text-text-ghost">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      {show.venue}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-text-ghost">
                                      <Clock className="h-3 w-3 shrink-0" />
                                      {timeStr}
                                    </span>
                                  </div>
                                  {/* Show media thumbnails inline */}
                                  {showMedia.length > 0 && !isExpanded && (
                                    <div className="flex items-center gap-2 mt-2">
                                      {showMedia.slice(0, 3).map((m) => (
                                        <div key={m.id} className="h-10 w-10 rounded-lg overflow-hidden border border-border-strong">
                                          <img src={m.url!} alt="" className="h-full w-full object-cover" />
                                        </div>
                                      ))}
                                      {showMedia.length > 3 && (
                                        <span className="text-[10px] text-text-ghost">+{showMedia.length - 3} mas</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-right space-y-2">
                                  <Badge variant="outline" className="text-[10px] border-border-medium text-text-ghost">
                                    Finalizado
                                  </Badge>
                                  {showMedia.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-text-dim hover:text-text-primary"
                                      onClick={() => setExpandedShowGallery(isExpanded ? null : show.id)}
                                    >
                                      <ImageIcon className="mr-1 h-3 w-3" />
                                      {showMedia.length} fotos
                                      {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {/* Expanded gallery */}
                              {isExpanded && showMedia.length > 0 && (
                                <div className="border-t border-border-default px-4 pb-4 pt-3">
                                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                    {showMedia.map((m) => (
                                      <div key={m.id} className="aspect-square overflow-hidden rounded-lg border border-border-default">
                                        <img src={m.url!} alt={m.title || ''} className="h-full w-full object-cover hover:scale-110 transition-transform duration-300" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </TabsContent>
              )}

              {/* TAB: GALERIA */}
              {showGallery && galleryAll.length > 0 && (
                <TabsContent value="galeria" className="mt-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-text-primary">Galeria</h2>
                    <p className="text-sm text-text-dim mt-0.5">Fotos y videos de {artist.stageName}</p>
                  </div>

                  {/* Photos & Videos Grid */}
                  {galleryAll.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {galleryAll.map((item) => (
                        <div
                          key={item.id}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-surface-card border border-border-default hover:border-border-hover transition-all duration-300"
                        >
                          {item.type === 'video' ? (
                            <>
                              <video
                                src={item.url!}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                                onMouseOut={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 ring-1 ring-border-strong group-hover:scale-110 transition-transform">
                                  <Play className="h-5 w-5 text-white ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img
                              src={item.url!}
                              alt={item.title || ''}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          )}
                          {item.title && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs text-white truncate">{item.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}

            </Tabs>

            {/* Estado vacío si no hay ninguna sección */}
            {artist.artistProducts.length === 0 && artist.shows.length === 0 && galleryAll.length === 0 && (
              <div className="text-center py-20 text-text-ghost">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>Este artista aun no tiene contenido publicado</p>
              </div>
            )}
          </div>

          {/* ============================================================
              SIDEBAR DERECHA — bio + servicios
          ============================================================ */}
          {layout !== 'compact' && (
          <aside className="space-y-6">

            {/* 3D Lanyard Badge */}
            <div className="rounded-xl border border-border-default bg-surface-card backdrop-blur-sm overflow-hidden">
              <div className="h-[420px]">
                <ArtistLanyard
                  artistName={artist.stageName}
                  artistImage={artist.profileImage}
                  accentColor={accent}
                  tagline={artist.tagline}
                />
              </div>
              <div className="px-4 pb-3 pt-1 text-center">
                <p className="text-[11px] text-text-ghost tracking-wider uppercase">Arrastra el carnet</p>
              </div>
            </div>

            {/* Bio */}
            {showBio && bioPosition === 'sidebar' && artist.biography && (
              <div className="rounded-xl bg-surface-card border border-border-default p-5 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-3">
                  Sobre el artista
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {artist.biography}
                </p>
              </div>
            )}

            {/* Estadisticas */}
            {showStats && (artist._count || artist.artistProducts.length > 0) && (
              <div className="rounded-xl bg-surface-card border border-border-default p-5 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-4">
                  Estadisticas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {artist._count && (
                    <div className="rounded-lg bg-surface-elevated border border-border-default p-3 text-center">
                      <p className="text-2xl font-black text-text-primary">{artist._count.followers.toLocaleString()}</p>
                      <p className="text-[11px] text-text-dim mt-0.5">Seguidores</p>
                    </div>
                  )}
                  {artist.artistProducts.length > 0 && (
                    <div className="rounded-lg bg-surface-elevated border border-border-default p-3 text-center">
                      <p className="text-2xl font-black text-text-primary">{artist.artistProducts.length}</p>
                      <p className="text-[11px] text-text-dim mt-0.5">Productos</p>
                    </div>
                  )}
                  {artist.shows.length > 0 && (
                    <div className="rounded-lg bg-surface-elevated border border-border-default p-3 text-center">
                      <p className="text-2xl font-black text-text-primary">{artist.shows.length}</p>
                      <p className="text-[11px] text-text-dim mt-0.5">Shows totales</p>
                    </div>
                  )}
                  {upcomingShows.length > 0 && (
                    <div className="rounded-lg bg-surface-elevated border border-border-default p-3 text-center">
                      <p className="text-2xl font-black text-text-primary">{upcomingShows.length}</p>
                      <p className="text-[11px] text-text-dim mt-0.5">Shows proximos</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Servicios personalizados */}
            {showServices && artist.customizations.length > 0 && (
              <div className="rounded-xl bg-surface-card border border-border-default p-5 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-4">
                  Servicios exclusivos
                </h3>
                <div className="space-y-3">
                  {artist.customizations.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-surface-elevated border border-border-default p-3 hover:border-border-strong transition-colors duration-200"
                    >
                      <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border" style={{ backgroundColor: `${accent}20`, color: accent, borderColor: `${accent}33` }}>
                        {customizationIcons[c.type] || <Star className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-snug">
                          {customizationLabels[c.type] || c.type.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        {c.description && (
                          <p className="text-xs text-text-dim mt-0.5 line-clamp-2">{c.description}</p>
                        )}
                        <p className="text-xs font-bold text-emerald-400 mt-1.5">
                          + S/. {Number(c.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA tienda */}
            {artist.artistProducts.length > 0 && (
              <div className="rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 blur-xl" style={{ background: `linear-gradient(135deg, ${gFrom}4d, ${gTo}4d)` }} />
                <div className="relative rounded-xl border border-border-strong bg-surface-card p-5 backdrop-blur-sm text-center space-y-3">
                  <ShoppingBag className="h-8 w-8 text-navy-400 mx-auto" />
                  <div>
                    <p className="font-bold text-text-primary">Tienda oficial</p>
                    <p className="text-xs text-text-dim mt-0.5">
                      {artist.artistProducts.length} productos exclusivos
                    </p>
                  </div>
                  <Button
                    className="w-full text-white border-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                    asChild
                  >
                    <Link href={`/artistas/${artist.slug}/tienda`}>
                      Ir a la tienda
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </aside>
          )}
        </div>
      </div>
    </div>
  );
}
