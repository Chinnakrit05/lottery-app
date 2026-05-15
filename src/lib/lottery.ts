import type { BetType, Round, Ticket, TicketWithCustomer } from '@/types/database';
import { getBetDigits } from './constants';

/**
 * Normalize: for 3_tod, sort digits so '321' becomes '123'.
 */
export function normalizeNumber(number: string, betType: BetType): string {
  const cleaned = number.trim();
  if (betType === '3_tod') {
    return cleaned.split('').sort().join('');
  }
  return cleaned;
}

/**
 * Validate: correct number of digits, all numeric.
 */
export function validateNumber(number: string, betType: BetType): string | null {
  const expected = getBetDigits(betType);
  const cleaned = number.trim();
  if (!/^[0-9]+$/.test(cleaned)) return 'เลขต้องเป็นตัวเลขเท่านั้น';
  if (cleaned.length !== expected) return `ต้องเป็น ${expected} หลัก`;
  return null;
}

/**
 * Compute the reverse of a 2-digit number. Returns null if palindrome.
 */
export function reverseNumber(number: string): string | null {
  if (number.length !== 2) return null;
  const rev = number.split('').reverse().join('');
  if (rev === number) return null;
  return rev;
}

export function isRoundDrawn(round: Round | null | undefined): boolean {
  if (!round) return false;
  return !!(round.win_2_top || round.win_2_bottom || round.win_3_top || round.win_3_top2);
}

/**
 * Compute prize for a single ticket given the round's results.
 * Returns 0 if not winning.
 */
export function calculatePrize(ticket: Ticket | TicketWithCustomer, round: Round): number {
  const { bet_type, number, price } = ticket;
  switch (bet_type) {
    case '2_top':
      return round.win_2_top === number ? price * round.rate_2_top : 0;
    case '2_bottom':
      return round.win_2_bottom === number ? price * round.rate_2_bottom : 0;
    case '3_top': {
      const winners = [round.win_3_top, round.win_3_top2].filter(Boolean);
      return winners.includes(number) ? price * round.rate_3_top : 0;
    }
    case '3_tod': {
      const winners = [round.win_3_top, round.win_3_top2].filter(Boolean) as string[];
      // ticket.number is already sorted; compare against sorted winners
      const sortedWinners = winners.map((w) => w.split('').sort().join(''));
      return sortedWinners.includes(number) ? price * round.rate_3_tod : 0;
    }
    default:
      return 0;
  }
}

export interface RoundSummary {
  total_count: number;
  total_amount: number;
  deduct_amount: number;
  net_amount: number; // after deduction
  prize_payout: number;
  winning_count: number;
  profit: number; // net - prize_payout
  by_type: Record<BetType, { count: number; amount: number }>;
}

export function summarizeRound(
  tickets: (Ticket | TicketWithCustomer)[],
  round: Round,
): RoundSummary {
  const summary: RoundSummary = {
    total_count: tickets.length,
    total_amount: 0,
    deduct_amount: 0,
    net_amount: 0,
    prize_payout: 0,
    winning_count: 0,
    profit: 0,
    by_type: {
      '2_top': { count: 0, amount: 0 },
      '2_bottom': { count: 0, amount: 0 },
      '3_top': { count: 0, amount: 0 },
      '3_tod': { count: 0, amount: 0 },
    },
  };

  for (const t of tickets) {
    summary.total_amount += t.price;
    summary.by_type[t.bet_type].count += 1;
    summary.by_type[t.bet_type].amount += t.price;

    const prize = calculatePrize(t, round);
    if (prize > 0) {
      summary.winning_count += 1;
      summary.prize_payout += prize;
    }
  }

  summary.deduct_amount = (summary.total_amount * round.deduct_percent) / 100;
  summary.net_amount = summary.total_amount - summary.deduct_amount;
  summary.profit = summary.net_amount - summary.prize_payout;

  return summary;
}

/**
 * Top numbers by total amount (sales-volume risk view).
 */
export function topNumbers(
  tickets: (Ticket | TicketWithCustomer)[],
  limit = 10,
): { number: string; bet_type: BetType; count: number; amount: number }[] {
  const map = new Map<string, { number: string; bet_type: BetType; count: number; amount: number }>();
  for (const t of tickets) {
    const key = `${t.bet_type}:${t.number}`;
    const cur = map.get(key) || { number: t.number, bet_type: t.bet_type, count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += t.price;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount).slice(0, limit);
}
