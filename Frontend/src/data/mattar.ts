export type SignalStatus = 'hot' | 'active' | 'queued' | 'routed' | 'idle';
export type ConnectionStatus =
  | 'connected'
  | 'syncing'
  | 'error'
  | 'disconnected'
  | 'available';
export type CoreIntegrationType = 'slack' | 'gmail' | 'granola';

export type InputTriggerKind =
  | 'slack-new-message'
  | 'slack-new-mention'
  | 'slack-thread-reply'
  | 'gmail-new-email'
  | 'gmail-thread-reply'
  | 'granola-new-meeting'
  | 'granola-new-action-item';

export type OutputAgentKind =
  | 'gmail-send-reply'
  | 'gmail-create-draft'
  | 'slack-send-message'
  | 'slack-post-alert'
  | 'granola-push-action-item';

/** @deprecated Use CoreIntegrationType — kept for forward-compatible imports */
export type IntegrationType = CoreIntegrationType;
export type OutputStatus = 'ready' | 'running' | 'paused' | 'error';

export interface InputSignal {
  id: string;
  source: string;
  integration: CoreIntegrationType;
  preview: string;
  receivedAt: string;
  priority: SignalStatus;
  matterScore: number;
}

export interface OutputAction {
  id: string;
  name: string;
  integration: CoreIntegrationType;
  kind: OutputAgentKind;
  lastRun: string;
  status: OutputStatus;
  todayCount: number;
}

export interface Integration {
  id: string;
  name: string;
  type: CoreIntegrationType;
  status: ConnectionStatus;
  lastSync: string;
  signalsToday: number;
  channel?: string;
  account?: string;
}

export interface PlatformCatalogEntry {
  type: CoreIntegrationType;
  description: string;
}

export interface InputTrigger {
  id: string;
  integration: CoreIntegrationType;
  kind: InputTriggerKind;
  label: string;
  description: string;
  enabled: boolean;
  eventsToday: number;
  lastEvent: string;
}

export interface OutputAgent {
  id: string;
  integration: CoreIntegrationType;
  kind: OutputAgentKind;
  name: string;
  description: string;
  status: OutputStatus;
  lastRun: string;
  todayCount: number;
}

export interface InsightMetrics {
  signalsIn: number;
  matterFiltered: number;
  actionsRouted: number;
  pendingReview: number;
  avgResponseMin: number;
}

export interface MatterConfig {
  prompt: string;
  temperature: number;
  priorityThreshold: number;
  autoRoute: boolean;
  lastEdited: string;
  editedBy: string;
}

export const insightMetrics: InsightMetrics = {
  signalsIn: 47,
  matterFiltered: 12,
  actionsRouted: 9,
  pendingReview: 3,
  avgResponseMin: 4.2,
};

export const emptyInsightMetrics: InsightMetrics = {
  signalsIn: 0,
  matterFiltered: 0,
  actionsRouted: 0,
  pendingReview: 0,
  avgResponseMin: 0,
};

export const inputSignals: InputSignal[] = [
  {
    id: 'sig-1',
    source: '#product-standup',
    integration: 'slack',
    preview: 'Blocked on API rate limits — need eng decision by noon',
    receivedAt: '8:14 AM',
    priority: 'hot',
    matterScore: 94,
  },
  {
    id: 'sig-2',
    source: 'sarah.chen@york.ie',
    integration: 'gmail',
    preview: 'Re: Q2 contract renewal — legal flagged clause 7.2',
    receivedAt: '7:52 AM',
    priority: 'hot',
    matterScore: 91,
  },
  {
    id: 'sig-3',
    source: 'Investor sync notes',
    integration: 'granola',
    preview: 'Action item: send updated cap table before Thursday call',
    receivedAt: '7:30 AM',
    priority: 'active',
    matterScore: 78,
  },
  {
    id: 'sig-4',
    source: '#customer-success',
    integration: 'slack',
    preview: 'Acme Corp escalation — churn risk, wants callback today',
    receivedAt: '7:18 AM',
    priority: 'hot',
    matterScore: 88,
  },
  {
    id: 'sig-5',
    source: 'partnerships@cloudstack.com',
    integration: 'gmail',
    preview: 'Partnership proposal follow-up — decision needed this week',
    receivedAt: '6:45 AM',
    priority: 'active',
    matterScore: 72,
  },
  {
    id: 'sig-6',
    source: 'Weekly planning',
    integration: 'granola',
    preview: 'Hiring: finalize offer for senior backend role',
    receivedAt: 'Yesterday',
    priority: 'queued',
    matterScore: 65,
  },
  {
    id: 'sig-7',
    source: '#eng-alerts',
    integration: 'slack',
    preview: 'Deploy pipeline failed on staging — non-blocking',
    receivedAt: 'Yesterday',
    priority: 'queued',
    matterScore: 41,
  },
];

