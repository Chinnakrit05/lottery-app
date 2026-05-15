import { contextBridge, ipcRenderer } from 'electron';

// Expose a typed surface to the renderer. The renderer should access these via window.api
const api = {
  rounds: {
    list: () => ipcRenderer.invoke('rounds:list'),
    get: (id: number) => ipcRenderer.invoke('rounds:get', id),
    create: (data: unknown) => ipcRenderer.invoke('rounds:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('rounds:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('rounds:delete', id),
  },
  customers: {
    list: () => ipcRenderer.invoke('customers:list'),
    get: (id: number) => ipcRenderer.invoke('customers:get', id),
    create: (data: unknown) => ipcRenderer.invoke('customers:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id),
    stats: () => ipcRenderer.invoke('customers:stats'),
  },
  tickets: {
    listByRound: (roundId: number) => ipcRenderer.invoke('tickets:listByRound', roundId),
    listRecent: (roundId: number, limit?: number) =>
      ipcRenderer.invoke('tickets:listRecent', roundId, limit),
    search: (roundId: number, betType: string | null, number: string | null) =>
      ipcRenderer.invoke('tickets:search', roundId, betType, number),
    create: (data: unknown) => ipcRenderer.invoke('tickets:create', data),
    createBulk: (rows: unknown[]) => ipcRenderer.invoke('tickets:createBulk', rows),
    delete: (id: number) => ipcRenderer.invoke('tickets:delete', id),
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: (mode: 'merge' | 'replace') => ipcRenderer.invoke('backup:import', mode),
    stats: () => ipcRenderer.invoke('backup:stats'),
  },
  history: {
    exportCsv: (roundId: number) => ipcRenderer.invoke('history:exportCsv', roundId),
  },
  app: {
    platform: () => process.platform,
  },
  update: {
    getStatus: () => ipcRenderer.invoke('update:getStatus'),
    check: () => ipcRenderer.invoke('update:check'),
    restartAndInstall: () => ipcRenderer.invoke('update:restartAndInstall'),
    onStatus: (cb: (s: any) => void) => {
      const handler = (_e: unknown, s: unknown) => cb(s);
      ipcRenderer.on('update:status', handler);
      return () => ipcRenderer.removeListener('update:status', handler);
    },
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
