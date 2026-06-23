export const config = {
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID ?? '',
  cognitoRegion: process.env.COGNITO_REGION ?? 'us-east-1',
  cognitoDomain: process.env.COGNITO_DOMAIN ?? '',
  oauthRedirectUri: process.env.OAUTH_REDIRECT_URI ?? '',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  oauthStateSecret: process.env.OAUTH_STATE_SECRET ?? 'dev-state-secret',
  slackClientId: process.env.SLACK_CLIENT_ID ?? '',
  slackClientSecret: process.env.SLACK_CLIENT_SECRET ?? '',
  slackRedirectUri: process.env.SLACK_REDIRECT_URI ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  gmailRedirectUri: process.env.GMAIL_REDIRECT_URI ?? '',
  granolaApiBaseUrl: process.env.GRANOLA_API_BASE_URL ?? 'https://api.granola.ai',
  tableName: process.env.DYNAMODB_TABLE_NAME ?? 'MattarTable',
};

export function cognitoIssuer(): string {
  return `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}`;
}

export function cognitoJwksUrl(): string {
  return `${cognitoIssuer()}/.well-known/jwks.json`;
}
