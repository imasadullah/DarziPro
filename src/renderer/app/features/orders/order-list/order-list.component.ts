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

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
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

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutShellComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  public readonly store = inject(OrderStoreService);
  private readonly toast = inject(ToastService);
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

  // ── Filters ───────────────────────────────────────────────────────────────

  setStatusFilter(status: OrderStatus | null): void {
    this.store.setStatusFilter(status);
  }

  setGarmentFilter(garmentType: GarmentType | null): void {
    this.store.setGarmentFilter(garmentType);
  }

  setPriorityFilter(priority: OrderPriority | null): void {
    this.store.setPriorityFilter(priority);
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

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex + 1);
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
