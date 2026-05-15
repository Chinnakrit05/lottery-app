import { getDb } from '../connection';

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

export function listCustomers(): Customer[] {
  return getDb().prepare(`SELECT * FROM customers ORDER BY name`).all() as Customer[];
}

export function getCustomer(id: number): Customer | undefined {
  return getDb().prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as Customer | undefined;
}

export function createCustomer(input: CustomerInput): Customer {
  const info = getDb().prepare(`
    INSERT INTO customers (name, phone, note) VALUES (@name, @phone, @note)
  `).run({
    name: input.name,
    phone: input.phone ?? null,
    note: input.note ?? null,
  });
  return getCustomer(Number(info.lastInsertRowid))!;
}

export function updateCustomer(id: number, input: Partial<CustomerInput>): Customer | undefined {
  const current = getCustomer(id);
  if (!current) return undefined;
  const merged = { ...current, ...input };
  getDb().prepare(`
    UPDATE customers SET name = @name, phone = @phone, note = @note WHERE id = @id
  `).run({ id, name: merged.name, phone: merged.phone, note: merged.note });
  return getCustomer(id);
}

export function deleteCustomer(id: number): boolean {
  return getDb().prepare(`DELETE FROM customers WHERE id = ?`).run(id).changes > 0;
}

export function listCustomerStats(): CustomerStats[] {
  return getDb().prepare(`
    SELECT
      c.*,
      COALESCE(t.ticket_count, 0) AS ticket_count,
      COALESCE(t.total_amount, 0) AS total_amount
    FROM customers c
    LEFT JOIN (
      SELECT customer_id,
             COUNT(*) AS ticket_count,
             SUM(price) AS total_amount
      FROM tickets
      WHERE customer_id IS NOT NULL
      GROUP BY customer_id
    ) t ON t.customer_id = c.id
    ORDER BY c.name
  `).all() as CustomerStats[];
}
