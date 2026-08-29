import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '../../../shared/components/services/toast.service';
import { MatDividerModule } from '@angular/material/divider';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { MeasurementStoreService } from '../store/measurement-store.service';
import { MeasurementService } from '../../../core/services/measurement.service';
import { MeasurementModel } from '../models/measurement.model';
import {
  MeasurementType,
  getTemplate,
  getFieldLabel,
  getTypeBadgeClass
} from '../measurement-templates';

@Component({
  selector: 'app-measurement-detail',
  standalone: true,
  imports: [
    CommonModule,
    LayoutShellComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './measurement-detail.component.html',
  styleUrls: ['./measurement-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(MeasurementStoreService);
  private readonly measurementService = inject(MeasurementService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  public readonly copying = signal<boolean>(false);

  public get loading() { return this.store.loading; }
  public get error() { return this.store.error; }
  public get measurement() { return this.store.selectedMeasurement; }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.getMeasurementById(id);
    } else {
      this.router.navigate(['/measurements/list']);
    }
  }

  ngOnDestroy(): void {
    this.store.clearSelectedMeasurement();
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateBack(): void {
    this.router.navigate(['/measurements/list']);
  }

  navigateToEdit(): void {
    const m = this.measurement();
    if (m) {
      this.router.navigate(['/measurements', m.id, 'edit']);
    }
  }

  copyMeasurement(): void {
    const m = this.measurement();
    if (!m) return;

    this.copying.set(true);
    this.measurementService
      .copy(m.id)
      .pipe(
        finalize(() => this.copying.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.toast.success('Measurement copied. Redirecting to copy…', 3000);
            this.router.navigate(['/measurements', res.data.id]);
          } else {
            this.toast.error(res.error ?? 'Failed to copy measurement.', 4000);
          }
        },
        error: (err) => {
          this.toast.error(err.message ?? 'Failed to copy measurement.', 4000);
        }
      });
  }

  deleteMeasurement(): void {
    const m = this.measurement();
    if (!m) return;
    if (!confirm('Are you sure you want to delete this measurement?')) return;

    this.store.deleteMeasurement(
      m.id,
      () => {
        this.toast.success('Measurement deleted.', 3000);
        this.router.navigate(['/measurements/list']);
      },
      (msg) => {
        this.toast.error(msg, 4000);
      }
    );
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

  getFieldLabel(type: MeasurementType, key: string): string {
    return getFieldLabel(type, key);
  }

  getOrderedValues(m: MeasurementModel): Array<{ label: string; key: string; value: string }> {
    const template = getTemplate(m.measurementType);
    if (!template || m.measurementType === 'custom') {
      // For custom, just return values in stored order
      return m.values.map((v) => ({
        label: v.fieldName,
        key: v.fieldName,
        value: v.fieldValue ?? '—'
      }));
    }

    // Order by template field order
    return template.fields.map((f) => {
      const stored = m.values.find((v) => v.fieldName === f.key);
      return {
        label: f.label,
        key: f.key,
        value: stored?.fieldValue ? `${stored.fieldValue} ${f.unit}` : '—'
      };
    });
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
}
