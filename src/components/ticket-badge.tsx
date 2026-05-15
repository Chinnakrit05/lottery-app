import { BET_EMOJI, BET_LABELS, BET_COLOR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BetType } from '@/types/database';

interface Props {
  betType: BetType;
  className?: string;
}

export function TicketBadge({ betType, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        BET_COLOR[betType],
        className,
      )}
    >
      <span>{BET_EMOJI[betType]}</span>
      <span>{BET_LABELS[betType]}</span>
    </span>
  );
}
