import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  integrationMeta,
  platformCatalog,
} from '@/data/mattar';
import type { CoreIntegrationType, Integration } from '@/data/mattar';
import { useIntegrations, useInputTriggers, useOutputAgents } from '@/hooks/useMattarData';
import { saveGranolaApiKey, startIntegrationOAuth } from '@/lib/cognitoAuth';
import { isApiConfigured } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { IntegrationIcon } from '@/components/IntegrationIcon';
import emptyInputsIllustration from '@/assets/illustrations/empty-inputs.svg';

type FilterStatus = 'all' | 'connected' | 'syncing' | 'error';

export default function IntegrationsPage() {
  const { integrations, loading, error, refresh } = useIntegrations();
  const { triggers } = useInputTriggers();
  const { agents } = useOutputAgents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showConnect, setShowConnect] = useState(false);
  const [connectTarget, setConnectTarget] = useState<CoreIntegrationType | null>(
    null,
  );
  const [oauthNotice, setOauthNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const integration = searchParams.get('integration');
    if (!status || !integration) return;

    const label = integrationMeta[integration as CoreIntegrationType]?.label ?? integration;
    if (status === 'success') {
      setOauthNotice({
        type: 'success',
        message: `${label} connected successfully.`,
      });
      void refresh();
    } else if (status === 'error') {
      const detail = searchParams.get('message');
      setOauthNotice({
        type: 'error',
        message: detail
          ? `Could not connect ${label}: ${detail}`
          : `Could not connect ${label}. Please try again.`,
      });
    }

    const next = new URLSearchParams(searchParams);
    next.delete('status');
    next.delete('integration');
    next.delete('message');
    setSearchParams(next, { replace: true });
  }, [refresh, searchParams, setSearchParams]);

  const connectedTypes = new Set(integrations.map((i) => i.type));
  const hasConnections = integrations.length > 0;

  const catalog = platformCatalog.map((platform) => {
    const connection = integrations.find((i) => i.type === platform.type);
    return { ...platform, connection };
  });

  const filtered = catalog.filter((item) => {
    if (filter === 'all') return true;
    if (!item.connection) return false;
    return item.connection.status === filter;
  });

  const openConnect = (type?: CoreIntegrationType) => {
    setConnectTarget(type ?? null);
    setShowConnect(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">
            Integrations
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Connect Slack, Gmail, and Granola — then wire inputs and output agents
            on each platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openConnect()}
          className="rounded-xl bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Connect platform
        </button>
      </header>

      {oauthNotice && (
        <p
          className={`rounded-lg border px-3 py-2 font-sans text-sm ${
            oauthNotice.type === 'success'
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-destructive/30 bg-destructive/5 text-destructive'
          }`}
          role="status"
        >
          {oauthNotice.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'connected', 'syncing', 'error'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-2.5 py-1 font-sans text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              filter === f
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-sans text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div
          className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-12 text-center"
          role="status"
          aria-live="polite"
          aria-label="Loading integrations"
        >
          <p className="font-sans text-sm text-muted-foreground">Loading integrations…</p>
        </div>
      ) : !hasConnections ? (
        <EmptyIntegrationsState onConnect={() => openConnect()} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            No integrations match this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) =>
            item.connection ? (
              <ConnectedPlatformCard
                key={item.type}
                integration={item.connection}
                inputCount={triggers.filter((t) => t.integration === item.type).length}
                outputCount={agents.filter((a) => a.integration === item.type).length}
              />
            ) : (
              <AvailablePlatformCard
                key={item.type}
                type={item.type}
                description={item.description}
                onConnect={() => openConnect(item.type)}
              />
            ),
          )}
        </div>
      )}

      {connectedTypes.size > 0 && (
        <p className="font-sans text-xs text-muted-foreground">
          After connecting, configure{' '}
          <Link to="/inputs" className="text-primary hover:underline">
            input triggers
          </Link>{' '}
          and{' '}
          <Link to="/outputs" className="text-primary hover:underline">
            output agents
          </Link>{' '}
          per platform.
        </p>
      )}

      {showConnect && (
        <ConnectModal
          initialType={connectTarget}
          connectedTypes={connectedTypes}
          onClose={() => {
            setShowConnect(false);
            setConnectTarget(null);
          }}
          onConnected={() => void refresh()}
        />
      )}
    </div>
  );
}

