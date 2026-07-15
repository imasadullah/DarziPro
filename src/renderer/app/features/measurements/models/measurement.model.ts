import { MeasurementType } from '../measurement-templates';

export { MeasurementType };

export interface MeasurementValueModel {
  id: number;
  measurementId: number;
  fieldName: string;
  fieldValue?: string;
}

export interface MeasurementCustomerInfo {
  id: number;
  fullName: string;
  phoneNumber: string;
}

export interface MeasurementModel {
  id: number;
  customerId: number;
  customer?: MeasurementCustomerInfo;
  measurementType: MeasurementType;
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values: MeasurementValueModel[];
  created_at: string;
  updated_at: string;
}

export interface MeasurementValueDto {
  fieldName: string;
  fieldValue?: string;
}

export interface CreateMeasurementDto {
  customerId: number;
  measurementType: MeasurementType;
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values: MeasurementValueDto[];
}

export interface UpdateMeasurementDto {
  notes?: string;
  fabricNotes?: string;
  stitchingInstructions?: string;
  values?: MeasurementValueDto[];
}

export interface MeasurementSearchParams {
  measurementType?: MeasurementType;
  page?: number;
  limit?: number;
}

export interface PaginatedMeasurements {
  items: MeasurementModel[];
  total: number;
  page: number;
  limit: number;
}
