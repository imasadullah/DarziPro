import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get authApi(): Window['api']['auth'] {
    if (!window.api?.auth) {
      throw new Error(
        'Electron API is unavailable. Use npm start and run the app in the Electron window, not the browser.'
      );
    }
    return window.api.auth;
  }

  hasUsers(): Observable<{ success: boolean; data?: boolean; error?: string }> {
    return this.invoke(() => this.authApi.hasUsers());
  }

  registerOwner(data: any): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.authApi.registerOwner(data));
  }

  login(credentials: any): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.authApi.login(credentials));
  }

  loginWithPIN(pin: string): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.authApi.loginWithPIN(pin));
  }

  logout(): Observable<{ success: boolean; error?: string }> {
    return this.invoke(() => this.authApi.logout());
  }

  getCurrentUser(): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.authApi.getCurrentUser());
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
