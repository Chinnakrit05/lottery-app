'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BET_EMOJI, BET_LABELS, BET_TYPES } from '@/lib/constants';
import type { BetType } from '@/types/database';

interface Props {
  value: BetType;
  onChange: (v: BetType) => void;
  className?: string;
}

export function BetTypeButtons({ value, onChange, className }: Props) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-2', className)}>
      {BET_TYPES.map((t) => (
        <Button
          key={t}
          type="button"
          variant={value === t ? 'default' : 'outline'}
          onClick={() => onChange(t)}
          className="h-12 justify-start"
        >
          <span className="mr-1">{BET_EMOJI[t]}</span>
          <span>{BET_LABELS[t]}</span>
        </Button>
      ))}
    </div>
  );
}
