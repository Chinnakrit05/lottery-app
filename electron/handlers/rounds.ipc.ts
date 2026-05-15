import { ipcMain } from 'electron';
import {
  listRounds,
  getRound,
  createRound,
  updateRound,
  deleteRound,
  type RoundInput,
} from '../db/queries/rounds';

export function registerRoundsHandlers() {
  ipcMain.handle('rounds:list', () => listRounds());
  ipcMain.handle('rounds:get', (_e, id: number) => getRound(id));
  ipcMain.handle('rounds:create', (_e, data: RoundInput) => createRound(data));
  ipcMain.handle('rounds:update', (_e, id: number, data: Partial<RoundInput>) => updateRound(id, data));
  ipcMain.handle('rounds:delete', (_e, id: number) => deleteRound(id));
}
