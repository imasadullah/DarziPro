import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { AuthStateService } from '../../core/store/auth-state.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  setupForm: FormGroup;
  hidePassword = signal(true);
  loading = signal(false);

  constructor() {
    this.setupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      pin: ['', [Validators.pattern(/^\d{4,6}$/)]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    const pwd = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pwd === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.setupForm.invalid) {
      return;
    }

    this.loading.set(true);
    const { fullName, username, password, pin } = this.setupForm.value;

    this.authService.registerOwner({ fullName, username, password, pin: pin || undefined }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.authState.setSession(res.data);
          this.snackBar.open('Owner Account Registered Successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.snackBar.open(res.error || 'Failed to register owner.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.message || 'An error occurred.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
