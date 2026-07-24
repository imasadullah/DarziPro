// ── Enums ─────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'Pending'
  | 'Cutting'
  | 'Stitching'
  | 'Quality Check'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Cutting',
  'Stitching',
  'Quality Check',
  'Ready',
  'Delivered',
  'Cancelled'
];

/** Statuses that represent "in production" orders */
export const ACTIVE_STATUSES: OrderStatus[] = [
  'Pending',
  'Cutting',
  'Stitching',
  'Quality Check',
  'Ready'
];

/** Status flow for the progress timeline (excludes Cancelled) */
export const STATUS_TIMELINE: OrderStatus[] = [
  'Pending',
  'Cutting',
  'Stitching',
  'Quality Check',
  'Ready',
  'Delivered'
];

export type GarmentType =
  | 'shirt'
  | 'pant'
  | 'shalwar_kameez'
  | 'kurta'
  | 'coat'
  | 'waistcoat'
  | 'sherwani'
  | 'ladies_suit'
  | 'custom';

export const GARMENT_TYPE_OPTIONS: { value: GarmentType; label: string; icon: string }[] = [
  { value: 'shalwar_kameez', label: 'Shalwar Kameez', icon: 'dry_cleaning' },
  { value: 'kurta', label: 'Kurta', icon: 'checkroom' },
  { value: 'shirt', label: 'Shirt', icon: 'checkroom' },
  { value: 'pant', label: 'Pant', icon: 'straighten' },
  { value: 'coat', label: 'Coat', icon: 'business_center' },
  { value: 'waistcoat', label: 'Waistcoat', icon: 'style' },
  { value: 'sherwani', label: 'Sherwani', icon: 'military_tech' },
  { value: 'ladies_suit', label: 'Ladies Suit', icon: 'woman' },
  { value: 'custom', label: 'Custom', icon: 'tune' }
];

export type OrderPriority = 'normal' | 'urgent' | 'express';

export const ORDER_PRIORITY_OPTIONS: { value: OrderPriority; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal', color: 'accent' },
  { value: 'urgent', label: 'Urgent', color: 'warn' },
  { value: 'express', label: 'Express', color: 'warn' }
];

// ── Models ────────────────────────────────────────────────────────────────────

export interface OrderCustomerInfo {
  id: number;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
}

export interface OrderMeasurementInfo {
  id: number;
  measurementType: string;
  values: { fieldName: string; fieldValue?: string }[];
}

export interface OrderModel {
  id: number;
  orderNumber: string;
  customerId: number;
  customer?: OrderCustomerInfo;
  measurementId?: number | null;
  measurement?: OrderMeasurementInfo | null;
  garmentType: GarmentType;
  quantity: number;
  status: OrderStatus;
  priority: OrderPriority;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  stitchingNotes?: string;
  fabricNotes?: string;
  specialInstructions?: string;
  created_at: string;
  updated_at: string;
}

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
  items: OrderModel[];
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

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getGarmentLabel(type: GarmentType): string {
  return GARMENT_TYPE_OPTIONS.find((g) => g.value === type)?.label ?? type;
}

export function getGarmentIcon(type: GarmentType): string {
  return GARMENT_TYPE_OPTIONS.find((g) => g.value === type)?.icon ?? 'checkroom';
}

export function getStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'status-pending',
    Cutting: 'status-cutting',
    Stitching: 'status-stitching',
    'Quality Check': 'status-quality',
    Ready: 'status-ready',
    Delivered: 'status-delivered',
    Cancelled: 'status-cancelled'
  };
  return map[status] ?? 'status-pending';
}

export function getPriorityColor(priority: OrderPriority): string {
  const map: Record<OrderPriority, string> = {
    normal: 'priority-normal',
    urgent: 'priority-urgent',
    express: 'priority-express'
  };
  return map[priority] ?? 'priority-normal';
}

export function isEditable(status: OrderStatus): boolean {
  return status !== 'Delivered' && status !== 'Cancelled';
}
