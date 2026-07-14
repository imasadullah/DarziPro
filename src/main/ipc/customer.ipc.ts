import { ipcMain } from 'electron';
import { CustomerService } from '../services/customer.service';

export function registerCustomerIPCHandlers(): void {
  ipcMain.handle('customer:getAll', async (_event, params) => {
    try {
      const data = await CustomerService.getAll(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('customer:getById', async (_event, id: number) => {
    try {
      const data = await CustomerService.getById(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('customer:search', async (_event, query: string) => {
    try {
      const data = await CustomerService.search(query);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('customer:create', async (_event, data) => {
    try {
      const customer = await CustomerService.create(data);
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('customer:update', async (_event, payload: { id: number; data: any }) => {
    try {
      const customer = await CustomerService.update(payload.id, payload.data);
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('customer:delete', async (_event, id: number) => {
    try {
      await CustomerService.delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
