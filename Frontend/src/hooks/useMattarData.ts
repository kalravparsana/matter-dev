import { useCallback, useEffect, useRef, useState } from 'react';
import {
  inputSignals as mockSignals,
  routedOutputs as mockOutputs,
  insightMetrics as mockMetrics,
  emptyInsightMetrics,
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

const apiMode = isApiConfigured();

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
  const [signals, setSignals] = useState<InputSignal[]>(apiMode ? [] : mockSignals);
  const [outputs, setOutputs] = useState<OutputAction[]>(apiMode ? [] : mockOutputs);
  const [metrics, setMetrics] = useState<InsightMetrics>(
    apiMode ? emptyInsightMetrics : mockMetrics,
  );
  const [integrations, setIntegrations] = useState<Integration[]>(
    apiMode ? [] : mockIntegrations,
  );
  const [loading, setLoading] = useState(apiMode);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!apiMode) {
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
    if (!apiMode) return undefined;

    const id = window.setInterval(() => void refresh(), pollIntervalMs);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [refresh, pollIntervalMs]);

  return { signals, outputs, metrics, integrations, loading, error, refresh };
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(apiMode ? [] : mockIntegrations);
  const [loading, setLoading] = useState(apiMode);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!apiMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<Integration[]>('/api/v1/integrations');
      setIntegrations(data);
      setError(null);
    } catch (err) {
      setIntegrations([]);
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { integrations, loading, error, refresh };
}

export function useInputTriggers() {
  const [triggers, setTriggers] = useState<InputTrigger[]>(apiMode ? [] : mockTriggers);
  const { integrations } = useIntegrations();

  useEffect(() => {
    if (!apiMode) return;
    apiFetch<InputTrigger[]>('/api/v1/input-triggers').then(setTriggers);
  }, []);

  const toggleTrigger = useCallback(async (id: string) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
    if (apiMode) {
      const current = triggers.find((t) => t.id === id);
      if (current) {
        try {
          const updated = await apiFetch<InputTrigger>(`/api/v1/input-triggers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled: !current.enabled }),
          });
          setTriggers((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch {
          /* revert on error */
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
  const [agents, setAgents] = useState<OutputAgent[]>(apiMode ? [] : mockAgents);
  const { integrations } = useIntegrations();

  useEffect(() => {
    if (!apiMode) return;
    apiFetch<OutputAgent[]>('/api/v1/output-agents').then(setAgents);
  }, []);

  return { agents, integrations };
}

export function useMatterConfig() {
  const [config, setConfig] = useState<MatterConfig>(mockMatterConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!apiMode) return;
    apiFetch<MatterConfig>('/api/v1/matter-config').then(setConfig);
  }, []);

  const save = useCallback(async (patch: Partial<MatterConfig>) => {
    setSaving(true);
    try {
      if (apiMode) {
        const updated = await apiFetch<MatterConfig>('/api/v1/matter-config', {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        setConfig(updated);
      } else {
        setConfig((c) => ({ ...c, ...patch, lastEdited: 'Just now' }));
      }
    } finally {
      setSaving(false);
    }
  }, []);

  return { config, setConfig, save, saving };
}
