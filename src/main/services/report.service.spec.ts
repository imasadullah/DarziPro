/**
 * Unit Tests for ReportService (Main Process)
 *
 * Strategy: Mock 'data-source' AND entity modules to avoid TypeORM decorator
 * evaluation in the Vitest/esbuild environment. Mirrors payment.service.spec.ts pattern.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mocks ──────────────────────────────────────────────────────────

const makeQb = () => ({
  select: vi.fn().mockReturnThis(),
  addSelect: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  having: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  take: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  getMany: vi.fn().mockResolvedValue([]),
  getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
  getRawOne: vi.fn().mockResolvedValue({ total: '0', count: '0', avgDays: '0' }),
  getRawMany: vi.fn().mockResolvedValue([]),
  getCount: vi.fn().mockResolvedValue(0),
});

let orderQb = makeQb();
let paymentQb = makeQb();
let customerQb = makeQb();

const mockOrderRepository = {
  createQueryBuilder: vi.fn(() => orderQb),
};

const mockPaymentRepository = {
  createQueryBuilder: vi.fn(() => paymentQb),
};

const mockCustomerRepository = {
  createQueryBuilder: vi.fn(() => customerQb),
};

// ── Module Mocks ──────────────────────────────────────────────────────────────

vi.mock('../database/entities/order.entity', () => ({
  Order: class Order {},
  ORDER_STATUSES: ['Pending', 'Cutting', 'Stitching', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'],
  GARMENT_TYPES: [],
}));

vi.mock('../database/entities/payment.entity', () => ({
  Payment: class Payment {},
  PAYMENT_METHODS: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash'],
  PAYMENT_METHOD_LABELS: { cash: 'Cash', bank_transfer: 'Bank Transfer', easypaisa: 'Easypaisa', jazzcash: 'JazzCash' },
}));

vi.mock('../database/entities/customer.entity', () => ({
  Customer: class Customer {},
}));

vi.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn((entity: any) => {
      const name = entity?.name ?? '';
      if (name === 'Order') return mockOrderRepository;
      if (name === 'Payment') return mockPaymentRepository;
      if (name === 'Customer') return mockCustomerRepository;
      return mockOrderRepository;
    }),
  },
}));

// ── Import Service ────────────────────────────────────────────────────────────

import { ReportService } from './report.service';

// ── Test Suites ───────────────────────────────────────────────────────────────

describe('ReportService — KPI Summary', () => {
  beforeEach(() => {
    orderQb = makeQb();
    paymentQb = makeQb();
    customerQb = makeQb();
    mockOrderRepository.createQueryBuilder.mockImplementation(() => orderQb);
    mockPaymentRepository.createQueryBuilder.mockImplementation(() => paymentQb);
    mockCustomerRepository.createQueryBuilder.mockImplementation(() => customerQb);
  });

  it('should return zero KPIs when database is empty', async () => {
    paymentQb.getRawOne.mockResolvedValue({ total: '0' });
    orderQb.getRawOne.mockResolvedValue({ count: '0', total: '0' });
    customerQb.getRawOne.mockResolvedValue({ count: '0' });

    const result = await ReportService.getKpiSummary();

    expect(result.revenueToday).toBe(0);
    expect(result.revenueThisMonth).toBe(0);
    expect(result.activeOrders).toBe(0);
    expect(result.outstandingAmount).toBe(0);
    expect(result.deliveredOrders).toBe(0);
    expect(result.totalCustomers).toBe(0);
  });

  it('should correctly parse numeric string results from SQLite', async () => {
    paymentQb.getRawOne
      .mockResolvedValueOnce({ total: '5000.50' })  // today
      .mockResolvedValueOnce({ total: '45000.75' }); // month
    orderQb.getRawOne
      .mockResolvedValueOnce({ count: '12' })        // active
      .mockResolvedValueOnce({ total: '8500.00' })   // outstanding
      .mockResolvedValueOnce({ count: '30' });        // delivered
    customerQb.getRawOne.mockResolvedValue({ count: '150' });

    const result = await ReportService.getKpiSummary();

    expect(result.revenueToday).toBe(5000.5);
    expect(result.revenueThisMonth).toBe(45000.75);
    expect(result.activeOrders).toBe(12);
    expect(result.outstandingAmount).toBe(8500);
    expect(result.deliveredOrders).toBe(30);
    expect(result.totalCustomers).toBe(150);
  });
});

// ── Revenue Report Tests ──────────────────────────────────────────────────────

describe('ReportService — Revenue Calculations', () => {
  beforeEach(() => {
    paymentQb = makeQb();
    mockPaymentRepository.createQueryBuilder.mockImplementation(() => paymentQb);
  });

  it('should return zero revenue when no payments exist', async () => {
    paymentQb.getRawOne.mockResolvedValue({ totalRevenue: '0', paymentCount: '0', averagePayment: '0' });
    paymentQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getRevenueReport({});

    expect(result.totalRevenue).toBe(0);
    expect(result.paymentCount).toBe(0);
    expect(result.averagePayment).toBe(0);
    expect(result.methodBreakdown).toHaveLength(0);
    expect(result.dailyTrend).toHaveLength(0);
  });

  it('should correctly calculate total revenue and average', async () => {
    paymentQb.getRawOne.mockResolvedValue({
      totalRevenue: '90000.00',
      paymentCount: '9',
      averagePayment: '10000.00',
    });
    paymentQb.getRawMany.mockResolvedValueOnce([
      { method: 'cash', total: '60000', count: '6' },
      { method: 'easypaisa', total: '30000', count: '3' },
    ]).mockResolvedValueOnce([]);

    const result = await ReportService.getRevenueReport({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });

    expect(result.totalRevenue).toBe(90000);
    expect(result.paymentCount).toBe(9);
    expect(result.averagePayment).toBe(10000);
    expect(result.methodBreakdown[0].method).toBe('cash');
    expect(result.methodBreakdown[0].label).toBe('Cash');
    expect(result.methodBreakdown[0].total).toBe(60000);
  });

  it('should return correct method labels for all 4 payment methods', async () => {
    paymentQb.getRawOne.mockResolvedValue({ totalRevenue: '0', paymentCount: '0', averagePayment: '0' });
    paymentQb.getRawMany
      .mockResolvedValueOnce([
        { method: 'cash', total: '1000', count: '1' },
        { method: 'bank_transfer', total: '2000', count: '1' },
        { method: 'easypaisa', total: '3000', count: '1' },
        { method: 'jazzcash', total: '4000', count: '1' },
      ])
      .mockResolvedValueOnce([]);

    const result = await ReportService.getRevenueReport({});

    const labels = result.methodBreakdown.map((m) => m.label);
    expect(labels).toContain('Cash');
    expect(labels).toContain('Bank Transfer');
    expect(labels).toContain('Easypaisa');
    expect(labels).toContain('JazzCash');
  });
});

// ── Outstanding Balance Tests ─────────────────────────────────────────────────

describe('ReportService — Outstanding Calculations', () => {
  beforeEach(() => {
    orderQb = makeQb();
    mockOrderRepository.createQueryBuilder.mockImplementation(() => orderQb);
  });

  it('should return empty outstanding report when all orders are paid', async () => {
    orderQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getOutstandingReport({});

    expect(result.items).toHaveLength(0);
    expect(result.totalOutstanding).toBe(0);
    expect(result.orderCount).toBe(0);
  });

  it('should correctly calculate remaining as totalAmount − totalPaid', async () => {
    orderQb.getRawMany.mockResolvedValue([
      {
        orderId: '1',
        orderNumber: 'ORD-001',
        customerId: '1',
        customerName: 'Ali Khan',
        phoneNumber: '03001234567',
        orderDate: '2024-01-01',
        deliveryDate: '2024-01-15',
        totalAmount: '15000',
        totalPaid: '8000',
        remaining: '7000',
      },
      {
        orderId: '2',
        orderNumber: 'ORD-002',
        customerId: '2',
        customerName: 'Sara Ahmed',
        phoneNumber: '03111234567',
        orderDate: '2024-01-05',
        deliveryDate: '2024-01-20',
        totalAmount: '20000',
        totalPaid: '5000',
        remaining: '15000',
      },
    ]);

    const result = await ReportService.getOutstandingReport({ sortDir: 'DESC' });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].remaining).toBe(7000);
    expect(result.items[1].remaining).toBe(15000);
    expect(result.totalOutstanding).toBe(22000);
    expect(result.orderCount).toBe(2);
  });

  it('should use DESC sort for highest outstanding by default', async () => {
    orderQb.getRawMany.mockResolvedValue([]);
    await ReportService.getOutstandingReport({});

    // verify orderBy was called with DESC
    expect(orderQb.orderBy).toHaveBeenCalledWith('o.remainingAmount', 'DESC');
  });

  it('should use ASC sort when explicitly requested', async () => {
    orderQb.getRawMany.mockResolvedValue([]);
    await ReportService.getOutstandingReport({ sortDir: 'ASC' });

    expect(orderQb.orderBy).toHaveBeenCalledWith('o.remainingAmount', 'ASC');
  });
});

// ── Delivery Statistics Tests ─────────────────────────────────────────────────

describe('ReportService — Delivery Statistics', () => {
  beforeEach(() => {
    orderQb = makeQb();
    mockOrderRepository.createQueryBuilder.mockImplementation(() => orderQb);
  });

  it('should return zero delivery stats when database is empty', async () => {
    orderQb.getRawOne
      .mockResolvedValueOnce({ count: '0' })  // deliveredToday
      .mockResolvedValueOnce({ count: '0' })  // deliveredMonth
      .mockResolvedValueOnce({ count: '0' })  // overdue
      .mockResolvedValueOnce({ count: '0' })  // dueToday
      .mockResolvedValueOnce({ avgDays: '0' }); // avgDelivery
    orderQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getDeliveryReport();

    expect(result.deliveredToday).toBe(0);
    expect(result.deliveredThisMonth).toBe(0);
    expect(result.overdueOrders).toBe(0);
    expect(result.dueToday).toBe(0);
    expect(result.averageDeliveryDays).toBe(0);
    expect(result.overdueItems).toHaveLength(0);
  });

  it('should correctly parse delivery counts', async () => {
    orderQb.getRawOne
      .mockResolvedValueOnce({ count: '3' })   // deliveredToday
      .mockResolvedValueOnce({ count: '25' })  // deliveredMonth
      .mockResolvedValueOnce({ count: '7' })   // overdue
      .mockResolvedValueOnce({ count: '2' })   // dueToday
      .mockResolvedValueOnce({ avgDays: '4.7' }); // avgDelivery (rounded to 5)
    orderQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getDeliveryReport();

    expect(result.deliveredToday).toBe(3);
    expect(result.deliveredThisMonth).toBe(25);
    expect(result.overdueOrders).toBe(7);
    expect(result.dueToday).toBe(2);
    expect(result.averageDeliveryDays).toBe(5); // Math.round(4.7)
  });

  it('should correctly map overdue item fields', async () => {
    orderQb.getRawOne
      .mockResolvedValue({ count: '0', avgDays: '0' });
    orderQb.getRawMany.mockResolvedValue([
      {
        id: '5',
        orderNumber: 'ORD-005',
        customerName: 'Zara Malik',
        deliveryDate: '2024-01-01',
        daysOverdue: '10',
        status: 'Stitching',
        totalAmount: '12000',
        remainingAmount: '6000',
      },
    ]);

    const result = await ReportService.getDeliveryReport();

    expect(result.overdueItems[0].id).toBe(5);
    expect(result.overdueItems[0].orderNumber).toBe('ORD-005');
    expect(result.overdueItems[0].daysOverdue).toBe(10);
    expect(result.overdueItems[0].status).toBe('Stitching');
  });
});

// ── Customer Report Tests ─────────────────────────────────────────────────────

describe('ReportService — Customer Statistics', () => {
  beforeEach(() => {
    customerQb = makeQb();
    orderQb = makeQb();
    mockCustomerRepository.createQueryBuilder.mockImplementation(() => customerQb);
    mockOrderRepository.createQueryBuilder.mockImplementation(() => orderQb);
  });

  it('should return zero customer stats when database is empty', async () => {
    customerQb.getRawOne.mockResolvedValue({ count: '0' });
    orderQb.getRawMany.mockResolvedValue([]);
    customerQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getCustomerReport({});

    expect(result.totalCustomers).toBe(0);
    expect(result.newCustomers).toBe(0);
    expect(result.repeatCustomers).toBe(0);
    expect(result.topBySpending).toHaveLength(0);
    expect(result.topByOrders).toHaveLength(0);
  });

  it('should count repeat customers as those with more than 1 order', async () => {
    customerQb.getRawOne
      .mockResolvedValueOnce({ count: '50' })  // total
      .mockResolvedValueOnce({ count: '8' });  // new this month
    // repeatRaw — 3 customers have multiple orders
    orderQb.getRawMany.mockResolvedValue([
      { customerId: '1', orderCount: '3' },
      { customerId: '2', orderCount: '2' },
      { customerId: '3', orderCount: '4' },
    ]);
    customerQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getCustomerReport({});

    expect(result.totalCustomers).toBe(50);
    expect(result.newCustomers).toBe(8);
    expect(result.repeatCustomers).toBe(3); // length of repeatRaw array
  });

  it('should correctly map top spender fields', async () => {
    customerQb.getRawOne.mockResolvedValue({ count: '0' });
    orderQb.getRawMany.mockResolvedValue([]);
    customerQb.getRawMany
      .mockResolvedValueOnce([
        {
          id: '1',
          fullName: 'Hamid Ansari',
          phoneNumber: '03001234567',
          totalSpent: '85000',
          orderCount: '8',
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await ReportService.getCustomerReport({});

    expect(result.topBySpending[0].fullName).toBe('Hamid Ansari');
    expect(result.topBySpending[0].totalSpent).toBe(85000);
    expect(result.topBySpending[0].orderCount).toBe(8);
  });
});

// ── Payment Method Report Tests ───────────────────────────────────────────────

describe('ReportService — Payment Method Report', () => {
  beforeEach(() => {
    paymentQb = makeQb();
    mockPaymentRepository.createQueryBuilder.mockImplementation(() => paymentQb);
  });

  it('should return all 4 methods even when some have no data', async () => {
    paymentQb.getRawMany.mockResolvedValue([
      { method: 'cash', total: '50000', count: '10' },
    ]);

    const result = await ReportService.getPaymentMethodReport({});

    const methods = result.methods.map((m) => m.method);
    expect(methods).toContain('cash');
    expect(methods).toContain('bank_transfer');
    expect(methods).toContain('easypaisa');
    expect(methods).toContain('jazzcash');
  });

  it('should calculate percentage correctly', async () => {
    paymentQb.getRawMany.mockResolvedValue([
      { method: 'cash', total: '75000', count: '15' },
      { method: 'easypaisa', total: '25000', count: '5' },
    ]);

    const result = await ReportService.getPaymentMethodReport({});

    const cash = result.methods.find((m) => m.method === 'cash')!;
    const easypaisa = result.methods.find((m) => m.method === 'easypaisa')!;

    expect(cash.percentage).toBe(75);
    expect(easypaisa.percentage).toBe(25);
    expect(result.grandTotal).toBe(100000);
    expect(result.grandCount).toBe(20);
  });

  it('should return 0% for all methods when grandTotal is 0', async () => {
    paymentQb.getRawMany.mockResolvedValue([]);

    const result = await ReportService.getPaymentMethodReport({});

    result.methods.forEach((m) => {
      expect(m.percentage).toBe(0);
      expect(m.total).toBe(0);
    });
  });
});
