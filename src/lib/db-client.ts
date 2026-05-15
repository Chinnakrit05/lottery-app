// Thin wrapper around window.api so React components have a friendly client.

'use client';

import type {
  Round, RoundInput,
  Customer, CustomerInput, CustomerStats,
  Ticket, TicketInput, TicketWithCustomer, BetType,
} from '@/types/database';

function getApi() {
  if (typeof window === 'undefined' || !window.api) {
    throw new Error('Electron API not available. Are you running outside Electron?');
  }
  return window.api;
}

export const dbClient = {
  rounds: {
    list: (): Promise<Round[]> => getApi().rounds.list(),
    get: (id: number) => getApi().rounds.get(id),
    create: (data: RoundInput) => getApi().rounds.create(data),
    update: (id: number, data: Partial<RoundInput>) => getApi().rounds.update(id, data),
    delete: (id: number) => getApi().rounds.delete(id),
  },
  customers: {
    list: (): Promise<Customer[]> => getApi().customers.list(),
    get: (id: number) => getApi().customers.get(id),
    create: (data: CustomerInput) => getApi().customers.create(data),
    update: (id: number, data: Partial<CustomerInput>) => getApi().customers.update(id, data),
    delete: (id: number) => getApi().customers.delete(id),
    stats: (): Promise<CustomerStats[]> => getApi().customers.stats(),
  },
  tickets: {
    listByRound: (roundId: number): Promise<TicketWithCustomer[]> =>
      getApi().tickets.listByRound(roundId),
    listRecent: (roundId: number, limit?: number) =>
      getApi().tickets.listRecent(roundId, limit),
    search: (roundId: number, betType: BetType | null, number: string | null) =>
      getApi().tickets.search(roundId, betType, number),
    create: (data: TicketInput): Promise<Ticket> => getApi().tickets.create(data),
    createBulk: (rows: TicketInput[]) => getApi().tickets.createBulk(rows),
    delete: (id: number) => getApi().tickets.delete(id),
  },
  backup: {
    export: () => getApi().backup.export(),
    import: (mode: 'merge' | 'replace') => getApi().backup.import(mode),
    stats: () => getApi().backup.stats(),
  },
  history: {
    exportCsv: (roundId: number) => getApi().history.exportCsv(roundId),
  },
};

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.api;
}
