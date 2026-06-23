import type { ConnectionStatus, OutputStatus, SignalStatus } from '@/data/mattar';

const signalStyles: Record<SignalStatus, string> = {
  hot: 'bg-accent/15 text-accent border-accent/30',
  active: 'bg-primary/15 text-primary border-primary/30',
  queued: 'bg-muted text-muted-foreground border-border',
  routed: 'bg-success/15 text-success border-success/30',
  idle: 'bg-muted text-muted-foreground border-border',
};

const connectionStyles: Record<ConnectionStatus, string> = {
  connected: 'bg-success/15 text-success border-success/30',
  syncing: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-destructive/15 text-destructive border-destructive/30',
  disconnected: 'bg-muted text-muted-foreground border-border',
  available: 'bg-primary/10 text-primary border-primary/25',
};

const outputStyles: Record<OutputStatus, string> = {
  ready: 'bg-success/15 text-success border-success/30',
  running: 'bg-primary/15 text-primary border-primary/30',
  paused: 'bg-muted text-muted-foreground border-border',
  error: 'bg-destructive/15 text-destructive border-destructive/30',
};

const statusLabels: Partial<Record<ConnectionStatus, string>> = {
  available: 'Available',
};

interface StatusBadgeProps {
  status: SignalStatus | ConnectionStatus | OutputStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles =
    signalStyles[status as SignalStatus] ??
    connectionStyles[status as ConnectionStatus] ??
    outputStyles[status as OutputStatus] ??
    'bg-muted text-muted-foreground border-border';

  const displayLabel =
    label ??
    statusLabels[status as ConnectionStatus] ??
    status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wide ${styles}`}
    >
      {displayLabel}
    </span>
  );
}
