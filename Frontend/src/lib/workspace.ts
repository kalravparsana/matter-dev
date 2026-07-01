export const ALLOWED_WORKSPACE_DOMAIN = 'york.ie';
export const ALLOWED_WORKSPACE_NAME = 'York';

export function isAllowedWorkspaceEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_WORKSPACE_DOMAIN}`);
}
