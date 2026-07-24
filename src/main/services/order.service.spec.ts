/**
 * Unit Tests for OrderService (Main Process)
 *
 * Strategy: Mock 'data-source' AND entity modules to avoid TypeORM decorator
 * evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mock ────────────────────────────────────────────────────────────
const mockRepository = {
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  find: vi.fn(),
  findAndCount: vi.fn(),
  count: vi.fn(),
  create: vi.fn((data: any) => ({ ...data })),
  save: vi.fn((entity: any) => Promise.resolve({ id: 1, ...entity })),
  remove: vi.fn((entity: any) => Promise.resolve(entity)),
  createQueryBuilder: vi.fn()
};

// Mock query builder chain
const mockQb = {
  leftJoinAndSelect: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  orWhere: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  take: vi.fn().mockReturnThis(),
  getMany: vi.fn().mockResolvedValue([]),
  getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
  getCount: vi.fn().mockResolvedValue(0)
};

mockRepository.createQueryBuilder.mockReturnValue(mockQb);

vi.mock('../database/entities/order.entity', () => ({
  Order: class Order {},
  ORDER_STATUSES: ['Pending', 'Cutting', 'Stitching', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'],
  GARMENT_TYPES: []
}));

vi.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => mockRepository)
  }
}));

const { OrderService } = await import('./order.service');

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeOrder(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    orderNumber: 'ORD-000001',
    customerId: 1,
    measurementId: null,
    garmentType: 'shalwar_kameez',
    quantity: 1,
    status: 'Pending',
    priority: 'normal',
    orderDate: '2026-01-01',
    deliveryDate: '2026-01-15',
    totalAmount: 2500,
    advanceAmount: 1000,
    remainingAmount: 1500,
    stitchingNotes: null,
    fabricNotes: null,
    specialInstructions: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

// ── Test Suites ────────────────────────────────────────────────────────────────

describe('OrderService — Order Number Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQb);
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    mockQb.getCount.mockResolvedValue(0);
  });

  it('generates ORD-000001 when no orders exist', async () => {
    mockRepository.find.mockResolvedValue([]);
    mockRepository.create.mockImplementation((data: any) => ({ id: 1, ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

    const dto = {
      customerId: 1,
      garmentType: 'shirt' as const,
      deliveryDate: '2026-02-01',
      orderDate: '2026-01-01'
    };
    const result = await OrderService.create(dto);
    expect(result.orderNumber).toBe('ORD-000001');
  });

  it('generates ORD-000007 when last order id is 6', async () => {
    mockRepository.find.mockResolvedValue([makeOrder({ id: 6, orderNumber: 'ORD-000006' })]);
    mockRepository.create.mockImplementation((data: any) => ({ id: 7, ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

    const dto = {
      customerId: 1,
      garmentType: 'pant' as const,
      deliveryDate: '2026-02-01',
      orderDate: '2026-01-01'
    };
    const result = await OrderService.create(dto);
    expect(result.orderNumber).toBe('ORD-000007');
  });

  it('pads order number to 6 digits', async () => {
    mockRepository.find.mockResolvedValue([makeOrder({ id: 42 })]);
    mockRepository.create.mockImplementation((data: any) => ({ id: 43, ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

    const dto = {
      customerId: 1,
      garmentType: 'coat' as const,
      deliveryDate: '2026-03-01',
      orderDate: '2026-01-01'
    };
    const result = await OrderService.create(dto);
    expect(result.orderNumber).toMatch(/^ORD-\d{6}$/);
  });
});

// ── Amount Calculations ────────────────────────────────────────────────────────

describe('OrderService — Amount Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQb);
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    mockQb.getCount.mockResolvedValue(0);
    mockRepository.find.mockResolvedValue([]);
  });

  it('calculates remaining = total - advance', async () => {
    mockRepository.create.mockImplementation((data: any) => ({ id: 1, ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

    const dto = {
      customerId: 1,
      garmentType: 'shirt' as const,
      deliveryDate: '2026-02-01',
      orderDate: '2026-01-01',
      totalAmount: 3000,
      advanceAmount: 1200
    };
    const result = await OrderService.create(dto);
    expect(Number(result.remainingAmount)).toBe(1800);
  });

  it('remaining is 0 when advance equals total', async () => {
    mockRepository.create.mockImplementation((data: any) => ({ id: 1, ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

    const dto = {
      customerId: 1,
      garmentType: 'shirt' as const,
      deliveryDate: '2026-02-01',
      orderDate: '2026-01-01',
      totalAmount: 1500,
      advanceAmount: 1500
    };
    const result = await OrderService.create(dto);
    expect(Number(result.remainingAmount)).toBe(0);
  });

  it('remaining is 0 when no amounts provided', async () => {
    mockRepository.create.mockImplementation((data: any) => ({ id: 1, ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));

    const dto = {
      customerId: 1,
      garmentType: 'pant' as const,
      deliveryDate: '2026-02-01',
      orderDate: '2026-01-01'
    };
    const result = await OrderService.create(dto);
    expect(Number(result.remainingAmount)).toBe(0);
  });
});

// ── Validation ─────────────────────────────────────────────────────────────────

describe('OrderService — Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository.find.mockResolvedValue([]);
    mockRepository.createQueryBuilder.mockReturnValue(mockQb);
  });

  it('throws if customerId is missing', async () => {
    await expect(
      OrderService.create({ customerId: 0, garmentType: 'shirt', deliveryDate: '2026-02-01' })
    ).rejects.toThrow('Customer is required.');
  });

  it('throws if garmentType is missing', async () => {
    await expect(
      OrderService.create({ customerId: 1, garmentType: '' as any, deliveryDate: '2026-02-01' })
    ).rejects.toThrow('Garment type is required.');
  });

  it('throws if deliveryDate is missing', async () => {
    await expect(
      OrderService.create({ customerId: 1, garmentType: 'shirt', deliveryDate: '' })
    ).rejects.toThrow('Delivery date is required.');
  });

  it('throws if totalAmount is negative', async () => {
    await expect(
      OrderService.create({
        customerId: 1,
        garmentType: 'shirt',
        deliveryDate: '2026-02-01',
        orderDate: '2026-01-01',
        totalAmount: -100
      })
    ).rejects.toThrow('Total amount cannot be negative.');
  });

  it('throws if advanceAmount is negative', async () => {
    await expect(
      OrderService.create({
        customerId: 1,
        garmentType: 'shirt',
        deliveryDate: '2026-02-01',
        orderDate: '2026-01-01',
        totalAmount: 1000,
        advanceAmount: -50
      })
    ).rejects.toThrow('Advance amount cannot be negative.');
  });

  it('throws if advanceAmount exceeds totalAmount', async () => {
    await expect(
      OrderService.create({
        customerId: 1,
        garmentType: 'shirt',
        deliveryDate: '2026-02-01',
        orderDate: '2026-01-01',
        totalAmount: 1000,
        advanceAmount: 1500
      })
    ).rejects.toThrow('Advance amount cannot exceed total amount.');
  });

  it('throws if deliveryDate is before orderDate', async () => {
    await expect(
      OrderService.create({
        customerId: 1,
        garmentType: 'shirt',
        deliveryDate: '2026-01-01',
        orderDate: '2026-02-01'
      })
    ).rejects.toThrow('Delivery date cannot be before order date.');
  });
});

// ── Status Changes ─────────────────────────────────────────────────────────────

describe('OrderService — Status Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQb);
  });

  it('changes status to Cutting', async () => {
    const order = makeOrder({ status: 'Pending' });
    mockRepository.findOneBy.mockResolvedValue(order);
    mockRepository.save.mockImplementation((e: any) => Promise.resolve(e));

    const result = await OrderService.changeStatus(1, 'Cutting');
    expect(result.status).toBe('Cutting');
  });

  it('marks order as Ready', async () => {
    const order = makeOrder({ status: 'Stitching' });
    mockRepository.findOneBy.mockResolvedValue(order);
    mockRepository.save.mockImplementation((e: any) => Promise.resolve(e));

    const result = await OrderService.markReady(1);
    expect(result.status).toBe('Ready');
  });

  it('marks order as Delivered', async () => {
    const order = makeOrder({ status: 'Ready' });
    mockRepository.findOneBy.mockResolvedValue(order);
    mockRepository.save.mockImplementation((e: any) => Promise.resolve(e));

    const result = await OrderService.markDelivered(1);
    expect(result.status).toBe('Delivered');
  });

  it('cancels an order', async () => {
    const order = makeOrder({ status: 'Pending' });
    mockRepository.findOneBy.mockResolvedValue(order);
    mockRepository.save.mockImplementation((e: any) => Promise.resolve(e));

    const result = await OrderService.cancelOrder(1);
    expect(result.status).toBe('Cancelled');
  });

  it('throws if order not found when changing status', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);
    await expect(OrderService.changeStatus(999, 'Cutting')).rejects.toThrow(
      'Order with id 999 not found.'
    );
  });

  it('blocks editing a Delivered order', async () => {
    const order = makeOrder({ status: 'Delivered' });
    mockRepository.findOne.mockResolvedValue(order);

    await expect(OrderService.update(1, { garmentType: 'pant' })).rejects.toThrow(
      "Cannot edit an order with status 'Delivered'."
    );
  });

  it('blocks editing a Cancelled order', async () => {
    const order = makeOrder({ status: 'Cancelled' });
    mockRepository.findOne.mockResolvedValue(order);

    await expect(OrderService.update(1, { garmentType: 'coat' })).rejects.toThrow(
      "Cannot edit an order with status 'Cancelled'."
    );
  });
});
