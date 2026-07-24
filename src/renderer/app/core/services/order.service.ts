import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderSearchParams,
  PaginatedOrders,
  OrderModel,
  OrderStatus,
  OrderStats
} from '../../features/orders/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private get ordersApi(): Window['api']['orders'] {
    if (!window.api?.orders) {
      throw new Error(
        'Electron API is unavailable. Run the app via Electron (npm start).'
      );
    }
    return window.api.orders;
  }

  create(data: CreateOrderDto): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.create(data));
  }

  update(id: number, data: UpdateOrderDto): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.update(id, data));
  }

  delete(id: number): Observable<ApiResponse> {
    return this.invoke(() => this.ordersApi.delete(id));
  }

  getById(id: number): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.get(id));
  }

  getAll(params?: OrderSearchParams): Observable<ApiResponse<PaginatedOrders>> {
    return this.invoke(() => this.ordersApi.getAll(params));
  }

  getByCustomer(
    customerId: number,
    params?: OrderSearchParams
  ): Observable<ApiResponse<PaginatedOrders>> {
    return this.invoke(() => this.ordersApi.getByCustomer(customerId, params));
  }

  changeStatus(id: number, status: OrderStatus): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.changeStatus(id, status));
  }

  markReady(id: number): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.markReady(id));
  }

  markDelivered(id: number): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.markDelivered(id));
  }

  cancel(id: number): Observable<ApiResponse<OrderModel>> {
    return this.invoke(() => this.ordersApi.cancel(id));
  }

  search(query: string): Observable<ApiResponse<OrderModel[]>> {
    return this.invoke(() => this.ordersApi.search(query));
  }

  getStats(): Observable<ApiResponse<OrderStats>> {
    return this.invoke(() => this.ordersApi.getStats());
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
