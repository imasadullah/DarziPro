import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastService } from '../../shared/components/services/toast.service';
import { AuthStateService } from '../store/auth-state.service';

/**
 * ReceiptService — central service for all receipt printing operations.
 *
 * All three receipt types (Order, Payment, Delivery) flow through here.
 * HTML is generated in the main process; we open a popup window and call
 * window.print() — the same pattern already used for payment receipts.
 */
@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private readonly toast = inject(ToastService);
  private readonly authState = inject(AuthStateService);

  // ── API Accessors ───────────────────────────────────────────────────────────

  private get ordersApi(): Window['api']['orders'] {
    if (!window.api?.orders) {
      throw new Error('Electron API is unavailable. Run the app via Electron (npm start).');
    }
    return window.api.orders;
  }

  private get paymentsApi(): Window['api']['payments'] {
    if (!window.api?.payments) {
      throw new Error('Electron API is unavailable. Run the app via Electron (npm start).');
    }
    return window.api.payments;
  }

  // ── Print Methods ───────────────────────────────────────────────────────────

  /**
   * Print an Order Receipt for the given order ID.
   * Accessible from: Order List, Order Detail, Order Wizard success screen.
   */
  printOrderReceipt(orderId: number): void {
    this.invoke(() => this.ordersApi.printReceipt(orderId)).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.openPrintWindow(res.data);
        } else {
          this.toast.error(res.error ?? 'Failed to generate order receipt.', 4000);
        }
      },
      error: (err) => {
        this.toast.error(err.message ?? 'Failed to print order receipt.', 4000);
      }
    });
  }

  /**
   * Print a Payment Receipt for the given payment ID.
   * Accessible from: Payment Detail, Payment List.
   */
  printPaymentReceipt(paymentId: number): void {
    this.invoke(() => this.paymentsApi.printReceipt(paymentId)).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.openPrintWindow(res.data);
        } else {
          this.toast.error(res.error ?? 'Failed to generate payment receipt.', 4000);
        }
      },
      error: (err) => {
        this.toast.error(err.message ?? 'Failed to print payment receipt.', 4000);
      }
    });
  }

  /**
   * Print a Delivery Receipt for the given order ID.
   * Only accessible when order.status === 'Delivered'.
   * Uses the currently logged-in user's name as "Delivered By".
   */
  printDeliveryReceipt(orderId: number): void {
    const user = this.authState.currentUser();
    const deliveredBy = user?.fullName ?? user?.username ?? 'Shop Staff';

    this.invoke(() => this.ordersApi.printDeliveryReceipt(orderId, deliveredBy)).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.openPrintWindow(res.data);
        } else {
          this.toast.error(res.error ?? 'Failed to generate delivery receipt.', 4000);
        }
      },
      error: (err) => {
        this.toast.error(err.message ?? 'Failed to print delivery receipt.', 4000);
      }
    });
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Open a new browser window with the receipt HTML and trigger print dialog.
   */
  private openPrintWindow(html: string): void {
    const win = window.open('', '_blank', 'width=520,height=700,scrollbars=yes');
    if (!win) {
      this.toast.error('Could not open print window. Check your browser popup settings.', 5000);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Small delay to ensure fonts/styles load before print dialog opens
    win.addEventListener('load', () => {
      setTimeout(() => win.print(), 250);
    });
    // Fallback: trigger print even if load event already fired
    setTimeout(() => {
      try { win.print(); } catch { /* already printed */ }
    }, 600);
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
