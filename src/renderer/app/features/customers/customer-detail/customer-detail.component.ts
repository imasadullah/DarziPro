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
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { CustomerStoreService } from '../store/customer-store.service';
import { MeasurementStoreService } from '../../measurements/store/measurement-store.service';
import { MeasurementService } from '../../../core/services/measurement.service';
import { MeasurementModel } from '../../measurements/models/measurement.model';
import {
  MeasurementType,
  getTemplate,
  getTypeBadgeClass,
  getFieldLabel
} from '../../measurements/measurement-templates';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    LayoutShellComponent,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(CustomerStoreService);
  private readonly measurementStore = inject(MeasurementStoreService);
  private readonly measurementService = inject(MeasurementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  public readonly copyingId = signal<number | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.getCustomerById(id);
      this.measurementStore.loadByCustomer(id);
    } else {
      this.router.navigate(['/customers/list']);
    }
  }

  ngOnDestroy(): void {
    this.store.clearSelectedCustomer();
    this.measurementStore.clearMeasurements();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Customer Store Proxies ────────────────────────────────────────────────────
  get loading() { return this.store.loading; }
  get error() { return this.store.error; }
  get selectedCustomer() { return this.store.selectedCustomer; }

  // ── Measurement Store Proxies ─────────────────────────────────────────────────
  get measurements() { return this.measurementStore.measurements; }
  get measurementsLoading() { return this.measurementStore.loading; }

  // ── Navigation ────────────────────────────────────────────────────────────────
  navigateToEdit(): void {
    const customer = this.store.selectedCustomer();
    if (customer) {
      this.router.navigate(['/customers', customer.id, 'edit']);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/customers/list']);
  }

  navigateToNewMeasurement(): void {
    const customer = this.store.selectedCustomer();
    if (customer) {
      this.router.navigate(['/measurements/new'], {
        queryParams: { customerId: customer.id }
      });
    }
  }

  navigateToMeasurement(id: number): void {
    this.router.navigate(['/measurements', id]);
  }

  // ── Copy Measurement ──────────────────────────────────────────────────────────
  copyMeasurement(measurementId: number): void {
    this.copyingId.set(measurementId);
    const customer = this.store.selectedCustomer();

    this.measurementService
      .copy(measurementId)
      .pipe(
        finalize(() => this.copyingId.set(null)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.snackBar.open('Measurement copied successfully.', 'Dismiss', {
              duration: 3000,
              panelClass: ['snack-success']
            });
            if (customer) {
              this.measurementStore.loadByCustomer(customer.id);
            }
            this.cdr.markForCheck();
          } else {
            this.snackBar.open(res.error ?? 'Failed to copy measurement.', 'Dismiss', {
              duration: 4000,
              panelClass: ['snack-error']
            });
          }
        },
        error: (err) => {
          this.snackBar.open(err.message ?? 'Failed to copy measurement.', 'Dismiss', {
            duration: 4000,
            panelClass: ['snack-error']
          });
        }
      });
  }

  // ── Template Helpers ──────────────────────────────────────────────────────────
  getTypeLabel(type: MeasurementType): string {
    return getTemplate(type)?.label ?? type;
  }

  getTypeIcon(type: MeasurementType): string {
    return getTemplate(type)?.icon ?? 'straighten';
  }

  getTypeBadge(type: MeasurementType): string {
    return getTypeBadgeClass(type);
  }

  getTopValues(m: MeasurementModel): Array<{ label: string; value: string }> {
    const template = getTemplate(m.measurementType);
    const fields = template ? template.fields.slice(0, 4) : [];
    return fields.map((f) => {
      const stored = m.values.find((v) => v.fieldName === f.key);
      return {
        label: f.label,
        value: stored?.fieldValue ? `${stored.fieldValue}″` : '—'
      };
    });
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join('');
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

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
