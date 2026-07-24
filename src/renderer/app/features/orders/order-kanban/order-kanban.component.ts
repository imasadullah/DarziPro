import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { OrderStoreService } from '../store/order-store.service';
import {
  OrderModel,
  OrderStatus,
  GarmentType,
  getGarmentLabel,
  getGarmentIcon,
  getPriorityColor
} from '../models/order.model';
import { ToastService } from '../../../shared/components/services/toast.service';

interface KanbanColumn {
  status: OrderStatus;
  label: string;
  colorClass: string;
  orders: OrderModel[];
}

@Component({
  selector: 'app-order-kanban',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    LayoutShellComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './order-kanban.component.html',
  styleUrls: ['./order-kanban.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderKanbanComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(OrderStoreService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  public columns: KanbanColumn[] = [
    { status: 'Pending', label: 'Pending', colorClass: 'col-pending', orders: [] },
    { status: 'Cutting', label: 'Cutting', colorClass: 'col-cutting', orders: [] },
    { status: 'Stitching', label: 'Stitching', colorClass: 'col-stitching', orders: [] },
    { status: 'Quality Check', label: 'Quality Check', colorClass: 'col-quality', orders: [] },
    { status: 'Ready', label: 'Ready', colorClass: 'col-ready', orders: [] },
    { status: 'Delivered', label: 'Delivered', colorClass: 'col-delivered', orders: [] }
  ];

  public readonly connectedLists = ['Pending', 'Cutting', 'Stitching', 'Quality Check', 'Ready', 'Delivered'];

  get loading() { return this.store.loading; }
  get error() { return this.store.error; }

  constructor() {
    // Reactively sync the store's orders signal into kanban columns.
    // effect() re-runs automatically whenever store.orders() changes.
    effect(() => {
      const orders = this.store.orders();
      for (const col of this.columns) {
        col.orders = orders.filter((o) => o.status === col.status);
      }
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // Load all non-cancelled orders
    this.store.loadOrders({ limit: 200, sortBy: 'deliveryDate', sortDir: 'ASC' });
  }

  ngOnDestroy(): void {
    this.store.clearOrders();
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  onDrop(event: CdkDragDrop<OrderModel[]>, targetStatus: OrderStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const order: OrderModel = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Persist the status change
      this.store.changeStatus(
        order.id,
        targetStatus,
        (updated) => {
          this.toast.success(`${order.orderNumber} moved to "${targetStatus}"`, 3000)
          this.cdr.markForCheck();
        },
        (msg) => {
          // Revert the move on error
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          this.toast.error(msg, 4000)
          this.cdr.markForCheck();
        }
      );

      this.cdr.markForCheck();
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateToOrder(order: OrderModel): void {
    this.router.navigate(['/orders', order.id]);
  }

  navigateToList(): void {
    this.router.navigate(['/orders/list']);
  }

  navigateToNew(): void {
    this.router.navigate(['/orders/new']);
  }

  // ── Template Helpers ──────────────────────────────────────────────────────

  getGarmentLabel(type: GarmentType): string {
    return getGarmentLabel(type);
  }

  getGarmentIcon(type: GarmentType): string {
    return getGarmentIcon(type);
  }

  getPriorityColor(priority: string): string {
    return getPriorityColor(priority as any);
  }

  isOverdue(order: OrderModel): boolean {
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    return new Date(order.deliveryDate) < new Date(new Date().toDateString());
  }

  isDueToday(order: OrderModel): boolean {
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    return order.deliveryDate === new Date().toISOString().split('T')[0];
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short'
    });
  }

  formatCurrency(amount: number): string {
    return `Rs ${Number(amount).toLocaleString('en-PK')}`;
  }

  getColumnListId(col: KanbanColumn): string {
    return col.status.replace(/ /g, '_');
  }

  getAllListIds(): string[] {
    return this.columns.map((c) => c.status.replace(/ /g, '_'));
  }
}
