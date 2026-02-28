'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Palette, Eye, Save, RotateCcw } from 'lucide-react';

interface LandingConfig {
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  layout: 'default' | 'compact' | 'wide';
  showBio: boolean;
  showStats: boolean;
  showGallery: boolean;
  showServices: boolean;
  bioPosition: 'sidebar' | 'top';
}

const DEFAULT_CONFIG: LandingConfig = {
  accentColor: '#1B2A4A',
  gradientFrom: '#1B2A4A',
  gradientTo: '#d946ef',
  layout: 'default',
  showBio: true,
  showStats: true,
  showGallery: true,
  showServices: true,
  bioPosition: 'sidebar',
};

const ACCENT_PRESETS = [
  { label: 'Azul Marino', from: '#1B2A4A', to: '#5575A7' },
  { label: 'Azul', from: '#2563eb', to: '#06b6d4' },
  { label: 'Rojo', from: '#dc2626', to: '#f97316' },
  { label: 'Verde', from: '#059669', to: '#22d3ee' },
  { label: 'Rosa', from: '#ec4899', to: '#f43f5e' },
  { label: 'Dorado', from: '#d97706', to: '#fbbf24' },
];

export default function LandingConfigPage() {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<LandingConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artistSlug, setArtistSlug] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!user?.artistId) return;
    try {
      const [configRes, artistRes] = await Promise.all([
        api.get(`/artists/${user.artistId}/landing-config`),
        api.get(`/artists/${user.artistId}`),
      ]);
      if (configRes.data && typeof configRes.data === 'object' && Object.keys(configRes.data).length > 0) {
        setConfig({ ...DEFAULT_CONFIG, ...configRes.data });
      }
      if (artistRes.data?.slug) {
        setArtistSlug(artistRes.data.slug);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!user?.artistId) return;
    setSaving(true);
    try {
      await api.patch(`/artists/${user.artistId}/landing-config`, config);
      toast.success('Configuracion guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const updateConfig = (key: keyof LandingConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Landing Page</h2>
          <p className="mt-1 text-sm text-text-dim">Personaliza la apariencia de tu perfil publico</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-border-strong bg-overlay-light text-text-secondary hover:border-border-accent hover:text-text-primary"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restablecer
          </Button>
          {artistSlug && (
            <Button
              variant="outline"
              asChild
              className="border-border-strong bg-overlay-light text-text-secondary hover:border-border-accent hover:text-text-primary"
            >
              <a href={`/artistas/${artistSlug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                Ver perfil
              </a>
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-navy-600 text-white hover:bg-navy-500"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Settings */}
        <div className="space-y-6">
          {/* Color scheme */}
          <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Palette className="h-4 w-4 text-navy-400" />
              Esquema de colores
            </h3>

            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Presets</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ACCENT_PRESETS.map((preset) => {
                  const isActive = config.gradientFrom === preset.from && config.gradientTo === preset.to;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        updateConfig('accentColor', preset.from);
                        updateConfig('gradientFrom', preset.from);
                        updateConfig('gradientTo', preset.to);
                      }}
                      className={`rounded-xl border p-2 text-center transition-all ${
                        isActive
                          ? 'border-navy-500 ring-1 ring-navy-500/30'
                          : 'border-border-default hover:border-border-accent'
                      }`}
                    >
                      <div
                        className="mx-auto h-8 w-8 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                      />
                      <p className="mt-1.5 text-[10px] text-text-dim">{preset.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Color primario</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.gradientFrom}
                    onChange={(e) => {
                      updateConfig('gradientFrom', e.target.value);
                      updateConfig('accentColor', e.target.value);
                    }}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-border-strong bg-transparent"
                  />
                  <Input
                    value={config.gradientFrom}
                    onChange={(e) => {
                      updateConfig('gradientFrom', e.target.value);
                      updateConfig('accentColor', e.target.value);
                    }}
                    className="flex-1 border-border-strong bg-overlay-light text-text-primary font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-dim">Color secundario</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.gradientTo}
                    onChange={(e) => updateConfig('gradientTo', e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-border-strong bg-transparent"
                  />
                  <Input
                    value={config.gradientTo}
                    onChange={(e) => updateConfig('gradientTo', e.target.value)}
                    className="flex-1 border-border-strong bg-overlay-light text-text-primary font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Diseno</h3>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Estilo de layout</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['default', 'compact', 'wide'] as const).map((layout) => {
                  const labels = { default: 'Estandar', compact: 'Compacto', wide: 'Amplio' };
                  const descs = { default: 'Columnas equilibradas', compact: 'Todo en una columna', wide: 'Mas espacio visual' };
                  return (
                    <button
                      key={layout}
                      onClick={() => updateConfig('layout', layout)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        config.layout === layout
                          ? 'border-navy-500/50 bg-navy-600/10'
                          : 'border-border-default hover:border-border-accent'
                      }`}
                    >
                      <p className={`text-sm font-medium ${config.layout === layout ? 'text-navy-600 dark:text-navy-300' : 'text-text-primary'}`}>
                        {labels[layout]}
                      </p>
                      <p className="text-[11px] text-text-ghost mt-0.5">{descs[layout]}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-text-dim">Posicion de la biografia</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['sidebar', 'top'] as const).map((pos) => {
                  const labels = { sidebar: 'Barra lateral', top: 'Arriba del contenido' };
                  return (
                    <button
                      key={pos}
                      onClick={() => updateConfig('bioPosition', pos)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        config.bioPosition === pos
                          ? 'border-navy-500/50 bg-navy-600/10'
                          : 'border-border-default hover:border-border-accent'
                      }`}
                    >
                      <p className={`text-sm font-medium ${config.bioPosition === pos ? 'text-navy-600 dark:text-navy-300' : 'text-text-primary'}`}>
                        {labels[pos]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sections visibility */}
          <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Secciones visibles</h3>
            <div className="space-y-3">
              {([
                { key: 'showBio', label: 'Biografia', desc: 'Muestra la seccion "Sobre el artista"' },
                { key: 'showStats', label: 'Estadisticas', desc: 'Muestra seguidores, productos, shows' },
                { key: 'showGallery', label: 'Galeria', desc: 'Muestra fotos y videos' },
                { key: 'showServices', label: 'Servicios', desc: 'Muestra personalizaciones disponibles' },
              ] as const).map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-border-default bg-overlay-subtle px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-[11px] text-text-ghost">{desc}</p>
                  </div>
                  <button
                    onClick={() => updateConfig(key, !config[key])}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      config[key] ? 'bg-navy-600' : 'bg-muted-foreground/40'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        config[key] ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Vista previa</h3>
          <div className="rounded-2xl border border-border-default bg-surface-deep overflow-hidden">
            {/* Mini banner */}
            <div
              className="h-20"
              style={{ background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})` }}
            />
            {/* Mini profile */}
            <div className="px-4 -mt-6 pb-4">
              <div
                className="h-12 w-12 rounded-full border-2 flex items-center justify-center text-white text-sm font-bold"
                style={{
                  borderColor: config.accentColor,
                  background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
                }}
              >
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="mt-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-1 h-2 w-16 rounded bg-muted/60" />
              </div>

              {/* Action buttons preview */}
              <div className="mt-3 flex gap-2">
                <div
                  className="h-6 w-16 rounded-full text-[8px] flex items-center justify-center text-white font-medium"
                  style={{ background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})` }}
                >
                  Seguir
                </div>
                <div className="h-6 w-14 rounded-full border border-border-medium text-[8px] flex items-center justify-center text-text-muted font-medium">
                  Tienda
                </div>
              </div>

              {/* Content preview */}
              <div className={`mt-4 ${config.layout === 'compact' ? 'space-y-3' : 'grid grid-cols-[1fr_80px] gap-3'}`}>
                <div className="space-y-2">
                  {/* Tabs */}
                  <div className="flex gap-1">
                    <div className="h-5 w-14 rounded bg-muted text-[7px] flex items-center justify-center text-text-muted">
                      Productos
                    </div>
                    <div className="h-5 w-10 rounded bg-muted/50 text-[7px] flex items-center justify-center text-text-dim">
                      Shows
                    </div>
                    {config.showGallery && (
                      <div className="h-5 w-10 rounded bg-muted/50 text-[7px] flex items-center justify-center text-text-dim">
                        Galeria
                      </div>
                    )}
                  </div>
                  {/* Product cards */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-md bg-surface-card border border-border-default overflow-hidden">
                        <div className="aspect-square bg-muted" />
                        <div className="p-1.5 space-y-0.5">
                          <div className="h-1.5 w-full rounded bg-muted" />
                          <div className="h-1.5 w-8 rounded bg-muted/60" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {config.layout !== 'compact' && (
                  <div className="space-y-2">
                    {config.showBio && (
                      <div className="rounded-md bg-surface-card border border-border-default p-2 space-y-1">
                        <div className="h-1.5 w-10 rounded bg-muted-foreground/30" />
                        <div className="h-1 w-full rounded bg-muted" />
                        <div className="h-1 w-full rounded bg-muted" />
                        <div className="h-1 w-12 rounded bg-muted" />
                      </div>
                    )}
                    {config.showStats && (
                      <div className="rounded-md bg-surface-card border border-border-default p-2">
                        <div className="grid grid-cols-2 gap-1">
                          {[1, 2].map((i) => (
                            <div key={i} className="rounded bg-muted/60 p-1 text-center">
                              <div className="h-2 w-4 rounded bg-muted-foreground/30 mx-auto" />
                              <div className="h-1 w-6 rounded bg-muted mx-auto mt-0.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {config.showServices && (
                      <div className="rounded-md bg-surface-card border border-border-default p-2 space-y-1">
                        <div className="h-1.5 w-10 rounded bg-muted-foreground/30" />
                        <div className="flex items-center gap-1 rounded bg-muted/50 p-1">
                          <div
                            className="h-3 w-3 rounded"
                            style={{ background: `${config.accentColor}33` }}
                          />
                          <div className="h-1 w-10 rounded bg-muted" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-text-ghost text-center">
            Los colores se aplican al avatar, botones y acentos de tu perfil publico
          </p>
        </div>
      </div>
    </div>
  );
}
