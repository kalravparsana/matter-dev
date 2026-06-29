import googleIcon from '@/assets/icons/integration-gmail.svg';
import { Icon } from '@/components/Icon';

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GoogleSignInButton({ onClick, disabled, loading }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 font-sans text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon src={googleIcon} className="h-5 w-5" alt="" />
      {loading ? 'Connecting to Google…' : 'Continue with Google'}
    </button>
  );
}
