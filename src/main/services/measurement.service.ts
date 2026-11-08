import { AppDataSource } from '../config/data-source';
import { Measurement, MeasurementType } from '../database/entities/measurement.entity';
import { MeasurementValue } from '../database/entities/measurement-value.entity';
import { getPaginationWindow, PaginatedResult, PaginationRequest } from './pagination';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface MeasurementValueDto {
  fieldName: string;
  fieldValue?: string;
}

export interface CreateMeasurementDto {
  customerId: number;
  measurementType: MeasurementType;
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values: MeasurementValueDto[];
}

export interface UpdateMeasurementDto {
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values?: MeasurementValueDto[];
}

export interface MeasurementSearchParams extends PaginationRequest {
  measurementType?: MeasurementType;
  search?: string;
}

export type PaginatedMeasurements = PaginatedResult<Measurement>;

// ── Service ───────────────────────────────────────────────────────────────────

export class MeasurementService {
  private static getMeasurementRepo() {
    return AppDataSource.getRepository(Measurement);
  }

  private static getMeasurementValueRepo() {
    return AppDataSource.getRepository(MeasurementValue);
  }

  /**
   * Create a new measurement with its key-value pairs.
   */
  public static async create(data: CreateMeasurementDto): Promise<Measurement> {
    const repo = this.getMeasurementRepo();

    if (!data.customerId) {
      throw new Error('Customer is required.');
    }
    if (!data.measurementType) {
      throw new Error('Measurement type is required.');
    }
    if (!data.values || data.values.length === 0) {
      throw new Error('At least one measurement value is required.');
    }

    const measurement = repo.create({
      customerId: data.customerId,
      measurementType: data.measurementType,
      notes: data.notes?.trim(),
      fabricNotes: data.fabricNotes?.trim(),
      stitchingInstructions: data.stitchingInstructions?.trim(),
      values: data.values.map((v) => {
        const val = new MeasurementValue();
        val.fieldName = v.fieldName;
        val.fieldValue = v.fieldValue;
        return val;
      })
    });

    return repo.save(measurement);
  }

  /**
   * Update measurement notes and replace all value rows.
   */
  public static async update(
    id: number,
    data: UpdateMeasurementDto
  ): Promise<Measurement> {
    const repo = this.getMeasurementRepo();
    const valueRepo = this.getMeasurementValueRepo();

    const measurement = await repo.findOne({
      where: { id },
      relations: ['values']
    });
    if (!measurement) {
      throw new Error(`Measurement with id ${id} not found.`);
    }

    if (data.notes !== undefined) measurement.notes = data.notes?.trim();
    if (data.fabricNotes !== undefined) measurement.fabricNotes = data.fabricNotes?.trim();
    if (data.stitchingInstructions !== undefined) {
      measurement.stitchingInstructions = data.stitchingInstructions?.trim();
    }

    if (data.values !== undefined) {
      // Remove existing values and replace with new set
      await valueRepo.delete({ measurementId: id });
      measurement.values = data.values.map((v) => {
        const val = new MeasurementValue();
        val.measurementId = id;
        val.fieldName = v.fieldName;
        val.fieldValue = v.fieldValue;
        return val;
      });
    }

    return repo.save(measurement);
  }

  /**
   * Delete a measurement and cascade to its values.
   */
  public static async delete(id: number): Promise<void> {
    const repo = this.getMeasurementRepo();
    const measurement = await repo.findOneBy({ id });
    if (!measurement) {
      throw new Error(`Measurement with id ${id} not found.`);
    }
    await repo.remove(measurement);
  }

  /**
   * Get a single measurement by id, eager-loading values.
   */
  public static async getById(id: number): Promise<Measurement> {
    const repo = this.getMeasurementRepo();
    const measurement = await repo.findOne({
      where: { id },
      relations: ['values', 'customer']
    });
    if (!measurement) {
      throw new Error(`Measurement with id ${id} not found.`);
    }
    return measurement;
  }

  /**
   * Get all measurements across all customers, paginated.
   */
  public static async getAll(
    params: MeasurementSearchParams = {}
  ): Promise<PaginatedMeasurements> {
    const repo = this.getMeasurementRepo();
    const { page, limit, skip } = getPaginationWindow(params);

    const query = repo.createQueryBuilder('measurement')
      .leftJoinAndSelect('measurement.values', 'values')
      .leftJoinAndSelect('measurement.customer', 'customer')
      .orderBy('measurement.created_at', 'DESC')
      .addOrderBy('measurement.id', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.measurementType) {
      query.andWhere('measurement.measurementType = :measurementType', {
        measurementType: params.measurementType
      });
    }
    const search = params.search?.trim();
    if (search) {
      const typeSearch = search.replace(/[\s-]+/g, '_');
      query.andWhere(
        '(customer.fullName LIKE :search OR customer.phoneNumber LIKE :search OR measurement.measurementType LIKE :typeSearch)',
        { search: `%${search}%`, typeSearch: `%${typeSearch}%` }
      );
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total, page, limit };
  }

  /**
   * Get paginated measurements for a customer, optionally filtered by type.
   */
  public static async getByCustomer(
    customerId: number,
    params: MeasurementSearchParams = {}
  ): Promise<PaginatedMeasurements> {
    const repo = this.getMeasurementRepo();
    const { page, limit, skip } = getPaginationWindow(params);

    const where: Record<string, unknown> = { customerId };
    if (params.measurementType) {
      where['measurementType'] = params.measurementType;
    }

    const [items, total] = await repo.findAndCount({
      where,
      relations: ['values', 'customer'],
      order: { created_at: 'DESC', id: 'DESC' },
      skip,
      take: limit
    });

    return { items, total, page, limit };
  }

  /**
   * Get the most recent measurement for a customer, optionally filtered by type.
   */
  public static async getLatest(
    customerId: number,
    measurementType?: MeasurementType
  ): Promise<Measurement | null> {
    const repo = this.getMeasurementRepo();

    const where: Record<string, unknown> = { customerId };
    if (measurementType) {
      where['measurementType'] = measurementType;
    }

    const measurement = await repo.findOne({
      where,
      relations: ['values'],
      order: { created_at: 'DESC' }
    });

    return measurement ?? null;
  }

  /**
   * Copy an existing measurement — duplicates header and all values as a new record.
   */
  public static async copy(measurementId: number): Promise<Measurement> {
    const repo = this.getMeasurementRepo();

    const source = await repo.findOne({
      where: { id: measurementId },
      relations: ['values']
    });
    if (!source) {
      throw new Error(`Measurement with id ${measurementId} not found.`);
    }

    const copy = repo.create({
      customerId: source.customerId,
      measurementType: source.measurementType,
      notes: source.notes,
      fabricNotes: source.fabricNotes,
      stitchingInstructions: source.stitchingInstructions,
      values: source.values.map((v) => {
        const val = new MeasurementValue();
        val.fieldName = v.fieldName;
        val.fieldValue = v.fieldValue;
        return val;
      })
    });

    return repo.save(copy);
  }
}
