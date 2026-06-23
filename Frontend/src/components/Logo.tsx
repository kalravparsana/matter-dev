import logoMark from '@/assets/logos/logo-mark.svg';

export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return <img src={logoMark} alt="Mattar" className={className} />;
}

export function LogoLockup() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
        <Logo className="h-6 w-6" />
      </div>
      <span className="font-display text-base font-semibold tracking-tight text-foreground">
        Mattar
      </span>
    </div>
  );
}
