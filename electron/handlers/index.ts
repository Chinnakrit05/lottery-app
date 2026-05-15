import { registerRoundsHandlers } from './rounds.ipc';
import { registerCustomersHandlers } from './customers.ipc';
import { registerTicketsHandlers } from './tickets.ipc';
import { registerBackupHandlers } from './backup.ipc';

export function registerIpcHandlers() {
  registerRoundsHandlers();
  registerCustomersHandlers();
  registerTicketsHandlers();
  registerBackupHandlers();
}
