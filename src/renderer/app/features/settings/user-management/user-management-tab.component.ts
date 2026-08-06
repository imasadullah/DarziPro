import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { SettingsStoreService } from '../store/settings-store.service';
import {
  UserFormDialogComponent,
  UserFormDialogData,
  UserFormResult
} from './user-form-dialog.component';

// ── Sub-dialog for password/PIN reset ─────────────────────────────────────────
import {
  Component as NgComponent, ChangeDetectionStrategy as CDC,
  signal as sig, inject as inj, Inject
} from '@angular/core';
import {
  ReactiveFormsModule, FormBuilder, Validators
} from '@angular/forms';
import {
  MatDialogRef as MDialogRef, MAT_DIALOG_DATA as DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgComponent({
  selector: 'app-reset-secret-dialog',
  standalone: true,
  changeDetection: CDC.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-header">
        <mat-icon class="dialog-icon">lock_reset</mat-icon>
        <h2 class="dialog-title">{{ data.type === 'password' ? 'Reset Password' : 'Reset PIN' }}</h2>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>New {{ data.type === 'password' ? 'Password' : 'PIN' }}</mat-label>
          <input matInput formControlName="value"
                 [type]="showValue() ? 'text' : 'password'"
                 [placeholder]="data.type === 'password' ? 'Min 4 characters' : '4-6 digits'"
                 autocomplete="new-password" />
          <button type="button" mat-icon-button matSuffix (click)="showValue.set(!showValue())">
            <mat-icon>{{ showValue() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.get('value')?.hasError('required') && form.get('value')?.touched) {
            <mat-error>This field is required.</mat-error>
          }
          @if (form.get('value')?.hasError('minlength') && form.get('value')?.touched) {
            <mat-error>Must be at least 4 characters.</mat-error>
          }
          @if (form.get('value')?.hasError('pattern') && form.get('value')?.touched) {
            <mat-error>PIN must be 4 to 6 digits.</mat-error>
          }
        </mat-form-field>
        <div class="dialog-actions">
          <button type="button" mat-stroked-button class="btn-cancel" (click)="dialogRef.close()">Cancel</button>
          <button type="submit" mat-raised-button class="btn-confirm" [disabled]="form.invalid">Save</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.dialog-shell{padding:24px;width:380px} .dialog-header{display:flex;align-items:center;gap:12px;margin-bottom:20px} .dialog-icon{color:var(--accent,#6366f1)} .dialog-title{font-size:1.05rem;font-weight:600;color:var(--text-primary,#e2e8f0);margin:0} .dialog-form{display:flex;flex-direction:column;gap:4px} mat-form-field{width:100%} .dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px} .btn-cancel{border-color:var(--border,rgba(255,255,255,.12))!important;color:var(--text-secondary,#94a3b8)!important;height:40px;border-radius:8px} .btn-confirm{background:var(--accent,#6366f1)!important;color:#fff!important;height:40px;border-radius:8px;padding:0 20px}`]
})
export class ResetSecretDialogComponent {
  readonly dialogRef = inj(MDialogRef<ResetSecretDialogComponent>);
  private readonly fb = inj(FormBuilder);
  showValue = sig(false);
  form;
  constructor(@Inject(DIALOG_DATA) public data: { type: 'password' | 'pin' }) {
    this.form = this.fb.group({
      value: ['', [
        Validators.required,
        ...(data.type === 'password'
          ? [Validators.minLength(4)]
          : [Validators.pattern(/^\d{4,6}$/)])
      ]]
    });
  }
  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.get('value')?.value);
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-user-management-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatProgressSpinnerModule, MatMenuModule
  ],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <div>
          <h2 class="tab-title">User Management</h2>
          <p class="tab-subtitle">Control who has access to Darzi Pro.</p>
        </div>
        <button mat-raised-button class="btn-primary" (click)="openAddUser()">
          <mat-icon>person_add</mat-icon>
          Add User
        </button>
      </div>

      @if (store.loading()) {
        <div class="loading-wrap"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="users-table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>PIN</th>
                <th>Status</th>
                <th>Joined</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of store.users(); track user.id) {
                <tr [class.inactive-row]="user.status === 'inactive'">
                  <td class="cell-name">
                    <div class="user-avatar">{{ initials(user.fullName) }}</div>
                    {{ user.fullName }}
                  </td>
                  <td class="cell-mono">{{ user.username }}</td>
                  <td>
                    <span class="badge" [class.badge-owner]="user.role === 'owner'"
                          [class.badge-staff]="user.role === 'staff'">
                      {{ user.role | titlecase }}
                    </span>
                  </td>
                  <td>
                    <mat-icon class="pin-icon" [class.has-pin]="user.hasPin"
                              [title]="user.hasPin ? 'PIN set' : 'No PIN'">
                      {{ user.hasPin ? 'pin' : 'pin_off' }}
                    </mat-icon>
                  </td>
                  <td>
                    <span class="status-dot" [class.active]="user.status === 'active'"
                          [class.inactive]="user.status === 'inactive'">
                      {{ user.status | titlecase }}
                    </span>
                  </td>
                  <td class="cell-date">{{ formatDate(user.created_at) }}</td>
                  <td class="col-actions">
                    <button mat-icon-button [matMenuTriggerFor]="userMenu" class="action-btn"
                            title="User actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #userMenu="matMenu" class="action-menu">
                      <button mat-menu-item (click)="openEditUser(user)">
                        <mat-icon>edit</mat-icon> Edit
                      </button>
                      <button mat-menu-item (click)="toggleStatus(user)">
                        <mat-icon>{{ user.status === 'active' ? 'block' : 'check_circle' }}</mat-icon>
                        {{ user.status === 'active' ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button mat-menu-item (click)="openResetPassword(user)">
                        <mat-icon>lock_reset</mat-icon> Reset Password
                      </button>
                      <button mat-menu-item (click)="openResetPin(user)">
                        <mat-icon>dialpad</mat-icon> Reset PIN
                      </button>
                    </mat-menu>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-cell">No users found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tab-content { padding: 0; }
    .tab-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;
    }
    .tab-title { font-size: 1.15rem; font-weight: 600; color: var(--text-primary, #e2e8f0); margin: 0 0 4px; }
    .tab-subtitle { font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin: 0; }
    .btn-primary {
      background: var(--accent, #6366f1) !important;
      color: #fff !important;
      height: 40px; border-radius: 8px;
      flex-shrink: 0;
    }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }

    /* Table */
    .users-table-wrap {
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 12px;
      overflow: hidden;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .users-table thead th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted, #64748b);
      background: var(--surface-secondary, rgba(255,255,255,0.02));
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    }
    .users-table tbody tr {
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.05));
      transition: background 0.15s;
    }
    .users-table tbody tr:hover { background: var(--hover, rgba(255,255,255,0.03)); }
    .users-table tbody tr:last-child { border-bottom: none; }
    .users-table td { padding: 14px 16px; color: var(--text-primary, #e2e8f0); vertical-align: middle; }
    .inactive-row td { opacity: 0.5; }

    .cell-name { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--accent, #6366f1);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700;
      flex-shrink: 0;
    }
    .cell-mono { font-family: monospace; color: var(--text-secondary, #94a3b8); }
    .cell-date { color: var(--text-muted, #64748b); font-size: 0.8rem; }
    .col-actions { text-align: right; width: 60px; }

    .badge {
      display: inline-block; padding: 2px 10px; border-radius: 20px;
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em;
    }
    .badge-owner { background: rgba(99,102,241,0.18); color: #a5b4fc; }
    .badge-staff { background: rgba(16,185,129,0.15); color: #6ee7b7; }

    .status-dot {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 500;
    }
    .status-dot::before {
      content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 50%;
    }
    .status-dot.active { color: #6ee7b7; }
    .status-dot.active::before { background: #10b981; }
    .status-dot.inactive { color: #f87171; }
    .status-dot.inactive::before { background: #ef4444; }

    .pin-icon { font-size: 20px; width: 20px; height: 20px; color: var(--text-muted, #475569); }
    .pin-icon.has-pin { color: var(--accent, #6366f1); }

    .action-btn { color: var(--text-muted, #64748b); }
    .empty-cell { text-align: center; color: var(--text-muted, #64748b); padding: 48px; }
  `]
})
export class UserManagementTabComponent implements OnInit {
  readonly store = inject(SettingsStoreService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.store.loadUsers();
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openAddUser(): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      data: { mode: 'add' } satisfies UserFormDialogData,
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe((result: UserFormResult | undefined) => {
      if (result) {
        this.store.createUser(result as any, () => {});
      }
    });
  }

  openEditUser(user: UserDto): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      data: { mode: 'edit', user } satisfies UserFormDialogData,
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe((result: UserFormResult | undefined) => {
      if (result) {
        this.store.updateUser(user.id, { fullName: result.fullName, role: result.role }, () => {});
      }
    });
  }

  toggleStatus(user: UserDto): void {
    const next: 'active' | 'inactive' = user.status === 'active' ? 'inactive' : 'active';
    this.store.setUserStatus(user.id, next);
  }

  openResetPassword(user: UserDto): void {
    const ref = this.dialog.open(ResetSecretDialogComponent, {
      data: { type: 'password' },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe((newPassword: string | undefined) => {
      if (newPassword) this.store.resetPassword(user.id, newPassword, () => {});
    });
  }

  openResetPin(user: UserDto): void {
    const ref = this.dialog.open(ResetSecretDialogComponent, {
      data: { type: 'pin' },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe((newPin: string | undefined) => {
      if (newPin !== undefined) this.store.resetPin(user.id, newPin || null, () => {});
    });
  }
}
