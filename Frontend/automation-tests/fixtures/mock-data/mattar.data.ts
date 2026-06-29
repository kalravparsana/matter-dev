/** Mattar domain data for Playwright specs */
export const mattarData = {
  valid: {
    email: 'priya@meridian.io',
    fullName: 'Priya Natarajan',
    granolaApiKey: 'grnl_live_test_key_12345678',
  },
  invalid: {
    email: 'not-an-email',
    granolaApiKey: 'short',
  },
  edge: {
    longPrompt: 'A'.repeat(1000),
    xssLikeText: '<script>alert(1)</script>',
    whitespaceOnly: '   ',
  },
  api: {
    integrations: [
      {
        id: 'int-1',
        name: 'Slack',
        type: 'slack',
        status: 'connected',
        lastSync: '2 min ago',
        signalsToday: 28,
        channel: 'Meridian HQ workspace',
      },
      {
        id: 'int-2',
        name: 'Gmail',
        type: 'gmail',
        status: 'connected',
        lastSync: '4 min ago',
        signalsToday: 14,
        account: 'priya@meridian.io',
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
    ],
    signals: [
      {
        id: 'sig-1',
        source: '#product-standup',
        integration: 'slack',
        preview: 'Blocked on API rate limits — need eng decision by noon',
        receivedAt: '8:14 AM',
        priority: 'hot',
        matterScore: 94,
      },
    ],
    outputs: [
      {
        id: 'out-1',
        name: 'Reply to Sarah — clause review',
        integration: 'gmail',
        kind: 'gmail-send-reply',
        lastRun: '8:31 AM',
        status: 'running',
        todayCount: 3,
      },
    ],
    metrics: {
      signalsIn: 47,
      matterFiltered: 12,
      actionsRouted: 9,
      pendingReview: 3,
      avgResponseMin: 4.2,
    },
    errorMessage: 'Request failed',
  },
} as const;
