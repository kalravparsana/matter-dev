export const ALLOWED_WORKSPACE_DOMAIN =
  process.env.ALLOWED_WORKSPACE_DOMAIN?.trim().toLowerCase() || 'york.ie';

export const ALLOWED_WORKSPACE_NAME =
  process.env.ALLOWED_WORKSPACE_NAME?.trim() || 'York';

export function isAllowedWorkspaceEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_WORKSPACE_DOMAIN}`);
}
