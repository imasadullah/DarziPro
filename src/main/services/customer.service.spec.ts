/**
 * Unit Tests for CustomerService (Main Process)
 *
 * Strategy: Mock both 'data-source' AND the entity modules to avoid triggering
 * TypeORM decorator evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mock ────────────────────────────────────────────────────────────
const mockRepository = {
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  find: vi.fn(),
  findAndCount: vi.fn(),
  create: vi.fn((data: any) => ({ ...data })),
  save: vi.fn((entity: any) => Promise.resolve(entity)),
  remove: vi.fn((entity: any) => Promise.resolve(entity))
};

// Mock the entire database module chain before any imports
vi.mock('../database/entities/customer.entity', () => ({
  Customer: class Customer {}
}));

vi.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => mockRepository)
  }
}));

// Import AFTER mocks are set up
const { CustomerService } = await import('./customer.service');

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeCustomer(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    customerCode: 'CUST-0001',
    fullName: 'Muhammad Ali',
    phoneNumber: '0300-1234567',
    address: 'Lahore',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

// ── Test Suites ────────────────────────────────────────────────────────────────
describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore create mock to its default behavior
    mockRepository.create.mockImplementation((data: any) => ({ ...data }));
    mockRepository.save.mockImplementation((entity: any) => Promise.resolve(entity));
  });

  // ── create() ─────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('generates CUST-0001 when no customers exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null); // phone uniqueness
      mockRepository.findOne.mockResolvedValue(null);   // last customer (id=null)
      const saved = makeCustomer({ customerCode: 'CUST-0001' });
      mockRepository.save.mockResolvedValue(saved);

      const result = await CustomerService.create({
        fullName: 'Muhammad Ali',
        phoneNumber: '0300-1234567'
      });

      expect(result.customerCode).toBe('CUST-0001');
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('generates CUST-0002 when one customer exists with id=1', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(makeCustomer({ id: 1 }));
      const saved = makeCustomer({ id: 2, customerCode: 'CUST-0002' });
      mockRepository.save.mockResolvedValue(saved);

      const result = await CustomerService.create({
        fullName: 'Bilal Ahmed',
        phoneNumber: '0300-9876543'
      });

      expect(result.customerCode).toBe('CUST-0002');
    });

    it('throws when phone number already exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(makeCustomer()); // duplicate phone

      await expect(
        CustomerService.create({
          fullName: 'Ahmed',
          phoneNumber: '0300-1234567'
        })
      ).rejects.toThrow("A customer with phone number '0300-1234567' already exists.");
    });

    it('trims whitespace from fullName and phoneNumber', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);
      const saved = makeCustomer({ fullName: 'Ali Khan', phoneNumber: '0300-0000001' });
      mockRepository.save.mockResolvedValue(saved);

      await CustomerService.create({
        fullName: '  Ali Khan  ',
        phoneNumber: '  0300-0000001  '
      });

      // The object passed to create() must have trimmed values
      const createArg = mockRepository.create.mock.calls[0][0];
      expect(createArg.fullName).toBe('Ali Khan');
      expect(createArg.phoneNumber).toBe('0300-0000001');
    });
  });

  // ── getById() ─────────────────────────────────────────────────────────────────
  describe('getById()', () => {
    it('returns the customer when found', async () => {
      const customer = makeCustomer();
      mockRepository.findOneBy.mockResolvedValue(customer);

      const result = await CustomerService.getById(1);

      expect(result).toEqual(customer);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('throws when customer is not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(CustomerService.getById(99)).rejects.toThrow(
        'Customer with id 99 not found.'
      );
    });
  });

  // ── update() ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates fullName successfully', async () => {
      const existing = makeCustomer();
      // First call: find by id; second call: phone uniqueness (not changing phone)
      mockRepository.findOneBy
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null);
      const updated = { ...existing, fullName: 'Ali Raza' };
      mockRepository.save.mockResolvedValue(updated);

      const result = await CustomerService.update(1, { fullName: 'Ali Raza' });

      expect(result.fullName).toBe('Ali Raza');
    });

    it('throws when customer is not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        CustomerService.update(99, { fullName: 'Ghost' })
      ).rejects.toThrow('Customer with id 99 not found.');
    });

    it('throws when the new phone number conflicts with another customer', async () => {
      const existing = makeCustomer({ id: 1, phoneNumber: '0300-1111111' });
      const conflicting = makeCustomer({ id: 2, phoneNumber: '0300-9999999' });

      mockRepository.findOneBy
        .mockResolvedValueOnce(existing)       // find by id
        .mockResolvedValueOnce(conflicting);   // phone uniqueness check

      await expect(
        CustomerService.update(1, { phoneNumber: '0300-9999999' })
      ).rejects.toThrow("A customer with phone number '0300-9999999' already exists.");
    });
  });

  // ── delete() ──────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('removes the customer when found', async () => {
      const customer = makeCustomer();
      mockRepository.findOneBy.mockResolvedValue(customer);
      mockRepository.remove.mockResolvedValue(customer);

      await CustomerService.delete(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(customer);
    });

    it('throws when customer is not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(CustomerService.delete(99)).rejects.toThrow(
        'Customer with id 99 not found.'
      );
    });
  });

  // ── search() ──────────────────────────────────────────────────────────────────
  describe('search()', () => {
    it('returns matching customers', async () => {
      const customers = [makeCustomer(), makeCustomer({ id: 2, fullName: 'Ali Raza' })];
      mockRepository.find.mockResolvedValue(customers);

      const result = await CustomerService.search('Ali');

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledOnce();
    });

    it('returns empty array for an empty string query', async () => {
      const result = await CustomerService.search('');

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('returns empty array for a whitespace-only query', async () => {
      const result = await CustomerService.search('   ');

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });
  });

  // ── getAll() ──────────────────────────────────────────────────────────────────
  describe('getAll()', () => {
    it('returns paginated results with default params', async () => {
      const customers = [makeCustomer(), makeCustomer({ id: 2 })];
      mockRepository.findAndCount.mockResolvedValue([customers, 2]);

      const result = await CustomerService.getAll();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('uses correct skip offset for page 2', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 50]);

      await CustomerService.getAll({ page: 2, limit: 10 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });

    it('applies search filter when provided', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await CustomerService.getAll({ search: 'Ali' });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ fullName: expect.anything() })
          ])
        })
      );
    });

    it('caps limit at 100 to prevent large queries', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await CustomerService.getAll({ limit: 999 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('enforces a minimum page of 1 for invalid inputs', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await CustomerService.getAll({ page: -5 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 })
      );
    });
  });
});
