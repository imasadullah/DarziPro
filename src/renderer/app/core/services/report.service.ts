import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private get reportsApi(): Window['api']['reports'] {
    if (!window.api?.reports) {
      throw new Error(
        'Electron API is unavailable. Run the app via Electron (npm start).'
      );
    }
    return window.api.reports;
  }

  getKpiSummary(): Observable<ApiResponse<ReportKpiSummary>> {
    return this.invoke(() => this.reportsApi.getKpiSummary());
  }

  getRevenueReport(params?: RevenueReportParams): Observable<ApiResponse<RevenueReport>> {
    return this.invoke(() => this.reportsApi.getRevenueReport(params));
  }

  getOrdersReport(params?: OrdersReportParams): Observable<ApiResponse<OrdersReport>> {
    return this.invoke(() => this.reportsApi.getOrdersReport(params));
  }

  getCustomerReport(params?: CustomerReportParams): Observable<ApiResponse<CustomerReport>> {
    return this.invoke(() => this.reportsApi.getCustomerReport(params));
  }

  getOutstandingReport(params?: OutstandingReportParams): Observable<ApiResponse<OutstandingReport>> {
    return this.invoke(() => this.reportsApi.getOutstandingReport(params));
  }

  getDeliveryReport(): Observable<ApiResponse<DeliveryReport>> {
    return this.invoke(() => this.reportsApi.getDeliveryReport());
  }

  getPaymentMethodReport(params?: ReportDateParams): Observable<ApiResponse<PaymentMethodReport>> {
    return this.invoke(() => this.reportsApi.getPaymentMethodReport(params));
  }

  getRevenueTrend(
    params?: ReportDateParams & { groupBy?: 'day' | 'month' }
  ): Observable<ApiResponse<RevenueTrendPoint[]>> {
    return this.invoke(() => this.reportsApi.getRevenueTrend(params));
  }

  exportCsv(type: string, params?: any): Observable<ApiResponse<ReportExportResult>> {
    return this.invoke(() => this.reportsApi.exportCsv(type, params));
  }

  exportPdf(type: string, params?: any): Observable<ApiResponse<ReportExportResult>> {
    return this.invoke(() => this.reportsApi.exportPdf(type, params));
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
