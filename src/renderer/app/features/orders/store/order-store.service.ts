import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import {
  OrderModel,
  OrderStatus,
  OrderStats,
  OrderSearchParams,
  CreateOrderDto,
  UpdateOrderDto,
  PaginatedOrders
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderStoreService {
  private readonly orderService = inject(OrderService);

  // ── Private Writable Signals ────────────────────────────────────────────────
  #orders = signal<OrderModel[]>([]);
  #selectedOrder = signal<OrderModel | null>(null);
  #orderStats = signal<OrderStats | null>(null);
  #loading = signal<boolean>(false);
  #saving = signal<boolean>(false);
  #error = signal<string | null>(null);
  #searchQuery = signal<string>('');
  #statusFilter = signal<OrderStatus | null>(null);
  #garmentTypeFilter = signal<string | null>(null);
  #priorityFilter = signal<string | null>(null);
  #page = signal<number>(1);
  #pageSize = signal<number>(20);
  #totalCount = signal<number>(0);
  #sortBy = signal<'orderDate' | 'deliveryDate' | 'created_at'>('created_at');
  #sortDir = signal<'ASC' | 'DESC'>('DESC');

  // ── Public Read-Only Signals ────────────────────────────────────────────────
  public readonly orders = this.#orders.asReadonly();
  public readonly selectedOrder = this.#selectedOrder.asReadonly();
  public readonly orderStats = this.#orderStats.asReadonly();
  public readonly loading = this.#loading.asReadonly();
  public readonly saving = this.#saving.asReadonly();
  public readonly error = this.#error.asReadonly();
  public readonly searchQuery = this.#searchQuery.asReadonly();
  public readonly statusFilter = this.#statusFilter.asReadonly();
  public readonly garmentTypeFilter = this.#garmentTypeFilter.asReadonly();
  public readonly priorityFilter = this.#priorityFilter.asReadonly();
  public readonly page = this.#page.asReadonly();
  public readonly pageSize = this.#pageSize.asReadonly();
  public readonly totalCount = this.#totalCount.asReadonly();
  public readonly sortBy = this.#sortBy.asReadonly();
  public readonly sortDir = this.#sortDir.asReadonly();

  // ── Computed Signals ────────────────────────────────────────────────────────
  public readonly totalPages = computed(() =>
    Math.ceil(this.#totalCount() / this.#pageSize())
  );

  public readonly hasOrders = computed(() => this.#orders().length > 0);

  /** Group orders by status for Kanban view */
  public readonly ordersByStatus = computed(() => {
    const all = this.#orders();
    const grouped: Record<string, OrderModel[]> = {
      Pending: [],
      Cutting: [],
      Stitching: [],
      'Quality Check': [],
      Ready: [],
      Delivered: [],
      Cancelled: []
    };
    for (const order of all) {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    }
    return grouped;
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

  public loadOrders(params?: OrderSearchParams): void {
    this.#loading.set(true);
    this.#error.set(null);

    const searchParams: OrderSearchParams = {
      search: params?.search ?? (this.#searchQuery() || undefined),
      status: params?.status ?? this.#statusFilter() ?? undefined,
      garmentType: params?.garmentType ?? (this.#garmentTypeFilter() as any) ?? undefined,
      priority: params?.priority ?? (this.#priorityFilter() as any) ?? undefined,
      page: params?.page ?? this.#page(),
      limit: params?.limit ?? this.#pageSize(),
      sortBy: params?.sortBy ?? this.#sortBy(),
      sortDir: params?.sortDir ?? this.#sortDir()
    };

    this.orderService
      .getAll(searchParams)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#orders.set(res.data.items);
            this.#totalCount.set(res.data.total);
            this.#page.set(res.data.page);
          } else {
            this.#error.set(res.error ?? 'Failed to load orders.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load orders.')
      });
  }

  public loadByCustomer(customerId: number, params?: OrderSearchParams): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.orderService
      .getByCustomer(customerId, params)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#orders.set(res.data.items);
            this.#totalCount.set(res.data.total);
          } else {
            this.#error.set(res.error ?? 'Failed to load orders.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load orders.')
      });
  }

  public loadOrderById(id: number): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.#selectedOrder.set(null);

    this.orderService
      .getById(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#selectedOrder.set(res.data as unknown as OrderModel);
          } else {
            this.#error.set(res.error ?? 'Order not found.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Order not found.')
      });
  }

  public loadStats(): void {
    this.orderService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.#orderStats.set(res.data as unknown as OrderStats);
        }
      },
      error: () => { /* silently fail for stats */ }
    });
  }

  public createOrder(
    data: CreateOrderDto,
    onSuccess: (order: OrderModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.orderService
      .create(data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as unknown as OrderModel);
          } else {
            const msg = res.error ?? 'Failed to create order.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to create order.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public updateOrder(
    id: number,
    data: UpdateOrderDto,
    onSuccess: (order: OrderModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.orderService
      .update(id, data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as unknown as OrderModel);
          } else {
            const msg = res.error ?? 'Failed to update order.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to update order.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public deleteOrder(
    id: number,
    onSuccess: () => void,
    onError: (message: string) => void
  ): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.orderService
      .delete(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#orders.update((list) => list.filter((o) => o.id !== id));
            this.#totalCount.update((n) => n - 1);
            onSuccess();
          } else {
            const msg = res.error ?? 'Failed to delete order.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to delete order.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public changeStatus(
    id: number,
    status: OrderStatus,
    onSuccess?: (order: OrderModel) => void,
    onError?: (message: string) => void
  ): void {
    this.orderService.changeStatus(id, status).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const updated = res.data as unknown as OrderModel;
          this.#orders.update((list) =>
            list.map((o) => (o.id === id ? updated : o))
          );
          if (this.#selectedOrder()?.id === id) {
            this.#selectedOrder.set(updated);
          }
          onSuccess?.(updated);
        } else {
          onError?.(res.error ?? 'Failed to change status.');
        }
      },
      error: (err) => onError?.(err.message ?? 'Failed to change status.')
    });
  }

  // ── Filter / Sort / Pagination Actions ──────────────────────────────────────

  public setSearch(query: string): void {
    this.#searchQuery.set(query);
    this.#page.set(1);
    this.loadOrders({ search: query, page: 1 });
  }

  public setStatusFilter(status: OrderStatus | null): void {
    this.#statusFilter.set(status);
    this.#page.set(1);
    this.loadOrders({ page: 1 });
  }

  public setGarmentFilter(garmentType: string | null): void {
    this.#garmentTypeFilter.set(garmentType);
    this.#page.set(1);
    this.loadOrders({ page: 1 });
  }

  public setPriorityFilter(priority: string | null): void {
    this.#priorityFilter.set(priority);
    this.#page.set(1);
    this.loadOrders({ page: 1 });
  }

  public setSort(sortBy: 'orderDate' | 'deliveryDate' | 'created_at', sortDir: 'ASC' | 'DESC'): void {
    this.#sortBy.set(sortBy);
    this.#sortDir.set(sortDir);
    this.loadOrders({ page: 1 });
  }

  public setPage(page: number): void {
    this.#page.set(page);
    this.loadOrders({ page });
  }

  public clearFilters(): void {
    this.#searchQuery.set('');
    this.#statusFilter.set(null);
    this.#garmentTypeFilter.set(null);
    this.#priorityFilter.set(null);
    this.#page.set(1);
    this.loadOrders({ page: 1 });
  }

  public clearSelectedOrder(): void {
    this.#selectedOrder.set(null);
  }

  public clearOrders(): void {
    this.#orders.set([]);
    this.#totalCount.set(0);
  }

  public clearError(): void {
    this.#error.set(null);
  }
}
