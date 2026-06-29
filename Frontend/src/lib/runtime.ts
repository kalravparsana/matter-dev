import type { InsightMetrics } from '@/data/mattar';
import { getRuntimeConfig } from '@/lib/runtime';

declare global {
  interface Window {
    __MATTAR_CONFIG__?: Record<string, string | undefined>;
  }
}

/** Local dev only — mock data and demo sign-in when API env vars are unset. */
export function isPreviewMode(): boolean {
  return import.meta.env.DEV && !Boolean(getRuntimeConfig('API_BASE_URL'));
}

export function getRuntimeConfig(key: string): string | undefined {
  const viteKey = `VITE_${key}` as keyof ImportMetaEnv;
  const fromEnv = import.meta.env[viteKey];
  const fromWindow =
    typeof window !== 'undefined' ? window.__MATTAR_CONFIG__?.[key] : undefined;
  const value = (fromWindow ?? fromEnv)?.trim();
  return value || undefined;
}

export const emptyInsightMetrics: InsightMetrics = {
  signalsIn: 0,
  matterFiltered: 0,
  actionsRouted: 0,
  pendingReview: 0,
  avgResponseMin: 0,
};
