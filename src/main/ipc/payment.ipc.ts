import { ipcMain } from 'electron';
import { PaymentService } from '../services/payment.service';
import { loadShopSettings, buildPaymentReceiptHtml } from './receipt-templates';

export function registerPaymentIPCHandlers(): void {
  ipcMain.handle('payment:create', async (_event, data) => {
    try {
      const payment = await PaymentService.create(data);
      return { success: true, data: payment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:update', async (_event, payload: { id: number; data: any }) => {
    try {
      const payment = await PaymentService.update(payload.id, payload.data);
      return { success: true, data: payment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:delete', async (_event, id: number) => {
    try {
      await PaymentService.delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:get', async (_event, id: number) => {
    try {
      const data = await PaymentService.getById(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:getAll', async (_event, params?: any) => {
    try {
      const data = await PaymentService.getAll(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    'payment:getByCustomer',
    async (_event, payload: { customerId: number; params?: any }) => {
      try {
        const data = await PaymentService.getByCustomer(payload.customerId, payload.params);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle('payment:getByOrder', async (_event, orderId: number) => {
    try {
      const data = await PaymentService.getByOrder(orderId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:calculateBalance', async (_event, orderId: number) => {
    try {
      const data = await PaymentService.calculateOutstandingBalance(orderId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:getStats', async () => {
    try {
      const data = await PaymentService.getStats();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('payment:printReceipt', async (_event, paymentId: number) => {
    try {
      const payment = await PaymentService.getById(paymentId);
      const settings = await loadShopSettings();
      const html = buildPaymentReceiptHtml(payment, settings);
      return { success: true, data: html };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
