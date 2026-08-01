import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { PaymentStoreService } from '../store/payment-store.service';
import { OrderStoreService } from '../../orders/store/order-store.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../shared/components/services/toast.service';
import {
  PAYMENT_METHOD_OPTIONS,
  OrderBalanceSummary,
  formatCurrency
} from '../models/payment.model';
import { OrderModel } from '../../orders/models/order.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutShellComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(PaymentStoreService);
  private readonly orderStore = inject(OrderStoreService);
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();

  // ── State ──────────────────────────────────────────────────────────────────
  public readonly isEditMode = signal<boolean>(false);
  public readonly editPaymentId = signal<number | null>(null);
  public readonly selectedOrder = signal<OrderModel | null>(null);
  public readonly orderBalance = signal<OrderBalanceSummary | null>(null);
  public readonly orderSearchResults = signal<OrderModel[]>([]);
  public readonly orderSearchLoading = signal<boolean>(false);
  public readonly showDropdown = signal<boolean>(false);

  public readonly PAYMENT_METHOD_OPTIONS = PAYMENT_METHOD_OPTIONS;

  // ── Form ───────────────────────────────────────────────────────────────────
  public form!: FormGroup;
  // Plain string control — only holds the text the user types.
  // We do NOT store order objects here to avoid Angular Material displayWith conflicts.
  public orderSearchControl = new FormControl<string>('');

  // ── Computed ───────────────────────────────────────────────────────────────
  public readonly remainingBalance = computed(() => this.orderBalance()?.remaining ?? 0);
  public readonly totalAmount = computed(() => this.orderBalance()?.totalAmount ?? 0);
  public readonly totalPaid = computed(() => this.orderBalance()?.totalPaid ?? 0);
  public readonly paymentStatus = computed(() => this.orderBalance()?.status ?? null);
  public readonly hasOrderSelected = computed(() => this.selectedOrder() !== null);

  get saving() { return this.store.saving; }
  get storeError() { return this.store.error; }

  ngOnInit(): void {
    this.buildForm();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isEditMode.set(true);
      this.editPaymentId.set(id);
      this.store.loadPaymentById(id);
      // Wait for payment to load then populate form
      const sub = this.store.selectedPayment;
      const interval = setInterval(() => {
        const p = sub();
        if (p) {
          clearInterval(interval);
          this.populateFormForEdit(p);
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 10000);
    }

    // Pre-fill orderId from query params (navigation from order detail)
    const orderIdParam = Number(this.route.snapshot.queryParamMap.get('orderId'));
    if (orderIdParam) {
      this.loadOrderById(orderIdParam);
    }

    // Order search
    this.orderSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((q) => {
        const query = q?.trim() ?? '';
        if (query.length >= 2) {
          // Clear stale selection if user is typing a new query
          if (this.selectedOrder()) {
            this.selectedOrder.set(null);
            this.orderBalance.set(null);
            this.store.clearOrderBalance();
          }
          this.searchOrders(query);
        } else {
          this.orderSearchResults.set([]);
          this.showDropdown.set(false);
          // If the field is fully cleared, reset selected order
          if (!query && this.selectedOrder()) {
            this.selectedOrder.set(null);
            this.orderBalance.set(null);
            this.store.clearOrderBalance();
          }
        }
      });

  }

  ngOnDestroy(): void {
    this.store.clearSelectedPayment();
    this.store.clearOrderBalance();
    this.store.clearError();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01), this.amountValidator.bind(this)]],
      paymentMethod: ['cash', Validators.required],
      paymentDate: [new Date(), Validators.required],
      notes: ['']
    });
  }

  private amountValidator(control: AbstractControl): ValidationErrors | null {
    const value = Number(control.value);
    if (!value || value <= 0) return null; // Let min validator handle
    const remaining = this.remainingBalance();
    if (remaining > 0 && value > remaining) {
      return { exceedsBalance: { remaining, entered: value } };
    }
    return null;
  }

  private populateFormForEdit(payment: any): void {
    this.form.patchValue({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date(payment.paymentDate),
      notes: payment.notes ?? ''
    });

    if (payment.orderId) {
      this.loadOrderById(payment.orderId);
    }
    this.cdr.markForCheck();
  }

  private loadOrderById(orderId: number): void {
    this.orderService.getById(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success && res.data) {
          const order = res.data as unknown as OrderModel;
          this.selectedOrder.set(order);
          this.form.patchValue({ orderId: order.id });
          // Set the display string in the search field (emitEvent: false
          // prevents the valueChanges subscription from triggering a search)
          this.orderSearchControl.setValue(
            `${order.orderNumber} — ${order.customer?.fullName ?? ''}`,
            { emitEvent: false }
          );
          // Load balance
          this.store.loadOrderBalance(orderId);
          // Sync balance
          const sub = setInterval(() => {
            const b = this.store.orderBalance();
            if (b) {
              clearInterval(sub);
              this.orderBalance.set(b);
              if (!this.isEditMode() && !this.form.get('amount')?.value) {
                this.form.patchValue({ amount: b.remaining });
              }
              this.form.get('amount')?.updateValueAndValidity();
              this.cdr.markForCheck();
            }
          }, 100);
          setTimeout(() => clearInterval(sub), 5000);
        }
        this.cdr.markForCheck();
      });
  }

  private searchOrders(query: string): void {
    this.orderSearchLoading.set(true);
    this.orderService.search(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // Run inside Angular zone to guarantee OnPush change detection fires
          this.ngZone.run(() => {
            this.orderSearchLoading.set(false);
            if (res.success && res.data) {
              // const results = (res.data as unknown as OrderModel[]).filter(
              //   (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
              // );
              const results = (res.data as unknown as OrderModel[]).filter((o) => o.status !== 'Cancelled');
              this.orderSearchResults.set(results);
              this.showDropdown.set(results.length > 0);
            } else {
              this.orderSearchResults.set([]);
              this.showDropdown.set(false);
            }
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.orderSearchLoading.set(false);
            this.orderSearchResults.set([]);
            this.showDropdown.set(false);
          });
        }
      });
  }

  onOrderSelected(order: OrderModel): void {
    this.selectedOrder.set(order);
    // Store the formatted display string (NOT the object) in the control.
    this.orderSearchControl.setValue(
      `${order.orderNumber} — ${order.customer?.fullName ?? ''}`,
      { emitEvent: false }
    );
    this.orderSearchResults.set([]);
    this.showDropdown.set(false);
    this.orderBalance.set(null);
    this.store.loadOrderBalance(order.id);

    // Poll for balance update
    const sub = setInterval(() => {
      const b = this.store.orderBalance();
      if (b) {
        clearInterval(sub);
        this.ngZone.run(() => {
          this.orderBalance.set(b);
          if (!this.isEditMode()) {
            this.form.patchValue({ amount: b.remaining });
          }
          this.form.get('amount')?.updateValueAndValidity();
        });
      }
    }, 100);
    setTimeout(() => clearInterval(sub), 5000);
  }

  closeDropdown(): void {
    // Small delay so click on option registers before blur hides the dropdown
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedOrder()) {
      this.form.markAllAsTouched();
      if (!this.selectedOrder()) {
        this.toast.error('Please select an order first.', 4000);
      }
      return;
    }

    const raw = this.form.getRawValue();
    const paymentDate = raw.paymentDate instanceof Date
      ? raw.paymentDate.toISOString()
      : raw.paymentDate;

    if (this.isEditMode() && this.editPaymentId()) {
      this.store.updatePayment(
        this.editPaymentId()!,
        { amount: Number(raw.amount), paymentMethod: raw.paymentMethod, paymentDate, notes: raw.notes },
        (payment) => {
          this.toast.success(`Payment ${payment.paymentNumber} updated.`, 3000);
          this.router.navigate(['/payments', payment.id]);
        },
        (msg) => {
          this.toast.error(msg, 5000);
          this.cdr.markForCheck();
        }
      );
    } else {
      this.store.createPayment(
        {
          orderId: this.selectedOrder()!.id,
          amount: Number(raw.amount),
          paymentMethod: raw.paymentMethod,
          paymentDate,
          notes: raw.notes
        },
        (payment) => {
          this.toast.success(`Payment ${payment.paymentNumber} recorded successfully!`, 3000);
          this.router.navigate(['/payments', payment.id]);
        },
        (msg) => {
          this.toast.error(msg, 5000);
          this.cdr.markForCheck();
        }
      );
    }
  }

  navigateBack(): void {
    this.router.navigate(['/payments/list']);
  }

  // ── Template Helpers ───────────────────────────────────────────────────────

  formatAmount(amount: number): string {
    return formatCurrency(amount);
  }

  getAmountError(): string {
    const ctrl = this.form.get('amount');
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Amount is required.';
    if (ctrl.errors['min']) return 'Amount must be greater than zero.';
    if (ctrl.errors['exceedsBalance']) {
      return `Amount exceeds remaining balance of ${formatCurrency(ctrl.errors['exceedsBalance'].remaining)}.`;
    }
    return '';
  }

  isFullPayment(): boolean {
    const amount = Number(this.form.get('amount')?.value);
    return amount > 0 && amount === this.remainingBalance();
  }
}
