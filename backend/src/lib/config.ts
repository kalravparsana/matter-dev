export function loadConfig() {
  const required = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new Error(`Missing required configuration: ${name}`);
    }
    return value;
  };

  const optional = (name: string, fallback = ''): string =>
    process.env[name]?.trim() ?? fallback;

  return {
    cognitoUserPoolId: optional('COGNITO_USER_POOL_ID'),
    cognitoClientId: optional('COGNITO_CLIENT_ID'),
    cognitoRegion: optional('COGNITO_REGION', 'us-east-1'),
    cognitoDomain: optional('COGNITO_DOMAIN'),
    oauthRedirectUri: optional('OAUTH_REDIRECT_URI'),
    tableName: required('MATTAR_TABLE_NAME'),
    allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    slackClientId: optional('SLACK_CLIENT_ID'),
    slackClientSecret: optional('SLACK_CLIENT_SECRET'),
    slackSigningSecret: optional('SLACK_SIGNING_SECRET'),
    slackOAuthRedirectUri: optional('SLACK_OAUTH_REDIRECT_URI'),
    googleOAuthClientId: optional('GOOGLE_OAUTH_CLIENT_ID'),
    googleOAuthClientSecret: optional('GOOGLE_OAUTH_CLIENT_SECRET'),
    gmailOAuthRedirectUri: optional('GMAIL_OAUTH_REDIRECT_URI'),
    apiBaseUrl: optional('API_BASE_URL'),
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
