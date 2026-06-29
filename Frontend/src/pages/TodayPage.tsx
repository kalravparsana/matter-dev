import { MattarRadar } from '@/components/MattarRadar';
import { StatusBadge } from '@/components/StatusBadge';
import { IntegrationIcon } from '@/components/IntegrationIcon';
import {
  integrationMeta,
  workspaceUser,
  type InsightMetrics,
} from '@/data/mattar';
import { useTodayData } from '@/hooks/useMattarData';

export default function TodayPage() {
  const { signals, outputs, metrics, integrations, loading, error } = useTodayData();
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <header className="flex shrink-0 flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-sm font-medium text-muted-foreground">
            {greeting}, {workspaceUser.firstName}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Mattar Today
          </h1>
        </div>
        <PipelineSummary metrics={metrics} />
      </header>

      {error && (
        <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-sans text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
        <span className="font-display text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Live inputs
        </span>
        {integrations.map((int) => (
          <div
            key={int.id}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2 py-1"
          >
            <IntegrationIcon type={int.type} className="h-4 w-4" />
            <span className="font-sans text-xs text-foreground">
              {integrationMeta[int.type].label}
            </span>
            <StatusBadge status={int.status} />
          </div>
        ))}
      </div>

      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised p-3 lg:p-4"
        aria-label="Mattar radar — what matters today"
      >
        <MattarRadar
          signals={signals}
          outputs={outputs}
          metrics={metrics}
        />
        {loading && (
          <p className="mt-2 text-center font-sans text-xs text-muted-foreground">Refreshing signals…</p>
        )}
      </section>
    </div>
  );
}

const PIPELINE_STEPS = [
  {
    key: 'received',
    label: 'Received',
    detail: 'from inputs',
    valueKey: 'signalsIn' as const,
    valueClass: 'text-primary',
  },
  {
    key: 'need-you',
    label: 'Need you',
    detail: 'matter filter',
    valueKey: 'matterFiltered' as const,
    valueClass: 'text-foreground',
  },
  {
    key: 'routed',
    label: 'Routed',
    detail: 'actions sent',
    valueKey: 'actionsRouted' as const,
    valueClass: 'text-accent',
  },
] as const;

function PipelineSummary({ metrics }: { metrics: InsightMetrics }) {
  return (
    <div
      className="flex shrink-0 items-stretch overflow-hidden rounded-xl border border-border bg-surface"
      role="group"
      aria-label={`Today's pipeline: ${metrics.signalsIn} signals received, ${metrics.matterFiltered} need you, ${metrics.actionsRouted} actions routed`}
    >
      {PIPELINE_STEPS.map((step, index) => (
        <div key={step.key} className="flex items-stretch">
          {index > 0 && (
            <div
              className="flex w-5 items-center justify-center font-sans text-xs text-muted-foreground"
              aria-hidden="true"
            >
              →
            </div>
          )}
          <div className="flex min-w-[4.75rem] flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-center sm:min-w-[5.5rem] sm:px-3">
            <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {step.label}
            </p>
            <p
              className={`font-display text-lg font-semibold tabular-nums leading-tight ${step.valueClass}`}
            >
              {metrics[step.valueKey]}
            </p>
            <p className="mt-0.5 hidden font-sans text-[10px] text-muted-foreground sm:block">
              {step.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
