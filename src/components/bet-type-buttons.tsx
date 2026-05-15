'use client';

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
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
      {BET_TYPES.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              'group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-4',
              'transition-bounce select-none active:scale-[0.96]',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'border-border bg-card hover:border-primary/40 hover:bg-accent hover:shadow-md',
            )}
          >
            <span className={cn(
              'text-3xl transition-transform duration-200',
              active ? 'scale-110' : 'group-hover:scale-110',
            )}>
              {BET_EMOJI[t]}
            </span>
            <span className="text-sm font-semibold leading-tight text-center">
              {BET_LABELS[t]}
            </span>
            {active && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-foreground animate-pop-in" />
            )}
          </button>
        );
      })}
    </div>
  );
}
