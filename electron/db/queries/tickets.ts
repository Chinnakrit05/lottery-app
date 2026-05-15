import { getDb } from '../connection';

export type BetType = '2_top' | '2_bottom' | '3_top' | '3_tod';

export interface Ticket {
  id: number;
  round_id: number;
  customer_id: number | null;
  number: string;
  bet_type: BetType;
  price: number;
  buyer_name: string | null;
  note: string | null;
  is_reverse: number; // 0/1
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

const SELECT_WITH_CUSTOMER = `
  SELECT t.*, c.name AS customer_name
  FROM tickets t
  LEFT JOIN customers c ON c.id = t.customer_id
`;

export function listTicketsByRound(roundId: number): TicketWithCustomer[] {
  return getDb()
    .prepare(`${SELECT_WITH_CUSTOMER} WHERE t.round_id = ? ORDER BY t.created_at DESC`)
    .all(roundId) as TicketWithCustomer[];
}

export function listRecentTickets(roundId: number, limit = 10): TicketWithCustomer[] {
  return getDb()
    .prepare(`${SELECT_WITH_CUSTOMER} WHERE t.round_id = ? ORDER BY t.created_at DESC LIMIT ?`)
    .all(roundId, limit) as TicketWithCustomer[];
}

export function searchTickets(
  roundId: number,
  betType: BetType | null,
  number: string | null,
): TicketWithCustomer[] {
  const conditions: string[] = ['t.round_id = ?'];
  const params: (string | number)[] = [roundId];

  if (betType) {
    conditions.push('t.bet_type = ?');
    params.push(betType);
  }
  if (number && number.length > 0) {
    conditions.push('t.number = ?');
    params.push(number);
  }

  const sql = `${SELECT_WITH_CUSTOMER} WHERE ${conditions.join(' AND ')} ORDER BY t.created_at DESC`;
  return getDb().prepare(sql).all(...params) as TicketWithCustomer[];
}

export function createTicket(input: TicketInput): Ticket {
  const info = getDb().prepare(`
    INSERT INTO tickets (round_id, customer_id, number, bet_type, price, buyer_name, note, is_reverse)
    VALUES (@round_id, @customer_id, @number, @bet_type, @price, @buyer_name, @note, @is_reverse)
  `).run({
    round_id: input.round_id,
    customer_id: input.customer_id ?? null,
    number: input.number,
    bet_type: input.bet_type,
    price: input.price,
    buyer_name: input.buyer_name ?? null,
    note: input.note ?? null,
    is_reverse: input.is_reverse ? 1 : 0,
  });
  return getDb().prepare(`SELECT * FROM tickets WHERE id = ?`).get(Number(info.lastInsertRowid)) as Ticket;
}

export function createTicketsBulk(rows: TicketInput[]): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tickets (round_id, customer_id, number, bet_type, price, buyer_name, note, is_reverse)
    VALUES (@round_id, @customer_id, @number, @bet_type, @price, @buyer_name, @note, @is_reverse)
  `);
  const tx = db.transaction((items: TicketInput[]) => {
    for (const row of items) {
      stmt.run({
        round_id: row.round_id,
        customer_id: row.customer_id ?? null,
        number: row.number,
        bet_type: row.bet_type,
        price: row.price,
        buyer_name: row.buyer_name ?? null,
        note: row.note ?? null,
        is_reverse: row.is_reverse ? 1 : 0,
      });
    }
  });
  tx(rows);
  return rows.length;
}

export function deleteTicket(id: number): boolean {
  return getDb().prepare(`DELETE FROM tickets WHERE id = ?`).run(id).changes > 0;
}
