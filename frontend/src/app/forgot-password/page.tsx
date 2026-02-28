'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ingresa tu correo electronico');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Error al enviar el correo');
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 bg-surface-base">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-navy-600/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-navy-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-black text-gradient-navy">Comediantes</span>
            <span className="text-2xl font-black text-text-muted">.com</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-text-muted">Te enviaremos un enlace a tu correo</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-strong bg-surface-card p-5 sm:p-8 shadow-2xl shadow-[var(--shadow-color)]">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <Mail className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Correo enviado</h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  Si el correo existe en nuestro sistema, recibiras un enlace para restablecer tu contraseña.
                  Revisa tu bandeja de entrada y spam.
                </p>
              </div>
              <Button
                asChild
                className="w-full border border-border-strong bg-overlay-light text-text-primary hover:bg-overlay-strong hover:border-border-accent transition-all duration-200"
                variant="outline"
              >
                <Link href="/login">Volver al login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-text-muted leading-relaxed">
                Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-text-secondary text-sm font-medium">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-text-faint hover:text-navy-400 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
