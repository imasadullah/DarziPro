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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { SearchBarComponent } from '../../../shared/ui/search-bar/search-bar';
import { PAGINATOR_PAGE_SIZE_OPTIONS, PaginatorComponent } from '../../../shared/ui/paginator/paginator';
import { MeasurementService } from '../../../core/services/measurement.service';
import { MeasurementModel } from '../models/measurement.model';
import {
  MEASUREMENT_TEMPLATES,
  MeasurementType,
  getTemplate,
  getTypeBadgeClass
} from '../measurement-templates';
import { ToastService } from '../../../shared/components/services/toast.service';

// MeasurementRow is an alias; customer data comes from the joined relation on MeasurementModel
type MeasurementRow = MeasurementModel;

@Component({
  selector: 'app-measurement-list',
  standalone: true,
  imports: [
    CommonModule,
    LayoutShellComponent,
    PageHeaderComponent,
    SearchBarComponent,
    PaginatorComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './measurement-list.component.html',
  styleUrls: ['./measurement-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly measurementService = inject(MeasurementService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  public readonly templates = MEASUREMENT_TEMPLATES;

  // Paged data state
  public readonly rows = signal<MeasurementRow[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly totalCount = signal<number>(0);
  public readonly page = signal<number>(1);
  public readonly pageSize = signal<number>(10);
  public readonly error = signal<string | null>(null);
  public readonly pageSizeOptions = PAGINATOR_PAGE_SIZE_OPTIONS;
  public readonly searchQuery = signal<string>('');
  public readonly measurementType = signal<MeasurementType | ''>('');

  public readonly copying = signal<number | null>(null);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadMeasurements();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      this.page.set(1);
      this.loadMeasurements(query);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMeasurements(search = this.searchQuery()): void {
    this.loading.set(true);
    this.error.set(null);
    this.measurementService
      .getAll({
        page: this.page(),
        limit: this.pageSize(),
        search: search.trim() || undefined,
        measurementType: this.measurementType() || undefined
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
            this.page.set(res.data.page);
            this.pageSize.set(res.data.limit);
          } else {
            this.error.set(res.error ?? 'Failed to load measurements.');
          }
        },
        error: (err) => this.error.set(err.message ?? 'Failed to load measurements.')
      });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onMeasurementTypeChange(type: string): void {
    this.measurementType.set(type as MeasurementType | '');
    this.page.set(1);
    this.loadMeasurements();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.measurementType.set('');
    this.page.set(1);
    this.searchSubject.next('');
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadMeasurements();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
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
            this.toast.success('Measurement copied successfully.', 3000);
            this.loadMeasurements();
          } else {
            this.toast.error(res.error ?? 'Failed to copy measurement.', 4000);
          }
        },
        error: (err) => {
          this.toast.error(err.message ?? 'Failed to copy measurement.', 4000);
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
            this.toast.success('Measurement deleted.', 3000);
            const total = Math.max(0, this.totalCount() - 1);
            const page = Math.min(this.page(), Math.max(1, Math.ceil(total / this.pageSize())));
            this.totalCount.set(total);
            this.page.set(page);
            this.loadMeasurements();
          } else {
            this.toast.error(res.error ?? 'Failed to delete measurement.', 4000);
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

  getCustomerInitial(row: MeasurementRow): string {
    return (row.customer?.fullName ?? '?').charAt(0).toUpperCase();
  }
}
