import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export interface UserSession {
  id: number;
  username: string;
  fullName: string;
  role: 'owner' | 'staff';
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly authService = inject(AuthService);

  // Private Writable Signals
  #currentUser = signal<UserSession | null>(null);
  #initialized = signal<boolean>(false);
  #loading = signal<boolean>(false);

  // Public Read-Only Signals
  public readonly currentUser = this.#currentUser.asReadonly();
  public readonly initialized = this.#initialized.asReadonly();
  public readonly loading = this.#loading.asReadonly();

  // Computed State
  public readonly isAuthenticated = computed(() => this.#currentUser() !== null);
  public readonly userRole = computed(() => this.#currentUser()?.role || null);
  public readonly isOwner = computed(() => this.#currentUser()?.role === 'owner');

  public setSession(user: UserSession | null): void {
    this.#currentUser.set(user);
    this.#initialized.set(true);
  }

  public setLoading(loading: boolean): void {
    this.#loading.set(loading);
  }

  public initializeSession(): Promise<boolean> {
    if (this.#initialized()) {
      return Promise.resolve(this.isAuthenticated());
    }

    this.#loading.set(true);
    return new Promise((resolve) => {
      this.authService.getCurrentUser().subscribe({
        next: (res) => {
          this.#loading.set(false);
          if (res.success && res.data) {
            this.setSession(res.data);
            resolve(true);
          } else {
            this.#currentUser.set(null);
            this.#initialized.set(true);
            resolve(false);
          }
        },
        error: () => {
          this.#loading.set(false);
          this.#currentUser.set(null);
          this.#initialized.set(true);
          resolve(false);
        }
      });
    });
  }
}
