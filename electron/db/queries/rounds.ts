import { getDb } from '../connection';

export interface Round {
  id: number;
  name: string;
  draw_date: string | null;
  status: 'open' | 'closed' | 'drawn';
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

export function listRounds(): Round[] {
  return getDb().prepare(`SELECT * FROM rounds ORDER BY created_at DESC`).all() as Round[];
}

export function getRound(id: number): Round | undefined {
  return getDb().prepare(`SELECT * FROM rounds WHERE id = ?`).get(id) as Round | undefined;
}

export function createRound(input: RoundInput): Round {
  const stmt = getDb().prepare(`
    INSERT INTO rounds (name, draw_date, rate_2_top, rate_2_bottom, rate_3_top, rate_3_tod, deduct_percent)
    VALUES (@name, @draw_date, @rate_2_top, @rate_2_bottom, @rate_3_top, @rate_3_tod, @deduct_percent)
  `);
  const info = stmt.run({
    name: input.name,
    draw_date: input.draw_date ?? null,
    rate_2_top: input.rate_2_top ?? 70,
    rate_2_bottom: input.rate_2_bottom ?? 70,
    rate_3_top: input.rate_3_top ?? 500,
    rate_3_tod: input.rate_3_tod ?? 100,
    deduct_percent: input.deduct_percent ?? 30,
  });
  return getRound(Number(info.lastInsertRowid))!;
}

export function updateRound(id: number, input: Partial<RoundInput>): Round | undefined {
  const current = getRound(id);
  if (!current) return undefined;

  const merged = { ...current, ...input, id };
  getDb().prepare(`
    UPDATE rounds SET
      name = @name,
      draw_date = @draw_date,
      rate_2_top = @rate_2_top,
      rate_2_bottom = @rate_2_bottom,
      rate_3_top = @rate_3_top,
      rate_3_tod = @rate_3_tod,
      deduct_percent = @deduct_percent,
      win_2_top = @win_2_top,
      win_2_bottom = @win_2_bottom,
      win_3_top = @win_3_top,
      win_3_top2 = @win_3_top2,
      status = CASE
        WHEN @win_2_top IS NOT NULL OR @win_2_bottom IS NOT NULL OR @win_3_top IS NOT NULL THEN 'drawn'
        ELSE status
      END
    WHERE id = @id
  `).run(merged);
  return getRound(id);
}

export function deleteRound(id: number): boolean {
  const info = getDb().prepare(`DELETE FROM rounds WHERE id = ?`).run(id);
  return info.changes > 0;
}
