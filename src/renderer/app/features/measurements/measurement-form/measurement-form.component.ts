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
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { MeasurementStoreService } from '../store/measurement-store.service';
import { MeasurementService } from '../../../core/services/measurement.service';
import { CustomerService } from '../../../core/services/customer.service';
import {
  MEASUREMENT_TEMPLATES,
  MeasurementTemplate,
  MeasurementType,
  getTemplate
} from '../measurement-templates';
import { MeasurementModel, MeasurementValueDto } from '../models/measurement.model';

/** Validator: must be a non-negative number */
function nonNegativeNumber(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) return null;
  const val = parseFloat(control.value);
  if (isNaN(val)) return { notANumber: true };
  if (val < 0) return { negative: true };
  return null;
}

@Component({
  selector: 'app-measurement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutShellComponent,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './measurement-form.component.html',
  styleUrls: ['./measurement-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(MeasurementStoreService);
  private readonly measurementService = inject(MeasurementService);
  private readonly customerService = inject(CustomerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  public readonly isEditMode = signal<boolean>(false);
  public readonly measurementId = signal<number | null>(null);
  public readonly pageTitle = signal<string>('New Measurement');
  public readonly serverError = signal<string | null>(null);
  public readonly customerSearchResults = signal<Customer[]>([]);
  public readonly selectedCustomer = signal<Customer | null>(null);
  public readonly selectedTemplate = signal<MeasurementTemplate | null>(null);

  public readonly templates = MEASUREMENT_TEMPLATES;

  public form!: FormGroup;
  public customerSearchQuery = '';

  private customerSearchSubject = new Subject<string>();

  // ── Computed ──────────────────────────────────────────────────────────────────
  public get isSaving(): boolean {
    return this.store.saving();
  }

  public get isLoading(): boolean {
    return this.store.loading();
  }

  public get valueControls(): AbstractControl[] {
    return this.valuesArray.controls;
  }

  private get valuesArray(): FormArray {
    return this.form.get('values') as FormArray;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.setupCustomerSearch();

    // Check for pre-selected customerId via query params (from Customer Detail page)
    const qCustomerId = this.route.snapshot.queryParamMap.get('customerId');
    if (qCustomerId) {
      this.loadCustomerById(Number(qCustomerId));
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.isEditMode.set(true);
      this.measurementId.set(id);
      this.pageTitle.set('Edit Measurement');
      this.loadForEdit(id);
    }
  }

  ngOnDestroy(): void {
    this.store.clearSelectedMeasurement();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form Initialization ───────────────────────────────────────────────────────
  private initForm(): void {
    this.form = this.fb.group({
      customerId: [null, Validators.required],
      customerSearch: [''],
      measurementType: [null, Validators.required],
      notes: ['', Validators.maxLength(1000)],
      fabricNotes: ['', Validators.maxLength(1000)],
      stitchingInstructions: ['', Validators.maxLength(1000)],
      values: this.fb.array([])
    });
  }

  private setupCustomerSearch(): void {
    this.customerSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      if (query.length < 2) {
        this.customerSearchResults.set([]);
        return;
      }
      this.customerService.search(query).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.customerSearchResults.set(res.data);
            this.cdr.markForCheck();
          }
        }
      });
    });
  }

  private loadCustomerById(id: number): void {
    this.customerService.getById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectCustomer(res.data);
          this.cdr.markForCheck();
        }
      }
    });
  }

  private loadForEdit(id: number): void {
    this.store.getMeasurementById(id);

    const interval = setInterval(() => {
      const m = this.store.selectedMeasurement();
      if (m) {
        clearInterval(interval);
        this.populateFormFromMeasurement(m);
      }
    }, 50);
  }

  private populateFormFromMeasurement(m: MeasurementModel): void {
    this.form.patchValue({
      customerId: m.customerId,
      measurementType: m.measurementType,
      notes: m.notes ?? '',
      fabricNotes: m.fabricNotes ?? '',
      stitchingInstructions: m.stitchingInstructions ?? ''
    });

    this.onTypeSelect(m.measurementType, m.values);
    this.loadCustomerById(m.customerId);
    this.cdr.markForCheck();
  }

  // ── Customer Selection ────────────────────────────────────────────────────────
  onCustomerSearchInput(query: string): void {
    this.customerSearchQuery = query;
    this.customerSearchSubject.next(query);
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.form.patchValue({
      customerId: customer.id,
      customerSearch: `${customer.fullName} — ${customer.phoneNumber}`
    });
    this.customerSearchResults.set([]);
    this.cdr.markForCheck();
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.form.patchValue({ customerId: null, customerSearch: '' });
    this.customerSearchResults.set([]);
  }

  displayCustomer(customer: Customer): string {
    return customer ? `${customer.fullName} — ${customer.phoneNumber}` : '';
  }

  // ── Type Selection ────────────────────────────────────────────────────────────
  onTypeSelect(
    type: MeasurementType,
    existingValues?: Array<{ fieldName: string; fieldValue?: string }>
  ): void {
    const template = getTemplate(type);
    this.selectedTemplate.set(template ?? null);
    this.form.patchValue({ measurementType: type });

    // Rebuild the values FormArray from the template
    this.valuesArray.clear();

    if (type === 'custom') {
      // For custom type, start with one empty user-defined field
      if (existingValues && existingValues.length > 0) {
        existingValues.forEach((v) => this.addCustomField(v.fieldName, v.fieldValue));
      } else {
        this.addCustomField();
      }
    } else if (template) {
      template.fields.forEach((field) => {
        const existing = existingValues?.find((v) => v.fieldName === field.key);
        this.valuesArray.push(
          this.fb.group({
            fieldName: [field.key],
            fieldLabel: [field.label],
            fieldUnit: [field.unit],
            fieldValue: [
              existing?.fieldValue ?? '',
              [nonNegativeNumber, Validators.maxLength(10)]
            ]
          })
        );
      });
    }

    this.cdr.markForCheck();
  }

  // ── Custom Fields (for 'custom' type) ────────────────────────────────────────
  addCustomField(name = '', value = ''): void {
    this.valuesArray.push(
      this.fb.group({
        fieldName: [name, [Validators.required, Validators.maxLength(50)]],
        fieldLabel: ['Custom Field'],
        fieldUnit: ['in'],
        fieldValue: [value, [nonNegativeNumber, Validators.maxLength(10)]]
      })
    );
    this.cdr.markForCheck();
  }

  removeCustomField(index: number): void {
    this.valuesArray.removeAt(index);
    this.cdr.markForCheck();
  }

  isCustomType(): boolean {
    return this.form.get('measurementType')?.value === 'custom';
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.serverError.set(null);
    const raw = this.form.getRawValue();

    const values: MeasurementValueDto[] = (raw.values as any[]).map((v) => ({
      fieldName: v.fieldName,
      fieldValue: v.fieldValue?.toString() ?? undefined
    }));

    if (this.isEditMode() && this.measurementId()) {
      this.store.updateMeasurement(
        this.measurementId()!,
        {
          notes: raw.notes || undefined,
          fabricNotes: raw.fabricNotes || undefined,
          stitchingInstructions: raw.stitchingInstructions || undefined,
          values
        },
        (m) => {
          this.snackBar.open('Measurement updated successfully.', 'Dismiss', {
            duration: 3000,
            panelClass: ['snack-success']
          });
          this.router.navigate(['/measurements', m.id]);
        },
        (msg) => {
          this.serverError.set(msg);
          this.cdr.markForCheck();
        }
      );
    } else {
      this.store.createMeasurement(
        {
          customerId: raw.customerId,
          measurementType: raw.measurementType,
          notes: raw.notes || undefined,
          fabricNotes: raw.fabricNotes || undefined,
          stitchingInstructions: raw.stitchingInstructions || undefined,
          values
        },
        (m) => {
          this.snackBar.open('Measurement saved successfully.', 'Dismiss', {
            duration: 3000,
            panelClass: ['snack-success']
          });
          this.router.navigate(['/measurements', m.id]);
        },
        (msg) => {
          this.serverError.set(msg);
          this.cdr.markForCheck();
        }
      );
    }
  }

  onCancel(): void {
    if (this.isEditMode() && this.measurementId()) {
      this.router.navigate(['/measurements', this.measurementId()]);
    } else {
      this.router.navigate(['/measurements/list']);
    }
  }

  // ── Error Helpers ─────────────────────────────────────────────────────────────
  getValueError(control: AbstractControl): string | null {
    if (!control.errors || !control.touched) return null;
    if (control.errors['notANumber']) return 'Must be a number.';
    if (control.errors['negative']) return 'Cannot be negative.';
    if (control.errors['maxlength']) return 'Value too long.';
    return null;
  }

  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return null;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters.`;
    }
    return null;
  }
}
