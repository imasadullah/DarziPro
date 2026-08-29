import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
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
import { PaginatorComponent } from '../../../shared/ui/paginator/paginator';
import { MeasurementStoreService } from '../store/measurement-store.service';
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
  private readonly store = inject(MeasurementStoreService);
  private readonly measurementService = inject(MeasurementService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  public readonly templates = MEASUREMENT_TEMPLATES;

  // Paged data state
  public readonly rows = signal<MeasurementRow[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly totalCount = signal<number>(0);
  public readonly page = signal<number>(1);
  public readonly pageSize = signal<number>(15);

  // Search — client-side filter of the current page only
  // NOTE: This is a stop-gap. True server-side search (across all pages)
  // requires a search/customerName param in MeasurementSearchParams, which
  // is not yet implemented in the API layer.
  public readonly searchQuery = signal<string>('');

  /** Rows filtered client-side by customer name substring match. */
  public readonly filteredRows = computed<MeasurementRow[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.rows();
    return this.rows().filter((r) => {
      const name = (r.customer?.fullName ?? '').toLowerCase();
      const phone = (r.customer?.phoneNumber ?? '').toLowerCase();
      const type = (getTemplate(r.measurementType)?.label ?? r.measurementType).toLowerCase();
      return name.includes(q) || phone.includes(q) || type.includes(q);
    });
  });

  public readonly copying = signal<number | null>(null);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadMeasurements();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Search is client-side only — no re-fetch needed, filteredRows reacts via signal
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
        error: () => { }
      });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
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
            this.rows.update((list) => list.filter((m) => m.id !== id));
            this.totalCount.update((n) => Math.max(0, n - 1));
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