function ConnectedPlatformCard({
  integration,
  inputCount,
  outputCount,
}: {
  integration: Integration;
  inputCount: number;
  outputCount: number;
}) {
  const meta = integrationMeta[integration.type];
  return (
    <article className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised"
            style={{ borderColor: `${meta.color}30` }}
          >
            <IntegrationIcon type={integration.type} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">
              {integration.name}
            </h3>
            <p className="font-sans text-xs text-muted-foreground">
              {integration.channel ?? integration.account}
            </p>
          </div>
        </div>
        <StatusBadge status={integration.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <p className="font-display text-lg font-semibold tabular-nums text-foreground">
            {integration.signalsToday}
          </p>
          <p className="font-sans text-[10px] text-muted-foreground">signals today</p>
        </div>
        <div>
          <p className="font-display text-lg font-semibold tabular-nums text-foreground">
            {inputCount}
          </p>
          <p className="font-sans text-[10px] text-muted-foreground">input triggers</p>
        </div>
        <div>
          <p className="font-display text-lg font-semibold tabular-nums text-foreground">
            {outputCount}
          </p>
          <p className="font-sans text-[10px] text-muted-foreground">output agents</p>
        </div>
      </div>
      <p className="mt-3 font-sans text-[11px] text-muted-foreground">
        Synced {integration.lastSync}
      </p>
    </article>
  );
}

function AvailablePlatformCard({
  type,
  description,
  onConnect,
}: {
  type: CoreIntegrationType;
  description: string;
  onConnect: () => void;
}) {
  const meta = integrationMeta[type];
  return (
    <article className="flex flex-col rounded-xl border border-dashed border-border bg-surface p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised"
            style={{ borderColor: `${meta.color}30` }}
          >
            <IntegrationIcon type={type} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">
              {meta.label}
            </h3>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <StatusBadge status="available" />
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="mt-4 w-full rounded-lg border border-primary/30 bg-primary/5 py-2 font-sans text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Connect
      </button>
    </article>
  );
}

function EmptyIntegrationsState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <img
        src={emptyInputsIllustration}
        alt=""
        aria-hidden="true"
        className="mb-6 w-[35%] max-w-[200px] min-w-[140px]"
      />
      <h2 className="font-display text-lg font-semibold text-foreground">
        No platforms connected
      </h2>
      <p className="mt-2 max-w-sm font-sans text-sm text-muted-foreground">
        Connect Slack, Gmail, or Granola to start feeding your radar.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="mt-6 rounded-xl bg-primary px-4 py-2 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Connect your first platform
      </button>
    </div>
  );
}

function ConnectModal({
  onClose,
  onConnected,
  initialType,
  connectedTypes,
}: {
  onClose: () => void;
  onConnected: () => void;
  initialType: CoreIntegrationType | null;
  connectedTypes: Set<CoreIntegrationType>;
}) {
  const [granolaKey, setGranolaKey] = useState('');
  const [connecting, setConnecting] = useState<CoreIntegrationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState(false);

  const handleOAuthConnect = async (type: 'slack' | 'gmail') => {
    if (!isApiConfigured()) {
      setError('API is not configured — set VITE_API_BASE_URL to connect platforms');
      return;
    }
    setError(null);
    setConnecting(type);
    const result = await startIntegrationOAuth(type);
    setConnecting(null);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    window.location.href = result.url;
  };

  const handleGranolaSave = async () => {
    if (granolaKey.trim().length < 8) {
      setError('API key must be at least 8 characters');
      return;
    }
    setError(null);
    setSavingKey(true);
    const result = await saveGranolaApiKey(granolaKey.trim());
    setSavingKey(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onConnected();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Connect platform"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-glow-teal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-foreground">
          Connect platform
        </h2>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Choose a platform to link to your Mattar workspace.
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-sans text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {platformCatalog.map((platform) => {
            const isConnected = connectedTypes.has(platform.type);
            const isOAuth = platform.type === 'slack' || platform.type === 'gmail';
            return (
              <li key={platform.type}>
                <button
                  type="button"
                  disabled={isConnected || connecting === platform.type}
                  onClick={() => {
                    if (platform.type === 'slack' || platform.type === 'gmail') {
                      void handleOAuthConnect(platform.type);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    initialType === platform.type
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted'
                  } ${isConnected || connecting === platform.type ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <IntegrationIcon type={platform.type} className="h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-sans text-sm font-medium text-foreground">
                        {integrationMeta[platform.type].label}
                      </p>
                      <StatusBadge
                        status={isConnected ? 'connected' : 'available'}
                      />
                    </div>
                    <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                      {platform.description}
                    </p>
                    {connecting === platform.type && (
                      <p className="mt-1 font-sans text-[11px] text-primary">Redirecting…</p>
                    )}
                    {isOAuth && !isConnected && !isApiConfigured() && (
                      <p className="mt-1 font-sans text-[11px] text-muted-foreground">
                        Requires API connection
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 rounded-lg border border-border bg-surface p-3">
          <label htmlFor="granola-api-key" className="font-sans text-xs font-medium text-foreground">
            Granola API key
          </label>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
            Paste your Granola API key to sync meeting notes.
          </p>
          <input
            id="granola-api-key"
            type="password"
            value={granolaKey}
            onChange={(e) => setGranolaKey(e.target.value)}
            placeholder="grnl_…"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-sans text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => void handleGranolaSave()}
            disabled={savingKey || connectedTypes.has('granola')}
            className="mt-2 w-full rounded-lg bg-primary px-3 py-2 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingKey ? 'Saving…' : connectedTypes.has('granola') ? 'Granola connected' : 'Save API key'}
          </button>
        </div>
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
