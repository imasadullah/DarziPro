import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CustomerService } from '../../../core/services/customer.service';
import {
  CustomerModel,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSearchParams,
  PaginatedCustomers
} from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerStoreService {
  private readonly customerService = inject(CustomerService);

  // ── Private Writable Signals ────────────────────────────────────────────────
  #customers = signal<CustomerModel[]>([]);
  #selectedCustomer = signal<CustomerModel | null>(null);
  #loading = signal<boolean>(false);
  #saving = signal<boolean>(false);
  #error = signal<string | null>(null);
  #searchQuery = signal<string>('');
  #page = signal<number>(1);
  #pageSize = signal<number>(20);
  #totalCount = signal<number>(0);

  // ── Public Read-Only Signals ────────────────────────────────────────────────
  public readonly customers = this.#customers.asReadonly();
  public readonly selectedCustomer = this.#selectedCustomer.asReadonly();
  public readonly loading = this.#loading.asReadonly();
  public readonly saving = this.#saving.asReadonly();
  public readonly error = this.#error.asReadonly();
  public readonly searchQuery = this.#searchQuery.asReadonly();
  public readonly page = this.#page.asReadonly();
  public readonly pageSize = this.#pageSize.asReadonly();
  public readonly totalCount = this.#totalCount.asReadonly();

  // ── Computed Signals ────────────────────────────────────────────────────────
  public readonly totalPages = computed(() =>
    Math.ceil(this.#totalCount() / this.#pageSize())
  );

  public readonly hasCustomers = computed(() => this.#customers().length > 0);

  // ── Actions ─────────────────────────────────────────────────────────────────

  public loadCustomers(params?: CustomerSearchParams): void {
    this.#loading.set(true);
    this.#error.set(null);

    const searchParams: CustomerSearchParams = {
      search: params?.search ?? this.#searchQuery(),
      page: params?.page ?? this.#page(),
      limit: params?.limit ?? this.#pageSize()
    };

    this.customerService
      .getAll(searchParams)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#customers.set(res.data.items);
            this.#totalCount.set(res.data.total);
            this.#page.set(res.data.page);
          } else {
            this.#error.set(res.error ?? 'Failed to load customers.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load customers.')
      });
  }

  public searchCustomers(query: string): void {
    this.#searchQuery.set(query);
    this.#page.set(1);
    this.loadCustomers({ search: query, page: 1, limit: this.#pageSize() });
  }

  public setPage(page: number): void {
    this.#page.set(page);
    this.loadCustomers({ page });
  }

  public setPageSize(limit: number): void {
    this.#pageSize.set(limit);
    this.#page.set(1);
    this.loadCustomers({ page: 1, limit });
  }

  public getCustomerById(id: number): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.#selectedCustomer.set(null);

    this.customerService
      .getById(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#selectedCustomer.set(res.data as unknown as CustomerModel);
          } else {
            this.#error.set(res.error ?? 'Customer not found.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Customer not found.')
      });
  }

  public createCustomer(
    data: CreateCustomerDto,
    onSuccess: (customer: CustomerModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.customerService
      .create(data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as unknown as CustomerModel);
          } else {
            const msg = res.error ?? 'Failed to create customer.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to create customer.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public updateCustomer(
    id: number,
    data: UpdateCustomerDto,
    onSuccess: (customer: CustomerModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.customerService
      .update(id, data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as unknown as CustomerModel);
          } else {
            const msg = res.error ?? 'Failed to update customer.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to update customer.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public deleteCustomer(
    id: number,
    onSuccess: () => void,
    onError: (message: string) => void
  ): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.customerService
      .delete(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            // Remove from local list immediately for a snappy UI
            this.#customers.update((list) => list.filter((c) => c.id !== id));
            this.#totalCount.update((n) => n - 1);
            onSuccess();
          } else {
            const msg = res.error ?? 'Failed to delete customer.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to delete customer.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public clearSelectedCustomer(): void {
    this.#selectedCustomer.set(null);
  }

  public clearError(): void {
    this.#error.set(null);
  }
}
