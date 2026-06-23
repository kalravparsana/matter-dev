import type {
  InputSignal,
  OutputAction,
  InputTrigger,
  OutputAgent,
  InsightMetrics,
  MatterConfig,
} from '@/data/mattar';
import { apiFetch } from './client';

export async function fetchSignals(): Promise<InputSignal[]> {
  const res = await apiFetch<{ signals: InputSignal[] }>('/api/v1/signals');
  return res.signals;
}

export async function fetchOutputs(): Promise<OutputAction[]> {
  const res = await apiFetch<{ outputs: OutputAction[] }>('/api/v1/outputs');
  return res.outputs;
}

export async function fetchInputTriggers(): Promise<InputTrigger[]> {
  const res = await apiFetch<{ triggers: InputTrigger[] }>('/api/v1/input-triggers');
  return res.triggers;
}

export async function updateInputTrigger(id: string, enabled: boolean): Promise<InputTrigger> {
  const res = await apiFetch<{ trigger: InputTrigger }>(`/api/v1/input-triggers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
  return res.trigger;
}

export async function fetchOutputAgents(): Promise<OutputAgent[]> {
  const res = await apiFetch<{ agents: OutputAgent[] }>('/api/v1/output-agents');
  return res.agents;
}

export async function fetchMetrics(): Promise<InsightMetrics | null> {
  const res = await apiFetch<{ metrics: InsightMetrics | null }>('/api/v1/metrics');
  return res.metrics;
}

export async function fetchMatterConfig(): Promise<MatterConfig | null> {
  const res = await apiFetch<{ matterConfig: MatterConfig | null }>('/api/v1/matter-config');
  return res.matterConfig;
}

export async function updateMatterConfig(
  patch: Partial<MatterConfig>,
): Promise<MatterConfig> {
  const res = await apiFetch<{ matterConfig: MatterConfig }>('/api/v1/matter-config', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.matterConfig;
}
