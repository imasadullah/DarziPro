import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { MeasurementService } from '../../../core/services/measurement.service';
import {
  MeasurementModel,
  CreateMeasurementDto,
  UpdateMeasurementDto,
  MeasurementSearchParams,
  PaginatedMeasurements
} from '../models/measurement.model';
import { MeasurementType } from '../measurement-templates';

@Injectable({
  providedIn: 'root'
})
export class MeasurementStoreService {
  private readonly measurementService = inject(MeasurementService);

  // ── Private Writable Signals ─────────────────────────────────────────────────
  #measurements = signal<MeasurementModel[]>([]);
  #selectedMeasurement = signal<MeasurementModel | null>(null);
  #loading = signal<boolean>(false);
  #saving = signal<boolean>(false);
  #error = signal<string | null>(null);
  #page = signal<number>(1);
  #pageSize = signal<number>(20);
  #totalCount = signal<number>(0);

  // ── Public Read-Only Signals ─────────────────────────────────────────────────
  public readonly measurements = this.#measurements.asReadonly();
  public readonly selectedMeasurement = this.#selectedMeasurement.asReadonly();
  public readonly loading = this.#loading.asReadonly();
  public readonly saving = this.#saving.asReadonly();
  public readonly error = this.#error.asReadonly();
  public readonly page = this.#page.asReadonly();
  public readonly pageSize = this.#pageSize.asReadonly();
  public readonly totalCount = this.#totalCount.asReadonly();

  // ── Computed Signals ─────────────────────────────────────────────────────────
  public readonly totalPages = computed(() =>
    Math.ceil(this.#totalCount() / this.#pageSize())
  );

  public readonly hasMeasurements = computed(() => this.#measurements().length > 0);

  // ── Actions ──────────────────────────────────────────────────────────────────

  public loadByCustomer(
    customerId: number,
    params?: MeasurementSearchParams
  ): void {
    this.#loading.set(true);
    this.#error.set(null);

    const searchParams: MeasurementSearchParams = {
      measurementType: params?.measurementType,
      page: params?.page ?? this.#page(),
      limit: params?.limit ?? this.#pageSize()
    };

    this.measurementService
      .getByCustomer(customerId, searchParams)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#measurements.set(res.data.items as MeasurementModel[]);
            this.#totalCount.set(res.data.total);
            this.#page.set(res.data.page);
          } else {
            this.#error.set(res.error ?? 'Failed to load measurements.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load measurements.')
      });
  }

  public getMeasurementById(id: number): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.#selectedMeasurement.set(null);

    this.measurementService
      .getById(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#selectedMeasurement.set(res.data as unknown as MeasurementModel);
          } else {
            this.#error.set(res.error ?? 'Measurement not found.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Measurement not found.')
      });
  }

  public createMeasurement(
    data: CreateMeasurementDto,
    onSuccess: (m: MeasurementModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.measurementService
      .create(data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as unknown as MeasurementModel);
          } else {
            const msg = res.error ?? 'Failed to create measurement.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to create measurement.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public updateMeasurement(
    id: number,
    data: UpdateMeasurementDto,
    onSuccess: (m: MeasurementModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.measurementService
      .update(id, data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            onSuccess(res.data as unknown as MeasurementModel);
          } else {
            const msg = res.error ?? 'Failed to update measurement.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to update measurement.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public deleteMeasurement(
    id: number,
    onSuccess: () => void,
    onError: (message: string) => void
  ): void {
    this.#loading.set(true);
    this.#error.set(null);

    this.measurementService
      .delete(id)
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#measurements.update((list) => list.filter((m) => m.id !== id));
            this.#totalCount.update((n) => Math.max(0, n - 1));
            onSuccess();
          } else {
            const msg = res.error ?? 'Failed to delete measurement.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to delete measurement.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public copyMeasurement(
    measurementId: number,
    onSuccess: (m: MeasurementModel) => void,
    onError: (message: string) => void
  ): void {
    this.#saving.set(true);
    this.#error.set(null);

    this.measurementService
      .copy(measurementId)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const copied = res.data as unknown as MeasurementModel;
            // Prepend new copy to local list for immediate UI feedback
            this.#measurements.update((list) => [copied, ...list]);
            this.#totalCount.update((n) => n + 1);
            onSuccess(copied);
          } else {
            const msg = res.error ?? 'Failed to copy measurement.';
            this.#error.set(msg);
            onError(msg);
          }
        },
        error: (err) => {
          const msg = err.message ?? 'Failed to copy measurement.';
          this.#error.set(msg);
          onError(msg);
        }
      });
  }

  public setPage(page: number, customerId: number): void {
    this.#page.set(page);
    this.loadByCustomer(customerId, { page });
  }

  public clearSelectedMeasurement(): void {
    this.#selectedMeasurement.set(null);
  }

  public clearMeasurements(): void {
    this.#measurements.set([]);
    this.#totalCount.set(0);
    this.#page.set(1);
  }

  public clearError(): void {
    this.#error.set(null);
  }
}
