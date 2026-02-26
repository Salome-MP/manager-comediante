'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ShapesLogin, { type Expression } from '@/components/auth/shapes-login';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState<Expression>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginResult, setLoginResult] = useState<'none' | 'error' | 'success'>('none');
  const [errorCount, setErrorCount] = useState(0);
  const [buttonClicks, setButtonClicks] = useState<number[]>([]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Derive expression from state
  useEffect(() => {
    if (loginResult === 'success') {
      setExpression('success');
      return;
    }
    if (loginResult === 'error') {
      if (errorCount >= 3) {
        setExpression('scared');
      } else {
        setExpression('error');
      }
      const timer = setTimeout(() => {
        setLoginResult('none');
      }, 2500);
      return () => clearTimeout(timer);
    }

    const recentClicks = buttonClicks.filter((t) => Date.now() - t < 4000);
    if (recentClicks.length >= 5) {
      setExpression('angry');
      const timer = setTimeout(() => {
        setButtonClicks([]);
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (focusedField === 'password') {
      setExpression('typing-password');
    } else if (focusedField === 'email') {
      setExpression('typing-email');
    } else {
      setExpression('idle');
    }
  }, [focusedField, loginResult, errorCount, buttonClicks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setButtonClicks((prev) => [...prev.filter((t) => Date.now() - t < 4000), Date.now()]);

    try {
      await login(email, password);
      setErrorCount(0);
      setLoginResult('success');
      toast.success('Sesion iniciada correctamente');
      setTimeout(() => router.push('/'), 1000);
    } catch {
      setErrorCount((prev) => prev + 1);
      setLoginResult('error');
      toast.error('Credenciales invalidas');
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
          <ShapesLogin mousePos={mousePos} expression={expression} />
        </div>
      </div>

      {/* Right side — Login form */}
      <div className="relative flex w-full md:w-1/2 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-black text-gradient-navy">Comediantes</span>
              <span className="text-2xl font-black text-text-muted">.com</span>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Iniciar sesion</h1>
            <p className="mt-1 text-sm text-text-muted">Bienvenido de vuelta</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border-strong bg-surface-card p-8 shadow-2xl shadow-[var(--shadow-color)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-text-secondary text-sm font-medium">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => {
                    setFocusedField('email');
                    setLoginResult('none');
                  }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="tu@email.com"
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-text-secondary text-sm font-medium">
                    Contrasena
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    setFocusedField('password');
                    setLoginResult('none');
                  }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Tu contrasena"
                  required
                  className="bg-overlay-light border-border-strong text-text-primary placeholder:text-text-dim focus:border-navy-500 focus-visible:ring-navy-500/20 focus-visible:ring-2"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-navy-600 hover:bg-navy-500 text-white font-semibold shadow-lg shadow-navy-500/25 hover:-translate-y-0.5 transition-all duration-200"
                disabled={isLoading}
                onMouseEnter={() => {
                  if (loginResult === 'none' && focusedField !== 'password' && expression !== 'angry') {
                    setExpression('hover-button');
                  }
                }}
                onMouseLeave={() => {
                  if (expression === 'hover-button') {
                    setExpression(focusedField === 'password' ? 'typing-password' : focusedField === 'email' ? 'typing-email' : 'idle');
                  }
                }}
              >
                {isLoading ? 'Ingresando...' : 'Iniciar sesion'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-faint">
                No tienes cuenta?{' '}
                <Link href="/registro" className="font-medium text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 transition-colors">
                  Registrate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
