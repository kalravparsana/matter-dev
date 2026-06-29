import { useCallback, useEffect, useRef, useState } from 'react';
import {
  inputSignals as mockSignals,
  routedOutputs as mockOutputs,
  insightMetrics as mockMetrics,
  integrations as mockIntegrations,
  inputTriggers as mockTriggers,
  outputAgents as mockAgents,
  defaultMatterConfig as mockMatterConfig,
} from '@/data/mattar';
import type {
  InputSignal,
  OutputAction,
  InsightMetrics,
  Integration,
  InputTrigger,
  OutputAgent,
  MatterConfig,
} from '@/data/mattar';
import { apiFetch, isApiConfigured } from '@/lib/api';
import { emptyInsightMetrics, isPreviewMode } from '@/lib/runtime';

interface TodayData {
  signals: InputSignal[];
  outputs: OutputAction[];
  metrics: InsightMetrics;
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTodayData(pollIntervalMs = 5000): TodayData {
  const preview = isPreviewMode();
  const [signals, setSignals] = useState<InputSignal[]>(preview ? mockSignals : []);
  const [outputs, setOutputs] = useState<OutputAction[]>(preview ? mockOutputs : []);
  const [metrics, setMetrics] = useState<InsightMetrics>(
    preview ? mockMetrics : emptyInsightMetrics,
  );
  const [integrations, setIntegrations] = useState<Integration[]>(
    preview ? mockIntegrations : [],
  );
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const [signalsData, outputsData, metricsData, integrationsData] = await Promise.all([
        apiFetch<InputSignal[]>('/api/v1/signals'),
        apiFetch<OutputAction[]>('/api/v1/outputs'),
        apiFetch<InsightMetrics>('/api/v1/metrics/today'),
        apiFetch<Integration[]>('/api/v1/integrations'),
      ]);

      if (!mounted.current) return;
      setSignals(signalsData);
      setOutputs(outputsData);
      setMetrics(metricsData);
      setIntegrations(integrationsData);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    if (!isApiConfigured()) return undefined;

    const id = window.setInterval(() => void refresh(), pollIntervalMs);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [refresh, pollIntervalMs]);

  return { signals, outputs, metrics, integrations, loading, error, refresh };
}

export function useIntegrations() {
  const preview = isPreviewMode();
  const [integrations, setIntegrations] = useState<Integration[]>(
    preview ? mockIntegrations : [],
  );
  const [loading, setLoading] = useState(isApiConfigured());

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    apiFetch<Integration[]>('/api/v1/integrations')
      .then(setIntegrations)
      .finally(() => setLoading(false));
  }, []);

  return { integrations, loading };
}

export function useInputTriggers() {
  const preview = isPreviewMode();
  const [triggers, setTriggers] = useState<InputTrigger[]>(preview ? mockTriggers : []);
  const { integrations } = useIntegrations();

  useEffect(() => {
    if (!isApiConfigured()) return;
    apiFetch<InputTrigger[]>('/api/v1/input-triggers').then(setTriggers);
  }, []);

  const toggleTrigger = useCallback(async (id: string) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
    if (isApiConfigured()) {
      const current = triggers.find((t) => t.id === id);
      if (current) {
        try {
          const updated = await apiFetch<InputTrigger>(`/api/v1/input-triggers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled: !current.enabled }),
          });
          setTriggers((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch {
          setTriggers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, enabled: current.enabled } : t)),
          );
        }
      }
    }
  }, [triggers]);

  return { triggers, integrations, toggleTrigger };
}

export function useOutputAgents() {
  const preview = isPreviewMode();
  const [agents, setAgents] = useState<OutputAgent[]>(preview ? mockAgents : []);
  const { integrations } = useIntegrations();

  useEffect(() => {
    if (!isApiConfigured()) return;
    apiFetch<OutputAgent[]>('/api/v1/output-agents').then(setAgents);
  }, []);

  return { agents, integrations };
}

export function useMatterConfig() {
  const preview = isPreviewMode();
  const [config, setConfig] = useState<MatterConfig>(
    preview ? mockMatterConfig : {
      prompt: '',
      temperature: 0.3,
      priorityThreshold: 70,
      autoRoute: false,
      lastEdited: '—',
      editedBy: '—',
    },
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) return;
    apiFetch<MatterConfig>('/api/v1/matter-config').then(setConfig);
  }, []);

  const save = useCallback(async (patch: Partial<MatterConfig>) => {
    setSaving(true);
    try {
      if (isApiConfigured()) {
        const updated = await apiFetch<MatterConfig>('/api/v1/matter-config', {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        setConfig(updated);
      } else if (preview) {
        setConfig((c) => ({ ...c, ...patch, lastEdited: 'Just now' }));
      }
    } finally {
      setSaving(false);
    }
  }, []);

  return { config, setConfig, save, saving };
}
