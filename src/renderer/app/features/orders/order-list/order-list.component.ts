import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { SearchBarComponent } from '../../../shared/ui/search-bar/search-bar';
import { PaginatorComponent } from '../../../shared/ui/paginator/paginator';


import { OrderStoreService } from '../store/order-store.service';
import {
  OrderModel,
  OrderStatus,
  GarmentType,
  OrderPriority,
  ORDER_STATUSES,
  GARMENT_TYPE_OPTIONS,
  ORDER_PRIORITY_OPTIONS,
  getGarmentLabel,
  getStatusColor,
  getPriorityColor
} from '../models/order.model';
import { ToastService } from '../../../shared/components/services/toast.service';
import { ReceiptService } from '../../../core/services/receipt.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutShellComponent,
    PageHeaderComponent,
    SearchBarComponent,
    PaginatorComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  public readonly store = inject(OrderStoreService);
  private readonly toast = inject(ToastService);
  private readonly receiptService = inject(ReceiptService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  public readonly searchControl = new FormControl('');
  public readonly viewMode = signal<'table' | 'kanban'>('table');
  public readonly deletingId = signal<number | null>(null);

  // Constants for template
  public readonly ORDER_STATUSES = ORDER_STATUSES;
  public readonly GARMENT_TYPE_OPTIONS = GARMENT_TYPE_OPTIONS;
  public readonly ORDER_PRIORITY_OPTIONS = ORDER_PRIORITY_OPTIONS;
  public readonly displayedColumns = [
    'orderNumber', 'customer', 'garmentType', 'quantity',
    'status', 'deliveryDate', 'remaining', 'actions'
  ];

  // Store proxies
  get orders() { return this.store.orders; }
  get loading() { return this.store.loading; }
  get error() { return this.store.error; }
  get totalCount() { return this.store.totalCount; }
  get page() { return this.store.page; }
  get pageSize() { return this.store.pageSize; }
  get statusFilter() { return this.store.statusFilter; }
  get garmentTypeFilter() { return this.store.garmentTypeFilter; }
  get priorityFilter() { return this.store.priorityFilter; }

  ngOnInit(): void {
    this.store.loadOrders();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      this.store.setSearch(query ?? '');
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.store.clearOrders();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateToNew(): void {
    this.router.navigate(['/orders/new']);
  }

  navigateToDetail(order: OrderModel): void {
    this.router.navigate(['/orders', order.id]);
  }

  navigateToEdit(order: OrderModel, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/orders', order.id, 'edit']);
  }

  navigateToKanban(): void {
    this.router.navigate(['/orders/kanban']);
  }

  onSearch(query: string): void {
    this.store.setSearch(query);
    this.cdr.markForCheck();
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  setStatusFilter(status: OrderStatus | null): void {
    this.store.setStatusFilter(status);
  }

  onSetStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value ?? '';
    this.setStatusFilter((value || null) as OrderStatus | null);
  }

  setGarmentFilter(garmentType: GarmentType | null): void {
    this.store.setGarmentFilter(garmentType);
  }

  onSetGarmentFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value ?? '';
    this.setGarmentFilter((value || null) as GarmentType | null);
  }

  setPriorityFilter(priority: OrderPriority | null): void {
    this.store.setPriorityFilter(priority);
  }

  onPriorityFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value ?? '';
    this.setPriorityFilter((value || null) as OrderPriority | null);
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.store.clearFilters();
  }

  setSort(sortBy: 'orderDate' | 'deliveryDate' | 'created_at'): void {
    const currentDir = this.store.sortDir();
    const newDir = currentDir === 'ASC' ? 'DESC' : 'ASC';
    this.store.setSort(sortBy, newDir);
  }

  onPageChange(newPage: number): void {
    this.store.setPage(newPage);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  deleteOrder(order: OrderModel, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;

    this.deletingId.set(order.id);
    this.store.deleteOrder(
      order.id,
      () => {
        this.deletingId.set(null);
        this.toast.success(`Order ${order.orderNumber} deleted.`, 3000);
        this.cdr.markForCheck();
      },
      (msg) => {
        this.deletingId.set(null);
        this.toast.error(msg, 4000);
        this.cdr.markForCheck();
      }
    );
  }

  printOrderReceipt(order: OrderModel, event: Event): void {
    event.stopPropagation();
    this.receiptService.printOrderReceipt(order.id);
  }

  // ── Template Helpers ──────────────────────────────────────────────────────

  getGarmentLabel(type: GarmentType): string {
    return getGarmentLabel(type);
  }

  getStatusColor(status: OrderStatus): string {
    return getStatusColor(status);
  }

  getPriorityColor(priority: OrderPriority): string {
    return getPriorityColor(priority);
  }

  isOverdue(order: OrderModel): boolean {
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    return new Date(order.deliveryDate) < new Date(new Date().toDateString());
  }

  isDueToday(order: OrderModel): boolean {
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    const today = new Date().toISOString().split('T')[0];
    return order.deliveryDate === today;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `Rs ${Number(amount).toLocaleString('en-PK')}`;
  }

  trackByOrder(_: number, order: OrderModel): number {
    return order.id;
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.store.statusFilter() ||
      this.store.garmentTypeFilter() ||
      this.store.priorityFilter()
    );
  }
}
