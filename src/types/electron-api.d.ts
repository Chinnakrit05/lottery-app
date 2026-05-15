// Typings for the API bridge exposed in electron/preload.ts via contextBridge

import type { Round, RoundInput } from './database';
import type { Customer, CustomerInput, CustomerStats } from './database';
import type { Ticket, TicketInput, TicketWithCustomer, BetType } from './database';

export interface ElectronApi {
  rounds: {
    list: () => Promise<Round[]>;
    get: (id: number) => Promise<Round | undefined>;
    create: (data: RoundInput) => Promise<Round>;
    update: (id: number, data: Partial<RoundInput>) => Promise<Round | undefined>;
    delete: (id: number) => Promise<boolean>;
  };
  customers: {
    list: () => Promise<Customer[]>;
    get: (id: number) => Promise<Customer | undefined>;
    create: (data: CustomerInput) => Promise<Customer>;
    update: (id: number, data: Partial<CustomerInput>) => Promise<Customer | undefined>;
    delete: (id: number) => Promise<boolean>;
    stats: () => Promise<CustomerStats[]>;
  };
  tickets: {
    listByRound: (roundId: number) => Promise<TicketWithCustomer[]>;
    listRecent: (roundId: number, limit?: number) => Promise<TicketWithCustomer[]>;
    search: (roundId: number, betType: BetType | null, number: string | null) => Promise<TicketWithCustomer[]>;
    create: (data: TicketInput) => Promise<Ticket>;
    createBulk: (rows: TicketInput[]) => Promise<number>;
    delete: (id: number) => Promise<boolean>;
  };
  backup: {
    export: () => Promise<{ ok: boolean; path?: string; canceled?: boolean; error?: string }>;
    import: (mode: 'merge' | 'replace') => Promise<{ ok: boolean; canceled?: boolean; error?: string }>;
    stats: () => Promise<{ rounds: number; customers: number; tickets: number }>;
  };
  history: {
    exportCsv: (roundId: number) => Promise<{ ok: boolean; path?: string; canceled?: boolean; error?: string; count?: number }>;
  };
  app: {
    platform: () => NodeJS.Platform;
  };
  update: {
    getStatus: () => Promise<UpdateStatus>;
    check: () => Promise<{ ok: boolean; version?: string | null; error?: string }>;
    restartAndInstall: () => Promise<void>;
    onStatus: (cb: (s: UpdateStatus) => void) => () => void;
  };
}

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'none' | 'downloading' | 'ready' | 'error';
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  message?: string;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
