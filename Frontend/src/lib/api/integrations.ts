import type { Integration } from '@/data/mattar';
import { apiFetch } from './client';

export async function fetchIntegrations(): Promise<Integration[]> {
  const res = await apiFetch<{ integrations: Integration[] }>('/api/v1/integrations');
  return res.integrations;
}

export async function startSlackOAuth(): Promise<string> {
  const res = await apiFetch<{ authorizeUrl: string }>('/api/v1/integrations/slack/authorize', {
    method: 'POST',
  });
  return res.authorizeUrl;
}

export async function startGmailOAuth(): Promise<string> {
  const res = await apiFetch<{ authorizeUrl: string }>('/api/v1/integrations/gmail/authorize', {
    method: 'POST',
  });
  return res.authorizeUrl;
}

export async function connectGranola(apiKey: string): Promise<Integration> {
  const res = await apiFetch<{ integration: Integration }>('/api/v1/integrations/granola', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
  return res.integration;
}

export async function disconnectIntegration(id: string): Promise<void> {
  await apiFetch(`/api/v1/integrations/${id}`, { method: 'DELETE' });
}
