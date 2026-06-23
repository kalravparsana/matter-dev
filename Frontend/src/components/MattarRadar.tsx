import { useCallback, useId, useState } from 'react';
import type { InputSignal, OutputAction, InsightMetrics, OutputStatus, SignalStatus } from '@/data/mattar';
import { StatusBadge } from './StatusBadge';
import { IntegrationIcon } from './IntegrationIcon';

const RADAR_CENTER = 200;

/** Higher matter score → closer to center (more relevant). */
function matterScoreToRadius(score: number): number {
  const t = Math.min(1, Math.max(0, (score - 40) / 60));
  return 168 - t * 88;
}

/** Input integrations cluster on the left hemisphere. */
const INPUT_SECTOR_ANGLE: Record<InputSignal['integration'], number> = {
  slack: (210 * Math.PI) / 180,
  gmail: Math.PI,
  granola: (150 * Math.PI) / 180,
};

function polarToCartesian(r: number, angleRad: number) {
  return {
    x: RADAR_CENTER + r * Math.cos(angleRad),
    y: RADAR_CENTER + r * Math.sin(angleRad),
  };
}

function inputBlipPosition(signal: InputSignal, indexInIntegration: number) {
  const angle =
    INPUT_SECTOR_ANGLE[signal.integration] + (indexInIntegration - 0.5) * 0.14;
  return polarToCartesian(matterScoreToRadius(signal.matterScore), angle);
}

function outputStatusRadius(status: OutputStatus, index: number): number {
  switch (status) {
    case 'running':
      return 76;
    case 'ready':
      return 102 + index * 10;
    case 'paused':
      return 148;
    case 'error':
      return 118;
    default:
      return 120;
  }
}

function outputBlipPosition(output: OutputAction, index: number, total: number) {
  const start = -Math.PI * 0.38;
  const end = Math.PI * 0.38;
  const angle = total === 1 ? 0 : start + (index / (total - 1)) * (end - start);
  return polarToCartesian(outputStatusRadius(output.status, index), angle);
}

const INPUT_BLIP_COLOR: Record<SignalStatus, string> = {
  hot: '#e8a838',
  active: '#00c997',
  queued: '#8b95a5',
  routed: '#00b48a',
  idle: '#c8d1da',
};

const OUTPUT_BLIP_COLOR: Record<OutputStatus, string> = {
  running: '#e8a838',
  ready: '#00b48a',
  paused: '#8b95a5',
  error: '#cf222e',
};

function buildInputBlips(signals: InputSignal[]) {
  const counts: Record<InputSignal['integration'], number> = {
    slack: 0,
    gmail: 0,
    granola: 0,
  };

  return signals.map((signal) => {
    const indexInIntegration = counts[signal.integration];
    counts[signal.integration] += 1;
    return {
      signal,
      indexInIntegration,
      ...inputBlipPosition(signal, indexInIntegration),
    };
  });
}

type HighlightTarget =
  | { kind: 'input'; id: string }
  | { kind: 'output'; id: string };

interface MattarRadarProps {
  signals: InputSignal[];
  outputs: OutputAction[];
  metrics: InsightMetrics;
}

