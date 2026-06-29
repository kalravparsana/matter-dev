import { Icon } from '@/components/Icon';
import { integrationMeta } from '@/data/mattar';
import type { CoreIntegrationType } from '@/data/mattar';
import iconSlack from '@/assets/icons/integration-slack.svg';
import iconGmail from '@/assets/icons/integration-gmail.svg';
import iconGranola from '@/assets/icons/integration-granola.svg';

export const integrationIconSrc: Record<CoreIntegrationType, string> = {
  slack: iconSlack,
  gmail: iconGmail,
  granola: iconGranola,
};

interface IntegrationIconProps {
  type: CoreIntegrationType;
  className?: string;
}

export function IntegrationIcon({ type, className = 'h-5 w-5' }: IntegrationIconProps) {
  return (
    <Icon
      src={integrationIconSrc[type]}
      className={className}
      alt={integrationMeta[type].label}
    />
  );
}
