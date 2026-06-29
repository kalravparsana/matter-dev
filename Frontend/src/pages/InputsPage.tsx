import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  integrationMeta,
  platformCatalog,
} from '@/data/mattar';
import type { CoreIntegrationType, InputTrigger } from '@/data/mattar';
import { useInputTriggers } from '@/hooks/useMattarData';
import { IntegrationIcon } from '@/components/IntegrationIcon';
import emptyInputsIllustration from '@/assets/illustrations/empty-inputs.svg';

type FilterIntegration = 'all' | CoreIntegrationType;

export default function InputsPage() {
  const [filter, setFilter] = useState<FilterIntegration>('all');
  const { triggers, integrations, toggleTrigger } = useInputTriggers();
  const hasConnections = integrations.length > 0;

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? triggers
        : triggers.filter((t) => t.integration === filter),
    [filter, triggers],
  );

  const grouped = useMemo(() => {
    const map = new Map<CoreIntegrationType, InputTrigger[]>();
    for (const trigger of filtered) {
      const list = map.get(trigger.integration) ?? [];
      list.push(trigger);
      map.set(trigger.integration, list);
    }
    return map;
  }, [filtered]);

  const toggleTriggerHandler = (id: string) => {
    void toggleTrigger(id);
  };

  if (!hasConnections) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyInputsState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
            filter === 'all'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
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
              onClick={() => setFilter(platform.type)}
              className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                filter === platform.type
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
              }`}
            >
              {integrationMeta[platform.type].label}
            </button>
          );
        })}
      </div>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([integration, items]) => (
          <section key={integration} className="space-y-3">
            <div className="flex items-center gap-2">
              <IntegrationIcon type={integration} className="h-4 w-4" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {integrationMeta[integration].label}
              </h2>
              <span className="font-sans text-xs text-muted-foreground">
                · {items.filter((t) => t.enabled).length} active
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-raised">
                    <th className="px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Trigger
                    </th>
                    <th className="hidden px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">
                      Scope
                    </th>
                    <th className="px-4 py-2.5 text-right font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Today
                    </th>
                    <th className="hidden px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                      Last event
                    </th>
                    <th className="px-4 py-2.5 text-right font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      On
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((trigger) => (
                    <InputTriggerRow
                      key={trigger.id}
                      trigger={trigger}
                      onToggle={() => toggleTriggerHandler(trigger.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">
          Inputs
        </h1>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Define what events become signals — new emails, messages, mentions, and
          meeting notes per platform.
        </p>
      </div>
    </header>
  );
}

function InputTriggerRow({
  trigger,
  onToggle,
}: {
  trigger: InputTrigger;
  onToggle: () => void;
}) {
  return (
    <tr
      className={`border-b border-border transition-colors last:border-0 hover:bg-muted/30 ${
        trigger.enabled ? '' : 'opacity-60'
      }`}
    >
      <td className="px-4 py-3">
        <p className="font-sans text-sm font-medium text-foreground">
          {trigger.label}
        </p>
        <p className="mt-0.5 font-sans text-[11px] text-muted-foreground sm:hidden">
          {trigger.description}
        </p>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <p className="max-w-md font-sans text-xs text-muted-foreground">
          {trigger.description}
        </p>
      </td>
      <td className="px-4 py-3 text-right font-display text-sm tabular-nums text-foreground">
        {trigger.enabled ? trigger.eventsToday : '—'}
      </td>
      <td className="hidden px-4 py-3 font-sans text-xs text-muted-foreground md:table-cell">
        {trigger.enabled ? trigger.lastEvent : 'Paused'}
      </td>
      <td className="px-4 py-3 text-right">
        <ToggleSwitch
          checked={trigger.enabled}
          onChange={onToggle}
          label={`Toggle ${trigger.label}`}
        />
      </td>
    </tr>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative ml-auto inline-flex h-5 w-9 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'left-4' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function EmptyInputsState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <img
        src={emptyInputsIllustration}
        alt=""
        aria-hidden="true"
        className="mb-6 w-[35%] max-w-[200px] min-w-[140px]"
      />
      <h2 className="font-display text-lg font-semibold text-foreground">
        Connect a platform first
      </h2>
      <p className="mt-2 max-w-sm font-sans text-sm text-muted-foreground">
        Input triggers depend on your integrations. Connect Slack, Gmail, or
        Granola to define what feeds your radar.
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
