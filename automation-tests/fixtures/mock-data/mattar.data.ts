/** Shared mock data for Playwright specs — mirrors Frontend/src/data/mattar.ts shapes */

export const integrationsData = {
  valid: {
    slack: { type: 'slack', status: 'connected', name: 'Slack', channel: 'Meridian HQ workspace' },
    gmail: { type: 'gmail', status: 'connected', name: 'Gmail', account: 'priya@meridian.io' },
    granola: { type: 'granola', status: 'syncing', name: 'Granola', account: 'Meeting notes' },
  },
  invalid: {
    apiKey: 'short',
    emptyKey: '',
  },
  edge: {
    apiKey: 'A'.repeat(200),
    xssLikeText: '<script>alert(1)</script>',
  },
  api: {
    listSuccess: [
      { id: 'int-1', name: 'Slack', type: 'slack', status: 'connected', lastSync: '2 min ago', signalsToday: 28, channel: 'Meridian HQ workspace' },
      { id: 'int-2', name: 'Gmail', type: 'gmail', status: 'connected', lastSync: '4 min ago', signalsToday: 14, account: 'priya@meridian.io' },
      { id: 'int-3', name: 'Granola', type: 'granola', status: 'syncing', lastSync: 'Syncing…', signalsToday: 5, account: 'Meeting notes' },
    ],
    listEmpty: [],
    errorMessage: 'Request failed',
    slackAuthorizeUrl: 'https://slack.com/oauth/v2/authorize?client_id=test',
    gmailAuthorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
  },
} as const;

export const todayData = {
  valid: { heading: 'Mattar Today' },
  api: {
    signals: [{ id: 'sig-1', source: '#product-standup', integration: 'slack', preview: 'Blocked on API rate limits', receivedAt: '8:14 AM', priority: 'hot', matterScore: 94 }],
    metrics: { signalsIn: 47, matterFiltered: 12, actionsRouted: 9, pendingReview: 3, avgResponseMin: 4.2 },
  },
} as const;

export const matterData = {
  valid: { prompt: 'You are the Matter agent for Meridian\'s ops team.' },
  invalid: { prompt: '' },
  edge: { prompt: 'A'.repeat(1000) },
  api: { errorMessage: 'Invalid matter config' },
} as const;

export const loginData = {
  valid: { email: 'priya@meridian.io' },
  invalid: { email: 'not-an-email' },
  edge: { email: 'a@b.c' },
} as const;
