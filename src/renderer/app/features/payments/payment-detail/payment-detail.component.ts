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

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { PaymentStoreService } from '../store/payment-store.service';
import { ToastService } from '../../../shared/components/services/toast.service';
import { ReceiptService } from '../../../core/services/receipt.service';
import {
  PaymentMethod,
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  derivePaymentStatus,
  getPaymentStatusClass,
  formatCurrency
} from '../models/payment.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    CommonModule,
    LayoutShellComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(PaymentStoreService);
  private readonly receiptService = inject(ReceiptService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  get loading() { return this.store.loading; }
  get error() { return this.store.error; }
  get payment() { return this.store.selectedPayment; }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.loadPaymentById(id);
    } else {
      this.router.navigate(['/payments/list']);
    }
  }

  ngOnDestroy(): void {
    this.store.clearSelectedPayment();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateBack(): void {
    this.router.navigate(['/payments/list']);
  }

  navigateToEdit(): void {
    const p = this.payment();
    if (p) this.router.navigate(['/payments', p.id, 'edit']);
  }

  navigateToOrder(): void {
    const p = this.payment();
    if (p?.orderId) this.router.navigate(['/orders', p.orderId]);
  }

  navigateToCustomer(): void {
    const p = this.payment();
    if (p?.customerId) this.router.navigate(['/customers', p.customerId]);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  deletePayment(): void {
    const p = this.payment();
    if (!p) return;
    if (!confirm(`Delete payment ${p.paymentNumber}? This will restore the order balance.`)) return;

    this.store.deletePayment(
      p.id,
      () => {
        this.toast.success(`Payment ${p.paymentNumber} deleted.`, 3000);
        this.router.navigate(['/payments/list']);
      },
      (msg) => {
        this.toast.error(msg, 4000);
        this.cdr.markForCheck();
      }
    );
  }

  printReceipt(): void {
    const p = this.payment();
    if (!p) return;
    this.receiptService.printPaymentReceipt(p.id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getMethodLabel(method: PaymentMethod): string {
    return getPaymentMethodLabel(method);
  }

  getMethodIcon(method: PaymentMethod): string {
    return getPaymentMethodIcon(method);
  }

  getPaymentStatus(): string {
    const p = this.payment();
    if (!p?.order) return 'Unknown';
    return derivePaymentStatus(
      Number(p.order.totalAmount),
      Number(p.order.totalAmount) - Number(p.order.remainingAmount)
    );
  }

  getStatusClass(): string {
    return getPaymentStatusClass(this.getPaymentStatus() as any);
  }

  formatAmount(amount: number): string {
    return formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');
  }
}
