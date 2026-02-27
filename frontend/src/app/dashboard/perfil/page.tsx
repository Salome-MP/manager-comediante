'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Upload, User, Image as ImageIcon, Trash2 } from 'lucide-react';

interface MediaItem {
  id: string;
  type: string;
  url?: string;
  title?: string;
  content?: string;
  createdAt?: string;
}

interface ArtistProfile {
  id: string;
  stageName: string;
  slug: string;
  tagline?: string;
  biography?: string;
  profileImage?: string;
  bannerImage?: string;
  socialLinks?: { instagram?: string; tiktok?: string; youtube?: string };
  commissionRate: number;
  isActive: boolean;
}

export default function ArtistPerfilPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [form, setForm] = useState({
    stageName: '',
    tagline: '',
    biography: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  });

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.artistId) return;

    async function fetchProfile() {
      try {
        const [{ data: profileData }, { data: galleryData }] = await Promise.all([
          api.get(`/artists/${user!.artistId}`),
          api.get(`/artists/${user!.artistId}/gallery`),
        ]);
        setProfile(profileData);
        setGallery(Array.isArray(galleryData) ? galleryData : []);
        const links = profileData.socialLinks || {};
        setForm({
          stageName: profileData.stageName || '',
          tagline: profileData.tagline || '',
          biography: profileData.biography || '',
          instagram: links.instagram || '',
          tiktok: links.tiktok || '',
          youtube: links.youtube || '',
        });
      } catch {
        toast.error('Error al cargar tu perfil');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;
    if (!form.stageName.trim()) {
      toast.error('El nombre artistico es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        stageName: form.stageName.trim(),
        tagline: form.tagline.trim() || null,
        biography: form.biography.trim() || null,
        socialLinks: {
          instagram: form.instagram.trim() || undefined,
          tiktok: form.tiktok.trim() || undefined,
          youtube: form.youtube.trim() || undefined,
        },
      };

      const { data } = await api.patch(`/artists/${profile.id}`, body);
      setProfile(data);
      toast.success('Perfil actualizado exitosamente');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (type: 'profile' | 'banner' | 'gallery', file: File) => {
    if (!profile) return;
    setUploading(type);

    const formData = new FormData();
    formData.append('file', file);

    try {
      let endpoint = '';
      if (type === 'profile') endpoint = `/upload/artist/${profile.id}/profile`;
      else if (type === 'banner') endpoint = `/upload/artist/${profile.id}/banner`;
      else endpoint = `/upload/artist/${profile.id}/gallery`;

      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (type === 'profile') {
        setProfile(prev => prev ? { ...prev, profileImage: data.url } : prev);
      } else if (type === 'banner') {
        setProfile(prev => prev ? { ...prev, bannerImage: data.url } : prev);
      } else {
        setGallery(prev => [...prev, data]);
      }
      toast.success('Imagen subida exitosamente');
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteGalleryItem = async (mediaItemId: string) => {
    if (!profile) return;
    try {
      await api.delete(`/artists/${profile.id}/gallery/${mediaItemId}`);
      setGallery(prev => prev.filter(m => m.id !== mediaItemId));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
          <p className="text-sm text-text-dim">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <div className="rounded-xl bg-overlay-light p-4">
          <User className="h-8 w-8 text-text-ghost" />
        </div>
        <p className="text-sm text-text-dim">No se encontro tu perfil de artista.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Mi Perfil</h2>
        <p className="mt-1 text-sm text-text-dim">Edita tu informacion publica como artista.</p>
      </div>

      {/* Images Upload Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Image */}
        <div className="rounded-2xl border border-border-default bg-surface-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Foto de perfil</h3>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border-strong bg-overlay-light">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-text-dim" />
              )}
            </div>
            <div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleUpload('profile', e.target.files[0])}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => profileInputRef.current?.click()}
                disabled={uploading === 'profile'}
                className="border-border-strong bg-overlay-light text-text-secondary hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
              >
                {uploading === 'profile' ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Cambiar foto</>
                )}
              </Button>
              <p className="mt-1.5 text-xs text-text-ghost">JPG, PNG o WEBP. Max 10MB.</p>
            </div>
          </div>
        </div>

        {/* Banner Image */}
        <div className="rounded-2xl border border-border-default bg-surface-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Banner / Portada</h3>
          <div className="mb-3 h-28 w-full overflow-hidden rounded-xl border border-border-medium bg-overlay-light">
            {profile.bannerImage ? (
              <img src={profile.bannerImage} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-7 w-7 text-text-ghost" />
              </div>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && handleUpload('banner', e.target.files[0])}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading === 'banner'}
            className="border-border-strong bg-overlay-light text-text-secondary hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
          >
            {uploading === 'banner' ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Cambiar banner</>
            )}
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="rounded-2xl border border-border-default bg-surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Galeria</h3>
            <p className="text-xs text-text-dim">{gallery.length} fotos</p>
          </div>
          <div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleUpload('gallery', e.target.files[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading === 'gallery'}
              className="border-border-strong bg-overlay-light text-text-secondary hover:border-border-accent hover:bg-overlay-medium hover:text-text-primary"
            >
              {uploading === 'gallery' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Agregar foto</>
              )}
            </Button>
          </div>
        </div>
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <div className="rounded-xl bg-overlay-light p-3">
              <ImageIcon className="h-6 w-6 text-text-ghost" />
            </div>
            <p className="text-sm text-text-dim">Aun no tienes fotos en tu galeria</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {gallery.filter(m => m.url).map((item) => (
              <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border-default">
                <img src={item.url!} alt={item.title || ''} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/40" />
                <button
                  onClick={() => handleDeleteGalleryItem(item.id)}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-red-500/90 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="rounded-2xl border border-border-default bg-surface-card p-5 lg:col-span-2">
          <h3 className="mb-5 text-sm font-semibold text-text-primary">Informacion del Artista</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stageName" className="text-xs font-medium text-text-dim">
                Nombre artistico *
              </Label>
              <Input
                id="stageName"
                value={form.stageName}
                onChange={(e) => setForm({ ...form, stageName: e.target.value })}
                placeholder="Tu nombre artistico"
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-xs font-medium text-text-dim">
                Tagline
              </Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="Una frase corta que te describa"
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biography" className="text-xs font-medium text-text-dim">
                Biografia
              </Label>
              <Textarea
                id="biography"
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Cuentale al mundo sobre ti..."
                rows={6}
                className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
              />
            </div>

            <Separator className="bg-border-default" />

            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-dim">
              Redes sociales
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-text-dim">
                  <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  Instagram
                </Label>
                <Input
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@usuario"
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-text-dim">
                  <svg className="h-4 w-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
                  </svg>
                  TikTok
                </Label>
                <Input
                  value={form.tiktok}
                  onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                  placeholder="@usuario"
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-text-dim">
                  <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
                  </svg>
                  YouTube
                </Label>
                <Input
                  value={form.youtube}
                  onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                  placeholder="URL del canal"
                  className="border-border-strong bg-overlay-light text-text-primary placeholder:text-text-ghost focus:border-navy-500 focus:ring-navy-500/20"
                />
              </div>
            </div>

            <Separator className="bg-border-default" />

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-navy-600 text-white hover:bg-navy-500 disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>
              )}
            </Button>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="rounded-2xl border border-border-default bg-surface-card p-5">
          <h3 className="mb-5 text-sm font-semibold text-text-primary">Resumen</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-text-dim">Slug</p>
              <p className="mt-1 font-mono text-sm text-text-secondary">{profile.slug}</p>
            </div>
            <Separator className="bg-border-default" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-text-dim">Estado</p>
              <span
                className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                  profile.isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {profile.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <Separator className="bg-border-default" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-text-dim">Comision</p>
              <p className="mt-1 text-sm font-semibold text-navy-400">{profile.commissionRate}%</p>
            </div>
            <Separator className="bg-border-default" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-text-dim">Fotos en galeria</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{gallery.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
