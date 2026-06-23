import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogoLockup } from './Logo';
import { Icon } from './Icon';
import { CommandPalette } from './CommandPalette';
import navToday from '@/assets/icons/nav-today.svg';
import navIntegrations from '@/assets/icons/nav-integrations.svg';
import navInputs from '@/assets/icons/nav-inputs.svg';
import navMatter from '@/assets/icons/nav-matter.svg';
import navOutputs from '@/assets/icons/nav-outputs.svg';
import { AccountMenu } from './AccountMenu';

const navItems = [
  { to: '/today', label: 'Today', icon: navToday },
  { to: '/integrations', label: 'Integrations', icon: navIntegrations },
  { to: '/inputs', label: 'Inputs', icon: navInputs },
  { to: '/matter', label: 'Matter', icon: navMatter },
  { to: '/outputs', label: 'Outputs', icon: navOutputs },
];

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <LogoLockup />
            <nav className="flex items-center gap-1" aria-label="Main">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-sans text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon src={item.icon} className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
              className="flex w-52 items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72"
            >
              <span className="truncate text-left">Search signals, inputs…</span>
              <kbd className="shrink-0 rounded-lg border border-border bg-surface px-1.5 py-0.5 font-display text-[10px] leading-none text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <div className="border-l border-border pl-3">
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      <footer className="shrink-0 border-t border-border py-2">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 font-sans text-[11px] text-muted-foreground">
          <span>Mattar v0.1 · Meridian workspace</span>
          <span className="font-display tabular-nums">
            Last sync 2m ago
          </span>
        </div>
      </footer>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
