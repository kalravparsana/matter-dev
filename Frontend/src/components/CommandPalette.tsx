import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const commands = [
  { label: 'Go to Today', path: '/today', shortcut: 'G T' },
  { label: 'Go to Integrations', path: '/integrations', shortcut: 'G N' },
  { label: 'Go to Inputs', path: '/inputs', shortcut: 'G I' },
  { label: 'Go to Matter', path: '/matter', shortcut: 'G M' },
  { label: 'Go to Outputs', path: '/outputs', shortcut: 'G O' },
  { label: 'Connect platform', path: '/integrations', shortcut: 'C' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-[20vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-glow-teal"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="text"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-none border-b border-border bg-transparent px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <ul className="max-h-64 overflow-y-auto p-2">
          {filtered.map((cmd) => (
            <li key={cmd.label}>
              <button
                type="button"
                onClick={() => {
                  navigate(cmd.path);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-sans text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{cmd.label}</span>
                <kbd className="rounded-lg border border-border bg-surface px-1.5 py-0.5 font-display text-[10px] text-muted-foreground">
                  {cmd.shortcut}
                </kbd>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-xl px-3 py-3 font-sans text-sm text-muted-foreground">
              No commands match
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
