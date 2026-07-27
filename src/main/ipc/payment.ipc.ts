import { ipcMain } from 'electron';
import { PaymentService } from '../services/payment.service';

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
      // Receipt HTML is generated and returned to renderer for printing via window.print()
      const receiptHtml = generateReceiptHtml(payment);
      return { success: true, data: receiptHtml };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * Generate a simple printable HTML receipt for a payment.
 * The renderer opens this in a hidden iframe and calls window.print().
 */
function generateReceiptHtml(payment: any): string {
  const formatCurrency = (amount: number) =>
    `Rs ${Number(amount).toLocaleString('en-PK')}`;
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    easypaisa: 'Easypaisa',
    jazzcash: 'JazzCash'
  };

  const remaining = payment.order
    ? Number(payment.order.remainingAmount)
    : 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt — ${payment.paymentNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, 'Segoe UI', sans-serif; font-size: 13px; color: #0f172a; padding: 24px; max-width: 400px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 16px; }
    .shop-name { font-size: 20px; font-weight: 700; color: #2563eb; }
    .receipt-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 4px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .label { color: #64748b; }
    .value { font-weight: 600; }
    .amount-row { font-size: 16px; margin-top: 8px; padding: 12px 0; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; }
    .remaining { color: ${remaining > 0 ? '#f59e0b' : '#16a34a'}; }
    .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #94a3b8; }
    .pay-number { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">Darzi Pro</div>
    <div class="receipt-title">Payment Receipt</div>
    <div class="pay-number">${payment.paymentNumber}</div>
  </div>

  <div class="row">
    <span class="label">Customer</span>
    <span class="value">${payment.customer?.fullName ?? '—'}</span>
  </div>
  <div class="row">
    <span class="label">Order #</span>
    <span class="value">${payment.order?.orderNumber ?? '—'}</span>
  </div>
  <div class="row">
    <span class="label">Date</span>
    <span class="value">${formatDate(payment.paymentDate)}</span>
  </div>
  <div class="row">
    <span class="label">Method</span>
    <span class="value">${paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod}</span>
  </div>
  ${payment.notes ? `
  <div class="row">
    <span class="label">Notes</span>
    <span class="value">${payment.notes}</span>
  </div>` : ''}

  <div class="row amount-row">
    <span class="label">Amount Paid</span>
    <span class="value" style="color: #16a34a; font-size: 18px;">${formatCurrency(payment.amount)}</span>
  </div>
  <div class="row">
    <span class="label">Remaining Balance</span>
    <span class="value remaining">${formatCurrency(remaining)}</span>
  </div>

  <div class="footer">
    Thank you for your payment!<br>
    Generated on ${new Date().toLocaleString('en-PK')}
  </div>
</body>
</html>`;
}
