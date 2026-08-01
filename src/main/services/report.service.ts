import { AppDataSource } from '../config/data-source';
import { Order } from '../database/entities/order.entity';
import { Payment } from '../database/entities/payment.entity';
import { Customer } from '../database/entities/customer.entity';

// ── DTOs & Interfaces ─────────────────────────────────────────────────────────

export interface ReportDateParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportKpiSummary {
  revenueToday: number;
  revenueThisMonth: number;
  activeOrders: number;
  outstandingAmount: number;
  deliveredOrders: number;
  totalCustomers: number;
}

export interface RevenueReportParams extends ReportDateParams {
  customerId?: number;
  paymentMethod?: string;
}

export interface RevenueReport {
  totalRevenue: number;
  paymentCount: number;
  averagePayment: number;
  methodBreakdown: { method: string; label: string; total: number; count: number }[];
  dailyTrend: { date: string; total: number }[];
}

export interface OrdersReportParams extends ReportDateParams {
  status?: string;
  customerId?: number;
  garmentType?: string;
}

export interface OrdersReport {
  total: number;
  pending: number;
  cutting: number;
  stitching: number;
  qualityCheck: number;
  ready: number;
  delivered: number;
  cancelled: number;
  items: {
    id: number;
    orderNumber: string;
    customerName: string;
    garmentType: string;
    status: string;
    orderDate: string;
    deliveryDate: string;
    totalAmount: number;
    remainingAmount: number;
  }[];
}

export interface CustomerReportParams extends ReportDateParams {
  limit?: number;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  topBySpending: {
    id: number;
    fullName: string;
    phoneNumber: string;
    totalSpent: number;
    orderCount: number;
  }[];
  topByOrders: {
    id: number;
    fullName: string;
    phoneNumber: string;
    orderCount: number;
    totalSpent: number;
  }[];
}

export interface OutstandingReportParams {
  sortDir?: 'ASC' | 'DESC';
  minOutstanding?: number;
}

export interface OutstandingItem {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  phoneNumber: string;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
}

export interface OutstandingReport {
  items: OutstandingItem[];
  totalOutstanding: number;
  orderCount: number;
}

export interface DeliveryReport {
  deliveredToday: number;
  deliveredThisMonth: number;
  overdueOrders: number;
  dueToday: number;
  averageDeliveryDays: number;
  overdueItems: {
    id: number;
    orderNumber: string;
    customerName: string;
    deliveryDate: string;
    daysOverdue: number;
    status: string;
    totalAmount: number;
    remainingAmount: number;
  }[];
}

export interface PaymentMethodReport {
  methods: {
    method: string;
    label: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  grandTotal: number;
  grandCount: number;
}

export interface RevenueTrendPoint {
  label: string;
  total: number;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

// ── Service ───────────────────────────────────────────────────────────────────

export class ReportService {
  private static getOrderRepository() {
    return AppDataSource.getRepository(Order);
  }

  private static getPaymentRepository() {
    return AppDataSource.getRepository(Payment);
  }

  private static getCustomerRepository() {
    return AppDataSource.getRepository(Customer);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // KPI Summary
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getKpiSummary(): Promise<ReportKpiSummary> {
    const paymentRepo = this.getPaymentRepository();
    const orderRepo = this.getOrderRepository();
    const customerRepo = this.getCustomerRepository();

    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    // Revenue Today
    const todayRev = await paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('DATE(p.paymentDate) = :today', { today })
      .getRawOne();

    // Revenue This Month
    const monthRev = await paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('DATE(p.paymentDate) >= :monthStart', { monthStart })
      .getRawOne();

    // Active Orders (not Delivered / Cancelled)
    const activeOrders = await orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'count')
      .where('o.status NOT IN (:...excluded)', { excluded: ['Delivered', 'Cancelled'] })
      .getRawOne();

    // Outstanding Amount (sum of remainingAmount across active orders)
    const outstanding = await orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.remainingAmount), 0)', 'total')
      .where('o.status NOT IN (:...excluded)', { excluded: ['Delivered', 'Cancelled'] })
      .getRawOne();

    // Delivered Orders
    const delivered = await orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'count')
      .where('o.status = :status', { status: 'Delivered' })
      .getRawOne();

    // Total Customers
    const totalCustomers = await customerRepo
      .createQueryBuilder('c')
      .select('COUNT(c.id)', 'count')
      .getRawOne();

