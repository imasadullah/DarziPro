import {
  Component, ChangeDetectionStrategy, signal, inject, Inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export interface UserFormDialogData {
  mode: 'add' | 'edit';
  user?: UserDto;
}

export interface UserFormResult {
  fullName: string;
  username?: string;
  password?: string;
  pin?: string;
  role: 'owner' | 'staff';
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-header">
        <mat-icon class="dialog-icon">{{ data.mode === 'add' ? 'person_add' : 'edit' }}</mat-icon>
        <h2 class="dialog-title">{{ data.mode === 'add' ? 'Add New User' : 'Edit User' }}</h2>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="dialog-form">

        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="fullName" placeholder="e.g. Ahmad Raza" />
          @if (form.get('fullName')?.hasError('required') && form.get('fullName')?.touched) {
            <mat-error>Full name is required.</mat-error>
          }
        </mat-form-field>

        @if (data.mode === 'add') {
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" placeholder="e.g. ahmad.raza"
                   autocomplete="off" />
            @if (form.get('username')?.hasError('required') && form.get('username')?.touched) {
              <mat-error>Username is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password"
                   [type]="showPassword() ? 'text' : 'password'"
                   placeholder="Min 4 characters" autocomplete="new-password" />
            <button type="button" mat-icon-button matSuffix
                    (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>Password is required.</mat-error>
            }
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Password must be at least 4 characters.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>PIN (Optional)</mat-label>
            <input matInput formControlName="pin" type="password"
                   placeholder="4–6 digit PIN" maxlength="6" autocomplete="new-password" />
            @if (form.get('pin')?.hasError('pattern') && form.get('pin')?.touched) {
              <mat-error>PIN must be 4 to 6 digits.</mat-error>
            }
            <mat-hint>Leave blank if no PIN login needed.</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="owner">Owner</mat-option>
            <mat-option value="staff">Staff</mat-option>
          </mat-select>
          @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
            <mat-error>Role is required.</mat-error>
          }
        </mat-form-field>

        <div class="dialog-actions">
          <button type="button" mat-stroked-button class="btn-cancel" (click)="dialogRef.close()">
            Cancel
          </button>
          <button type="submit" mat-raised-button class="btn-confirm" [disabled]="form.invalid">
            {{ data.mode === 'add' ? 'Create User' : 'Save Changes' }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .dialog-shell {
      padding: 28px;
      width: 420px;
      max-width: 100%;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .dialog-icon {
      font-size: 26px; width: 26px; height: 26px;
      color: var(--accent, #6366f1);
    }
    .dialog-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary, #e2e8f0);
      margin: 0;
    }
    .dialog-form { display: flex; flex-direction: column; gap: 4px; }
    mat-form-field { width: 100%; }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }
    .btn-cancel {
      border-color: var(--border, rgba(255,255,255,0.12)) !important;
      color: var(--text-secondary, #94a3b8) !important;
      height: 40px; border-radius: 8px;
    }
    .btn-confirm {
      background: var(--accent, #6366f1) !important;
      color: #fff !important;
      height: 40px; border-radius: 8px; padding: 0 20px;
    }
  `]
})
export class UserFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  showPassword = signal(false);
  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserFormDialogData) {
    const isEdit = data.mode === 'edit';
    this.form = this.fb.group({
      fullName: [data.user?.fullName ?? '', Validators.required],
      role:     [data.user?.role ?? 'staff', Validators.required],
      ...(isEdit ? {} : {
        username: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(4)]],
        pin:      ['', [Validators.pattern(/^\d{4,6}$/)]]
      })
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const result: UserFormResult = {
      fullName: v['fullName'],
      role:     v['role'],
      ...(this.data.mode === 'add' ? {
        username: v['username'],
        password: v['password'],
        pin:      v['pin'] || undefined
      } : {})
    };
    this.dialogRef.close(result);
  }
}
