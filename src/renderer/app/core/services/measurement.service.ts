import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
  MeasurementSearchParams,
  PaginatedMeasurements
} from '../../features/measurements/models/measurement.model';
import { MeasurementType } from '../../features/measurements/measurement-templates';

@Injectable({
  providedIn: 'root'
})
export class MeasurementService {
  private get measurementsApi(): Window['api']['measurements'] {
    if (!window.api?.measurements) {
      throw new Error(
        'Electron API is unavailable. Run the app via Electron (npm start).'
      );
    }
    return window.api.measurements;
  }

  create(data: CreateMeasurementDto): Observable<ApiResponse<Measurement>> {
    return this.invoke(() => this.measurementsApi.create(data));
  }

  update(id: number, data: UpdateMeasurementDto): Observable<ApiResponse<Measurement>> {
    return this.invoke(() => this.measurementsApi.update(id, data));
  }

  delete(id: number): Observable<ApiResponse> {
    return this.invoke(() => this.measurementsApi.delete(id));
  }

  getById(id: number): Observable<ApiResponse<Measurement>> {
    return this.invoke(() => this.measurementsApi.get(id));
  }

  getAll(params?: MeasurementSearchParams): Observable<ApiResponse<PaginatedMeasurements>> {
    return this.invoke(() => this.measurementsApi.getAll(params));
  }

  getByCustomer(
    customerId: number,
    params?: MeasurementSearchParams
  ): Observable<ApiResponse<PaginatedMeasurements>> {
    return this.invoke(() => this.measurementsApi.getByCustomer(customerId, params));
  }

  copy(measurementId: number): Observable<ApiResponse<Measurement>> {
    return this.invoke(() => this.measurementsApi.copy(measurementId));
  }

  getLatest(
    customerId: number,
    measurementType?: MeasurementType
  ): Observable<ApiResponse<Measurement | null>> {
    return this.invoke(() => this.measurementsApi.getLatest(customerId, measurementType));
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
