// Re-export the global types declared in typings.d.ts as local interfaces
// so components can import them as TypeScript modules.

export interface CustomerModel {
  id: number;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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
  items: CustomerModel[];
  total: number;
  page: number;
  limit: number;
}