export function MattarRadar({ signals, outputs, metrics }: MattarRadarProps) {
  const legendId = useId();
  const [highlight, setHighlight] = useState<HighlightTarget | null>(null);
  const hotCount = signals.filter((s) => s.priority === 'hot').length;
  const inputBlips = buildInputBlips(signals);

  const setInputHighlight = useCallback((id: string | null) => {
    setHighlight(id ? { kind: 'input', id } : null);
  }, []);

  const setOutputHighlight = useCallback((id: string | null) => {
    setHighlight(id ? { kind: 'output', id } : null);
  }, []);

  const highlightedInput =
    highlight?.kind === 'input'
      ? signals.find((signal) => signal.id === highlight.id)
      : undefined;
  const highlightedOutput =
    highlight?.kind === 'output'
      ? outputs.find((output) => output.id === highlight.id)
      : undefined;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)_minmax(0,1fr)] lg:items-stretch lg:gap-0">
      {/* Input column — fills available height; list scrolls */}
      <div className="flex min-h-0 flex-col gap-2 lg:h-full lg:pr-4">
        <div className="flex shrink-0 items-center justify-between">
          <h3 className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Input signals
          </h3>
          <span className="font-display text-xs tabular-nums text-primary">
            {metrics.signalsIn} today
          </span>
        </div>
        <div
          className="flex min-h-0 max-h-44 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1 lg:max-h-none"
          aria-label="Input signals list"
          tabIndex={0}
        >
          {signals.map((signal, i) => {
            const isHighlighted = highlight?.kind === 'input' && highlight.id === signal.id;
            const blipColor = INPUT_BLIP_COLOR[signal.priority];

            return (
            <div
              key={signal.id}
              className={`group flex items-start gap-2 rounded-xl border bg-surface p-2.5 transition-colors ${
                isHighlighted
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/25'
                  : 'border-border hover:border-primary/30'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
              onMouseEnter={() => setInputHighlight(signal.id)}
              onMouseLeave={() => setInputHighlight(null)}
              onFocus={() => setInputHighlight(signal.id)}
              onBlur={() => setInputHighlight(null)}
              tabIndex={0}
              role="button"
              aria-pressed={isHighlighted}
              aria-label={`${signal.source}, matter score ${signal.matterScore}, ${signal.priority} priority`}
            >
              <div className="relative mt-0.5 shrink-0">
                <IntegrationIcon
                  type={signal.integration}
                  className="h-4 w-4"
                />
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface"
                  style={{ backgroundColor: blipColor }}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-sans text-xs font-medium text-foreground">
                    {signal.source}
                  </span>
                  <StatusBadge status={signal.priority} />
                </div>
                <p className="mt-0.5 line-clamp-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                  {signal.preview}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-sans text-[10px] text-muted-foreground">
                    {signal.receivedAt}
                  </span>
                  <span className="font-display text-[10px] tabular-nums text-primary">
                    Matter {signal.matterScore}
                  </span>
                </div>
              </div>
              <div className="hidden lg:flex lg:items-center" aria-hidden="true">
                <div
                  className={`h-px w-6 bg-gradient-to-r transition-opacity ${
                    isHighlighted ? 'from-primary to-primary/40 opacity-100' : 'from-primary/60 to-transparent opacity-70'
                  }`}
                />
                <span className="ml-0.5 font-sans text-[10px] text-primary/70">→</span>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Radar center — radar centered; metric pills anchored below ring */}
      <div className="flex min-h-0 shrink-0 flex-col lg:h-full lg:shrink lg:px-2">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="relative mx-auto aspect-square w-full max-w-[min(100%,320px)] shrink-0 lg:h-full lg:max-h-[min(100%,380px)] lg:w-auto lg:max-w-full">
          {/* Outer rings */}
          <svg
            viewBox="0 0 400 400"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-labelledby={legendId}
            aria-describedby={`${legendId}-desc`}
          >
            <title id={legendId}>
              Mattar radar — {signals.length} input signals on the left, {outputs.length} output
              actions on the right
            </title>
            <desc id={`${legendId}-desc`}>
              Input dots sit on the left; closer to the center means a higher matter score. Output
              dots sit on the right; inner rings mean actively running. Hover a list item or dot to
              see the match.
            </desc>
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00b48a" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#00b48a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00b48a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00c997" stopOpacity="0" />
                <stop offset="50%" stopColor="#00c997" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00c997" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="200" r="190" fill="url(#radarGlow)" />
            {[180, 150, 120, 90, 60].map((r) => (
              <circle
                key={r}
                cx="200"
                cy="200"
                r={r}
                fill="none"
                stroke="#8b95a5"
                strokeWidth="1"
                strokeDasharray={r === 60 ? 'none' : '4 6'}
                opacity={r === 60 ? 0.9 : 0.58}
              />
            ))}
            <g className="radar-sweep" style={{ transformOrigin: '200px 200px' }}>
              <path
                d="M200 200 L200 10 A190 190 0 0 1 380 120 Z"
                fill="url(#sweepGrad)"
                opacity="0.38"
              />
            </g>
            {/* Cross hairs */}
            <line x1="200" y1="10" x2="200" y2="390" stroke="#8b95a5" strokeWidth="0.5" opacity="0.65" />
            <line x1="10" y1="200" x2="390" y2="200" stroke="#8b95a5" strokeWidth="0.5" opacity="0.65" />

            {/* Flow orientation — left in, center filter, right out */}
            <path
              d="M 48 200 Q 120 168 168 200"
              fill="none"
              stroke="#009670"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.52"
            />
            <path
              d="M 232 200 Q 280 168 352 200"
              fill="none"
              stroke="#c9922f"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.52"
            />

            {/* Input blips — left hemisphere, radius = matter score, sector = integration */}
            {inputBlips.map(({ signal, x, y, indexInIntegration }) => {
              const color = INPUT_BLIP_COLOR[signal.priority];
              const pulse = signal.priority === 'hot';
              const coreR = signal.priority === 'hot' ? 3.5 : signal.priority === 'active' ? 3 : 2.5;
              const isHighlighted = highlight?.kind === 'input' && highlight.id === signal.id;

              return (
                <g
                  key={signal.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setInputHighlight(signal.id)}
                  onMouseLeave={() => setInputHighlight(null)}
                  aria-hidden="true"
                >
                  {isHighlighted && (
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="none"
                      stroke="#00b48a"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                  )}
                  {pulse && (
                    <circle cx={x} cy={y} r="6" fill={color} opacity="0.3">
                      <animate
                        attributeName="r"
                        values="4;8;4"
                        dur="2s"
                        repeatCount="indefinite"
                        begin={`${indexInIntegration * 0.35}s`}
                      />
                    </circle>
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHighlighted ? coreR + 1 : coreR}
                    fill={color}
                    stroke={isHighlighted ? '#ffffff' : 'none'}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            {/* Output blips — right hemisphere, radius = routing status */}
            {outputs.map((output, i) => {
              const { x, y } = outputBlipPosition(output, i, outputs.length);
              const color = OUTPUT_BLIP_COLOR[output.status];
              const pulse = output.status === 'running';
              const coreR = output.status === 'running' ? 3.5 : 3;
              const isHighlighted = highlight?.kind === 'output' && highlight.id === output.id;

              return (
                <g
                  key={output.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setOutputHighlight(output.id)}
                  onMouseLeave={() => setOutputHighlight(null)}
                  aria-hidden="true"
                >
                  {isHighlighted && (
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="none"
                      stroke="#e8a838"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                  )}
                  {pulse && (
                    <circle cx={x} cy={y} r="6" fill={color} opacity="0.3">
                      <animate
                        attributeName="r"
                        values="4;8;4"
                        dur="2s"
                        repeatCount="indefinite"
                        begin={`${i * 0.35}s`}
                      />
                    </circle>
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHighlighted ? coreR + 1 : coreR}
                    fill={color}
                    stroke={isHighlighted ? '#ffffff' : 'none'}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </svg>

          {/* Center content — straight text on radar focal point */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-[11rem] px-2">
              <p className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                What matters
              </p>
              <p className="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {metrics.matterFiltered}
              </p>
              <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                signals need you
              </p>
              {hotCount > 0 && (
                <p className="mt-2 font-display text-[11px] text-accent">
                  {hotCount} hot · before noon
                </p>
              )}
              {(highlightedInput || highlightedOutput) && (
                <div className="pointer-events-auto mt-3 text-left">
                  {highlightedInput && (
                    <>
                      <p className="truncate font-sans text-[11px] font-medium text-foreground">
                        {highlightedInput.source}
                      </p>
                      <p className="mt-0.5 line-clamp-2 font-sans text-[10px] leading-snug text-muted-foreground">
                        {highlightedInput.preview}
                      </p>
                      <p className="mt-1 font-display text-[10px] tabular-nums text-primary">
                        Matter {highlightedInput.matterScore} · {highlightedInput.priority}
                      </p>
                    </>
                  )}
                  {highlightedOutput && (
                    <>
                      <p className="truncate font-sans text-[11px] font-medium text-foreground">
                        {highlightedOutput.name}
                      </p>
                      <p className="mt-1 font-display text-[10px] tabular-nums text-accent">
                        {highlightedOutput.status} · {highlightedOutput.todayCount} today
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <RadarLegend id={legendId} />

        {/* Insight metrics — below radar, separated from the ring */}
        <div className="flex shrink-0 justify-center gap-4 pb-0.5 pt-1.5 sm:gap-6">
          <MetricPill label="Routed" value={metrics.actionsRouted} delta="9 auto, 0 failed" />
          <MetricPill
            label="Pending"
            value={metrics.pendingReview}
            delta="need review"
            accent
          />
          <MetricPill
            label="Avg min"
            value={metrics.avgResponseMin}
            delta="-1.3m vs last week"
            highlight
          />
        </div>
      </div>

      {/* Output column — fills available height; list scrolls */}
      <div className="flex min-h-0 flex-col gap-2 lg:h-full lg:pl-4">
        <div className="flex shrink-0 items-center justify-between">
          <h3 className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Output actions
          </h3>
          <span className="font-display text-xs tabular-nums text-accent">
            {metrics.actionsRouted} routed
          </span>
        </div>
        <div
          className="flex min-h-0 max-h-44 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1 lg:max-h-none"
          aria-label="Output actions list"
          tabIndex={0}
        >
          {outputs.map((output) => {
            const isHighlighted = highlight?.kind === 'output' && highlight.id === output.id;
            const blipColor = OUTPUT_BLIP_COLOR[output.status];

            return (
            <div
              key={output.id}
              className={`flex items-start gap-2 rounded-lg border bg-surface p-2.5 transition-colors ${
                isHighlighted
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/25'
                  : 'border-border hover:border-accent/30'
              }`}
              onMouseEnter={() => setOutputHighlight(output.id)}
              onMouseLeave={() => setOutputHighlight(null)}
              onFocus={() => setOutputHighlight(output.id)}
              onBlur={() => setOutputHighlight(null)}
              tabIndex={0}
              role="button"
              aria-pressed={isHighlighted}
              aria-label={`${output.name}, ${output.status}, ${output.todayCount} actions today`}
            >
              <div className="hidden lg:flex lg:items-center" aria-hidden="true">
                <span className="mr-0.5 font-sans text-[10px] text-accent/70">←</span>
                <div
                  className={`h-px w-6 bg-gradient-to-l transition-opacity ${
                    isHighlighted ? 'from-accent to-accent/40 opacity-100' : 'from-accent/60 to-transparent opacity-70'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-sans text-xs font-medium text-foreground">
                    {output.name}
                  </span>
                  <StatusBadge status={output.status} />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-sans text-[10px] text-muted-foreground">
                    {output.lastRun}
                  </span>
                  <span className="flex items-center gap-1 font-display text-[10px] tabular-nums text-muted-foreground">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: blipColor }}
                      aria-hidden="true"
                    />
                    {output.todayCount} today
                  </span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RadarLegend({ id }: { id: string }) {
  return (
    <div
      id={`${id}-guide`}
      className="mx-auto mt-1 max-w-md shrink-0 rounded-xl border border-border bg-surface px-3 py-2"
      aria-label="How to read the radar"
    >
      <p className="text-center font-sans text-[10px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Signals in</span>
        <span aria-hidden="true"> → </span>
        matter filter
        <span aria-hidden="true"> → </span>
        <span className="font-medium text-foreground">actions out</span>
        . Hover a row or dot to see the match.
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <LegendSwatch color="#e8a838" label="Hot / running" />
        <LegendSwatch color="#00c997" label="Active" />
        <LegendSwatch color="#00b48a" label="Routed / ready" />
        <LegendSwatch color="#8b95a5" label="Queued / paused" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-sans text-[9px] text-muted-foreground">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function MetricPill({
  label,
  value,
  delta,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  delta?: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <p
        className={`font-display text-base font-semibold tabular-nums sm:text-lg ${
          accent || highlight ? 'text-accent' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <p className="font-sans text-[10px] text-muted-foreground">{label}</p>
      {delta && (
        <p className="mt-0.5 hidden font-sans text-[9px] leading-tight text-muted-foreground sm:block">
          {delta}
        </p>
      )}
    </div>
  );
}
