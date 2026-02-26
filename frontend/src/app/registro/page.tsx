'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mic } from 'lucide-react';
import ShapesMascot, { type Expression } from '@/components/auth/shapes-mascot';
import { getStoredReferralCode, clearStoredReferralCode } from '@/components/referral-capture';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading } = useAuthStore();
  const referralCode = searchParams.get('ref') || getStoredReferralCode() || '';
  const [accountType, setAccountType] = useState<'user' | 'artist'>('user');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    stageName: '',
    tagline: '',
    biography: '',
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState<Expression>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [registerResult, setRegisterResult] = useState<'none' | 'error' | 'success' | 'pending'>('none');
  const [errorCount, setErrorCount] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Derive expression from state
  useEffect(() => {
    if (registerResult === 'success' || registerResult === 'pending') {
      setExpression('success');
      return;
    }
    if (registerResult === 'error') {
      if (errorCount >= 3) {
        setExpression('scared');
      } else {
        setExpression('error');
      }
      const timer = setTimeout(() => {
        setRegisterResult('none');
      }, 2500);
      return () => clearTimeout(timer);
    }

    if (focusedField === 'password') {
      setExpression('typing-password');
    } else if (focusedField === 'email') {
      setExpression('typing-email');
    } else if (focusedField === 'firstName' || focusedField === 'lastName') {
      setExpression('typing-name');
    } else {
      setExpression('idle');
    }
  }, [focusedField, registerResult, errorCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      };

      if (accountType === 'artist') {
        payload.registerAsArtist = true;
        payload.stageName = form.stageName;
        if (form.tagline.trim()) payload.tagline = form.tagline.trim();
        if (form.biography.trim()) payload.biography = form.biography.trim();
      }

      if (referralCode) {
        payload.referralCode = referralCode;
      }

      await register(payload);
      setErrorCount(0);
      clearStoredReferralCode();

      if (accountType === 'artist') {
        setRegisterResult('pending');
        toast.success('Cuenta creada. Pendiente de aprobacion del administrador.');
      } else {
        setRegisterResult('success');
        toast.success('Cuenta creada correctamente');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch {
      setErrorCount((prev) => prev + 1);
      setRegisterResult('error');
      toast.error('Error al crear la cuenta. Intenta con otro email.');
    }
  };

  return (
    <div
      className="relative flex min-h-screen bg-surface-base overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-navy-600/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-navy-500/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-navy-500/5 blur-3xl" />
      </div>

      {/* Left side — Animated shapes (hidden on mobile) */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-600/10 via-transparent to-navy-900/10" />
        <div className="relative z-10 w-full max-w-sm px-8">
          <ShapesMascot
            mousePos={mousePos}
            expression={expression}
            passwordLength={form.password.length}
          />
        </div>
      </div>

      {/* Right side — Register form */}
      <div className="relative flex w-full md:w-1/2 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-black text-gradient-navy">Comediantes</span>
              <span className="text-2xl font-black text-text-muted">.com</span>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Crear cuenta</h1>
            <p className="mt-1 text-sm text-text-muted">Unete a la comunidad</p>
          </div>

          {/* Account type selector — above card */}
          {registerResult !== 'pending' && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('user')}
              className={`group relative rounded-xl border p-4 text-left transition-all duration-200 ${
                accountType === 'user'
                  ? 'border-navy-500 bg-navy-500/10 shadow-lg shadow-navy-500/10'
                  : 'border-border-strong bg-surface-card hover:border-border-default hover:bg-overlay-light'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  accountType === 'user'
                    ? 'bg-navy-500/20 text-navy-400'
                    : 'bg-overlay-light text-text-ghost group-hover:text-text-dim'
                }`}>
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-colors ${
                    accountType === 'user' ? 'text-navy-600 dark:text-navy-300' : 'text-text-secondary group-hover:text-text-primary'
                  }`}>
                    Fan / Usuario
                  </p>
                  <p className={`text-xs transition-colors ${
                    accountType === 'user' ? 'text-navy-400/70' : 'text-text-ghost'
                  }`}>
                    Compra y sigue artistas
                  </p>
                </div>
              </div>
              {accountType === 'user' && (
                <div className="absolute -top-px -right-px h-3 w-3 rounded-bl-lg rounded-tr-xl bg-navy-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAccountType('artist')}
              className={`group relative rounded-xl border p-4 text-left transition-all duration-200 ${
                accountType === 'artist'
                  ? 'border-navy-500 bg-navy-500/10 shadow-lg shadow-navy-500/10'
                  : 'border-border-strong bg-surface-card hover:border-border-default hover:bg-overlay-light'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  accountType === 'artist'
                    ? 'bg-navy-500/20 text-navy-400'
                    : 'bg-overlay-light text-text-ghost group-hover:text-text-dim'
                }`}>
                  <Mic className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-colors ${
                    accountType === 'artist' ? 'text-navy-600 dark:text-navy-300' : 'text-text-secondary group-hover:text-text-primary'
                  }`}>
                    Artista
                  </p>
                  <p className={`text-xs transition-colors ${
                    accountType === 'artist' ? 'text-navy-400/70' : 'text-text-ghost'
                  }`}>
                    Vende merch y shows
                  </p>
                </div>
              </div>
              {accountType === 'artist' && (
                <div className="absolute -top-px -right-px h-3 w-3 rounded-bl-lg rounded-tr-xl bg-navy-500" />
              )}
            </button>
          </div>
          )}

          {/* Pending approval message */}
          {registerResult === 'pending' && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                  <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-amber-300">Cuenta creada exitosamente</h3>
              <p className="text-sm text-amber-200/80">
                Tu solicitud como artista esta pendiente de aprobacion por el administrador.
                Te notificaremos cuando tu cuenta sea activada.
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  Ir al login
                </Button>
              </Link>
            </div>
          )}

          {/* Card */}
          {registerResult !== 'pending' && (
          <div className="rounded-2xl border border-border-strong bg-surface-card p-8 shadow-2xl shadow-[var(--shadow-color)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-text-secondary text-sm font-medium">
                    Nombre
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    onFocus={() => {
                      setFocusedField('firstName');
                      setRegisterResult('none');
                    }}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Juan"
                    required
                    className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-text-secondary text-sm font-medium">
                    Apellido
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    onFocus={() => {
                      setFocusedField('lastName');
                      setRegisterResult('none');
                    }}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Perez"
                    required
                    className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-text-secondary text-sm font-medium">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  onFocus={() => {
                    setFocusedField('email');
                    setRegisterResult('none');
                  }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="tu@email.com"
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-text-secondary text-sm font-medium">
                  Contrasena
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  onFocus={() => {
                    setFocusedField('password');
                    setRegisterResult('none');
                  }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Minimo 6 caracteres"
                  minLength={6}
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>

              {/* Artist-specific fields */}
              {accountType === 'artist' && (
                <>
                  <div className="border-t border-border-strong pt-4">
                    <p className="text-xs text-text-dim mb-3">Datos de artista</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stageName" className="text-text-secondary text-sm font-medium">
                      Nombre artistico *
                    </Label>
                    <Input
                      id="stageName"
                      value={form.stageName}
                      onChange={(e) => update('stageName', e.target.value)}
                      onFocus={() => {
                        setFocusedField('stageName');
                        setRegisterResult('none');
                      }}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Tu nombre de escenario"
                      required
                      className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagline" className="text-text-secondary text-sm font-medium">
                      Tagline
                    </Label>
                    <Input
                      id="tagline"
                      value={form.tagline}
                      onChange={(e) => update('tagline', e.target.value)}
                      onFocus={() => {
                        setFocusedField('tagline');
                        setRegisterResult('none');
                      }}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Frase corta que te describe"
                      className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="biography" className="text-text-secondary text-sm font-medium">
                      Biografia
                    </Label>
                    <textarea
                      id="biography"
                      value={form.biography}
                      onChange={(e) => update('biography', e.target.value)}
                      onFocus={() => {
                        setFocusedField('biography');
                        setRegisterResult('none');
                      }}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Cuentanos sobre ti..."
                      rows={3}
                      className="flex w-full rounded-md border px-3 py-2 text-sm bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2 focus-visible:outline-none resize-none"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                disabled={isLoading}
                onMouseEnter={() => {
                  if (registerResult === 'none' && focusedField !== 'password' && expression !== 'angry') {
                    setExpression('hover-button');
                  }
                }}
                onMouseLeave={() => {
                  if (expression === 'hover-button') {
                    setExpression(
                      focusedField === 'password' ? 'typing-password' :
                      focusedField === 'email' ? 'typing-email' :
                      (focusedField === 'firstName' || focusedField === 'lastName') ? 'typing-name' :
                      'idle'
                    );
                  }
                }}
              >
                {isLoading ? 'Creando cuenta...' : accountType === 'artist' ? 'Solicitar cuenta de artista' : 'Registrarse'}
              </Button>

              {accountType === 'artist' && (
                <p className="text-xs text-text-dim text-center">
                  Las cuentas de artista requieren aprobacion del administrador
                </p>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-faint">
                Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors">
                  Inicia sesion
                </Link>
              </p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
