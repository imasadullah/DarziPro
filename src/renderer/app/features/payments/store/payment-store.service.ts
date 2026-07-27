import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PaymentService } from '../../../core/services/payment.service';
import {
  PaymentModel,
  PaymentStats,
  PaymentSearchParams,
  OrderBalanceSummary,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaginatedPayments,
  derivePaymentStatus,
  PaymentMethod
} from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentStoreService {
  private readonly paymentService = inject(PaymentService);

  // ── Private Writable Signals ────────────────────────────────────────────────
  #payments = signal<PaymentModel[]>([]);
  #selectedPayment = signal<PaymentModel | null>(null);
  #orderBalance = signal<OrderBalanceSummary | null>(null);
  #stats = signal<PaymentStats | null>(null);
  #loading = signal<boolean>(false);
  #saving = signal<boolean>(false);
  #error = signal<string | null>(null);
  #searchQuery = signal<string>('');
  #methodFilter = signal<PaymentMethod | null>(null);
  #dateFrom = signal<string | null>(null);
  #dateTo = signal<string | null>(null);
  #page = signal<number>(1);
  #pageSize = signal<number>(20);
  #totalCount = signal<number>(0);
  #sortBy = signal<'paymentDate' | 'amount' | 'created_at'>('paymentDate');
  #sortDir = signal<'ASC' | 'DESC'>('DESC');

  // ── Public Read-Only Signals ────────────────────────────────────────────────
  public readonly payments = this.#payments.asReadonly();
  public readonly selectedPayment = this.#selectedPayment.asReadonly();
  public readonly orderBalance = this.#orderBalance.asReadonly();
  public readonly stats = this.#stats.asReadonly();
  public readonly loading = this.#loading.asReadonly();
  public readonly saving = this.#saving.asReadonly();
  public readonly error = this.#error.asReadonly();
  public readonly searchQuery = this.#searchQuery.asReadonly();
  public readonly methodFilter = this.#methodFilter.asReadonly();
  public readonly dateFrom = this.#dateFrom.asReadonly();
  public readonly dateTo = this.#dateTo.asReadonly();
  public readonly page = this.#page.asReadonly();
  public readonly pageSize = this.#pageSize.asReadonly();
  public readonly totalCount = this.#totalCount.asReadonly();
  public readonly sortBy = this.#sortBy.asReadonly();
  public readonly sortDir = this.#sortDir.asReadonly();

  // ── Computed Signals ────────────────────────────────────────────────────────
  public readonly totalPages = computed(() =>
    Math.ceil(this.#totalCount() / this.#pageSize())
  );

  public readonly hasPayments = computed(() => this.#payments().length > 0);

  /** Derives payment status from the current order balance summary */
  public readonly paymentStatus = computed(() => {
    const balance = this.#orderBalance();
    if (!balance) return null;
    return derivePaymentStatus(balance.totalAmount, balance.totalPaid);
  });

  /** Total paid for the currently-viewed order */
  public readonly totalPaidForOrder = computed(() => this.#orderBalance()?.totalPaid ?? 0);

  /** Remaining balance for the currently-viewed order */
  public readonly remainingForOrder = computed(() => this.#orderBalance()?.remaining ?? 0);

  // ── Actions ─────────────────────────────────────────────────────────────────

  public loadPayments(params?: PaymentSearchParams): void {
    this.#loading.set(true);
    this.#error.set(null);

    const searchParams: PaymentSearchParams = {
      search: params?.search ?? (this.#searchQuery() || undefined),
      paymentMethod: params?.paymentMethod ?? this.#methodFilter() ?? undefined,
      dateFrom: params?.dateFrom ?? this.#dateFrom() ?? undefined,
      dateTo: params?.dateTo ?? this.#dateTo() ?? undefined,
      page: params?.page ?? this.#page(),
      limit: params?.limit ?? this.#pageSize(),
      sortBy: params?.sortBy ?? this.#sortBy(),
      sortDir: params?.sortDir ?? this.#sortDir()
    };

    this.paymentService
      .getAll(searchParams)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#payments.set(res.data.items as PaymentModel[]);
            this.#totalCount.set(res.data.total);
            this.#page.set(res.data.page);
          } else {
            this.#error.set(res.error ?? 'Failed to load payments.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load payments.')
      });
  }

  public loadByOrder(orderId: number): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.paymentService
      .getByOrder(orderId)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#payments.set(res.data as PaymentModel[]);
            this.#totalCount.set((res.data as PaymentModel[]).length);
          } else {
            this.#error.set(res.error ?? 'Failed to load payments.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load payments.')
      });
  }

  public loadByCustomer(customerId: number, params?: PaymentSearchParams): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.paymentService
      .getByCustomer(customerId, params)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#payments.set(res.data.items as PaymentModel[]);
            this.#totalCount.set(res.data.total);
          } else {
            this.#error.set(res.error ?? 'Failed to load payments.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load payments.')
      });
  }

  public loadPaymentById(id: number): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.#selectedPayment.set(null);

    this.paymentService
      .getById(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#selectedPayment.set(res.data as PaymentModel);
          } else {
            this.#error.set(res.error ?? 'Payment not found.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Payment not found.')
      });
  }

  public loadStats(): void {
    this.paymentService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.#stats.set(res.data as PaymentStats);
        }
      },
      error: () => { /* silently fail for stats */ }
    });
  }

  public loadOrderBalance(orderId: number): void {
    this.paymentService.calculateBalance(orderId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.#orderBalance.set(res.data as OrderBalanceSummary);
        }
      },
      error: () => { /* silently fail for balance */ }
    });
  }

  public createPayment(
    data: CreatePaymentDto,
    onSuccess: (payment: PaymentModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.paymentService
      .create(data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as PaymentModel);
          } else {
            const msg = res.error ?? 'Failed to create payment.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to create payment.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public updatePayment(
    id: number,
    data: UpdatePaymentDto,
    onSuccess: (payment: PaymentModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.paymentService
      .update(id, data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as PaymentModel);
          } else {
            const msg = res.error ?? 'Failed to update payment.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to update payment.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public deletePayment(
    id: number,
    onSuccess: () => void,
    onError: (message: string) => void
  ): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.paymentService
      .delete(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#payments.update((list) => list.filter((p) => p.id !== id));
            this.#totalCount.update((n) => n - 1);
            onSuccess();
          } else {
            const msg = res.error ?? 'Failed to delete payment.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to delete payment.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  // ── Filter / Sort / Pagination ───────────────────────────────────────────────

  public setSearch(query: string): void {
    this.#searchQuery.set(query);
    this.#page.set(1);
    this.loadPayments({ search: query, page: 1 });
  }

  public setMethodFilter(method: PaymentMethod | null): void {
    this.#methodFilter.set(method);
    this.#page.set(1);
    this.loadPayments({ page: 1 });
  }

  public setDateRange(from: string | null, to: string | null): void {
    this.#dateFrom.set(from);
    this.#dateTo.set(to);
    this.#page.set(1);
    this.loadPayments({ page: 1 });
  }

  public setSort(
    sortBy: 'paymentDate' | 'amount' | 'created_at',
    sortDir: 'ASC' | 'DESC'
  ): void {
    this.#sortBy.set(sortBy);
    this.#sortDir.set(sortDir);
    this.loadPayments({ page: 1 });
  }

  public setPage(page: number): void {
    this.#page.set(page);
    this.loadPayments({ page });
  }

  public clearFilters(): void {
    this.#searchQuery.set('');
    this.#methodFilter.set(null);
    this.#dateFrom.set(null);
    this.#dateTo.set(null);
    this.#page.set(1);
    this.loadPayments({ page: 1 });
  }

  public clearSelectedPayment(): void {
    this.#selectedPayment.set(null);
  }

  public clearOrderBalance(): void {
    this.#orderBalance.set(null);
  }

  public clearPayments(): void {
    this.#payments.set([]);
    this.#totalCount.set(0);
  }

  public clearError(): void {
    this.#error.set(null);
  }
}
