import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutShellComponent } from '../../shared/components/layout-shell/layout-shell.component';
import { AuthStateService } from '../../core/store/auth-state.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OrderService } from '../../core/services/order.service';
import { OrderStats } from '../orders/models/order.model';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentStats } from '../payments/models/payment.model';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card';
import { ActionToolbarComponent } from '../../shared/ui/action-toolbar/action-toolbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    LayoutShellComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
    StatCardComponent,
    ActionToolbarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  public readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);

  public readonly orderStats = signal<OrderStats | null>(null);
  public readonly statsLoading = signal<boolean>(true);
  public readonly paymentStats = signal<PaymentStats | null>(null);
  public readonly paymentStatsLoading = signal<boolean>(true);
  public readonly today = new Date();

  ngOnInit(): void {
    this.orderService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orderStats.set(res.data as unknown as OrderStats);
        }
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false)
    });

    this.paymentService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.paymentStats.set(res.data as unknown as PaymentStats);
        }
        this.paymentStatsLoading.set(false);
      },
      error: () => this.paymentStatsLoading.set(false)
    });
  }

  navigateToOrders(filter?: string): void {
    this.router.navigate(['/orders/list']);
  }

  navigateToNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  navigateToKanban(): void {
    this.router.navigate(['/orders/kanban']);
  }

  navigateToCustomers(): void {
    this.router.navigate(['/customers/list']);
  }

  navigateToPayments(): void {
    this.router.navigate(['/payments/list']);
  }

  navigateToReceivePayment(): void {
    this.router.navigate(['/payments/new']);
  }

  navigateToPayment(id: number): void {
    this.router.navigate(['/payments', id]);
  }
}
