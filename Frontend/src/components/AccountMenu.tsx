import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const handleSignOut = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl border border-transparent px-1 py-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-display text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          {user.initials}
        </div>
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate font-sans text-sm font-medium text-foreground">
            {user.fullName}
          </p>
          <p className="font-sans text-[11px] text-muted-foreground">
            {user.workspace} · {user.role}
          </p>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate font-sans text-sm font-medium text-foreground">
              {user.fullName}
            </p>
            <p className="truncate font-sans text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full px-3 py-2 text-left font-sans text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