export const routedOutputs: OutputAction[] = [
  {
    id: 'out-1',
    name: 'Reply to Sarah — clause review',
    integration: 'gmail',
    kind: 'gmail-send-reply',
    lastRun: '8:31 AM',
    status: 'running',
    todayCount: 3,
  },
  {
    id: 'out-2',
    name: 'Alert #eng-leads — rate limit',
    integration: 'slack',
    kind: 'slack-post-alert',
    lastRun: '8:22 AM',
    status: 'ready',
    todayCount: 2,
  },
  {
    id: 'out-3',
    name: 'Cap table action item pushed',
    integration: 'granola',
    kind: 'granola-push-action-item',
    lastRun: '8:15 AM',
    status: 'ready',
    todayCount: 1,
  },
  {
    id: 'out-4',
    name: 'Cap table reminder',
    integration: 'gmail',
    kind: 'gmail-send-reply',
    lastRun: '7:45 AM',
    status: 'ready',
    todayCount: 2,
  },
];

export const integrations: Integration[] = [
  {
    id: 'int-1',
    name: 'Slack',
    type: 'slack',
    status: 'connected',
    lastSync: '2 min ago',
    signalsToday: 28,
    channel: 'York HQ workspace',
  },
  {
    id: 'int-2',
    name: 'Gmail',
    type: 'gmail',
    status: 'connected',
    lastSync: '4 min ago',
    signalsToday: 14,
    account: 'priya@york.ie',
  },
  {
    id: 'int-3',
    name: 'Granola',
    type: 'granola',
    status: 'syncing',
    lastSync: 'Syncing…',
    signalsToday: 5,
    account: 'Meeting notes',
  },
];

export const outputAgents: OutputAgent[] = [
  {
    id: 'agent-1',
    integration: 'gmail',
    kind: 'gmail-send-reply',
    name: 'Email reply sent',
    description: 'Draft and send Gmail replies on routed signals',
    lastRun: '8:31 AM',
    status: 'running',
    todayCount: 5,
  },
  {
    id: 'agent-2',
    integration: 'gmail',
    kind: 'gmail-create-draft',
    name: 'Draft created',
    description: 'Stage replies for review before sending',
    lastRun: '7:58 AM',
    status: 'ready',
    todayCount: 2,
  },
  {
    id: 'agent-3',
    integration: 'slack',
    kind: 'slack-send-message',
    name: 'Slack message sent',
    description: 'Post DMs or channel messages from routed signals',
    lastRun: '8:22 AM',
    status: 'ready',
    todayCount: 3,
  },
  {
    id: 'agent-4',
    integration: 'slack',
    kind: 'slack-post-alert',
    name: 'Channel alert posted',
    description: 'Push priority alerts to #eng-leads and #customer-success',
    lastRun: '8:18 AM',
    status: 'running',
    todayCount: 2,
  },
  {
    id: 'agent-5',
    integration: 'granola',
    kind: 'granola-push-action-item',
    name: 'Action item exported',
    description: 'Push meeting action items to your task tracker',
    lastRun: 'Yesterday',
    status: 'paused',
    todayCount: 0,
  },
];

