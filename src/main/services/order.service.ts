import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus, GarmentType, OrderPriority } from '../database/entities/order.entity';
import { Like } from 'typeorm';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateOrderDto {
  customerId: number;
  measurementId?: number | null;
  garmentType: GarmentType;
  quantity?: number;
  priority?: OrderPriority;
  orderDate?: string;
  deliveryDate: string;
  totalAmount?: number;
  advanceAmount?: number;
  stitchingNotes?: string;
  fabricNotes?: string;
  specialInstructions?: string;
}

export interface UpdateOrderDto {
  measurementId?: number | null;
  garmentType?: GarmentType;
  quantity?: number;
  priority?: OrderPriority;
  deliveryDate?: string;
  totalAmount?: number;
  advanceAmount?: number;
  stitchingNotes?: string;
  fabricNotes?: string;
  specialInstructions?: string;
}

export interface OrderSearchParams {
  search?: string;
  status?: OrderStatus;
  garmentType?: GarmentType;
  priority?: OrderPriority;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  customerId?: number;
  sortBy?: 'orderDate' | 'deliveryDate' | 'created_at';
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  dueToday: number;
  overdue: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class OrderService {
  private static getRepository() {
    return AppDataSource.getRepository(Order);
  }

  /**
   * Generate the next sequential order number in ORD-000001 format.
   */
  private static async generateOrderNumber(): Promise<string> {
    const repo = this.getRepository();
    const [lastOrder] = await repo.find({ order: { id: 'DESC' }, take: 1 });
    const nextId = lastOrder ? lastOrder.id + 1 : 1;
    return `ORD-${String(nextId).padStart(6, '0')}`;
  }

  /**
   * Calculate remaining amount from total and advance.
   */
  private static calcRemaining(total: number, advance: number): number {
    return Math.max(0, total - advance);
  }

  /**
   * Validate order data and throw descriptive errors.
   */
  private static validate(data: CreateOrderDto): void {
    if (!data.customerId) {
      throw new Error('Customer is required.');
    }
    if (!data.garmentType) {
      throw new Error('Garment type is required.');
    }
    if (!data.deliveryDate) {
      throw new Error('Delivery date is required.');
    }

    const total = data.totalAmount ?? 0;
    const advance = data.advanceAmount ?? 0;
    const orderDate = data.orderDate ?? new Date().toISOString().split('T')[0];

    if (total < 0) {
      throw new Error('Total amount cannot be negative.');
    }
    if (advance < 0) {
      throw new Error('Advance amount cannot be negative.');
    }
    if (advance > total) {
      throw new Error('Advance amount cannot exceed total amount.');
    }
    if (data.deliveryDate < orderDate) {
      throw new Error('Delivery date cannot be before order date.');
    }
  }

  /**
   * Create a new order.
   */
  public static async create(data: CreateOrderDto): Promise<Order> {
    this.validate(data);

    const repo = this.getRepository();
    const orderNumber = await this.generateOrderNumber();
    const today = new Date().toISOString().split('T')[0];
    const total = Number(data.totalAmount ?? 0);
    const advance = Number(data.advanceAmount ?? 0);

    const order = repo.create({
      orderNumber,
      customerId: data.customerId,
      measurementId: data.measurementId ?? null,
      garmentType: data.garmentType,
      quantity: data.quantity ?? 1,
      priority: data.priority ?? 'normal',
      status: 'Pending',
      orderDate: data.orderDate ?? today,
      deliveryDate: data.deliveryDate,
      totalAmount: total,
      advanceAmount: advance,
      remainingAmount: this.calcRemaining(total, advance),
      stitchingNotes: data.stitchingNotes?.trim(),
      fabricNotes: data.fabricNotes?.trim(),
      specialInstructions: data.specialInstructions?.trim()
    });

    return repo.save(order);
  }

  /**
   * Update an existing order.
   * Editing is blocked for Delivered and Cancelled orders.
   */
  public static async update(id: number, data: UpdateOrderDto): Promise<Order> {
    const repo = this.getRepository();
    const order = await repo.findOne({ where: { id }, relations: ['customer'] });
    if (!order) {
      throw new Error(`Order with id ${id} not found.`);
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new Error(
        `Cannot edit an order with status '${order.status}'. Only notes updates are possible through status management.`
      );
    }

    if (data.measurementId !== undefined) order.measurementId = data.measurementId;
    if (data.garmentType !== undefined) order.garmentType = data.garmentType;
    if (data.quantity !== undefined) order.quantity = data.quantity;
    if (data.priority !== undefined) order.priority = data.priority;
    if (data.deliveryDate !== undefined) {
      if (data.deliveryDate < order.orderDate) {
        throw new Error('Delivery date cannot be before order date.');
      }
      order.deliveryDate = data.deliveryDate;
    }
    if (data.stitchingNotes !== undefined) order.stitchingNotes = data.stitchingNotes?.trim();
    if (data.fabricNotes !== undefined) order.fabricNotes = data.fabricNotes?.trim();
    if (data.specialInstructions !== undefined) {
      order.specialInstructions = data.specialInstructions?.trim();
    }

    // Recalculate remaining amount if amounts changed
    if (data.totalAmount !== undefined || data.advanceAmount !== undefined) {
      const newTotal = data.totalAmount !== undefined ? Number(data.totalAmount) : Number(order.totalAmount);
      const newAdvance = data.advanceAmount !== undefined ? Number(data.advanceAmount) : Number(order.advanceAmount);

      if (newTotal < 0) throw new Error('Total amount cannot be negative.');
      if (newAdvance < 0) throw new Error('Advance amount cannot be negative.');
      if (newAdvance > newTotal) throw new Error('Advance amount cannot exceed total amount.');

      order.totalAmount = newTotal;
      order.advanceAmount = newAdvance;
      order.remainingAmount = this.calcRemaining(newTotal, newAdvance);
    }

    return repo.save(order);
  }

  /**
   * Delete an order.
   */
  public static async delete(id: number): Promise<void> {
    const repo = this.getRepository();
    const order = await repo.findOneBy({ id });
    if (!order) {
      throw new Error(`Order with id ${id} not found.`);
    }
    await repo.remove(order);
  }

  /**
   * Get a single order by id, eager-loading customer and measurement.
   */
  public static async getById(id: number): Promise<Order> {
    const repo = this.getRepository();
    const order = await repo.findOne({
      where: { id },
      relations: ['customer', 'measurement', 'measurement.values']
    });
    if (!order) {
      throw new Error(`Order with id ${id} not found.`);
    }
    return order;
  }

  /**
   * Get all orders, paginated and filterable.
   */
  public static async getAll(params: OrderSearchParams = {}): Promise<PaginatedOrders> {
    const repo = this.getRepository();
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.measurement', 'measurement');

    if (params.search) {
      qb.andWhere(
        '(order.orderNumber LIKE :search OR customer.fullName LIKE :search OR customer.phoneNumber LIKE :search)',
        { search: `%${params.search}%` }
      );
    }
    if (params.status) {
      qb.andWhere('order.status = :status', { status: params.status });
    }
    if (params.garmentType) {
      qb.andWhere('order.garmentType = :garmentType', { garmentType: params.garmentType });
    }
    if (params.priority) {
      qb.andWhere('order.priority = :priority', { priority: params.priority });
    }
    if (params.customerId) {
      qb.andWhere('order.customerId = :customerId', { customerId: params.customerId });
    }
    if (params.deliveryDateFrom) {
      qb.andWhere('order.deliveryDate >= :from', { from: params.deliveryDateFrom });
    }
    if (params.deliveryDateTo) {
      qb.andWhere('order.deliveryDate <= :to', { to: params.deliveryDateTo });
    }

    const sortCol = params.sortBy ?? 'created_at';
    const sortDir = params.sortDir ?? 'DESC';
    qb.orderBy(`order.${sortCol}`, sortDir);

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  /**
   * Get paginated orders for a specific customer.
   */
  public static async getByCustomer(
    customerId: number,
    params: OrderSearchParams = {}
  ): Promise<PaginatedOrders> {
    return this.getAll({ ...params, customerId });
  }

  /**
   * Change the status of an order.
   */
  public static async changeStatus(id: number, status: OrderStatus): Promise<Order> {
    const repo = this.getRepository();
    const order = await repo.findOneBy({ id });
    if (!order) {
      throw new Error(`Order with id ${id} not found.`);
    }
    order.status = status;
    return repo.save(order);
  }

  /**
   * Mark an order as Ready.
   */
  public static async markReady(id: number): Promise<Order> {
    return this.changeStatus(id, 'Ready');
  }

  /**
   * Mark an order as Delivered.
   */
  public static async markDelivered(id: number): Promise<Order> {
    return this.changeStatus(id, 'Delivered');
  }

  /**
   * Cancel an order.
   */
  public static async cancelOrder(id: number): Promise<Order> {
    return this.changeStatus(id, 'Cancelled');
  }

  /**
   * Search orders by orderNumber, customer name, or phone number.
   */
  public static async search(query: string): Promise<Order[]> {
    if (!query || query.trim().length === 0) return [];
    const repo = this.getRepository();
    return repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.orderNumber LIKE :q', { q: `%${query}%` })
      .orWhere('customer.fullName LIKE :q', { q: `%${query}%` })
      .orWhere('customer.phoneNumber LIKE :q', { q: `%${query}%` })
      .orderBy('order.created_at', 'DESC')
      .take(20)
      .getMany();
  }

  /**
   * Get order statistics for the dashboard KPI cards.
   */
  public static async getStats(): Promise<OrderStats> {
    const repo = this.getRepository();
    const today = new Date().toISOString().split('T')[0];

    const totalOrders = await repo.count();

    const activeStatuses: OrderStatus[] = ['Pending', 'Cutting', 'Stitching', 'Quality Check', 'Ready'];
    const activeOrders = await repo
      .createQueryBuilder('order')
      .where('order.status IN (:...statuses)', { statuses: activeStatuses })
      .getCount();

    const dueToday = await repo
      .createQueryBuilder('order')
      .where('order.deliveryDate = :today', { today })
      .andWhere('order.status NOT IN (:...excluded)', {
        excluded: ['Delivered', 'Cancelled']
      })
      .getCount();

    const overdue = await repo
      .createQueryBuilder('order')
      .where('order.deliveryDate < :today', { today })
      .andWhere('order.status NOT IN (:...excluded)', {
        excluded: ['Delivered', 'Cancelled']
      })
      .getCount();

    return { totalOrders, activeOrders, dueToday, overdue };
  }
}
