'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TicketCountdownProps {
  expiresAt: string;
  onExpired: () => void;
}

export function TicketCountdown({ expiresAt, onExpired }: TicketCountdownProps) {
  const [remaining, setRemaining] = useState<number>(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) {
      onExpired();
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired, remaining]);

  if (remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining < 5 * 60;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
        isUrgent
          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      }`}
    >
      <Clock className="h-4 w-4 flex-shrink-0" />
      <span>
        Reserva expira en {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