export const inputTriggers: InputTrigger[] = [
  {
    id: 'trg-1',
    integration: 'slack',
    kind: 'slack-new-message',
    label: 'New message',
    description: 'Any message in monitored channels (#product-standup, #customer-success, #eng-alerts)',
    enabled: true,
    eventsToday: 18,
    lastEvent: '8:14 AM',
  },
  {
    id: 'trg-2',
    integration: 'slack',
    kind: 'slack-new-mention',
    label: 'New @mention',
    description: 'Direct @mentions of you or @channel in watched threads',
    enabled: true,
    eventsToday: 6,
    lastEvent: '7:48 AM',
  },
  {
    id: 'trg-3',
    integration: 'slack',
    kind: 'slack-thread-reply',
    label: 'Thread reply',
    description: 'Replies in threads you participate in or own',
    enabled: true,
    eventsToday: 4,
    lastEvent: '7:22 AM',
  },
  {
    id: 'trg-4',
    integration: 'gmail',
    kind: 'gmail-new-email',
    label: 'New email',
    description: 'Inbound messages to priya@york.ie excluding promotions',
    enabled: true,
    eventsToday: 11,
    lastEvent: '7:52 AM',
  },
  {
    id: 'trg-5',
    integration: 'gmail',
    kind: 'gmail-thread-reply',
    label: 'Thread reply',
    description: 'New replies in threads you are already on',
    enabled: true,
    eventsToday: 3,
    lastEvent: '6:45 AM',
  },
  {
    id: 'trg-6',
    integration: 'granola',
    kind: 'granola-new-meeting',
    label: 'New meeting notes',
    description: 'Notes synced after Investor sync, Weekly planning, and standups',
    enabled: true,
    eventsToday: 3,
    lastEvent: '7:30 AM',
  },
  {
    id: 'trg-7',
    integration: 'granola',
    kind: 'granola-new-action-item',
    label: 'New action item',
    description: 'Action items extracted from meeting transcripts',
    enabled: true,
    eventsToday: 2,
    lastEvent: '7:30 AM',
  },
];

export const defaultMatterConfig: MatterConfig = {
  prompt: `You are the Matter agent for York's ops team. Your job is to surface only what needs human attention today.

Prioritize:
- Revenue risk (churn, contract issues, payment blocks)
- Team blockers with deadlines today
- Investor or board commitments with dates attached
- Customer escalations marked urgent

Deprioritize:
- FYI threads with no ask
- Automated alerts that self-resolved
- Scheduling back-and-forth without decisions

For each signal, output: priority (hot/active/queued), a one-line summary, and recommended output action.`,
  temperature: 0.3,
  priorityThreshold: 70,
  autoRoute: true,
  lastEdited: 'Jun 18, 2026',
  editedBy: 'Priya Natarajan',
};

export const workspaceUser = {
  firstName: 'Priya',
  fullName: 'Priya Natarajan',
  initials: 'PN',
  email: 'priya@york.ie',
  workspace: 'York',
  role: 'Owner',
} as const;

export const integrationMeta = {
  slack: { label: 'Slack', color: '#E01E5A' },
  gmail: { label: 'Gmail', color: '#EA4335' },
  granola: { label: 'Granola', color: '#B5C832' },
} as const;

export const platformCatalog: PlatformCatalogEntry[] = [
  {
    type: 'slack',
    description: 'Channels, DMs, and thread mentions from your workspace',
  },
  {
    type: 'gmail',
    description: 'Inbox threads and replies from your connected account',
  },
  {
    type: 'granola',
    description: 'Meeting notes and extracted action items',
  },
];

export const inputTriggerMeta: Record<
  InputTriggerKind,
  { label: string; eventLabel: string }
> = {
  'slack-new-message': { label: 'New message', eventLabel: 'messages' },
  'slack-new-mention': { label: 'New @mention', eventLabel: 'mentions' },
  'slack-thread-reply': { label: 'Thread reply', eventLabel: 'replies' },
  'gmail-new-email': { label: 'New email', eventLabel: 'emails' },
  'gmail-thread-reply': { label: 'Thread reply', eventLabel: 'replies' },
  'granola-new-meeting': { label: 'New meeting notes', eventLabel: 'meetings' },
  'granola-new-action-item': { label: 'New action item', eventLabel: 'action items' },
};

export const outputAgentMeta: Record<
  OutputAgentKind,
  { label: string; integration: CoreIntegrationType }
> = {
  'gmail-send-reply': { label: 'Email reply sent', integration: 'gmail' },
  'gmail-create-draft': { label: 'Draft created', integration: 'gmail' },
  'slack-send-message': { label: 'Slack message sent', integration: 'slack' },
  'slack-post-alert': { label: 'Channel alert posted', integration: 'slack' },
  'granola-push-action-item': {
    label: 'Action item exported',
    integration: 'granola',
  },
};

export const outputTypeMeta = outputAgentMeta;
