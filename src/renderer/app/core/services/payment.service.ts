import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private get paymentsApi(): Window['api']['payments'] {
    if (!window.api?.payments) {
      throw new Error(
        'Electron API is unavailable. Run the app via Electron (npm start).'
      );
    }
    return window.api.payments;
  }

  create(data: CreatePaymentDto): Observable<ApiResponse<PaymentModel>> {
    return this.invoke(() => this.paymentsApi.create(data));
  }

  update(id: number, data: UpdatePaymentDto): Observable<ApiResponse<PaymentModel>> {
    return this.invoke(() => this.paymentsApi.update(id, data));
  }

  delete(id: number): Observable<ApiResponse> {
    return this.invoke(() => this.paymentsApi.delete(id));
  }

  getById(id: number): Observable<ApiResponse<PaymentModel>> {
    return this.invoke(() => this.paymentsApi.get(id));
  }

  getAll(params?: PaymentSearchParams): Observable<ApiResponse<PaginatedPayments>> {
    return this.invoke(() => this.paymentsApi.getAll(params));
  }

  getByCustomer(
    customerId: number,
    params?: PaymentSearchParams
  ): Observable<ApiResponse<PaginatedPayments>> {
    return this.invoke(() => this.paymentsApi.getByCustomer(customerId, params));
  }

  getByOrder(orderId: number): Observable<ApiResponse<PaymentModel[]>> {
    return this.invoke(() => this.paymentsApi.getByOrder(orderId));
  }

  calculateBalance(orderId: number): Observable<ApiResponse<OrderBalanceSummary>> {
    return this.invoke(() => this.paymentsApi.calculateBalance(orderId));
  }

  getStats(): Observable<ApiResponse<PaymentStats>> {
    return this.invoke(() => this.paymentsApi.getStats());
  }

  printReceipt(paymentId: number): Observable<ApiResponse<string>> {
    return this.invoke(() => this.paymentsApi.printReceipt(paymentId));
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
