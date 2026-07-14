import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import {
  CustomerSearchParams,
  PaginatedCustomers,
  CreateCustomerDto,
  UpdateCustomerDto
} from '../../features/customers/models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private get customersApi(): Window['api']['customers'] {
    if (!window.api?.customers) {
      throw new Error(
        'Electron API is unavailable. Run the app via Electron (npm start).'
      );
    }
    return window.api.customers;
  }

  getAll(params?: CustomerSearchParams): Observable<ApiResponse<PaginatedCustomers>> {
    return this.invoke(() => this.customersApi.getAll(params));
  }

  getById(id: number): Observable<ApiResponse<Customer>> {
    return this.invoke(() => this.customersApi.getById(id));
  }

  search(query: string): Observable<ApiResponse<Customer[]>> {
    return this.invoke(() => this.customersApi.search(query));
  }

  create(data: CreateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.invoke(() => this.customersApi.create(data));
  }

  update(id: number, data: UpdateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.invoke(() => this.customersApi.update(id, data));
  }

  delete(id: number): Observable<ApiResponse> {
    return this.invoke(() => this.customersApi.delete(id));
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
