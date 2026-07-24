import { ipcMain } from 'electron';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '../database/entities/order.entity';

export function registerOrderIPCHandlers(): void {
  ipcMain.handle('order:create', async (_event, data) => {
    try {
      const order = await OrderService.create(data);
      return { success: true, data: order };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:update', async (_event, payload: { id: number; data: any }) => {
    try {
      const order = await OrderService.update(payload.id, payload.data);
      return { success: true, data: order };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:delete', async (_event, id: number) => {
    try {
      await OrderService.delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:get', async (_event, id: number) => {
    try {
      const data = await OrderService.getById(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:getAll', async (_event, params?: any) => {
    try {
      const data = await OrderService.getAll(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    'order:getByCustomer',
    async (_event, payload: { customerId: number; params?: any }) => {
      try {
        const data = await OrderService.getByCustomer(payload.customerId, payload.params);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    'order:changeStatus',
    async (_event, payload: { id: number; status: OrderStatus }) => {
      try {
        const data = await OrderService.changeStatus(payload.id, payload.status);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle('order:markReady', async (_event, id: number) => {
    try {
      const data = await OrderService.markReady(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:markDelivered', async (_event, id: number) => {
    try {
      const data = await OrderService.markDelivered(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:cancel', async (_event, id: number) => {
    try {
      const data = await OrderService.cancelOrder(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:search', async (_event, query: string) => {
    try {
      const data = await OrderService.search(query);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('order:getStats', async () => {
    try {
      const data = await OrderService.getStats();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
