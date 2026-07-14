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

interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

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
    system: {
      getSettings(): Promise<ApiResponse<Record<string, string>>>;
      saveSettings(settings: Record<string, string>): Promise<ApiResponse>;
    };
  };
}
