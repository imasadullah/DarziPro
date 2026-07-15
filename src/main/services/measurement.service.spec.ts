/**
 * Unit Tests for MeasurementService (Main Process)
 *
 * Strategy: Mock 'data-source' and entity modules to avoid TypeORM decorator
 * evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mocks ───────────────────────────────────────────────────────────
const mockMeasurementRepo = {
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  find: vi.fn(),
  findAndCount: vi.fn(),
  create: vi.fn((data: any) => ({ ...data, id: undefined })),
  save: vi.fn((entity: any) => Promise.resolve({ ...entity, id: entity.id ?? 1 })),
  remove: vi.fn((entity: any) => Promise.resolve(entity)),
  delete: vi.fn(() => Promise.resolve({ affected: 1 }))
};

const mockValueRepo = {
  delete: vi.fn(() => Promise.resolve({ affected: 1 })),
  create: vi.fn((data: any) => ({ ...data })),
  save: vi.fn((entity: any) => Promise.resolve(entity))
};

// Mock modules before imports
vi.mock('../database/entities/measurement.entity', () => ({
  Measurement: class Measurement {},
  MeasurementType: {}
}));

vi.mock('../database/entities/measurement-value.entity', () => ({
  MeasurementValue: class MeasurementValue {
    fieldName?: string;
    fieldValue?: string;
    measurementId?: number;
  }
}));

vi.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn((entity: any) => {
      // Distinguish by entity class name reference
      const name = entity?.name ?? entity?.constructor?.name ?? '';
      if (name === 'MeasurementValue') return mockValueRepo;
      return mockMeasurementRepo;
    })
  }
}));

// Import AFTER mocks are set up
const { MeasurementService } = await import('./measurement.service');

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeMeasurement(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    customerId: 10,
    measurementType: 'shirt',
    notes: null,
    fabricNotes: null,
    stitchingInstructions: null,
    values: [
      { id: 1, measurementId: 1, fieldName: 'chest', fieldValue: '40' },
      { id: 2, measurementId: 1, fieldName: 'waist', fieldValue: '34' }
    ],
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

// ── Test Suites ────────────────────────────────────────────────────────────────
describe('MeasurementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMeasurementRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockMeasurementRepo.save.mockImplementation((entity: any) =>
      Promise.resolve({ ...entity, id: entity.id ?? 1 })
    );
  });

  // ── create() ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('creates a measurement with values', async () => {
      const saved = makeMeasurement();
      mockMeasurementRepo.save.mockResolvedValue(saved);

      const result = await MeasurementService.create({
        customerId: 10,
        measurementType: 'shirt',
        values: [
          { fieldName: 'chest', fieldValue: '40' },
          { fieldName: 'waist', fieldValue: '34' }
        ]
      });

      expect(result).toEqual(saved);
      expect(mockMeasurementRepo.save).toHaveBeenCalledOnce();
    });

    it('throws when customerId is missing', async () => {
      await expect(
        MeasurementService.create({
          customerId: 0,
          measurementType: 'shirt',
          values: [{ fieldName: 'chest', fieldValue: '40' }]
        })
      ).rejects.toThrow('Customer is required.');
    });

    it('throws when measurementType is missing', async () => {
      await expect(
        MeasurementService.create({
          customerId: 10,
          measurementType: '' as any,
          values: [{ fieldName: 'chest', fieldValue: '40' }]
        })
      ).rejects.toThrow('Measurement type is required.');
    });

    it('throws when values array is empty', async () => {
      await expect(
        MeasurementService.create({
          customerId: 10,
          measurementType: 'shirt',
          values: []
        })
      ).rejects.toThrow('At least one measurement value is required.');
    });

    it('trims notes before saving', async () => {
      const saved = makeMeasurement({ notes: 'Test note' });
      mockMeasurementRepo.save.mockResolvedValue(saved);

      await MeasurementService.create({
        customerId: 10,
        measurementType: 'shirt',
        notes: '  Test note  ',
        values: [{ fieldName: 'chest', fieldValue: '40' }]
      });

      const createArg = mockMeasurementRepo.create.mock.calls[0][0];
      expect(createArg.notes).toBe('Test note');
    });
  });

  // ── getById() ─────────────────────────────────────────────────────────────────
  describe('getById()', () => {
    it('returns the measurement when found', async () => {
      const m = makeMeasurement();
      mockMeasurementRepo.findOne.mockResolvedValue(m);

      const result = await MeasurementService.getById(1);

      expect(result).toEqual(m);
      expect(mockMeasurementRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['values']
      });
    });

    it('throws when measurement is not found', async () => {
      mockMeasurementRepo.findOne.mockResolvedValue(null);

      await expect(MeasurementService.getById(99)).rejects.toThrow(
        'Measurement with id 99 not found.'
      );
    });
  });

  // ── getByCustomer() ───────────────────────────────────────────────────────────
  describe('getByCustomer()', () => {
    it('returns paginated measurements with default params', async () => {
      const items = [makeMeasurement(), makeMeasurement({ id: 2 })];
      mockMeasurementRepo.findAndCount.mockResolvedValue([items, 2]);

      const result = await MeasurementService.getByCustomer(10);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('filters by measurementType when provided', async () => {
      mockMeasurementRepo.findAndCount.mockResolvedValue([[], 0]);

      await MeasurementService.getByCustomer(10, { measurementType: 'pant' });

      expect(mockMeasurementRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ measurementType: 'pant' })
        })
      );
    });

    it('uses correct skip offset for page 2', async () => {
      mockMeasurementRepo.findAndCount.mockResolvedValue([[], 50]);

      await MeasurementService.getByCustomer(10, { page: 2, limit: 10 });

      expect(mockMeasurementRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });
  });

  // ── getLatest() ───────────────────────────────────────────────────────────────
  describe('getLatest()', () => {
    it('returns the most recent measurement for a customer', async () => {
      const m = makeMeasurement();
      mockMeasurementRepo.findOne.mockResolvedValue(m);

      const result = await MeasurementService.getLatest(10);

      expect(result).toEqual(m);
      expect(mockMeasurementRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: 10 } })
      );
    });

    it('returns null when no measurements exist', async () => {
      mockMeasurementRepo.findOne.mockResolvedValue(null);

      const result = await MeasurementService.getLatest(10);

      expect(result).toBeNull();
    });

    it('filters by measurementType when provided', async () => {
      mockMeasurementRepo.findOne.mockResolvedValue(null);

      await MeasurementService.getLatest(10, 'coat');

      expect(mockMeasurementRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 10, measurementType: 'coat' }
        })
      );
    });
  });

  // ── copy() ────────────────────────────────────────────────────────────────────
  describe('copy()', () => {
    it('creates a new measurement with all cloned values', async () => {
      const source = makeMeasurement({ id: 1 });
      mockMeasurementRepo.findOne.mockResolvedValueOnce(source);

      const copied = makeMeasurement({ id: 2 });
      mockMeasurementRepo.save.mockResolvedValueOnce(copied);

      const result = await MeasurementService.copy(1);

      expect(result.id).toBe(2);
      // create() should be called with same customerId and measurementType
      const createArg = mockMeasurementRepo.create.mock.calls[0][0];
      expect(createArg.customerId).toBe(source.customerId);
      expect(createArg.measurementType).toBe(source.measurementType);
      // Values should be duplicated (2 values from source)
      expect(createArg.values).toHaveLength(source.values.length);
    });

    it('clones all field names and values from source', async () => {
      const source = makeMeasurement({
        values: [
          { id: 1, measurementId: 1, fieldName: 'chest', fieldValue: '42' },
          { id: 2, measurementId: 1, fieldName: 'neck', fieldValue: '16' }
        ]
      });
      mockMeasurementRepo.findOne.mockResolvedValueOnce(source);
      mockMeasurementRepo.save.mockResolvedValueOnce(makeMeasurement({ id: 2 }));

      await MeasurementService.copy(1);

      const createArg = mockMeasurementRepo.create.mock.calls[0][0];
      const fieldNames = createArg.values.map((v: any) => v.fieldName);
      expect(fieldNames).toContain('chest');
      expect(fieldNames).toContain('neck');
    });

    it('throws when source measurement is not found', async () => {
      mockMeasurementRepo.findOne.mockResolvedValue(null);

      await expect(MeasurementService.copy(99)).rejects.toThrow(
        'Measurement with id 99 not found.'
      );
    });
  });

  // ── delete() ──────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('removes the measurement when found', async () => {
      const m = makeMeasurement();
      mockMeasurementRepo.findOneBy.mockResolvedValue(m);
      mockMeasurementRepo.remove.mockResolvedValue(m);

      await MeasurementService.delete(1);

      expect(mockMeasurementRepo.remove).toHaveBeenCalledWith(m);
    });

    it('throws when measurement is not found', async () => {
      mockMeasurementRepo.findOneBy.mockResolvedValue(null);

      await expect(MeasurementService.delete(99)).rejects.toThrow(
        'Measurement with id 99 not found.'
      );
    });
  });

  // ── update() ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates notes successfully', async () => {
      const existing = makeMeasurement();
      mockMeasurementRepo.findOne.mockResolvedValue(existing);
      mockMeasurementRepo.save.mockResolvedValue({ ...existing, notes: 'Updated note' });

      const result = await MeasurementService.update(1, { notes: 'Updated note' });

      expect(result.notes).toBe('Updated note');
    });

    it('throws when measurement is not found', async () => {
      mockMeasurementRepo.findOne.mockResolvedValue(null);

      await expect(MeasurementService.update(99, { notes: 'x' })).rejects.toThrow(
        'Measurement with id 99 not found.'
      );
    });

    it('replaces values when values array is provided', async () => {
      const existing = makeMeasurement();
      mockMeasurementRepo.findOne.mockResolvedValue(existing);
      mockMeasurementRepo.save.mockResolvedValue(existing);

      await MeasurementService.update(1, {
        values: [{ fieldName: 'chest', fieldValue: '44' }]
      });

      expect(mockValueRepo.delete).toHaveBeenCalledWith({ measurementId: 1 });
    });
  });
});
