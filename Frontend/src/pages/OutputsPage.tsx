import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  outputAgents,
  integrations,
  integrationMeta,
  platformCatalog,
  outputAgentMeta,
} from '@/data/mattar';
import type { CoreIntegrationType, OutputAgent, OutputAgentKind } from '@/data/mattar';
import { StatusBadge } from '@/components/StatusBadge';
import { IntegrationIcon } from '@/components/IntegrationIcon';
import emptyOutputsIllustration from '@/assets/illustrations/empty-outputs.svg';

type FilterIntegration = 'all' | CoreIntegrationType;
type FilterStatus = 'all' | 'ready' | 'running' | 'paused' | 'error';

export default function OutputsPage() {
  const [platformFilter, setPlatformFilter] = useState<FilterIntegration>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const hasConnections = integrations.length > 0;

  const filtered = useMemo(() => {
    return outputAgents.filter((agent) => {
      const platformMatch =
        platformFilter === 'all' || agent.integration === platformFilter;
      const statusMatch =
        statusFilter === 'all' || agent.status === statusFilter;
      return platformMatch && statusMatch;
    });
  }, [platformFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<CoreIntegrationType, OutputAgent[]>();
    for (const agent of filtered) {
      const list = map.get(agent.integration) ?? [];
      list.push(agent);
      map.set(agent.integration, list);
    }
    return map;
  }, [filtered]);

  if (!hasConnections) {
    return (
      <div className="space-y-6">
        <PageHeader onAdd={() => setShowAdd(true)} />
        <EmptyOutputsState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader onAdd={() => setShowAdd(true)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPlatformFilter('all')}
            className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              platformFilter === 'all'
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:border-accent/20 hover:text-foreground'
            }`}
          >
            All platforms
          </button>
          {platformCatalog.map((platform) => {
            const connected = integrations.some((i) => i.type === platform.type);
            if (!connected) return null;
            return (
              <button
                key={platform.type}
                type="button"
                onClick={() => setPlatformFilter(platform.type)}
                className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  platformFilter === platform.type
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/20 hover:text-foreground'
                }`}
              >
                {integrationMeta[platform.type].label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'ready', 'running', 'paused', 'error'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                statusFilter === f
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center font-sans text-sm text-muted-foreground">
          No output agents match this filter.
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([integration, agents]) => (
            <section key={integration} className="space-y-3">
              <div className="flex items-center gap-2">
                <IntegrationIcon type={integration} className="h-4 w-4" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {integrationMeta[integration].label}
                </h2>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised">
                      <th className="px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Agent
                      </th>
                      <th className="hidden px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">
                        Action
                      </th>
                      <th className="px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="hidden px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                        Last run
                      </th>
                      <th className="px-4 py-2.5 text-right font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Today
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <OutputAgentRow key={agent.id} agent={agent} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {showAdd && <AddAgentModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">
          Outputs
        </h1>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Output agents act on filtered signals — email replies sent, Slack messages
          posted, action items exported.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-xl bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Add output agent
      </button>
    </header>
  );
}

function OutputAgentRow({ agent }: { agent: OutputAgent }) {
  const meta = outputAgentMeta[agent.kind];
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <p className="font-sans text-sm font-medium text-foreground">{agent.name}</p>
        <p className="mt-0.5 font-sans text-[11px] text-muted-foreground sm:hidden">
          {agent.description}
        </p>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className="font-sans text-xs text-muted-foreground">
          {meta.label}
        </span>
        <p className="mt-0.5 max-w-sm font-sans text-[11px] text-muted-foreground">
          {agent.description}
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={agent.status} />
      </td>
      <td className="hidden px-4 py-3 font-sans text-xs text-muted-foreground md:table-cell">
        {agent.lastRun}
      </td>
      <td className="px-4 py-3 text-right font-display text-sm tabular-nums text-foreground">
        {agent.todayCount}
      </td>
    </tr>
  );
}

function EmptyOutputsState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <img
        src={emptyOutputsIllustration}
        alt=""
        aria-hidden="true"
        className="mb-6 w-[35%] max-w-[180px] min-w-[120px]"
      />
      <h2 className="font-display text-lg font-semibold text-foreground">
        Connect a platform first
      </h2>
      <p className="mt-2 max-w-sm font-sans text-sm text-muted-foreground">
        Output agents run on connected platforms. Wire up Slack, Gmail, or Granola
        before adding agents.
      </p>
      <Link
        to="/integrations"
        className="mt-6 rounded-xl bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Go to Integrations
      </Link>
    </div>
  );
}

function AddAgentModal({ onClose }: { onClose: () => void }) {
  const options: {
    kind: OutputAgentKind;
    integration: CoreIntegrationType;
    desc: string;
  }[] = [
    {
      kind: 'gmail-send-reply',
      integration: 'gmail',
      desc: 'Send email replies when Matter routes a signal',
    },
    {
      kind: 'gmail-create-draft',
      integration: 'gmail',
      desc: 'Stage drafts for review before sending',
    },
    {
      kind: 'slack-send-message',
      integration: 'slack',
      desc: 'Post DMs or channel messages from routed signals',
    },
    {
      kind: 'slack-post-alert',
      integration: 'slack',
      desc: 'Push priority alerts to a monitored channel',
    },
    {
      kind: 'granola-push-action-item',
      integration: 'granola',
      desc: 'Export meeting action items to your task tracker',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Add output agent"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface-raised p-6 shadow-glow-teal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-foreground">
          Add output agent
        </h2>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Choose an action Mattar performs on filtered signals.
        </p>
        <ul className="mt-4 space-y-2">
          {options.map((opt) => (
            <li key={opt.kind}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-accent/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IntegrationIcon type={opt.integration} className="h-5 w-5 shrink-0" />
                <div>
                  <span className="font-sans text-sm font-medium text-foreground">
                    {outputAgentMeta[opt.kind].label}
                  </span>
                  <span className="mt-0.5 block font-sans text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-border py-2 font-sans text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
