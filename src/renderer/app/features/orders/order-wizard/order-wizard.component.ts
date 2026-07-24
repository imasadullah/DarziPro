import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, FormControl } from '@angular/forms';
import { Subject, from } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, finalize, filter, take } from 'rxjs/operators';

import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { CustomerService } from '../../../core/services/customer.service';
import { MeasurementService } from '../../../core/services/measurement.service';
import { OrderStoreService } from '../store/order-store.service';
import {
  GarmentType,
  OrderPriority,
  GARMENT_TYPE_OPTIONS,
  ORDER_PRIORITY_OPTIONS,
  CreateOrderDto,
  UpdateOrderDto,
  isEditable
} from '../models/order.model';
import { CustomerModel } from '../../customers/models/customer.model';
import { MeasurementModel } from '../../measurements/models/measurement.model';
import { getTemplate, getFieldLabel } from '../../measurements/measurement-templates';

@Component({
  selector: 'app-order-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutShellComponent,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatAutocompleteModule
  ],
  templateUrl: './order-wizard.component.html',
  styleUrls: ['./order-wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderWizardComponent implements OnInit, OnDestroy {
  public readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly measurementService = inject(MeasurementService);
  private readonly store = inject(OrderStoreService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // ── Edit Mode ──────────────────────────────────────────────────────────────
  public isEditMode = false;
  public editOrderId: number | null = null;

  // ── State Signals ──────────────────────────────────────────────────────────
  public readonly selectedCustomer = signal<CustomerModel | null>(null);
  public readonly customerSearchResults = signal<CustomerModel[]>([]);
  public readonly customerSearching = signal<boolean>(false);
  public readonly selectedMeasurement = signal<MeasurementModel | null>(null);
  public readonly customerMeasurements = signal<MeasurementModel[]>([]);
  public readonly measurementsLoading = signal<boolean>(false);
  public readonly saving = signal<boolean>(false);
  public readonly savedOrderId = signal<number | null>(null);
  public readonly measurementMode = signal<'existing' | 'none'>('existing');
  public readonly today = new Date();

  // ── Constants ─────────────────────────────────────────────────────────────
  public readonly GARMENT_TYPE_OPTIONS = GARMENT_TYPE_OPTIONS;
  public readonly ORDER_PRIORITY_OPTIONS = ORDER_PRIORITY_OPTIONS;

  // ── Forms ──────────────────────────────────────────────────────────────────
  public customerForm!: FormGroup;
  public garmentForm!: FormGroup;
  public measurementForm!: FormGroup;
  public pricingForm!: FormGroup;
  public deliveryForm!: FormGroup;

  // Computed: customer preselected from query param
  private preselectedCustomerId: number | null = null;

  ngOnInit(): void {
    this.initForms();

    // Check if editing existing order
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      this.isEditMode = true;
      this.editOrderId = Number(id);
      this.loadOrderForEdit(Number(id));
    }

    // Check for pre-selected customer from query params
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    if (customerId && !isNaN(Number(customerId))) {
      this.preselectedCustomerId = Number(customerId);
      this.loadPreselectedCustomer(Number(customerId));
    }

    // Customer search debounce
    this.customerForm.get('customerSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query: string) => {
      if (query && query.length >= 2 && !this.selectedCustomer()) {
        this.searchCustomers(query);
      } else if (!query) {
        this.customerSearchResults.set([]);
      }
    });

    // Auto-calculate remaining amount
    this.pricingForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateRemaining();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.customerForm = this.fb.group({
      customerSearch: ['']
    });

    this.garmentForm = this.fb.group({
      garmentType: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(100)]]
    });

    this.measurementForm = this.fb.group({
      measurementMode: ['existing'],
      measurementId: [null]
    });

    this.pricingForm = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      advanceAmount: [0, [Validators.required, Validators.min(0)]],
      remainingAmount: [{ value: 0, disabled: true }]
    });

    this.deliveryForm = this.fb.group({
      deliveryDate: [null, Validators.required],
      priority: ['normal', Validators.required],
      stitchingNotes: [''],
      fabricNotes: [''],
      specialInstructions: ['']
    });
  }

  // ── Customer Step ──────────────────────────────────────────────────────────

  private searchCustomers(query: string): void {
    this.customerSearching.set(true);
    this.customerService.search(query)
      .pipe(finalize(() => this.customerSearching.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.customerSearchResults.set(res.data as unknown as CustomerModel[]);
          }
          this.cdr.markForCheck();
        }
      });
  }

  private loadPreselectedCustomer(id: number): void {
    this.customerService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.selectCustomer(res.data as unknown as CustomerModel);
          }
          this.cdr.markForCheck();
        }
      });
  }

  selectCustomer(customer: CustomerModel): void {
    this.selectedCustomer.set(customer);
    this.customerForm.get('customerSearch')!.setValue(customer.fullName, { emitEvent: false });
    this.customerSearchResults.set([]);
    this.loadCustomerMeasurements(customer.id);
    this.cdr.markForCheck();
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.customerForm.get('customerSearch')!.setValue('');
    this.customerSearchResults.set([]);
    this.customerMeasurements.set([]);
    this.selectedMeasurement.set(null);
    this.cdr.markForCheck();
  }

  displayCustomerFn(customer: CustomerModel | null): string {
    return customer?.fullName ?? '';
  }

  get isStep1Valid(): boolean {
    return this.selectedCustomer() !== null;
  }

  // ── Garment Step ──────────────────────────────────────────────────────────

  selectGarment(type: GarmentType): void {
    this.garmentForm.patchValue({ garmentType: type });
    // Load matching measurements when garment type changes
    const customer = this.selectedCustomer();
    if (customer) {
      this.loadCustomerMeasurements(customer.id);
    }
    this.cdr.markForCheck();
  }

  get isStep2Valid(): boolean {
    return this.garmentForm.valid;
  }

  // ── Measurement Step ───────────────────────────────────────────────────────

  private loadCustomerMeasurements(customerId: number): void {
    this.measurementsLoading.set(true);
    this.measurementService.getByCustomer(customerId)
      .pipe(finalize(() => this.measurementsLoading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.customerMeasurements.set(res.data.items as unknown as MeasurementModel[]);
          }
          this.cdr.markForCheck();
        }
      });
  }

  selectMeasurement(measurement: MeasurementModel): void {
    this.selectedMeasurement.set(measurement);
    this.measurementForm.patchValue({ measurementId: measurement.id });
    this.cdr.markForCheck();
  }

  clearMeasurement(): void {
    this.selectedMeasurement.set(null);
    this.measurementForm.patchValue({ measurementId: null });
  }

  getTopMeasurementValues(m: MeasurementModel): Array<{ label: string; value: string }> {
    const template = getTemplate(m.measurementType as any);
    const fields = template ? template.fields.slice(0, 4) : [];
    return fields.map((f) => {
      const stored = m.values.find((v) => v.fieldName === f.key);
      return { label: f.label, value: stored?.fieldValue ? `${stored.fieldValue}″` : '—' };
    });
  }

  getMeasurementTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  get isStep3Valid(): boolean {
    return true; // Measurement is optional
  }

  // ── Pricing Step ──────────────────────────────────────────────────────────

  private updateRemaining(): void {
    const total = Number(this.pricingForm.get('totalAmount')!.value ?? 0);
    const advance = Number(this.pricingForm.get('advanceAmount')!.value ?? 0);
    const remaining = Math.max(0, total - advance);
    this.pricingForm.get('remainingAmount')!.setValue(remaining, { emitEvent: false });
    this.cdr.markForCheck();
  }

  get isStep4Valid(): boolean {
    return this.pricingForm.valid;
  }

  // ── Delivery Step ──────────────────────────────────────────────────────────

  get isStep5Valid(): boolean {
    return this.deliveryForm.valid;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submitOrder(): void {
    if (!this.selectedCustomer()) {
      this.snackBar.open('Please select a customer.', 'Dismiss', { duration: 3000 });
      return;
    }

    const deliveryDate = this.deliveryForm.get('deliveryDate')!.value;
    const deliveryDateStr = deliveryDate instanceof Date
      ? deliveryDate.toISOString().split('T')[0]
      : String(deliveryDate);

    const dto: CreateOrderDto = {
      customerId: this.selectedCustomer()!.id,
      measurementId: this.measurementForm.get('measurementId')!.value ?? null,
      garmentType: this.garmentForm.get('garmentType')!.value,
      quantity: Number(this.garmentForm.get('quantity')!.value),
      priority: this.deliveryForm.get('priority')!.value,
      deliveryDate: deliveryDateStr,
      totalAmount: Number(this.pricingForm.get('totalAmount')!.value ?? 0),
      advanceAmount: Number(this.pricingForm.get('advanceAmount')!.value ?? 0),
      stitchingNotes: this.deliveryForm.get('stitchingNotes')!.value,
      fabricNotes: this.deliveryForm.get('fabricNotes')!.value,
      specialInstructions: this.deliveryForm.get('specialInstructions')!.value
    };

    this.saving.set(true);

    if (this.isEditMode && this.editOrderId) {
      const updateDto: UpdateOrderDto = { ...dto };
      this.store.updateOrder(
        this.editOrderId,
        updateDto,
        (order) => {
          this.saving.set(false);
          this.savedOrderId.set(order.id);
          this.snackBar.open(`Order ${order.orderNumber} updated successfully!`, 'View', {
            duration: 4000,
            panelClass: ['snack-success']
          }).onAction().subscribe(() => this.router.navigate(['/orders', order.id]));
          this.cdr.markForCheck();
        },
        (msg) => {
          this.saving.set(false);
          this.snackBar.open(msg, 'Dismiss', { duration: 5000, panelClass: ['snack-error'] });
          this.cdr.markForCheck();
        }
      );
    } else {
      this.store.createOrder(
        dto,
        (order) => {
          this.saving.set(false);
          this.savedOrderId.set(order.id);
          this.snackBar.open(`Order ${order.orderNumber} created!`, 'View', {
            duration: 4000,
            panelClass: ['snack-success']
          });
          this.cdr.markForCheck();
        },
        (msg) => {
          this.saving.set(false);
          this.snackBar.open(msg, 'Dismiss', { duration: 5000, panelClass: ['snack-error'] });
          this.cdr.markForCheck();
        }
      );
    }
  }

  navigateToOrder(): void {
    const id = this.savedOrderId();
    if (id) {
      this.router.navigate(['/orders', id]);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/orders/list']);
  }

  // ── Edit Mode Loader ───────────────────────────────────────────────────────

  private loadOrderForEdit(id: number): void {
    this.store.loadOrderById(id);
    // Use a polling observable that resolves once the selectedOrder signal is populated
    from(new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (this.store.selectedOrder() !== null) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      // Abort after 5 s to avoid leak
      setTimeout(() => clearInterval(check), 5000);
    })).pipe(takeUntil(this.destroy$)).subscribe(() => {
      const order = this.store.selectedOrder();
      if (!order) return;
      if (!isEditable(order.status)) {
        this.snackBar.open(
          `Cannot edit a ${order.status} order.`,
          'Dismiss',
          { duration: 4000 }
        );
        this.router.navigate(['/orders', id]);
        return;
      }
      this.prefillForm(order);
      this.cdr.markForCheck();
    });
  }

  private prefillForm(order: any): void {
    if (order.customer) {
      this.selectedCustomer.set(order.customer);
      this.loadCustomerMeasurements(order.customer.id);
    }
    this.garmentForm.patchValue({
      garmentType: order.garmentType,
      quantity: order.quantity
    });
    this.measurementForm.patchValue({
      measurementId: order.measurementId ?? null
    });
    if (order.measurement) {
      this.selectedMeasurement.set(order.measurement);
    }
    this.pricingForm.patchValue({
      totalAmount: order.totalAmount,
      advanceAmount: order.advanceAmount,
      remainingAmount: order.remainingAmount
    });
    this.deliveryForm.patchValue({
      deliveryDate: new Date(order.deliveryDate),
      priority: order.priority,
      stitchingNotes: order.stitchingNotes ?? '',
      fabricNotes: order.fabricNotes ?? '',
      specialInstructions: order.specialInstructions ?? ''
    });
  }

  // ── Navigation Helpers ────────────────────────────────────────────────────

  /** Called from template when no customer is found — navigate away then open customer form */
  navigateToCreateCustomer(): void {
    this.router.navigate(['/customers/new']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    return `Rs ${Number(amount).toLocaleString('en-PK')}`;
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  get customerSearchControl(): FormControl {
    return this.customerForm.get('customerSearch') as FormControl;
  }
}
