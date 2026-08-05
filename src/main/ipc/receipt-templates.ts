import { AppDataSource } from '../config/data-source';
import { Setting } from '../database/entities/setting.entity';

// ── Shop Settings ─────────────────────────────────────────────────────────────

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  footerMessage: string;
}

export async function loadShopSettings(): Promise<ShopSettings> {
  try {
    const repo = AppDataSource.getRepository(Setting);
    const all = await repo.find();
    const map: Record<string, string> = {};
    all.forEach((s) => (map[s.key] = s.value));
    return {
      shopName:      map['shopName']      ?? 'Darzi Pro',
      shopAddress:   map['shopAddress']   ?? '',
      shopPhone:     map['shopPhone']     ?? '',
      footerMessage: map['footerMessage'] ?? 'Thank you for your business!'
    };
  } catch {
    return {
      shopName:      'Darzi Pro',
      shopAddress:   '',
      shopPhone:     '',
      footerMessage: 'Thank you for your business!'
    };
  }
}

// ── Shared Utilities ──────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return `Rs ${Number(amount).toLocaleString('en-PK')}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ── Shared Receipt Shell ──────────────────────────────────────────────────────

function buildReceiptShell(
  title: string,
  receiptNumber: string,
  bodyHtml: string,
  settings: ShopSettings
): string {
  const shopLines = [
    settings.shopAddress ? `<div class="shop-detail">${settings.shopAddress}</div>` : '',
    settings.shopPhone   ? `<div class="shop-detail">📞 ${settings.shopPhone}</div>`  : ''
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — ${receiptNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Inter, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #0f172a;
      background: #fff;
      padding: 28px;
      max-width: 420px;
      margin: 0 auto;
    }
    /* ── Header ── */
    .receipt-header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .shop-name { font-size: 22px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; }
    .shop-detail { font-size: 11px; color: #64748b; margin-top: 2px; }
    .receipt-type {
      display: inline-block;
      margin-top: 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 99px;
    }
    .receipt-number { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    /* ── Section ── */
    .section { margin-bottom: 16px; }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }
    /* ── Row ── */
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 5px 0;
      border-bottom: 1px solid #f8fafc;
    }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-size: 12px; }
    .value { font-weight: 600; font-size: 12px; text-align: right; max-width: 60%; }
    /* ── Financial Summary ── */
    .financial-summary {
      background: #f8fafc;
      border-radius: 8px;
      padding: 14px;
      margin-top: 16px;
    }
    .fin-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }
    .fin-divider { border: none; border-top: 1px solid #e2e8f0; margin: 8px 0; }
    .fin-total { font-size: 16px; font-weight: 700; color: #0f172a; }
    .fin-advance { color: #16a34a; font-weight: 600; }
    .fin-balance-zero { color: #16a34a; font-weight: 700; }
    .fin-balance-due  { color: #f59e0b; font-weight: 700; }
    /* ── Amount Highlight ── */
    .amount-highlight {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 14px;
      margin: 16px 0;
    }
    .amount-highlight .label { color: #1e40af; font-size: 13px; font-weight: 600; }
    .amount-highlight .amount-value { font-size: 22px; font-weight: 700; color: #1d4ed8; }
    /* ── Status Badge ── */
    .status-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 99px;
    }
    .badge-delivered { background: #dcfce7; color: #15803d; }
    /* ── Footer ── */
    .receipt-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-message { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; size: A5; }
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="shop-name">${settings.shopName}</div>
    ${shopLines}
    <div class="receipt-type">${title}</div>
    <div class="receipt-number">${receiptNumber}</div>
  </div>

  ${bodyHtml}

  <div class="receipt-footer">
    <div class="footer-message">${settings.footerMessage}</div>
    Generated on ${new Date().toLocaleString('en-PK')}
  </div>
</body>
</html>`;
}

// ── Order Receipt ─────────────────────────────────────────────────────────────

export function buildOrderReceiptHtml(order: any, settings: ShopSettings): string {
  const garmentLabels: Record<string, string> = {
    shirt: 'Shirt', pant: 'Pant', shalwar_kameez: 'Shalwar Kameez',
    kurta: 'Kurta', coat: 'Coat', waistcoat: 'Waistcoat',
    sherwani: 'Sherwani', ladies_suit: 'Ladies Suit', custom: 'Custom'
  };

  const remaining = Number(order.remainingAmount ?? 0);
  const balanceClass = remaining === 0 ? 'fin-balance-zero' : 'fin-balance-due';
  const garmentLabel = garmentLabels[order.garmentType] ?? order.garmentType;

  const body = `
    <div class="section">
      <div class="section-label">Order Information</div>
      <div class="row">
        <span class="label">Order Number</span>
        <span class="value">${order.orderNumber}</span>
      </div>
      <div class="row">
        <span class="label">Order Date</span>
        <span class="value">${formatShortDate(order.orderDate)}</span>
      </div>
      <div class="row">
        <span class="label">Delivery Date</span>
        <span class="value">${formatShortDate(order.deliveryDate)}</span>
      </div>
      <div class="row">
        <span class="label">Status</span>
        <span class="value">${order.status}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Customer</div>
      <div class="row">
        <span class="label">Name</span>
        <span class="value">${order.customer?.fullName ?? '—'}</span>
      </div>
      ${order.customer?.phoneNumber ? `
      <div class="row">
        <span class="label">Phone</span>
        <span class="value">${order.customer.phoneNumber}</span>
      </div>` : ''}
      ${order.customer?.address ? `
      <div class="row">
        <span class="label">Address</span>
        <span class="value">${order.customer.address}</span>
      </div>` : ''}
    </div>

    <div class="section">
      <div class="section-label">Garment</div>
      <div class="row">
        <span class="label">Type</span>
        <span class="value">${garmentLabel}</span>
      </div>
      <div class="row">
        <span class="label">Quantity</span>
        <span class="value">${order.quantity} piece${order.quantity !== 1 ? 's' : ''}</span>
      </div>
    </div>

    <div class="financial-summary">
      <div class="section-label" style="margin-bottom:10px;">Payment Summary</div>
      <div class="fin-row">
        <span>Total Amount</span>
        <span class="fin-total">${formatCurrency(order.totalAmount)}</span>
      </div>
      <div class="fin-row">
        <span>Advance Received</span>
        <span class="fin-advance">${formatCurrency(order.advanceAmount)}</span>
      </div>
      <hr class="fin-divider">
      <div class="fin-row">
        <span>Remaining Balance</span>
        <span class="${balanceClass}">${formatCurrency(remaining)}</span>
      </div>
    </div>`;

  return buildReceiptShell('Order Receipt', order.orderNumber, body, settings);
}

// ── Payment Receipt ───────────────────────────────────────────────────────────

export function buildPaymentReceiptHtml(payment: any, settings: ShopSettings): string {
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash', bank_transfer: 'Bank Transfer',
    easypaisa: 'Easypaisa', jazzcash: 'JazzCash'
  };

  const remaining = Number(payment.order?.remainingAmount ?? 0);
  const balanceClass = remaining === 0 ? 'fin-balance-zero' : 'fin-balance-due';
  const methodLabel = paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod;

  const body = `
    <div class="section">
      <div class="section-label">Payment Details</div>
      <div class="row">
        <span class="label">Customer</span>
        <span class="value">${payment.customer?.fullName ?? '—'}</span>
      </div>
      ${payment.customer?.phoneNumber ? `
      <div class="row">
        <span class="label">Phone</span>
        <span class="value">${payment.customer.phoneNumber}</span>
      </div>` : ''}
      <div class="row">
        <span class="label">Order #</span>
        <span class="value">${payment.order?.orderNumber ?? '—'}</span>
      </div>
      <div class="row">
        <span class="label">Payment Date</span>
        <span class="value">${formatShortDate(payment.paymentDate)}</span>
      </div>
      <div class="row">
        <span class="label">Method</span>
        <span class="value">${methodLabel}</span>
      </div>
      ${payment.notes ? `
      <div class="row">
        <span class="label">Notes</span>
        <span class="value">${payment.notes}</span>
      </div>` : ''}
    </div>

    <div class="amount-highlight">
      <span class="label">Amount Received</span>
      <span class="amount-value">${formatCurrency(payment.amount)}</span>
    </div>

    <div class="financial-summary">
      <div class="fin-row">
        <span>Order Total</span>
        <span class="fin-total">${formatCurrency(payment.order?.totalAmount ?? 0)}</span>
      </div>
      <hr class="fin-divider">
      <div class="fin-row">
        <span>Remaining Balance</span>
        <span class="${balanceClass}">${formatCurrency(remaining)}</span>
      </div>
    </div>`;

  return buildReceiptShell('Payment Receipt', payment.paymentNumber, body, settings);
}

// ── Delivery Receipt ──────────────────────────────────────────────────────────

export function buildDeliveryReceiptHtml(
  order: any,
  settings: ShopSettings,
  deliveredBy: string
): string {
  const totalPaid = Number(order.totalAmount) - Number(order.remainingAmount ?? 0);
  const remaining = Number(order.remainingAmount ?? 0);
  const balanceClass = remaining === 0 ? 'fin-balance-zero' : 'fin-balance-due';

  const body = `
    <div class="section">
      <div class="section-label">Delivery Confirmation</div>
      <div class="row">
        <span class="label">Order Number</span>
        <span class="value">${order.orderNumber}</span>
      </div>
      <div class="row">
        <span class="label">Delivery Date</span>
        <span class="value">${formatShortDate(order.deliveryDate)}</span>
      </div>
      <div class="row">
        <span class="label">Status</span>
        <span class="value"><span class="status-badge badge-delivered">Delivered</span></span>
      </div>
      <div class="row">
        <span class="label">Delivered By</span>
        <span class="value">${deliveredBy}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Customer</div>
      <div class="row">
        <span class="label">Name</span>
        <span class="value">${order.customer?.fullName ?? '—'}</span>
      </div>
      ${order.customer?.phoneNumber ? `
      <div class="row">
        <span class="label">Phone</span>
        <span class="value">${order.customer.phoneNumber}</span>
      </div>` : ''}
    </div>

    <div class="financial-summary">
      <div class="section-label" style="margin-bottom:10px;">Final Settlement</div>
      <div class="fin-row">
        <span>Total Amount</span>
        <span class="fin-total">${formatCurrency(order.totalAmount)}</span>
      </div>
      <div class="fin-row">
        <span>Total Paid</span>
        <span class="fin-advance">${formatCurrency(totalPaid)}</span>
      </div>
      <hr class="fin-divider">
      <div class="fin-row">
        <span>Remaining Balance</span>
        <span class="${balanceClass}">${formatCurrency(remaining)}</span>
      </div>
    </div>`;

  return buildReceiptShell('Delivery Receipt', order.orderNumber, body, settings);
}
