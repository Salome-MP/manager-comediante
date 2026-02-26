'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 bg-surface-base">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-navy-600/10 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-border-strong bg-surface-card p-8 shadow-2xl shadow-[var(--shadow-color)] text-center">
            <p className="text-text-muted mb-4">Enlace invalido o expirado.</p>
            <Button
              asChild
              className="bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25"
            >
              <Link href="/forgot-password">Solicitar nuevo enlace</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch {
      toast.error('Token invalido o expirado. Solicita un nuevo enlace.');
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 bg-surface-base">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-navy-600/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-navy-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-black text-gradient-navy">Comediantes</span>
            <span className="text-2xl font-black text-text-muted">.com</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-text-muted">Elige una contraseña segura</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-strong bg-surface-card p-8 shadow-2xl shadow-[var(--shadow-color)]">
          {success ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Contraseña actualizada</h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  Tu contraseña ha sido restablecida exitosamente.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 transition-all duration-200"
              >
                <Link href="/login">Iniciar sesion</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-text-secondary text-sm font-medium">
                  Nueva contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-text-secondary text-sm font-medium">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Restablecer contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
