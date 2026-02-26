'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileSidebarProps {
  navItems: NavItem[];
  user: { firstName: string; lastName: string; role: string };
  basePath: string;
  brandLabel: string;
  brandIcon: React.ComponentType<{ className?: string }>;
  onLogout: () => void;
}

export default function MobileSidebar({
  navItems,
  user,
  basePath,
  brandLabel,
  brandIcon: BrandIcon,
  onLogout,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 text-text-dim hover:text-text-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-navy-600 to-navy-800 shadow-lg shadow-navy-900/50">
              <BrandIcon className="h-3.5 w-3.5 text-white" />
            </div>
            {brandLabel}
          </SheetTitle>
        </SheetHeader>
        <Separator />
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 py-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== basePath && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-navy-600/20 text-navy-600 dark:text-navy-300'
                    : 'text-text-dim hover:bg-overlay-light hover:text-text-secondary'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-navy-500" />
                )}
                <item.icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-navy-400'
                      : 'text-text-ghost group-hover:text-text-tertiary'
                  }`}
                />
                <span className="truncate font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-3">
          <div className="mb-2 rounded-lg bg-overlay-subtle px-3 py-2">
            <p className="truncate text-xs font-medium text-text-secondary">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-text-ghost">{user.role}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-dim transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Cerrar sesion</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
