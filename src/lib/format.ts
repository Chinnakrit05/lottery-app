const bahtFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export function formatBaht(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '฿0';
  return bahtFormatter.format(amount);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0';
  return numberFormatter.format(value);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
