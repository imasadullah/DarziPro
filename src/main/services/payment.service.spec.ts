/**
 * Unit Tests for PaymentService (Main Process)
 *
 * Strategy: Mock 'data-source' AND entity modules to avoid TypeORM decorator
 * evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mocks ──────────────────────────────────────────────────────────

const mockPaymentRepository = {
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  find: vi.fn(),
  create: vi.fn((data: any) => ({ ...data })),
  save: vi.fn((entity: any) => Promise.resolve({ id: 1, ...entity })),
  remove: vi.fn((entity: any) => Promise.resolve(entity)),
  createQueryBuilder: vi.fn()
};

const mockOrderRepository = {
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  save: vi.fn((entity: any) => Promise.resolve(entity)),
  createQueryBuilder: vi.fn()
};

// ── Query Builder Mocks ───────────────────────────────────────────────────────

const makeQb = () => ({
  select: vi.fn().mockReturnThis(),
  leftJoinAndSelect: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  take: vi.fn().mockReturnThis(),
  getRawOne: vi.fn().mockResolvedValue({ totalPaid: '0', maxId: null, total: '0' }),
  getManyAndCount: vi.fn().mockResolvedValue([[], 0])
});

let paymentQb = makeQb();
let orderQb = makeQb();

mockPaymentRepository.createQueryBuilder.mockImplementation(() => paymentQb);
mockOrderRepository.createQueryBuilder.mockImplementation(() => orderQb);

vi.mock('../database/entities/payment.entity', () => ({
  Payment: class Payment {},
  PAYMENT_METHODS: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash'],
  PAYMENT_METHOD_LABELS: { cash: 'Cash', bank_transfer: 'Bank Transfer', easypaisa: 'Easypaisa', jazzcash: 'JazzCash' }
}));

vi.mock('../database/entities/order.entity', () => ({
  Order: class Order {},
  ORDER_STATUSES: ['Pending', 'Cutting', 'Stitching', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'],
  GARMENT_TYPES: []
}));

vi.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn((entity: any) => {
      // Differentiate by class name
      const name = entity?.name ?? '';
      if (name === 'Order') return mockOrderRepository;
      return mockPaymentRepository;
    })
  }
}));

const { PaymentService } = await import('./payment.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrder(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    orderNumber: 'ORD-000001',
    customerId: 10,
    totalAmount: 5000,
    advanceAmount: 2000,
    remainingAmount: 3000,
    status: 'Pending',
    ...overrides
  };
}

function makePayment(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    paymentNumber: 'PAY-000001',
    orderId: 1,
    customerId: 10,
    amount: 1000,
    paymentMethod: 'cash',
    paymentDate: new Date(),
    ...overrides
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentQb = makeQb();
    orderQb = makeQb();
    mockPaymentRepository.createQueryBuilder.mockReturnValue(paymentQb);
    mockOrderRepository.createQueryBuilder.mockReturnValue(orderQb);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // calculateOutstandingBalance
  // ─────────────────────────────────────────────────────────────────────────────

  describe('calculateOutstandingBalance', () => {
    it('returns Unpaid status when no payments exist', async () => {
      mockOrderRepository.findOne.mockResolvedValue(makeOrder());
      paymentQb.getRawOne.mockResolvedValue({ totalPaid: null });

      const result = await PaymentService.calculateOutstandingBalance(1);

      expect(result.totalPaid).toBe(0);
      expect(result.remaining).toBe(5000);
      expect(result.status).toBe('Unpaid');
    });

    it('returns Partially Paid when some payments exist', async () => {
      mockOrderRepository.findOne.mockResolvedValue(makeOrder());
      paymentQb.getRawOne.mockResolvedValue({ totalPaid: '2000' });

      const result = await PaymentService.calculateOutstandingBalance(1);

      expect(result.totalPaid).toBe(2000);
      expect(result.remaining).toBe(3000);
      expect(result.status).toBe('Partially Paid');
    });

    it('returns Fully Paid when payments cover the full amount', async () => {
      mockOrderRepository.findOne.mockResolvedValue(makeOrder());
      paymentQb.getRawOne.mockResolvedValue({ totalPaid: '5000' });

      const result = await PaymentService.calculateOutstandingBalance(1);

      expect(result.totalPaid).toBe(5000);
      expect(result.remaining).toBe(0);
      expect(result.status).toBe('Fully Paid');
    });

    it('throws when order is not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(PaymentService.calculateOutstandingBalance(999)).rejects.toThrow(
        'Order with id 999 not found.'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('saves a valid payment and recalculates order balance', async () => {
      const order = makeOrder();
      mockOrderRepository.findOne.mockResolvedValue(order);
      mockOrderRepository.findOneBy.mockResolvedValue(order); // used by validate()
      // First call: check existing payments total (for overpayment validation)
      paymentQb.getRawOne
        .mockResolvedValueOnce({ totalPaid: '2000' }) // validation: 3000 remaining
        .mockResolvedValueOnce({ maxId: 0 })           // generatePaymentNumber
        .mockResolvedValueOnce({ totalPaid: '3000' }); // recalcOrderBalance
      mockPaymentRepository.save.mockResolvedValue(makePayment({ amount: 1000 }));

      const result = await PaymentService.create({
        orderId: 1,
        amount: 1000,
        paymentMethod: 'cash'
      });

      expect(mockPaymentRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(result.amount).toBe(1000);
    });

    it('throws when amount is zero', async () => {
      await expect(
        PaymentService.create({ orderId: 1, amount: 0, paymentMethod: 'cash' })
      ).rejects.toThrow('Payment amount must be greater than zero.');
    });

    it('throws when amount is negative', async () => {
      await expect(
        PaymentService.create({ orderId: 1, amount: -500, paymentMethod: 'cash' })
      ).rejects.toThrow('Payment amount must be greater than zero.');
    });

    it('throws when orderId is missing', async () => {
      await expect(
        PaymentService.create({ orderId: 0, amount: 500, paymentMethod: 'cash' })
      ).rejects.toThrow('Order is required.');
    });

    it('throws when paymentMethod is missing', async () => {
      await expect(
        PaymentService.create({ orderId: 1, amount: 500, paymentMethod: '' as any })
      ).rejects.toThrow('Payment method is required.');
    });

    it('throws when amount exceeds remaining balance (overpayment prevention)', async () => {
      const order = makeOrder({ totalAmount: 5000, remainingAmount: 1000 });
      mockOrderRepository.findOne.mockResolvedValue(order);
      mockOrderRepository.findOneBy.mockResolvedValue(order); // used by validate()
      // 4000 already paid, 1000 remaining
      paymentQb.getRawOne.mockResolvedValue({ totalPaid: '4000' });

      await expect(
        PaymentService.create({ orderId: 1, amount: 2000, paymentMethod: 'cash' })
      ).rejects.toThrow('exceeds the remaining balance');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates payment and recalculates order balance', async () => {
      const existing = makePayment({ amount: 1000 });
      mockPaymentRepository.findOne.mockResolvedValue(existing);
      const order = makeOrder();
      mockOrderRepository.findOne.mockResolvedValue(order);
      mockOrderRepository.findOneBy.mockResolvedValue(order); // used by validate()
      paymentQb.getRawOne.mockResolvedValue({ totalPaid: '1000' });
      mockPaymentRepository.save.mockResolvedValue({ ...existing, amount: 1500 });

      const result = await PaymentService.update(1, { amount: 1500 });

      expect(mockPaymentRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('throws when payment is not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(PaymentService.update(999, { amount: 100 })).rejects.toThrow(
        'Payment with id 999 not found.'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes payment and restores order balance', async () => {
      const payment = makePayment();
      mockPaymentRepository.findOneBy.mockResolvedValue(payment);
      mockOrderRepository.findOneBy.mockResolvedValue(makeOrder());
      paymentQb.getRawOne.mockResolvedValue({ totalPaid: '0' });

      await PaymentService.delete(1);

      expect(mockPaymentRepository.remove).toHaveBeenCalledWith(payment);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('throws when payment is not found', async () => {
      mockPaymentRepository.findOneBy.mockResolvedValue(null);

      await expect(PaymentService.delete(999)).rejects.toThrow(
        'Payment with id 999 not found.'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getStats — Revenue Calculations
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correct today\'s collections and monthly revenue', async () => {
      mockPaymentRepository.find.mockResolvedValue([]);

      // Mock the three aggregate queries in order:
      // 1. todayCollections query
      // 2. monthlyRevenue query
      // 3. outstandingAmount (on orderRepo)
      paymentQb.getRawOne
        .mockResolvedValueOnce({ total: '2500' })  // today's collections
        .mockResolvedValueOnce({ total: '18000' }); // monthly revenue
      orderQb.getRawOne.mockResolvedValue({ total: '7500' }); // outstanding

      const stats = await PaymentService.getStats();

      expect(stats.todayCollections).toBe(2500);
      expect(stats.monthlyRevenue).toBe(18000);
      expect(stats.outstandingAmount).toBe(7500);
    });

    it('returns 0 for all stats when no data exists', async () => {
      mockPaymentRepository.find.mockResolvedValue([]);
      paymentQb.getRawOne
        .mockResolvedValueOnce({ total: null })
        .mockResolvedValueOnce({ total: null });
      orderQb.getRawOne.mockResolvedValue({ total: null });

      const stats = await PaymentService.getStats();

      expect(stats.todayCollections).toBe(0);
      expect(stats.monthlyRevenue).toBe(0);
      expect(stats.outstandingAmount).toBe(0);
    });
  });
});
