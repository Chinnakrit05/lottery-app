// Shared types — mirror of electron/db/queries/* but kept in src for renderer

export type BetType = '2_top' | '2_bottom' | '3_top' | '3_tod';
export type RoundStatus = 'open' | 'closed' | 'drawn';

export interface Round {
  id: number;
  name: string;
  draw_date: string | null;
  status: RoundStatus;
  rate_2_top: number;
  rate_2_bottom: number;
  rate_3_top: number;
  rate_3_tod: number;
  deduct_percent: number;
  win_2_top: string | null;
  win_2_bottom: string | null;
  win_3_top: string | null;
  win_3_top2: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoundInput {
  name: string;
  draw_date?: string | null;
  rate_2_top?: number;
  rate_2_bottom?: number;
  rate_3_top?: number;
  rate_3_tod?: number;
  deduct_percent?: number;
  win_2_top?: string | null;
  win_2_bottom?: string | null;
  win_3_top?: string | null;
  win_3_top2?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
  note?: string | null;
}

export interface CustomerStats extends Customer {
  ticket_count: number;
  total_amount: number;
}

export interface Ticket {
  id: number;
  round_id: number;
  customer_id: number | null;
  number: string;
  bet_type: BetType;
  price: number;
  buyer_name: string | null;
  note: string | null;
  is_reverse: number; // 0 | 1
  created_at: string;
}

export interface TicketWithCustomer extends Ticket {
  customer_name: string | null;
}

export interface TicketInput {
  round_id: number;
  customer_id?: number | null;
  number: string;
  bet_type: BetType;
  price: number;
  buyer_name?: string | null;
  note?: string | null;
  is_reverse?: boolean;
}
