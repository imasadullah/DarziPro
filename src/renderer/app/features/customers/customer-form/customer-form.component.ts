import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { CustomerStoreService } from '../store/customer-store.service';

@Component({
  selector: 'app-customer-form',
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
    MatCardModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(CustomerStoreService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  public readonly isEditMode = signal<boolean>(false);
  public readonly customerId = signal<number | null>(null);
  public readonly pageTitle = signal<string>('Add Customer');
  public readonly serverError = signal<string | null>(null);

  public form!: FormGroup;

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.isEditMode.set(true);
      this.customerId.set(id);
      this.pageTitle.set('Edit Customer');
      this.loadCustomerForEdit(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.clearSelectedCustomer();
  }

  private initForm(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9+\-\s()]{7,20}$/)
        ]
      ],
      address: ['', [Validators.maxLength(300)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  private loadCustomerForEdit(id: number): void {
    this.store.getCustomerById(id);
    // Patch form when data arrives via the store signal
    const interval = setInterval(() => {
      const customer = this.store.selectedCustomer();
      if (customer) {
        clearInterval(interval);
        this.form.patchValue({
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          address: customer.address ?? '',
          notes: customer.notes ?? ''
        });
      }
    }, 50);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    const formValue = this.form.getRawValue();

    if (this.isEditMode() && this.customerId()) {
      this.store.updateCustomer(
        this.customerId()!,
        formValue,
        (customer) => {
          this.snackBar.open(
            `${customer.fullName} updated successfully.`,
            'Dismiss',
            { duration: 3000, panelClass: ['snack-success'] }
          );
          this.router.navigate(['/customers', customer.id]);
        },
        (msg) => this.serverError.set(msg)
      );
    } else {
      console.log("Form value: ", formValue);

      this.store.createCustomer(
        formValue,
        (customer) => {
          this.snackBar.open(
            `${customer.fullName} (${customer.customerCode}) added successfully.`,
            'Dismiss',
            { duration: 3000, panelClass: ['snack-success'] }
          );
          this.router.navigate(['/customers/list']);
        },
        (msg) => this.serverError.set(msg)
      );
    }
  }

  onCancel(): void {
    if (this.isEditMode() && this.customerId()) {
      this.router.navigate(['/customers', this.customerId()]);
    } else {
      this.router.navigate(['/customers/list']);
    }
  }

  getFieldError(fieldName: string): string | null {
    const control: AbstractControl | null = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return null;

    if (control.errors['required']) return `${this.getLabel(fieldName)} is required.`;
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters.`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters.`;
    if (control.errors['pattern']) return 'Enter a valid phone number.';

    return null;
  }

  private getLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      address: 'Address',
      notes: 'Notes'
    };
    return labels[fieldName] ?? fieldName;
  }

  get isSaving(): boolean {
    return this.store.saving();
  }

  get isLoadingCustomer(): boolean {
    return this.store.loading();
  }
}
