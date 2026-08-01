import { AppDataSource } from '../config/data-source';
import { Payment, PaymentMethod } from '../database/entities/payment.entity';
import { Order } from '../database/entities/order.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreatePaymentDto {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
}

export interface PaymentSearchParams {
  search?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  orderId?: number;
  customerId?: number;
  sortBy?: 'paymentDate' | 'amount' | 'created_at';
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedPayments {
  items: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderBalanceSummary {
  orderId: number;
  orderNumber: string;
  customerId: number;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
  status: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
}

export interface PaymentStats {
  todayCollections: number;
  monthlyRevenue: number;
  outstandingAmount: number;
  recentPayments: Payment[];
}

// ── Service ───────────────────────────────────────────────────────────────────

export class PaymentService {
  private static getPaymentRepository() {
    return AppDataSource.getRepository(Payment);
  }

  private static getOrderRepository() {
    return AppDataSource.getRepository(Order);
  }

  /**
   * Generate the next sequential payment number in PAY-000001 format.
   */
  private static async generatePaymentNumber(): Promise<string> {
    const repo = this.getPaymentRepository();
    const result = await repo
      .createQueryBuilder('payment')
      .select('MAX(payment.id)', 'maxId')
      .getRawOne();
    const nextId = (result?.maxId ?? 0) + 1;
    return `PAY-${String(nextId).padStart(6, '0')}`;
  }

  /**
   * Recalculate and persist the order's remainingAmount from payment totals.
   * Called after every create / update / delete payment operation.
   */
  private static async recalcOrderBalance(orderId: number): Promise<void> {
    const paymentRepo = this.getPaymentRepository();
    const orderRepo = this.getOrderRepository();

    const result = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalPaid')
      .where('payment.orderId = :orderId', { orderId })
      .getRawOne();

    const totalPaid = Number(result?.totalPaid ?? 0);

    const order = await orderRepo.findOneBy({ id: orderId });
    if (order) {
      const advanceAmount = Number(order.advanceAmount ?? 0);
      order.remainingAmount = Math.max(0, Number(order.totalAmount) - totalPaid - advanceAmount);
      await orderRepo.save(order);
    }
  }

  /**
   * Validate payment data — throws descriptive errors on violations.
   */
  private static async validate(
    data: CreatePaymentDto | UpdatePaymentDto,
    paymentId?: number
  ): Promise<void> {
    const amount = (data as any).amount;
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Payment amount must be greater than zero.');
      }
    }

    // Validate overpayment if orderId is present (create scenario)
    if ((data as CreatePaymentDto).orderId) {
      const dto = data as CreatePaymentDto;
      const orderRepo = this.getOrderRepository();
      const order = await orderRepo.findOneBy({ id: dto.orderId });
      if (!order) {
        throw new Error(`Order with id ${dto.orderId} not found.`);
      }

      const paymentRepo = this.getPaymentRepository();
      const result = await paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'totalPaid')
        .where('p.orderId = :orderId', { orderId: dto.orderId })
        .getRawOne();

      let alreadyPaid = Number(result?.totalPaid ?? 0) + Number(order.advanceAmount ?? 0);

      // On update, subtract the current payment's amount to get what others paid
      if (paymentId) {
        const current = await paymentRepo.findOneBy({ id: paymentId });
        if (current) {
          alreadyPaid -= Number(current.amount);
        }
      }

      const remaining = Math.max(0, Number(order.totalAmount) - alreadyPaid);
      if (dto.amount > remaining) {
        throw new Error(
          `Payment amount (${dto.amount}) exceeds the remaining balance (${remaining.toFixed(2)}).`
        );
      }
    }
  }

  /**
   * Create a new payment for an order.
   * Automatically updates the order's remainingAmount after saving.
   */
  public static async create(data: CreatePaymentDto): Promise<Payment> {
    if (!data.orderId) throw new Error('Order is required.');
    if (!data.paymentMethod) throw new Error('Payment method is required.');
    if (!data.amount || data.amount <= 0) throw new Error('Payment amount must be greater than zero.');

    await this.validate(data);

    const orderRepo = this.getOrderRepository();
    const order = await orderRepo.findOne({
      where: { id: data.orderId },
      relations: ['customer']
    });
    if (!order) throw new Error(`Order with id ${data.orderId} not found.`);

    const paymentRepo = this.getPaymentRepository();
    const paymentNumber = await this.generatePaymentNumber();

    const payment = paymentRepo.create({
      paymentNumber,
      orderId: data.orderId,
      customerId: order.customerId,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      notes: data.notes?.trim(),
      createdBy: data.createdBy?.trim()
    });

    const saved = await paymentRepo.save(payment);
    await this.recalcOrderBalance(data.orderId);
    return saved;
  }

  /**
   * Update an existing payment.
   * Recalculates the order balance after update.
   */
  public static async update(id: number, data: UpdatePaymentDto): Promise<Payment> {
    const paymentRepo = this.getPaymentRepository();
    const payment = await paymentRepo.findOne({ where: { id }, relations: ['order'] });
    if (!payment) throw new Error(`Payment with id ${id} not found.`);

    // Build a temporary create DTO for overpayment validation
    const validateDto: CreatePaymentDto = {
      orderId: payment.orderId,
      amount: data.amount !== undefined ? Number(data.amount) : Number(payment.amount),
      paymentMethod: data.paymentMethod ?? payment.paymentMethod
    };
    await this.validate(validateDto, id);

    if (data.amount !== undefined) payment.amount = Number(data.amount);
    if (data.paymentMethod !== undefined) payment.paymentMethod = data.paymentMethod;
    if (data.paymentDate !== undefined) payment.paymentDate = new Date(data.paymentDate);
    if (data.notes !== undefined) payment.notes = data.notes?.trim();

    const saved = await paymentRepo.save(payment);
    await this.recalcOrderBalance(payment.orderId);
    return saved;
  }

  /**
   * Delete a payment. Restores the order's remaining balance.
   */
  public static async delete(id: number): Promise<void> {
    const paymentRepo = this.getPaymentRepository();
    const payment = await paymentRepo.findOneBy({ id });
    if (!payment) throw new Error(`Payment with id ${id} not found.`);
    const orderId = payment.orderId;
    await paymentRepo.remove(payment);
    await this.recalcOrderBalance(orderId);
  }

  /**
   * Get a single payment by id, with customer and order relations.
   */
  public static async getById(id: number): Promise<Payment> {
    const paymentRepo = this.getPaymentRepository();
    const payment = await paymentRepo.findOne({
      where: { id },
      relations: ['order', 'customer']
    });
    if (!payment) throw new Error(`Payment with id ${id} not found.`);
    return payment;
  }

  /**
   * Get all payments, paginated and filterable.
   */
  public static async getAll(params: PaymentSearchParams = {}): Promise<PaginatedPayments> {
    const paymentRepo = this.getPaymentRepository();
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.customer', 'customer');

    if (params.search) {
      qb.andWhere(
        '(payment.paymentNumber LIKE :search OR order.orderNumber LIKE :search OR customer.fullName LIKE :search)',
        { search: `%${params.search}%` }
      );
    }
    if (params.paymentMethod) {
      qb.andWhere('payment.paymentMethod = :method', { method: params.paymentMethod });
    }
    if (params.dateFrom) {
      qb.andWhere('payment.paymentDate >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb.andWhere('payment.paymentDate <= :dateTo', { dateTo: params.dateTo + ' 23:59:59' });
    }
    if (params.orderId) {
      qb.andWhere('payment.orderId = :orderId', { orderId: params.orderId });
    }
    if (params.customerId) {
      qb.andWhere('payment.customerId = :customerId', { customerId: params.customerId });
    }

    const sortCol = params.sortBy ?? 'paymentDate';
    const sortDir = params.sortDir ?? 'DESC';
    qb.orderBy(`payment.${sortCol}`, sortDir);
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  /**
   * Get all payments for a specific customer.
   */
  public static async getByCustomer(
    customerId: number,
    params: PaymentSearchParams = {}
  ): Promise<PaginatedPayments> {
    return this.getAll({ ...params, customerId });
  }

  /**
   * Get all payments for a specific order.
   */
  public static async getByOrder(orderId: number): Promise<Payment[]> {
    const paymentRepo = this.getPaymentRepository();
    return paymentRepo.find({
      where: { orderId },
      order: { paymentDate: 'ASC' },
      relations: ['customer']
    });
  }

  /**
   * Calculate the outstanding balance for an order.
   * Returns the full balance summary including payment status.
   */
  public static async calculateOutstandingBalance(orderId: number): Promise<OrderBalanceSummary> {
    const orderRepo = this.getOrderRepository();
    const order = await orderRepo.findOne({
      where: { id: orderId },
      relations: ['customer']
    });
    if (!order) throw new Error(`Order with id ${orderId} not found.`);

    const paymentRepo = this.getPaymentRepository();
    const result = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalPaid')
      .where('payment.orderId = :orderId', { orderId })
      .getRawOne();

    const totalPaid = Number(result?.totalPaid ?? 0) + Number(order.advanceAmount ?? 0);
    const totalAmount = Number(order.totalAmount);
    const remaining = Math.max(0, totalAmount - totalPaid);

    let status: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
    if (totalPaid === 0) {
      status = 'Unpaid';
    } else if (totalPaid >= totalAmount) {
      status = 'Fully Paid';
    } else {
      status = 'Partially Paid';
    }

    return {
      orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      totalAmount,
      totalPaid,
      remaining,
      status
    };
  }

  /**
   * Get aggregate payment statistics for the dashboard.
   */
  public static async getStats(): Promise<PaymentStats> {
    const paymentRepo = this.getPaymentRepository();
    const orderRepo = this.getOrderRepository();

    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    // Today's collections
    const todayResult = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('DATE(payment.paymentDate) = :today', { today })
      .getRawOne();
    const todayCollections = Number(todayResult?.total ?? 0);

    // Monthly revenue
    const monthResult = await paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.paymentDate >= :monthStart', { monthStart })
      .getRawOne();
    const monthlyRevenue = Number(monthResult?.total ?? 0);

    // Total outstanding across all active orders
    const outstandingResult = await orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.remainingAmount)', 'total')
      .where('order.status NOT IN (:...excluded)', { excluded: ['Delivered', 'Cancelled'] })
      .getRawOne();
    const outstandingAmount = Number(outstandingResult?.total ?? 0);

    // Recent payments (last 5)
    const recentPayments = await paymentRepo.find({
      order: { paymentDate: 'DESC' },
      take: 5,
      relations: ['order', 'customer']
    });

    return { todayCollections, monthlyRevenue, outstandingAmount, recentPayments };
  }
}
