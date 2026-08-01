// ── Customer ───────────────────────────────────────────────────────────────────

interface Customer {
  id: number;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateCustomerDto {
  fullName: string;
  phoneNumber: string;
  address?: string;
  notes?: string;
}

interface UpdateCustomerDto {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
}

interface CustomerSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

// ── Measurement ────────────────────────────────────────────────────────────────

type MeasurementType =
  | 'shirt'
  | 'pant'
  | 'shalwar_kameez'
  | 'coat'
  | 'waistcoat'
  | 'custom';

interface MeasurementValue {
  id: number;
  measurementId: number;
  fieldName: string;
  fieldValue?: string;
}

interface Measurement {
  id: number;
  customerId: number;
  measurementType: MeasurementType;
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values: MeasurementValue[];
  created_at: string;
  updated_at: string;
}

interface MeasurementValueDto {
  fieldName: string;
  fieldValue?: string;
}

interface CreateMeasurementDto {
  customerId: number;
  measurementType: MeasurementType;
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values: MeasurementValueDto[];
}

interface UpdateMeasurementDto {
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values?: MeasurementValueDto[];
}

interface MeasurementSearchParams {
  measurementType?: MeasurementType;
  page?: number;
  limit?: number;
}

interface PaginatedMeasurements {
  items: Measurement[];
  total: number;
  page: number;
  limit: number;
}

// ── API Response ───────────────────────────────────────────────────────────────

interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Payment ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash';
type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';

interface PaymentOrderInfo {
  id: number;
  orderNumber: string;
  totalAmount: number;
  remainingAmount: number;
  customerId: number;
  customer?: { id: number; fullName: string; phoneNumber: string };
}

interface PaymentCustomerInfo {
  id: number;
  fullName: string;
  phoneNumber: string;
}

interface PaymentModel {
  id: number;
  paymentNumber: string;
  orderId: number;
  customerId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  createdBy?: string;
  order?: PaymentOrderInfo;
  customer?: PaymentCustomerInfo;
  created_at: string;
  updated_at: string;
}

interface CreatePaymentDto {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  createdBy?: string;
}

interface UpdatePaymentDto {
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
}

interface PaymentSearchParams {
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

interface PaginatedPayments {
  items: PaymentModel[];
  total: number;
  page: number;
  limit: number;
}

interface OrderBalanceSummary {
  orderId: number;
  orderNumber: string;
  customerId: number;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
  status: PaymentStatus;
}

interface PaymentStats {
  todayCollections: number;
  monthlyRevenue: number;
  outstandingAmount: number;
  recentPayments: PaymentModel[];
}

// ── Reports ────────────────────────────────────────────────────────────────────

interface ReportKpiSummary {
  revenueToday: number;
  revenueThisMonth: number;
  activeOrders: number;
  outstandingAmount: number;
  deliveredOrders: number;
  totalCustomers: number;
}

interface ReportDateParams {
  dateFrom?: string;
  dateTo?: string;
}

interface RevenueReportParams extends ReportDateParams {
  customerId?: number;
  paymentMethod?: string;
}

interface RevenueMethodBreakdown {
  method: string;
  label: string;
  total: number;
  count: number;
}

interface RevenueTrendPoint {
  label: string;
  total: number;
}

interface RevenueReport {
  totalRevenue: number;
  paymentCount: number;
  averagePayment: number;
  methodBreakdown: RevenueMethodBreakdown[];
  dailyTrend: RevenueTrendPoint[];
}

interface OrdersReportParams extends ReportDateParams {
  status?: string;
  customerId?: number;
  garmentType?: string;
}

interface OrdersReportItem {
  id: number;
  orderNumber: string;
  customerName: string;
  garmentType: string;
  status: string;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  remainingAmount: number;
}

interface OrdersReport {
  total: number;
  pending: number;
  cutting: number;
  stitching: number;
  qualityCheck: number;
  ready: number;
  delivered: number;
  cancelled: number;
  items: OrdersReportItem[];
}

interface CustomerReportParams extends ReportDateParams {
  limit?: number;
}

interface CustomerTopItem {
  id: number;
  fullName: string;
  phoneNumber: string;
  totalSpent: number;
  orderCount: number;
}

interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  topBySpending: CustomerTopItem[];
  topByOrders: CustomerTopItem[];
}

interface OutstandingReportParams {
  sortDir?: 'ASC' | 'DESC';
  minOutstanding?: number;
}

interface OutstandingItem {
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

interface OutstandingReport {
  items: OutstandingItem[];
  totalOutstanding: number;
  orderCount: number;
}

interface DeliveryOverdueItem {
  id: number;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  daysOverdue: number;
  status: string;
  totalAmount: number;
  remainingAmount: number;
}

interface DeliveryReport {
  deliveredToday: number;
  deliveredThisMonth: number;
  overdueOrders: number;
  dueToday: number;
  averageDeliveryDays: number;
  overdueItems: DeliveryOverdueItem[];
}

interface PaymentMethodItem {
  method: string;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

interface PaymentMethodReport {
  methods: PaymentMethodItem[];
  grandTotal: number;
  grandCount: number;
}

interface ReportExportResult {
  filePath: string;
  fileName: string;
}

// ── Window API ─────────────────────────────────────────────────────────────────

interface Window {
  api: {
    auth: {
      hasUsers(): Promise<ApiResponse<boolean>>;
      registerOwner(data: any): Promise<ApiResponse<any>>;
      login(credentials: any): Promise<ApiResponse<any>>;
      loginWithPIN(pin: string): Promise<ApiResponse<any>>;
      logout(): Promise<ApiResponse>;
      getCurrentUser(): Promise<ApiResponse<any>>;
    };
    customers: {
      getAll(params?: CustomerSearchParams): Promise<ApiResponse<PaginatedCustomers>>;
      getById(id: number): Promise<ApiResponse<Customer>>;
      search(query: string): Promise<ApiResponse<Customer[]>>;
      create(data: CreateCustomerDto): Promise<ApiResponse<Customer>>;
      update(id: number, data: UpdateCustomerDto): Promise<ApiResponse<Customer>>;
      delete(id: number): Promise<ApiResponse>;
    };
    measurements: {
      create(data: CreateMeasurementDto): Promise<ApiResponse<Measurement>>;
      update(id: number, data: UpdateMeasurementDto): Promise<ApiResponse<Measurement>>;
      delete(id: number): Promise<ApiResponse>;
      get(id: number): Promise<ApiResponse<Measurement>>;
      getAll(params?: MeasurementSearchParams): Promise<ApiResponse<PaginatedMeasurements>>;
      getByCustomer(
        customerId: number,
        params?: MeasurementSearchParams
      ): Promise<ApiResponse<PaginatedMeasurements>>;
      copy(measurementId: number): Promise<ApiResponse<Measurement>>;
      getLatest(
        customerId: number,
        measurementType?: MeasurementType
      ): Promise<ApiResponse<Measurement | null>>;
    };
    orders: {
      create(data: any): Promise<ApiResponse<any>>;
      update(id: number, data: any): Promise<ApiResponse<any>>;
      delete(id: number): Promise<ApiResponse>;
      get(id: number): Promise<ApiResponse<any>>;
      getAll(params?: any): Promise<ApiResponse<any>>;
      getByCustomer(customerId: number, params?: any): Promise<ApiResponse<any>>;
      changeStatus(id: number, status: string): Promise<ApiResponse<any>>;
      markReady(id: number): Promise<ApiResponse<any>>;
      markDelivered(id: number): Promise<ApiResponse<any>>;
      cancel(id: number): Promise<ApiResponse<any>>;
      search(query: string): Promise<ApiResponse<any>>;
      getStats(): Promise<ApiResponse<any>>;
    };
    payments: {
      create(data: CreatePaymentDto): Promise<ApiResponse<PaymentModel>>;
      update(id: number, data: UpdatePaymentDto): Promise<ApiResponse<PaymentModel>>;
      delete(id: number): Promise<ApiResponse>;
      get(id: number): Promise<ApiResponse<PaymentModel>>;
      getAll(params?: PaymentSearchParams): Promise<ApiResponse<PaginatedPayments>>;
      getByCustomer(customerId: number, params?: PaymentSearchParams): Promise<ApiResponse<PaginatedPayments>>;
      getByOrder(orderId: number): Promise<ApiResponse<PaymentModel[]>>;
      calculateBalance(orderId: number): Promise<ApiResponse<OrderBalanceSummary>>;
      getStats(): Promise<ApiResponse<PaymentStats>>;
      printReceipt(paymentId: number): Promise<ApiResponse<string>>;
    };
    system: {
      getSettings(): Promise<ApiResponse<Record<string, string>>>;
      saveSettings(settings: Record<string, string>): Promise<ApiResponse>;
    };
    reports: {
      getKpiSummary(): Promise<ApiResponse<ReportKpiSummary>>;
      getRevenueReport(params?: RevenueReportParams): Promise<ApiResponse<RevenueReport>>;
      getOrdersReport(params?: OrdersReportParams): Promise<ApiResponse<OrdersReport>>;
      getCustomerReport(params?: CustomerReportParams): Promise<ApiResponse<CustomerReport>>;
      getOutstandingReport(params?: OutstandingReportParams): Promise<ApiResponse<OutstandingReport>>;
      getDeliveryReport(): Promise<ApiResponse<DeliveryReport>>;
      getPaymentMethodReport(params?: ReportDateParams): Promise<ApiResponse<PaymentMethodReport>>;
      getRevenueTrend(params?: ReportDateParams & { groupBy?: 'day' | 'month' }): Promise<ApiResponse<RevenueTrendPoint[]>>;
      exportCsv(type: string, params?: any): Promise<ApiResponse<ReportExportResult>>;
      exportPdf(type: string, params?: any): Promise<ApiResponse<ReportExportResult>>;
    };
  };
}

