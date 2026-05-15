'use client';

import { BET_LABELS } from '@/lib/constants';
import { formatBaht, formatDateTime } from '@/lib/format';
import type { TicketWithCustomer, Round } from '@/types/database';

interface Props {
  round: Round;
  tickets: TicketWithCustomer[];
  customerName?: string | null;
  storeName?: string;
}

/**
 * Hidden by default — only visible when window.print() is called.
 * The body matches an 80mm thermal printer receipt format.
 */
export function PrintReceipt({ round, tickets, customerName, storeName = 'Love Number' }: Props) {
  const total = tickets.reduce((s, t) => s + t.price, 0);
  const now = new Date().toLocaleString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="print-receipt">
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: 6, marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>{storeName}</div>
        <div style={{ fontSize: 11 }}>สลิปบันทึกการขาย</div>
      </div>

      {/* Meta */}
      <table style={{ width: '100%', fontSize: 11, marginBottom: 6, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td>งวด:</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{round.name}</td>
          </tr>
          {customerName && (
            <tr>
              <td>ลูกค้า:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{customerName}</td>
            </tr>
          )}
          <tr>
            <td>พิมพ์:</td>
            <td style={{ textAlign: 'right' }}>{now}</td>
          </tr>
          <tr>
            <td>จำนวน:</td>
            <td style={{ textAlign: 'right' }}>{tickets.length} รายการ</td>
          </tr>
        </tbody>
      </table>

      {/* Tickets table */}
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 6 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left',  padding: '2px 4px' }}>ประเภท</th>
            <th style={{ textAlign: 'center', padding: '2px 4px' }}>เลข</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>ราคา</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td style={{ padding: '3px 4px' }}>
                {BET_LABELS[t.bet_type]}
                {t.is_reverse ? ' (ก)' : ''}
              </td>
              <td style={{ textAlign: 'center', padding: '3px 4px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {t.number}
              </td>
              <td style={{ textAlign: 'right', padding: '3px 4px' }}>
                {formatBaht(t.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={{
        borderTop: '2px dashed #000',
        paddingTop: 6,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 14,
        fontWeight: 'bold',
      }}>
        <span>รวม:</span>
        <span>{formatBaht(total)}</span>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12, paddingTop: 6, borderTop: '1px dashed #000' }}>
        <p>ขอบคุณที่ใช้บริการ 🐱</p>
        <p>กรุณาเก็บสลิปไว้ตรวจรางวัล</p>
      </div>
    </div>
  );
}
