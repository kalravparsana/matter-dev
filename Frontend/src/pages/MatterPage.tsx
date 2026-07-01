import { useMemo, useState, useEffect } from 'react';
import {
  integrationMeta,
} from '@/data/mattar';
import type { InputSignal } from '@/data/mattar';
import { useMatterConfig, useTodayData } from '@/hooks/useMattarData';
import { StatusBadge } from '@/components/StatusBadge';
import { IntegrationIcon } from '@/components/IntegrationIcon';
import matterLensIllustration from '@/assets/illustrations/matter-lens.svg';

type FilterVerdict = 'all' | 'passes' | 'filtered';

function signalPasses(signal: InputSignal, threshold: number) {
  return signal.matterScore >= threshold;
}

export default function MatterPage() {
  const { config, setConfig, save, saving } = useMatterConfig();
  const { signals: inputSignals } = useTodayData();
  const [prompt, setPrompt] = useState(config.prompt);
  const [saved, setSaved] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<FilterVerdict>('all');
  const hasChanges = prompt !== config.prompt;

  useEffect(() => {
    setPrompt(config.prompt);
  }, [config.prompt]);

  const evaluatedSignals = useMemo(
    () =>
      [...inputSignals]
        .map((signal) => ({
          signal,
          passes: signalPasses(signal, config.priorityThreshold),
        }))
        .sort((a, b) => b.signal.matterScore - a.signal.matterScore),
    [inputSignals, config.priorityThreshold],
  );

  const passingSignals = evaluatedSignals.filter((row) => row.passes);
  const filteredSignals = evaluatedSignals.filter((row) => !row.passes);

  const previewCounts = useMemo(() => {
    const hot = passingSignals.filter(
      (row) => row.signal.priority === 'hot',
    ).length;
    const active = passingSignals.filter(
      (row) => row.signal.priority === 'active',
    ).length;
    const queued = passingSignals.filter(
      (row) => row.signal.priority === 'queued',
    ).length;
    return { hot, active, queued };
  }, [passingSignals]);

  const visibleRows =
    verdictFilter === 'passes'
      ? passingSignals
      : verdictFilter === 'filtered'
        ? filteredSignals
        : evaluatedSignals;

  const handleSave = () => {
    if (!hasChanges) return;
    void save({ prompt }).then(() => {
      setConfig((c) => ({ ...c, prompt }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="flex min-h-full flex-col gap-6 pb-2">
      <header className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">
              Matter Agent
            </h1>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Write the rules once. The agent filters noise before anything hits your
              radar.
            </p>
          </div>
          <img
            src={matterLensIllustration}
            alt=""
            aria-hidden="true"
            className="hidden h-24 w-auto shrink-0 sm:block lg:h-28"
          />
        </div>
      </header>

      <div className="grid shrink-0 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
        <section className="flex min-h-[520px] flex-col rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="matter-prompt"
              className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Agent prompt
            </label>
            <span className="font-sans text-[11px] text-muted-foreground">
              Edited by {config.editedBy} · {config.lastEdited}
            </span>
          </div>
          <textarea
            id="matter-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[440px] flex-1 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="rounded-xl bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save prompt'}
            </button>
            {saved && (
              <span className="font-sans text-sm text-success">Prompt saved</span>
            )}
            {hasChanges && !saving && (
              <span className="font-sans text-xs text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <ConfigCard
            label="Temperature"
            value={config.temperature}
            desc="Lower = more consistent filtering"
          />
          <ConfigCard
            label="Priority threshold"
            value={config.priorityThreshold}
            desc="Signals below this score are queued"
          />
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-medium text-foreground">
                Auto-route outputs
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={config.autoRoute}
                aria-label="Auto-route outputs"
                onClick={() => {
                  const next = !config.autoRoute;
                  setConfig((c) => ({ ...c, autoRoute: next }));
                  void save({ autoRoute: next });
                }}
                className={`relative h-5 w-9 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  config.autoRoute ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    config.autoRoute ? 'left-4' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 font-sans text-xs text-muted-foreground">
              Route high-priority signals to output agents without review
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-display text-xs font-medium uppercase tracking-wider text-primary">
              Live preview
            </p>
            <p className="mt-2 font-sans text-sm text-foreground">
              {passingSignals.length} of {inputSignals.length} live signals on radar
              · {inputSignals.length} in today&apos;s queue
            </p>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              {previewCounts.hot} hot · {previewCounts.active} active ·{' '}
              {previewCounts.queued} queued
            </p>
          </div>
        </aside>
      </div>

      <section
        className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface"
        aria-label="Filter evaluation"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">
              Filter evaluation
            </h2>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              How today&apos;s live signals score against threshold{' '}
              <span className="font-display tabular-nums text-primary">
                {config.priorityThreshold}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all' as const, label: 'All', count: evaluatedSignals.length },
                {
                  id: 'passes' as const,
                  label: 'On radar',
                  count: passingSignals.length,
                },
                {
                  id: 'filtered' as const,
                  label: 'Filtered out',
                  count: filteredSignals.length,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVerdictFilter(tab.id)}
                className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  verdictFilter === tab.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className="ml-1 font-display tabular-nums opacity-80">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="sticky top-0 z-10 bg-surface-raised">
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Signal
                </th>
                <th className="hidden px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Source
                </th>
                <th className="px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Score
                </th>
                <th className="px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Verdict
                </th>
                <th className="hidden px-4 py-2.5 font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                  Priority
                </th>
                <th className="hidden px-4 py-2.5 text-right font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center font-sans text-sm text-muted-foreground"
                  >
                    No signals match this filter.
                  </td>
                </tr>
              ) : (
                visibleRows.map(({ signal, passes }) => (
                  <FilterEvaluationRow
                    key={signal.id}
                    signal={signal}
                    passes={passes}
                    threshold={config.priorityThreshold}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilterEvaluationRow({
  signal,
  passes,
  threshold,
}: {
  signal: InputSignal;
  passes: boolean;
  threshold: number;
}) {
  const meta = integrationMeta[signal.integration];
  const margin = signal.matterScore - threshold;

  return (
    <tr
      className={`border-b border-border transition-colors last:border-0 hover:bg-muted/30 ${
        passes ? '' : 'opacity-75'
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised"
            style={{ borderColor: `${meta.color}30` }}
          >
            <IntegrationIcon type={signal.integration} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 font-sans text-sm text-foreground">
              {signal.preview}
            </p>
            <p className="mt-0.5 font-sans text-[11px] text-muted-foreground sm:hidden">
              {signal.source}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className="font-sans text-xs text-muted-foreground">{signal.source}</span>
      </td>
      <td className="px-4 py-3">
        <p className="font-display text-sm font-semibold tabular-nums text-foreground">
          {signal.matterScore}
        </p>
        <p
          className={`font-sans text-[10px] tabular-nums ${
            passes ? 'text-success' : 'text-muted-foreground'
          }`}
        >
          {passes ? `+${margin} above` : `${margin} below`}
        </p>
      </td>
      <td className="px-4 py-3">
        {passes ? (
          <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wide text-success">
            On radar
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Filtered out
          </span>
        )}
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <StatusBadge status={signal.priority} />
      </td>
      <td className="hidden px-4 py-3 text-right font-sans text-xs text-muted-foreground lg:table-cell">
        {signal.receivedAt}
      </td>
    </tr>
  );
}

function ConfigCard({
  label,
  value,
  desc,
}: {
  label: string;
  value: number;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-sans text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-primary">
        {value}
      </p>
      <p className="mt-1 font-sans text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
