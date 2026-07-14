import { AppDataSource } from '../config/data-source';
import { Customer } from '../database/entities/customer.entity';
import { ILike, Like } from 'typeorm';

export interface CreateCustomerDto {
  fullName: string;
  phoneNumber: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
}

export interface CustomerSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

export class CustomerService {
  private static getRepository() {
    return AppDataSource.getRepository(Customer);
  }

  private static async generateCustomerCode(): Promise<string> {
    const repo = this.getRepository();
    const [last] = await repo.find({
      order: { id: 'DESC' },
      take: 1
    });
    const nextId = last ? last.id + 1 : 1;
    return `CUST-${String(nextId).padStart(4, '0')}`;
  }

  public static async getAll(params: CustomerSearchParams = {}): Promise<PaginatedCustomers> {
    const repo = this.getRepository();
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const whereConditions = params.search
      ? [
          { fullName: Like(`%${params.search}%`) },
          { phoneNumber: Like(`%${params.search}%`) },
          { customerCode: Like(`%${params.search}%`) }
        ]
      : undefined;

    const [items, total] = await repo.findAndCount({
      where: whereConditions,
      order: { created_at: 'DESC' },
      skip,
      take: limit
    });

    return { items, total, page, limit };
  }

  public static async getById(id: number): Promise<Customer> {
    const repo = this.getRepository();
    const customer = await repo.findOneBy({ id });
    if (!customer) {
      throw new Error(`Customer with id ${id} not found.`);
    }
    return customer;
  }

  public static async search(query: string): Promise<Customer[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const repo = this.getRepository();
    return repo.find({
      where: [
        { fullName: Like(`%${query}%`) },
        { phoneNumber: Like(`%${query}%`) },
        { customerCode: Like(`%${query}%`) }
      ],
      order: { fullName: 'ASC' },
      take: 20
    });
  }

  public static async create(data: CreateCustomerDto): Promise<Customer> {
    const repo = this.getRepository();

    // Check phone uniqueness
    const existingPhone = await repo.findOneBy({ phoneNumber: data.phoneNumber });
    if (existingPhone) {
      throw new Error(`A customer with phone number '${data.phoneNumber}' already exists.`);
    }

    const customerCode = await this.generateCustomerCode();

    const customer = repo.create({
      customerCode,
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      address: data.address?.trim(),
      notes: data.notes?.trim()
    });

    return repo.save(customer);
  }

  public static async update(id: number, data: UpdateCustomerDto): Promise<Customer> {
    const repo = this.getRepository();

    const customer = await repo.findOneBy({ id });
    if (!customer) {
      throw new Error(`Customer with id ${id} not found.`);
    }

    // Check phone uniqueness if phone is being changed
    if (data.phoneNumber && data.phoneNumber !== customer.phoneNumber) {
      const existingPhone = await repo.findOneBy({ phoneNumber: data.phoneNumber });
      if (existingPhone) {
        throw new Error(`A customer with phone number '${data.phoneNumber}' already exists.`);
      }
    }

    if (data.fullName !== undefined) customer.fullName = data.fullName.trim();
    if (data.phoneNumber !== undefined) customer.phoneNumber = data.phoneNumber.trim();
    if (data.address !== undefined) customer.address = data.address?.trim();
    if (data.notes !== undefined) customer.notes = data.notes?.trim();

    return repo.save(customer);
  }

  public static async delete(id: number): Promise<void> {
    const repo = this.getRepository();
    const customer = await repo.findOneBy({ id });
    if (!customer) {
      throw new Error(`Customer with id ${id} not found.`);
    }
    await repo.remove(customer);
  }
}
