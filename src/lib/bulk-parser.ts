import type { BetType } from '@/types/database';
import { normalizeNumber, validateNumber, reverseNumber } from './lottery';

export interface ParsedRow {
  lineNo: number;
  raw: string;
  // result
  number?: string;          // normalized
  betType?: BetType;
  price?: number;
  isReverse?: boolean;
  // for 2-digit numbers with ก suffix, also create reverse partner
  reversePartner?: string;
  error?: string;
}

/**
 * Bulk format examples (one per line):
 *   27 50            → 2_top, 27, 50
 *   27ก 50           → 2_top, 27 + 72 reverse, 50 each
 *   50ล 30           → 2_bottom, 50, 30
 *   38ลก 100         → 2_bottom + reverse 83, 100 each
 *   123 100          → 3_top, 123, 100
 *   123ต 50          → 3_tod, 123 (sorted), 50
 *
 * Separators between number and price can be: space, =, *, comma
 * Suffixes can appear in any order: "ก", "ล", "ต"
 *
 * Lines starting with # or empty lines are ignored.
 */
export function parseBulkInput(input: string): ParsedRow[] {
  const lines = input.split(/\r?\n/);
  const rows: ParsedRow[] = [];

  lines.forEach((rawLine, i) => {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const row: ParsedRow = { lineNo: i + 1, raw: rawLine };

    // Split: find separator between number-part and price-part
    // Accept: space, =, *, comma
    const match = trimmed.match(/^(\S+?)\s*[=*,\s]\s*([0-9.]+)\s*$/);
    if (!match) {
      row.error = 'รูปแบบไม่ถูกต้อง — ใส่ "เลข ราคา"';
      rows.push(row);
      return;
    }

    const numPart = match[1];
    const priceStr = match[2];
    const price = Number(priceStr);
    if (!price || price <= 0) {
      row.error = 'ราคาไม่ถูกต้อง';
      rows.push(row);
      return;
    }
    row.price = price;

    // Extract suffix: ก (reverse), ล (bottom), ต (tod)
    let hasReverse = false;
    let isBottom = false;
    let isTod = false;
    let numStr = numPart;
    // strip suffixes from the right
    const SUFFIX = /[กลต]+$/;
    const sufMatch = numStr.match(SUFFIX);
    if (sufMatch) {
      const suf = sufMatch[0];
      if (suf.includes('ก')) hasReverse = true;
      if (suf.includes('ล')) isBottom = true;
      if (suf.includes('ต')) isTod = true;
      numStr = numStr.slice(0, numStr.length - suf.length);
    }

    // Validate digit count
    if (!/^[0-9]+$/.test(numStr)) {
      row.error = 'ต้องเป็นตัวเลข';
      rows.push(row);
      return;
    }
    const digitCount = numStr.length;

    let betType: BetType;
    if (digitCount === 2) {
      betType = isBottom ? '2_bottom' : '2_top';
      if (isTod) {
        row.error = '"ต" ใช้กับเลข 3 หลักเท่านั้น';
        rows.push(row);
        return;
      }
    } else if (digitCount === 3) {
      if (isBottom) {
        row.error = '"ล" ใช้กับเลข 2 หลักเท่านั้น';
        rows.push(row);
        return;
      }
      betType = isTod ? '3_tod' : '3_top';
      if (hasReverse) {
        // "ก" doesn't apply to 3-digit (tod covers permutations)
        hasReverse = false;
      }
    } else {
      row.error = `เลขต้องเป็น 2 หรือ 3 หลัก (ได้ ${digitCount})`;
      rows.push(row);
      return;
    }

    const err = validateNumber(numStr, betType);
    if (err) {
      row.error = err;
      rows.push(row);
      return;
    }

    row.betType = betType;
    row.number = normalizeNumber(numStr, betType);
    row.isReverse = false;

    if (hasReverse && (betType === '2_top' || betType === '2_bottom')) {
      const rev = reverseNumber(row.number);
      if (rev) row.reversePartner = rev;
    }

    rows.push(row);
  });

  return rows;
}

export function rowToTickets(rows: ParsedRow[], roundId: number, customerId: number | null, buyerName: string | null) {
  const tickets: Array<{
    round_id: number;
    customer_id: number | null;
    number: string;
    bet_type: BetType;
    price: number;
    buyer_name: string | null;
    is_reverse: boolean;
  }> = [];
  for (const r of rows) {
    if (r.error || !r.number || !r.betType || !r.price) continue;
    tickets.push({
      round_id: roundId,
      customer_id: customerId,
      number: r.number,
      bet_type: r.betType,
      price: r.price,
      buyer_name: buyerName,
      is_reverse: false,
    });
    if (r.reversePartner) {
      tickets.push({
        round_id: roundId,
        customer_id: customerId,
        number: r.reversePartner,
        bet_type: r.betType,
        price: r.price,
        buyer_name: buyerName,
        is_reverse: true,
      });
    }
  }
  return tickets;
}
