import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { MeasurementStoreService } from '../store/measurement-store.service';
import { MeasurementService } from '../../../core/services/measurement.service';
import { MeasurementModel } from '../models/measurement.model';
import {
  MEASUREMENT_TEMPLATES,
  MeasurementType,
  getTemplate,
  getTypeBadgeClass
} from '../measurement-templates';
import { finalize } from 'rxjs/operators';

// MeasurementRow is an alias; customer data comes from the joined relation on MeasurementModel
type MeasurementRow = MeasurementModel;

@Component({
  selector: 'app-measurement-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutShellComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './measurement-list.component.html',
  styleUrls: ['./measurement-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(MeasurementStoreService);
  private readonly measurementService = inject(MeasurementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  public readonly templates = MEASUREMENT_TEMPLATES;
  public readonly displayedColumns = ['type', 'customerName', 'phone', 'created_at', 'actions'];

  // Local state for the standalone list (loads all, not per-customer)
  public readonly rows = signal<MeasurementRow[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly totalCount = signal<number>(0);
  public readonly page = signal<number>(1);
  public readonly pageSize = signal<number>(20);
  public readonly searchQuery = signal<string>('');
  public readonly sortField = signal<string>('created_at');
  public readonly sortDir = signal<'ASC' | 'DESC'>('DESC');
  public readonly copying = signal<number | null>(null);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadMeasurements();

    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page.set(1);
      this.loadMeasurements();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMeasurements(): void {
    this.loading.set(true);
    this.measurementService
      .getAll({
        page: this.page(),
        limit: this.pageSize()
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.rows.set(res.data.items as MeasurementRow[]);
            this.totalCount.set(res.data.total);
          }
        },
        error: () => {}
      });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadMeasurements();
  }

  onSort(sort: Sort): void {
    this.sortField.set(sort.active || 'created_at');
    this.sortDir.set(sort.direction === 'asc' ? 'ASC' : 'DESC');
    this.loadMeasurements();
  }

  navigateToNew(): void {
    this.router.navigate(['/measurements/new']);
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/measurements', id]);
  }

  navigateToEdit(id: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/measurements', id, 'edit']);
  }

  copyMeasurement(id: number, event: Event): void {
    event.stopPropagation();
    this.copying.set(id);

    this.measurementService
      .copy(id)
      .pipe(
        finalize(() => this.copying.set(null)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.snackBar.open('Measurement copied successfully.', 'Dismiss', {
              duration: 3000,
              panelClass: ['snack-success']
            });
            this.loadMeasurements();
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

  deleteMeasurement(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this measurement?')) return;

    this.measurementService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Measurement deleted.', 'Dismiss', {
              duration: 3000,
              panelClass: ['snack-success']
            });
            this.rows.update((list) => list.filter((m) => m.id !== id));
            this.totalCount.update((n) => Math.max(0, n - 1));
          } else {
            this.snackBar.open(res.error ?? 'Failed to delete measurement.', 'Dismiss', {
              duration: 4000,
              panelClass: ['snack-error']
            });
          }
        }
      });
  }

  getTypeLabel(type: MeasurementType): string {
    return getTemplate(type)?.label ?? type;
  }

  getTypeIcon(type: MeasurementType): string {
    return getTemplate(type)?.icon ?? 'straighten';
  }

  getTypeBadge(type: MeasurementType): string {
    return getTypeBadgeClass(type);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getCustomerName(row: MeasurementRow): string {
    return row.customer?.fullName ?? `Customer #${row.customerId}`;
  }

  getCustomerPhone(row: MeasurementRow): string {
    return row.customer?.phoneNumber ?? '—';
  }
}
