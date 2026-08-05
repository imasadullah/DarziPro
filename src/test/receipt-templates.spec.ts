/**
 * Unit Tests for Receipt Templates (Main Process)
 *
 * Tests the receipt HTML generators and settings loader.
 * Strategy: Mock 'data-source' and entity modules to avoid TypeORM
 * decorator evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mocks ──────────────────────────────────────────────────────────

const mockSettingRepository = {
  find: vi.fn(),
  findOneBy: vi.fn(),
  save: vi.fn()
};

// ── Module Mocks ──────────────────────────────────────────────────────────────

vi.mock('../main/database/entities/setting.entity', () => ({
  Setting: class MockSetting {
    key!: string;
    value!: string;
  }
}));

vi.mock('../main/config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => mockSettingRepository)
  }
}));

// ── Import After Mocks ────────────────────────────────────────────────────────

const {
  loadShopSettings,
  buildOrderReceiptHtml,
  buildPaymentReceiptHtml,
  buildDeliveryReceiptHtml
} = await import('../main/ipc/receipt-templates');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('loadShopSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default settings when the DB is empty', async () => {
    mockSettingRepository.find.mockResolvedValue([]);

    const settings = await loadShopSettings();

    expect(settings.shopName).toBe('Darzi Pro');
    expect(settings.shopAddress).toBe('');
    expect(settings.shopPhone).toBe('');
    expect(settings.footerMessage).toBe('Thank you for your business!');
  });

  it('returns settings from the database when they exist', async () => {
    mockSettingRepository.find.mockResolvedValue([
      { key: 'shopName', value: 'Al-Farooq Tailors' },
      { key: 'shopAddress', value: 'Shop 12, Main Bazaar, Lahore' },
      { key: 'shopPhone', value: '0300-1234567' },
      { key: 'footerMessage', value: 'Khush Amdeed!' }
    ]);

    const settings = await loadShopSettings();

    expect(settings.shopName).toBe('Al-Farooq Tailors');
    expect(settings.shopAddress).toBe('Shop 12, Main Bazaar, Lahore');
    expect(settings.shopPhone).toBe('0300-1234567');
    expect(settings.footerMessage).toBe('Khush Amdeed!');
  });

  it('falls back to defaults if the repository throws', async () => {
    mockSettingRepository.find.mockRejectedValue(new Error('DB error'));

    const settings = await loadShopSettings();

    expect(settings.shopName).toBe('Darzi Pro');
  });
});

// ── Shared Settings Fixture ───────────────────────────────────────────────────

const testSettings = {
  shopName: 'Test Tailors',
  shopAddress: '42 Test Street',
  shopPhone: '0300-0000000',
  footerMessage: 'Thanks for testing!'
};

// ── Order Receipt Tests ───────────────────────────────────────────────────────

describe('buildOrderReceiptHtml', () => {
  const mockOrder = {
    orderNumber: 'ORD-000001',
    orderDate: '2026-01-15',
    deliveryDate: '2026-01-25',
    status: 'Ready',
    garmentType: 'shalwar_kameez',
    quantity: 2,
    totalAmount: 5000,
    advanceAmount: 2000,
    remainingAmount: 3000,
    customer: {
      fullName: 'Ahmed Khan',
      phoneNumber: '0301-1234567',
      address: '23 Park Road, Lahore'
    }
  };

  it('includes the shop name in the output', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('Test Tailors');
  });

  it('includes the order number', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('ORD-000001');
  });

  it('includes the customer name', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('Ahmed Khan');
  });

  it('includes the customer phone number', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('0301-1234567');
  });

  it('includes garment type label (not raw value)', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('Shalwar Kameez');
    expect(html).not.toContain('shalwar_kameez');
  });

  it('includes quantity', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('2 pieces');
  });

  it('includes financial amounts', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('5,000');   // total
    expect(html).toContain('2,000');   // advance
    expect(html).toContain('3,000');   // remaining
  });

  it('includes footer message', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('Thanks for testing!');
  });

  it('includes "Order Receipt" label', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('Order Receipt');
  });

  it('generates valid HTML structure', () => {
    const html = buildOrderReceiptHtml(mockOrder, testSettings);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });
});

// ── Payment Receipt Tests ─────────────────────────────────────────────────────

describe('buildPaymentReceiptHtml', () => {
  const mockPayment = {
    paymentNumber: 'PAY-000001',
    paymentDate: '2026-01-16',
    paymentMethod: 'cash',
    amount: 2000,
    notes: 'First installment',
    customer: {
      fullName: 'Ahmed Khan',
      phoneNumber: '0301-1234567'
    },
    order: {
      orderNumber: 'ORD-000001',
      totalAmount: 5000,
      remainingAmount: 3000
    }
  };

  it('includes the shop name', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('Test Tailors');
  });

  it('includes payment number', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('PAY-000001');
  });

  it('includes the order number', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('ORD-000001');
  });

  it('includes customer name', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('Ahmed Khan');
  });

  it('renders payment method label (not raw value)', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('Cash');
    expect(html).not.toContain('"cash"');
  });

  it('includes amount received', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('2,000');
  });

  it('includes remaining balance', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('3,000');
  });

  it('includes notes when provided', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('First installment');
  });

  it('includes "Payment Receipt" label', () => {
    const html = buildPaymentReceiptHtml(mockPayment, testSettings);
    expect(html).toContain('Payment Receipt');
  });
});

// ── Delivery Receipt Tests ────────────────────────────────────────────────────

describe('buildDeliveryReceiptHtml', () => {
  const mockOrder = {
    orderNumber: 'ORD-000001',
    deliveryDate: '2026-01-25',
    status: 'Delivered',
    totalAmount: 5000,
    remainingAmount: 0,
    customer: {
      fullName: 'Ahmed Khan',
      phoneNumber: '0301-1234567'
    }
  };

  it('includes the shop name', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    expect(html).toContain('Test Tailors');
  });

  it('includes order number', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    expect(html).toContain('ORD-000001');
  });

  it('includes customer name', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    expect(html).toContain('Ahmed Khan');
  });

  it('includes the deliveredBy name', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    expect(html).toContain('Admin User');
  });

  it('shows remaining balance as zero when fully paid', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    // 0 remaining → green class, value is "Rs 0"
    expect(html).toContain('fin-balance-zero');
  });

  it('shows remaining balance class as due when outstanding', () => {
    const orderWithBalance = { ...mockOrder, remainingAmount: 1500 };
    const html = buildDeliveryReceiptHtml(orderWithBalance, testSettings, 'Admin User');
    expect(html).toContain('fin-balance-due');
    expect(html).toContain('1,500');
  });

  it('includes "Delivery Receipt" label', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    expect(html).toContain('Delivery Receipt');
  });

  it('includes Delivered status badge', () => {
    const html = buildDeliveryReceiptHtml(mockOrder, testSettings, 'Admin User');
    expect(html).toContain('badge-delivered');
    expect(html).toContain('Delivered');
  });
});
