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
    system: {
      getSettings(): Promise<ApiResponse<Record<string, string>>>;
      saveSettings(settings: Record<string, string>): Promise<ApiResponse>;
    };
  };
}
