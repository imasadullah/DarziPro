import {
  Component,
  OnInit,
  OnDestroy,
  inject,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { PaymentStoreService } from '../store/payment-store.service';
import { ToastService } from '../../../shared/components/services/toast.service';
import {
  PaymentModel,
  PaymentMethod,
  PAYMENT_METHOD_OPTIONS,
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  formatCurrency
} from '../models/payment.model';
import { ReceiptService } from '../../../core/services/receipt.service';

@Component({
  selector: 'app-payment-list',
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatCardModule
  ],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(PaymentStoreService);
  private readonly toast = inject(ToastService);
  private readonly receiptService = inject(ReceiptService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  public readonly searchControl = new FormControl('');
  public readonly methodControl = new FormControl<PaymentMethod | ''>('');
  public readonly dateFromControl = new FormControl<Date | null>(null);
  public readonly dateToControl = new FormControl<Date | null>(null);

  public readonly PAYMENT_METHOD_OPTIONS = PAYMENT_METHOD_OPTIONS;
  public readonly displayedColumns = [
    'paymentNumber',
    'orderNumber',
    'customerName',
    'amount',
    'paymentMethod',
    'paymentDate',
    'actions'
  ];

  // ── Store Proxies ─────────────────────────────────────────────────────────
  get payments() { return this.store.payments; }
  get loading() { return this.store.loading; }
  get error() { return this.store.error; }
  get totalCount() { return this.store.totalCount; }
  get page() { return this.store.page; }
  get pageSize() { return this.store.pageSize; }
  get hasPayments() { return this.store.hasPayments; }

  ngOnInit(): void {
    this.store.loadPayments();

    // Debounced search
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.store.setSearch(query ?? '');
        this.cdr.markForCheck();
      });

    // Method filter
    this.methodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((method) => {
        this.store.setMethodFilter(method as PaymentMethod | null);
        this.cdr.markForCheck();
      });

    // Date range filter
    this.dateFromControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyDateRange());

    this.dateToControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyDateRange());
  }

  ngOnDestroy(): void {
    this.store.clearPayments();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyDateRange(): void {
    const from = this.dateFromControl.value
      ? this.toDateString(this.dateFromControl.value)
      : null;
    const to = this.dateToControl.value
      ? this.toDateString(this.dateToControl.value)
      : null;
    this.store.setDateRange(from, to);
    this.cdr.markForCheck();
  }

  private toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateToNew(): void {
    this.router.navigate(['/payments/new']);
  }

  navigateToDetail(payment: PaymentModel): void {
    this.router.navigate(['/payments', payment.id]);
  }

  navigateToEdit(payment: PaymentModel): void {
    this.router.navigate(['/payments', payment.id, 'edit']);
  }

  navigateToOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  deletePayment(payment: PaymentModel, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete payment ${payment.paymentNumber}? This will restore the order balance.`)) {
      return;
    }
    this.store.deletePayment(
      payment.id,
      () => {
        this.toast.success(`Payment ${payment.paymentNumber} deleted.`, 3000);
        this.cdr.markForCheck();
      },
      (msg) => {
        this.toast.error(msg, 4000);
        this.cdr.markForCheck();
      }
    );
  }

  printPaymentReceipt(payment: PaymentModel, event: Event): void {
    event.stopPropagation();
    this.receiptService.printPaymentReceipt(payment.id);
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex + 1);
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.methodControl.setValue('', { emitEvent: false });
    this.dateFromControl.setValue(null, { emitEvent: false });
    this.dateToControl.setValue(null, { emitEvent: false });
    this.store.clearFilters();
    this.cdr.markForCheck();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getMethodLabel(method: PaymentMethod): string {
    return getPaymentMethodLabel(method);
  }

  getMethodIcon(method: PaymentMethod): string {
    return getPaymentMethodIcon(method);
  }

  formatAmount(amount: number): string {
    return formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  trackByPayment(_: number, p: PaymentModel): number {
    return p.id;
  }
}
