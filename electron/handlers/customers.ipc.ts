import { ipcMain } from 'electron';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomerStats,
  type CustomerInput,
} from '../db/queries/customers';

export function registerCustomersHandlers() {
  ipcMain.handle('customers:list', () => listCustomers());
  ipcMain.handle('customers:get', (_e, id: number) => getCustomer(id));
  ipcMain.handle('customers:create', (_e, data: CustomerInput) => createCustomer(data));
  ipcMain.handle('customers:update', (_e, id: number, data: Partial<CustomerInput>) => updateCustomer(id, data));
  ipcMain.handle('customers:delete', (_e, id: number) => deleteCustomer(id));
  ipcMain.handle('customers:stats', () => listCustomerStats());
}
