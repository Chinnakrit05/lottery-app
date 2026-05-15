import type { BetType } from '@/types/database';

export const BET_LABELS: Record<BetType, string> = {
  '2_top': '2 ตัวบน',
  '2_bottom': '2 ตัวล่าง',
  '3_top': '3 ตัวบน',
  '3_tod': '3 ตัวโต๊ด',
};

export const BET_EMOJI: Record<BetType, string> = {
  '2_top': '🔼',
  '2_bottom': '🔽',
  '3_top': '🎯',
  '3_tod': '🎲',
};

export const BET_COLOR: Record<BetType, string> = {
  '2_top': 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  '2_bottom': 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
  '3_top': 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  '3_tod': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
};

export const BET_TYPES: BetType[] = ['2_top', '2_bottom', '3_top', '3_tod'];

export const DEFAULT_RATES = {
  rate_2_top: 70,
  rate_2_bottom: 70,
  rate_3_top: 500,
  rate_3_tod: 100,
  deduct_percent: 30,
};

export function getBetDigits(betType: BetType): 2 | 3 {
  return betType === '2_top' || betType === '2_bottom' ? 2 : 3;
}
