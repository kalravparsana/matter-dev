import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../lib/config.js';

const SEED_USER_ID = process.env.SEED_USER_ID ?? 'seed-user';

const client = new DynamoDBClient({ region: config.cognitoRegion });
const doc = DynamoDBDocumentClient.from(client);
const pk = `USER#${SEED_USER_ID}`;

async function put(item: Record<string, unknown>) {
  await doc.send(new PutCommand({ TableName: config.tableName, Item: item }));
}

async function seed() {
  await put({
    pk,
    sk: 'PROFILE',
    email: 'priya@meridian.io',
    fullName: 'Priya Natarajan',
    firstName: 'Priya',
    initials: 'PN',
    workspace: 'Meridian',
    role: 'Owner',
  });

  await put({
    pk,
    sk: 'METRICS',
    signalsIn: 47,
    matterFiltered: 12,
    actionsRouted: 9,
    pendingReview: 3,
    avgResponseMin: 4.2,
  });

  const integrations = [
    { id: 'int-1', name: 'Slack', type: 'slack', status: 'connected', lastSync: '2 min ago', signalsToday: 28, channel: 'Meridian HQ workspace' },
    { id: 'int-2', name: 'Gmail', type: 'gmail', status: 'connected', lastSync: '4 min ago', signalsToday: 14, account: 'priya@meridian.io' },
    { id: 'int-3', name: 'Granola', type: 'granola', status: 'syncing', lastSync: 'Syncing…', signalsToday: 5, account: 'Meeting notes' },
  ];
  for (const i of integrations) {
    await put({ pk, sk: `INTEGRATION#${i.type}`, entityType: 'integration', ...i });
  }

  const signals = [
    { id: 'sig-1', source: '#product-standup', integration: 'slack', preview: 'Blocked on API rate limits — need eng decision by noon', receivedAt: '8:14 AM', priority: 'hot', matterScore: 94 },
    { id: 'sig-2', source: 'sarah.chen@meridian.io', integration: 'gmail', preview: 'Re: Q2 contract renewal — legal flagged clause 7.2', receivedAt: '7:52 AM', priority: 'hot', matterScore: 91 },
    { id: 'sig-3', source: 'Investor sync notes', integration: 'granola', preview: 'Action item: send updated cap table before Thursday call', receivedAt: '7:30 AM', priority: 'active', matterScore: 78 },
  ];
  for (const s of signals) {
    await put({ pk, sk: `SIGNAL#${s.id}`, entityType: 'signal', ...s });
  }

  const outputs = [
    { id: 'out-1', name: 'Reply to Sarah — clause review', integration: 'gmail', kind: 'gmail-send-reply', lastRun: '8:31 AM', status: 'running', todayCount: 3 },
    { id: 'out-2', name: 'Alert #eng-leads — rate limit', integration: 'slack', kind: 'slack-post-alert', lastRun: '8:22 AM', status: 'ready', todayCount: 2 },
  ];
  for (const o of outputs) {
    await put({ pk, sk: `OUTPUT#${o.id}`, entityType: 'output', ...o });
  }

  const triggers = [
    { id: 'trg-1', integration: 'slack', kind: 'slack-new-message', label: 'New message', description: 'Any message in monitored channels', enabled: true, eventsToday: 18, lastEvent: '8:14 AM' },
    { id: 'trg-4', integration: 'gmail', kind: 'gmail-new-email', label: 'New email', description: 'Inbound messages to priya@meridian.io', enabled: true, eventsToday: 11, lastEvent: '7:52 AM' },
    { id: 'trg-6', integration: 'granola', kind: 'granola-new-meeting', label: 'New meeting notes', description: 'Notes synced after meetings', enabled: true, eventsToday: 3, lastEvent: '7:30 AM' },
  ];
  for (const t of triggers) {
    await put({ pk, sk: `TRIGGER#${t.id}`, entityType: 'trigger', ...t });
  }

  const agents = [
    { id: 'agent-1', integration: 'gmail', kind: 'gmail-send-reply', name: 'Email reply sent', description: 'Draft and send Gmail replies', lastRun: '8:31 AM', status: 'running', todayCount: 5 },
    { id: 'agent-3', integration: 'slack', kind: 'slack-send-message', name: 'Slack message sent', description: 'Post messages from routed signals', lastRun: '8:22 AM', status: 'ready', todayCount: 3 },
    { id: 'agent-5', integration: 'granola', kind: 'granola-push-action-item', name: 'Action item exported', description: 'Push meeting action items', lastRun: 'Yesterday', status: 'paused', todayCount: 0 },
  ];
  for (const a of agents) {
    await put({ pk, sk: `AGENT#${a.id}`, entityType: 'agent', ...a });
  }

  await put({
    pk,
    sk: 'CONFIG#matter',
    prompt: 'You are the Matter agent for Meridian\'s ops team...',
    temperature: 0.3,
    priorityThreshold: 70,
    autoRoute: true,
    lastEdited: 'Jun 18, 2026',
    editedBy: 'Priya Natarajan',
  });

  console.log('Seed complete for user', SEED_USER_ID);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
