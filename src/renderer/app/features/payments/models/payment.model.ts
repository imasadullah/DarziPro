// ── Enums ─────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash';
export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'payments' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account_balance' },
  { value: 'easypaisa', label: 'Easypaisa', icon: 'phone_android' },
  { value: 'jazzcash', label: 'JazzCash', icon: 'smartphone' }
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash'
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: 'payments',
  bank_transfer: 'account_balance',
  easypaisa: 'phone_android',
  jazzcash: 'smartphone'
};

// ── Models ────────────────────────────────────────────────────────────────────

export interface PaymentOrderInfo {
  id: number;
  orderNumber: string;
  totalAmount: number;
  remainingAmount: number;
  customerId: number;
  customer?: { id: number; fullName: string; phoneNumber: string };
}

export interface PaymentCustomerInfo {
  id: number;
  fullName: string;
  phoneNumber: string;
}

export interface PaymentModel {
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

export interface OrderBalanceSummary {
  orderId: number;
  orderNumber: string;
  customerId: number;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
  status: PaymentStatus;
}

export interface PaymentStats {
  todayCollections: number;
  monthlyRevenue: number;
  outstandingAmount: number;
  recentPayments: PaymentModel[];
}

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
  items: PaymentModel[];
  total: number;
  page: number;
  limit: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  return PAYMENT_METHOD_ICONS[method] ?? 'payments';
}

export function derivePaymentStatus(totalAmount: number, totalPaid: number): PaymentStatus {
  if (totalPaid <= 0) return 'Unpaid';
  if (totalPaid >= totalAmount) return 'Fully Paid';
  return 'Partially Paid';
}

export function getPaymentStatusClass(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    'Unpaid': 'status-unpaid',
    'Partially Paid': 'status-partial',
    'Fully Paid': 'status-paid'
  };
  return map[status] ?? 'status-unpaid';
}

export function formatCurrency(amount: number | string): string {
  return `Rs ${Number(amount).toLocaleString('en-PK')}`;
}