    return {
      revenueToday: Number(todayRev?.total ?? 0),
      revenueThisMonth: Number(monthRev?.total ?? 0),
      activeOrders: Number(activeOrders?.count ?? 0),
      outstandingAmount: Number(outstanding?.total ?? 0),
      deliveredOrders: Number(delivered?.count ?? 0),
      totalCustomers: Number(totalCustomers?.count ?? 0),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Revenue Report
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getRevenueReport(params: RevenueReportParams = {}): Promise<RevenueReport> {
    const paymentRepo = this.getPaymentRepository();

    let qb = paymentRepo.createQueryBuilder('p');

    if (params.dateFrom) {
      qb = qb.andWhere('DATE(p.paymentDate) >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb = qb.andWhere('DATE(p.paymentDate) <= :dateTo', { dateTo: params.dateTo });
    }
    if (params.customerId) {
      qb = qb.andWhere('p.customerId = :customerId', { customerId: params.customerId });
    }
    if (params.paymentMethod) {
      qb = qb.andWhere('p.paymentMethod = :paymentMethod', { paymentMethod: params.paymentMethod });
    }

    // Aggregate totals
    const summary = await qb
      .select('COALESCE(SUM(p.amount), 0)', 'totalRevenue')
      .addSelect('COUNT(p.id)', 'paymentCount')
      .addSelect('COALESCE(AVG(p.amount), 0)', 'averagePayment')
      .getRawOne();

    // Method breakdown — rebuild query to avoid conflict with filters already applied
    const methodResults = await paymentRepo
      .createQueryBuilder('p')
      .select('p.paymentMethod', 'method')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where(params.dateFrom ? 'DATE(p.paymentDate) >= :dateFrom' : '1=1', { dateFrom: params.dateFrom })
      .andWhere(params.dateTo ? 'DATE(p.paymentDate) <= :dateTo' : '1=1', { dateTo: params.dateTo })
      .andWhere(params.customerId ? 'p.customerId = :customerId' : '1=1', { customerId: params.customerId })
      .groupBy('p.paymentMethod')
      .orderBy('total', 'DESC')
      .getRawMany();

    // Daily trend (last 30 days by default if no date range given)
    const trendFrom = params.dateFrom ?? (() => {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      return d.toISOString().split('T')[0];
    })();
    const trendTo = params.dateTo ?? new Date().toISOString().split('T')[0];

    const dailyResults = await paymentRepo
      .createQueryBuilder('p')
      .select("DATE(p.paymentDate)", 'date')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .where('DATE(p.paymentDate) >= :trendFrom', { trendFrom })
      .andWhere('DATE(p.paymentDate) <= :trendTo', { trendTo })
      .andWhere(params.customerId ? 'p.customerId = :customerId' : '1=1', { customerId: params.customerId })
      .groupBy("DATE(p.paymentDate)")
      .orderBy("DATE(p.paymentDate)", 'ASC')
      .getRawMany();

    return {
      totalRevenue: Number(summary?.totalRevenue ?? 0),
      paymentCount: Number(summary?.paymentCount ?? 0),
      averagePayment: Number(summary?.averagePayment ?? 0),
      methodBreakdown: methodResults.map((r) => ({
        method: r.method,
        label: METHOD_LABELS[r.method] ?? r.method,
        total: Number(r.total),
        count: Number(r.count),
      })),
      dailyTrend: dailyResults.map((r) => ({
        date: r.date,
        total: Number(r.total),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Orders Report
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getOrdersReport(params: OrdersReportParams = {}): Promise<OrdersReport> {
    const orderRepo = this.getOrderRepository();

    // Status counts (always unfiltered for the summary row)
    const statusCounts = await orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('o.status')
      .getRawMany();

    const countMap: Record<string, number> = {};
    for (const row of statusCounts) {
      countMap[row.status] = Number(row.count);
    }

    // Filtered list
    let qb = orderRepo
      .createQueryBuilder('o')
      .leftJoin('o.customer', 'c')
      .select([
        'o.id', 'o.orderNumber', 'o.garmentType', 'o.status',
        'o.orderDate', 'o.deliveryDate', 'o.totalAmount', 'o.remainingAmount',
        'c.id', 'c.fullName',
      ]);

    if (params.status) {
      qb = qb.andWhere('o.status = :status', { status: params.status });
    }
    if (params.customerId) {
      qb = qb.andWhere('o.customerId = :customerId', { customerId: params.customerId });
    }
    if (params.garmentType) {
      qb = qb.andWhere('o.garmentType = :garmentType', { garmentType: params.garmentType });
    }
    if (params.dateFrom) {
      qb = qb.andWhere('DATE(o.orderDate) >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb = qb.andWhere('DATE(o.orderDate) <= :dateTo', { dateTo: params.dateTo });
    }

    qb = qb.orderBy('o.orderDate', 'DESC').take(500);

    const rawOrders = await qb.getMany();

    return {
      total: Object.values(countMap).reduce((a, b) => a + b, 0),
      pending: countMap['Pending'] ?? 0,
      cutting: countMap['Cutting'] ?? 0,
      stitching: countMap['Stitching'] ?? 0,
      qualityCheck: countMap['Quality Check'] ?? 0,
      ready: countMap['Ready'] ?? 0,
      delivered: countMap['Delivered'] ?? 0,
      cancelled: countMap['Cancelled'] ?? 0,
      items: rawOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer?.fullName ?? '—',
        garmentType: o.garmentType,
        status: o.status,
        orderDate: o.orderDate,
        deliveryDate: o.deliveryDate,
        totalAmount: Number(o.totalAmount),
        remainingAmount: Number(o.remainingAmount),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Customer Report
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getCustomerReport(params: CustomerReportParams = {}): Promise<CustomerReport> {
    const customerRepo = this.getCustomerRepository();
    const orderRepo = this.getOrderRepository();

    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';
    const limit = params.limit ?? 10;

    // Total customers
    const totalResult = await customerRepo
      .createQueryBuilder('c')
      .select('COUNT(c.id)', 'count')
      .getRawOne();
    const totalCustomers = Number(totalResult?.count ?? 0);

    // New customers this month
    const newResult = await customerRepo
      .createQueryBuilder('c')
      .select('COUNT(c.id)', 'count')
      .where('DATE(c.created_at) >= :monthStart', { monthStart })
      .getRawOne();
    const newCustomers = Number(newResult?.count ?? 0);

    // Repeat customers (those with > 1 order) — use getRawMany to count distinct customers
    const repeatRaw = await orderRepo
      .createQueryBuilder('o')
      .select('o.customerId', 'customerId')
      .addSelect('COUNT(o.id)', 'orderCount')
      .groupBy('o.customerId')
      .having('COUNT(o.id) > 1')
      .getRawMany();
    const repeatCustomers = repeatRaw.length;

    // Top by spending — join orders and payments via raw column references
    const topBySpending = await customerRepo
      .createQueryBuilder('c')
      .leftJoin(Order, 'o', 'o.customerId = c.id')
      .leftJoin(Payment, 'p', 'p.orderId = o.id')
      .select('c.id', 'id')
      .addSelect('c.fullName', 'fullName')
      .addSelect('c.phoneNumber', 'phoneNumber')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'totalSpent')
      .addSelect('COUNT(DISTINCT o.id)', 'orderCount')
      .groupBy('c.id')
      .orderBy('totalSpent', 'DESC')
      .take(limit)
      .getRawMany();

    // Top by orders
    const topByOrders = await customerRepo
      .createQueryBuilder('c')
      .leftJoin(Order, 'o', 'o.customerId = c.id')
      .leftJoin(Payment, 'p', 'p.orderId = o.id')
      .select('c.id', 'id')
      .addSelect('c.fullName', 'fullName')
      .addSelect('c.phoneNumber', 'phoneNumber')
      .addSelect('COUNT(DISTINCT o.id)', 'orderCount')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'totalSpent')
      .groupBy('c.id')
      .orderBy('orderCount', 'DESC')
      .take(limit)
      .getRawMany();

    return {
      totalCustomers,
      newCustomers,
      repeatCustomers,
      topBySpending: topBySpending.map((r) => ({
        id: Number(r.id),
        fullName: r.fullName,
        phoneNumber: r.phoneNumber,
        totalSpent: Number(r.totalSpent),
        orderCount: Number(r.orderCount),
      })),
      topByOrders: topByOrders.map((r) => ({
        id: Number(r.id),
        fullName: r.fullName,
        phoneNumber: r.phoneNumber,
        orderCount: Number(r.orderCount),
        totalSpent: Number(r.totalSpent),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Outstanding Report
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getOutstandingReport(
    params: OutstandingReportParams = {}
  ): Promise<OutstandingReport> {
    const orderRepo = this.getOrderRepository();
    const sortDir = params.sortDir ?? 'DESC';

    const qb = orderRepo
      .createQueryBuilder('o')
      .leftJoin('o.customer', 'c')
      .select('o.id', 'orderId')
      .addSelect('o.orderNumber', 'orderNumber')
      .addSelect('o.customerId', 'customerId')
      .addSelect('c.fullName', 'customerName')
      .addSelect('c.phoneNumber', 'phoneNumber')
      .addSelect('o.orderDate', 'orderDate')
      .addSelect('o.deliveryDate', 'deliveryDate')
      .addSelect('o.totalAmount', 'totalAmount')
      .addSelect('(o.totalAmount - o.remainingAmount)', 'totalPaid')
      .addSelect('o.remainingAmount', 'remaining')
      .where('o.remainingAmount > 0')
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['Cancelled'] });

    if (params.minOutstanding) {
      qb.andWhere('o.remainingAmount >= :minOutstanding', { minOutstanding: params.minOutstanding });
    }

    qb.orderBy('o.remainingAmount', sortDir);

    const items = await qb.getRawMany();

    const totalOutstanding = items.reduce((sum, item) => sum + Number(item.remaining), 0);

    return {
      items: items.map((r) => ({
        orderId: Number(r.orderId),
        orderNumber: r.orderNumber,
        customerId: Number(r.customerId),
        customerName: r.customerName ?? '—',
        phoneNumber: r.phoneNumber ?? '—',
        orderDate: r.orderDate,
        deliveryDate: r.deliveryDate,
        totalAmount: Number(r.totalAmount),
        totalPaid: Number(r.totalPaid),
        remaining: Number(r.remaining),
      })),
      totalOutstanding,
      orderCount: items.length,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Delivery Report
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getDeliveryReport(): Promise<DeliveryReport> {
    const orderRepo = this.getOrderRepository();

    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    // Delivered today
    const deliveredTodayResult = await orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'count')
      .where('o.status = :status', { status: 'Delivered' })
      .andWhere('DATE(o.updated_at) = :today', { today })
      .getRawOne();

    // Delivered this month
    const deliveredMonthResult = await orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'count')
      .where('o.status = :status', { status: 'Delivered' })
      .andWhere('DATE(o.updated_at) >= :monthStart', { monthStart })
      .getRawOne();

    // Overdue orders (deliveryDate < today AND not Delivered/Cancelled)
    const overdueResult = await orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'count')
      .where('o.deliveryDate < :today', { today })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['Delivered', 'Cancelled'] })
      .getRawOne();

    // Due today
    const dueTodayResult = await orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'count')
      .where('o.deliveryDate = :today', { today })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['Delivered', 'Cancelled'] })
      .getRawOne();

    // Average delivery time (days between orderDate and updated_at for Delivered orders)
    const avgResult = await orderRepo
      .createQueryBuilder('o')
      .select(
        "AVG(JULIANDAY(DATE(o.updated_at)) - JULIANDAY(DATE(o.orderDate)))",
        'avgDays'
      )
      .where('o.status = :status', { status: 'Delivered' })
      .getRawOne();

    // Overdue order detail list
    const overdueItems = await orderRepo
      .createQueryBuilder('o')
      .leftJoin('o.customer', 'c')
      .select('o.id', 'id')
      .addSelect('o.orderNumber', 'orderNumber')
      .addSelect('c.fullName', 'customerName')
      .addSelect('o.deliveryDate', 'deliveryDate')
      .addSelect('o.status', 'status')
      .addSelect('o.totalAmount', 'totalAmount')
      .addSelect('o.remainingAmount', 'remainingAmount')
      .addSelect(
        `(JULIANDAY('${today}') - JULIANDAY(DATE(o.deliveryDate)))`,
        'daysOverdue'
      )
      .where('o.deliveryDate < :today', { today })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['Delivered', 'Cancelled'] })
      .orderBy('daysOverdue', 'DESC')
      .getRawMany();

    return {
      deliveredToday: Number(deliveredTodayResult?.count ?? 0),
      deliveredThisMonth: Number(deliveredMonthResult?.count ?? 0),
      overdueOrders: Number(overdueResult?.count ?? 0),
      dueToday: Number(dueTodayResult?.count ?? 0),
      averageDeliveryDays: Math.round(Number(avgResult?.avgDays ?? 0)),
      overdueItems: overdueItems.map((r) => ({
        id: Number(r.id),
        orderNumber: r.orderNumber,
        customerName: r.customerName ?? '—',
        deliveryDate: r.deliveryDate,
        daysOverdue: Math.round(Number(r.daysOverdue ?? 0)),
        status: r.status,
        totalAmount: Number(r.totalAmount),
        remainingAmount: Number(r.remainingAmount),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payment Method Report
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getPaymentMethodReport(
    params: ReportDateParams = {}
  ): Promise<PaymentMethodReport> {
    const paymentRepo = this.getPaymentRepository();

    let qb = paymentRepo
      .createQueryBuilder('p')
      .select('p.paymentMethod', 'method')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .groupBy('p.paymentMethod');

    if (params.dateFrom) {
      qb = qb.where('DATE(p.paymentDate) >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb = qb.andWhere('DATE(p.paymentDate) <= :dateTo', { dateTo: params.dateTo });
    }

    const results = await qb.getRawMany();

    const grandTotal = results.reduce((sum, r) => sum + Number(r.total), 0);
    const grandCount = results.reduce((sum, r) => sum + Number(r.count), 0);

    const methods = results.map((r) => ({
      method: r.method,
      label: METHOD_LABELS[r.method] ?? r.method,
      total: Number(r.total),
      count: Number(r.count),
      percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 100) : 0,
    }));

    // Ensure all 4 methods appear even if they have no data
    const allMethods = ['cash', 'bank_transfer', 'easypaisa', 'jazzcash'];
    for (const m of allMethods) {
      if (!methods.find((x) => x.method === m)) {
        methods.push({ method: m, label: METHOD_LABELS[m], total: 0, count: 0, percentage: 0 });
      }
    }

    return { methods, grandTotal, grandCount };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Revenue Trend (for charts)
  // ─────────────────────────────────────────────────────────────────────────────

  public static async getRevenueTrend(
    params: ReportDateParams & { groupBy?: 'day' | 'month' } = {}
  ): Promise<RevenueTrendPoint[]> {
    const paymentRepo = this.getPaymentRepository();
    const groupBy = params.groupBy ?? 'day';

    const dateExpr =
      groupBy === 'month'
        ? "strftime('%Y-%m', p.paymentDate)"
        : "DATE(p.paymentDate)";

    let qb = paymentRepo
      .createQueryBuilder('p')
      .select(dateExpr, 'label')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .groupBy(dateExpr)
      .orderBy(dateExpr, 'ASC');

    if (params.dateFrom) {
      qb = qb.where('DATE(p.paymentDate) >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb = qb.andWhere('DATE(p.paymentDate) <= :dateTo', { dateTo: params.dateTo });
    }

    const results = await qb.getRawMany();
    return results.map((r) => ({ label: r.label, total: Number(r.total) }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CSV Export Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  public static async exportRevenueCsv(params: RevenueReportParams): Promise<string> {
    const report = await this.getRevenueReport(params);
    const lines = [
      'Date,Total (Rs)',
      ...report.dailyTrend.map((d) => `${d.date},${d.total}`),
    ];
    return lines.join('\n');
  }

  public static async exportOrdersCsv(params: OrdersReportParams): Promise<string> {
    const report = await this.getOrdersReport(params);
    const lines = [
      'Order #,Customer,Garment Type,Status,Order Date,Delivery Date,Total (Rs),Remaining (Rs)',
      ...report.items.map(
        (o) =>
          `${o.orderNumber},"${o.customerName}",${o.garmentType},${o.status},${o.orderDate},${o.deliveryDate},${o.totalAmount},${o.remainingAmount}`
      ),
    ];
    return lines.join('\n');
  }

  public static async exportOutstandingCsv(params: OutstandingReportParams): Promise<string> {
    const report = await this.getOutstandingReport(params);
    const lines = [
      'Order #,Customer,Phone,Order Date,Delivery Date,Total (Rs),Paid (Rs),Remaining (Rs)',
      ...report.items.map(
        (o) =>
          `${o.orderNumber},"${o.customerName}",${o.phoneNumber},${o.orderDate},${o.deliveryDate},${o.totalAmount},${o.totalPaid},${o.remaining}`
      ),
    ];
    return lines.join('\n');
  }

  public static async exportDeliveryCsv(): Promise<string> {
    const report = await this.getDeliveryReport();
    const lines = [
      'Order #,Customer,Delivery Date,Days Overdue,Status,Total (Rs),Remaining (Rs)',
      ...report.overdueItems.map(
        (o) =>
          `${o.orderNumber},"${o.customerName}",${o.deliveryDate},${o.daysOverdue},${o.status},${o.totalAmount},${o.remainingAmount}`
      ),
    ];
    return lines.join('\n');
  }

  public static async exportCustomerCsv(params: CustomerReportParams): Promise<string> {
    const report = await this.getCustomerReport(params);
    const lines = [
      'Customer,Phone,Total Spent (Rs),Orders',
      ...report.topBySpending.map(
        (c) => `"${c.fullName}",${c.phoneNumber},${c.totalSpent},${c.orderCount}`
      ),
    ];
    return lines.join('\n');
  }
}
