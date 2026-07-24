import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { OrderStoreService } from '../store/order-store.service';
import {
  OrderStatus,
  STATUS_TIMELINE,
  GarmentType,
  getGarmentLabel,
  getGarmentIcon,
  getStatusColor,
  getPriorityColor,
  isEditable
} from '../models/order.model';
import { getTemplate } from '../../measurements/measurement-templates';
import { ToastService } from '../../../shared/components/services/toast.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    LayoutShellComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(OrderStoreService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Timeline statuses (excludes Cancelled)
  public readonly STATUS_TIMELINE = STATUS_TIMELINE;

  // Status options for quick menu (next statuses)
  public readonly ALL_STATUSES: OrderStatus[] = [
    'Pending', 'Cutting', 'Stitching', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'
  ];

  get loading() { return this.store.loading; }
  get error() { return this.store.error; }
  get order() { return this.store.selectedOrder; }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.loadOrderById(id);
    } else {
      this.router.navigate(['/orders/list']);
    }
  }

  ngOnDestroy(): void {
    this.store.clearSelectedOrder();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateBack(): void {
    this.router.navigate(['/orders/list']);
  }

  navigateToEdit(): void {
    const o = this.order();
    if (o) this.router.navigate(['/orders', o.id, 'edit']);
  }

  navigateToCustomer(): void {
    const o = this.order();
    if (o?.customer) this.router.navigate(['/customers', o.customer.id]);
  }

  // ── Status Management ─────────────────────────────────────────────────────

  changeStatus(status: OrderStatus): void {
    const o = this.order();
    if (!o) return;

    this.store.changeStatus(
      o.id,
      status,
      (updated) => {
        this.toast.success(`Status updated to "${status}"`, 3000)
        this.cdr.markForCheck();
      },
      (msg) => {
        this.toast.error(msg, 4000)
      }
    );
  }

  cancelOrder(): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    this.changeStatus('Cancelled');
  }

  // ── Template Helpers ──────────────────────────────────────────────────────

  getTimelineStep(status: OrderStatus): number {
    return STATUS_TIMELINE.indexOf(status);
  }

  getCurrentStep(): number {
    const o = this.order();
    if (!o) return 0;
    return STATUS_TIMELINE.indexOf(o.status);
  }

  isStepCompleted(stepStatus: OrderStatus): boolean {
    const currentStep = this.getCurrentStep();
    const stepIndex = STATUS_TIMELINE.indexOf(stepStatus);
    return stepIndex < currentStep;
  }

  isStepActive(stepStatus: OrderStatus): boolean {
    return this.order()?.status === stepStatus;
  }

  canAdvanceTo(status: OrderStatus): boolean {
    const o = this.order();
    if (!o || o.status === 'Delivered' || o.status === 'Cancelled') return false;
    const currentIdx = STATUS_TIMELINE.indexOf(o.status);
    const targetIdx = STATUS_TIMELINE.indexOf(status);
    return targetIdx === currentIdx + 1;
  }

  getGarmentLabel(type: GarmentType): string {
    return getGarmentLabel(type);
  }

  getGarmentIcon(type: GarmentType): string {
    return getGarmentIcon(type);
  }

  getStatusColor(status: OrderStatus): string {
    return getStatusColor(status);
  }

  getPriorityColor(priority: string): string {
    return getPriorityColor(priority as any);
  }

  isEditable(status: OrderStatus): boolean {
    return isEditable(status);
  }

  getMeasurementValues(): Array<{ label: string; value: string }> {
    const o = this.order();
    if (!o?.measurement?.values) return [];
    const template = getTemplate(o.measurement.measurementType as any);
    if (!template) return [];
    return template.fields.map((f) => {
      const stored = o.measurement!.values.find((v) => v.fieldName === f.key);
      return { label: f.label, value: stored?.fieldValue ? `${stored.fieldValue}″` : '—' };
    });
  }

  getMeasurementTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `Rs ${Number(amount).toLocaleString('en-PK')}`;
  }

  isOverdue(): boolean {
    const o = this.order();
    if (!o || o.status === 'Delivered' || o.status === 'Cancelled') return false;
    return new Date(o.deliveryDate) < new Date(new Date().toDateString());
  }

  isDueToday(): boolean {
    const o = this.order();
    if (!o || o.status === 'Delivered' || o.status === 'Cancelled') return false;
    return o.deliveryDate === new Date().toISOString().split('T')[0];
  }
}
