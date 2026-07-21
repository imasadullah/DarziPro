import { Component, inject, ChangeDetectionStrategy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NumericPadComponent } from '../../shared/components/numeric-pad/numeric-pad.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthStateService } from '../../core/store/auth-state.service';
import { ToastService } from '../../shared/components/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NumericPadComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  @ViewChild('pinPad') private pinPad?: NumericPadComponent;

  loginForm: FormGroup;
  loginMode = signal<'password' | 'pin'>('password');
  hidePassword = signal(true);
  loading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required]]
    });
  }

  onPasswordSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.authState.setSession(res.data);
          this.router.navigate(['/dashboard']);
        } else {
          this.toast.error(res.error || 'Invalid credentials.', 3000);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Login failed.', 3000);
      }
    });
  }

  onPINEntered(pin: string): void {
    // Attempt login when PIN reaches standard size (e.g. 4-6 digits, let's trigger automatically on length >= 4)
    if (pin.length >= 4 && pin.length <= 6) {
      this.loading.set(true);
      this.authService.loginWithPIN(pin).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.authState.setSession(res.data);
            this.toast.success('Login successful.', 3000);
            this.router.navigate(['/dashboard']);
          } else {
            // Keep loading false, don't show prompt yet unless length matches typical sizes
            if (pin.length === 6 || (pin.length === 4 && res.error !== 'Invalid PIN.')) {
              this.toast.error(res.error || 'Invalid PIN.', 3000);
              this.pinPad?.clear();
            }
          }
        },
        error: (err) => {
          this.loading.set(false);
          if (pin.length === 6) {
            this.toast.error(err.message || 'PIN login failed.', 3000);
            this.pinPad?.clear();
          }
        }
      });
    }
  }
}
