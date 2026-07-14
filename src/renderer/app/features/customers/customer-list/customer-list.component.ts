import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { LayoutShellComponent } from '../../../shared/components/layout-shell/layout-shell.component';
import { CustomerStoreService } from '../store/customer-store.service';
import { CustomerModel } from '../models/customer.model';
import {
  DeleteConfirmDialogComponent,
  DeleteConfirmDialogData
} from '../components/delete-confirm-dialog/delete-confirm-dialog.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutShellComponent,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public readonly store = inject(CustomerStoreService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public readonly searchControl = new FormControl('');
  public readonly displayedColumns = [
    'customerCode',
    'fullName',
    'phoneNumber',
    'address',
    'created_at',
    'actions'
  ];

  ngOnInit(): void {
    this.store.loadCustomers();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.store.searchCustomers(query ?? '');
      });
  }

  ngAfterViewInit(): void {
    // Sort is handled server-side via loadCustomers re-calls
  }

  navigateToAdd(): void {
    this.router.navigate(['/customers/new']);
  }

  navigateToDetail(customer: CustomerModel): void {
    this.router.navigate(['/customers', customer.id]);
  }

  navigateToEdit(event: Event, customer: CustomerModel): void {
    event.stopPropagation();
    this.router.navigate(['/customers', customer.id, 'edit']);
  }

  onPageChange(event: PageEvent): void {
    this.store.setPageSize(event.pageSize);
    this.store.setPage(event.pageIndex + 1);
  }

  openDeleteDialog(event: Event, customer: CustomerModel): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open<
      DeleteConfirmDialogComponent,
      DeleteConfirmDialogData,
      boolean
    >(DeleteConfirmDialogComponent, {
      width: '460px',
      data: {
        customerName: customer.fullName,
        customerCode: customer.customerCode
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteCustomer(
          customer.id,
          () => {
            this.snackBar.open(
              `${customer.fullName} has been deleted.`,
              'Dismiss',
              { duration: 3000, panelClass: ['snack-success'] }
            );
          },
          (msg) => {
            this.snackBar.open(msg, 'Dismiss', {
              duration: 5000,
              panelClass: ['snack-error']
            });
          }
        );
      }
    });
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join('');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
