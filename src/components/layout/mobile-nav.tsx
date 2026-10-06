'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/config/navigation';
import { useUIStore } from '@/stores/ui-store';
import { Logo } from './logo';
import { NavList } from './nav-list';
import { SidebarProjects } from './sidebar-projects';

/** Drawer navigation for small screens; focus is trapped and restored by Radix. */
export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const close = () => setOpen(false);
  // Close the drawer whenever navigation happens (covers links inside nested lists).
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 bg-sidebar p-0">
        <SheetHeader className="h-12 justify-center border-b px-4 text-left">
          <SheetTitle>
            <Logo />
          </SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2" aria-label="Main navigation">
          <NavList items={PRIMARY_NAV} onNavigate={close} />
          <SidebarProjects />
          <div className="mt-auto">
            <NavList items={SECONDARY_NAV} onNavigate={close} />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
