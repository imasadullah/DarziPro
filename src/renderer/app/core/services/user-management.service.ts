import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private get usersApi(): Window['api']['users'] {
    if (!window.api?.users) {
      throw new Error('Electron API is unavailable. Run the app via Electron (npm start).');
    }
    return window.api.users;
  }

  getAll(): Observable<{ success: boolean; data?: any[]; error?: string }> {
    return this.invoke(() => this.usersApi.getAll());
  }

  create(data: any): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.usersApi.create(data));
  }

  update(id: number, data: any): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.usersApi.update(id, data));
  }

  setStatus(id: number, status: 'active' | 'inactive'): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.invoke(() => this.usersApi.setStatus(id, status));
  }

  resetPassword(id: number, password: string): Observable<{ success: boolean; error?: string }> {
    return this.invoke(() => this.usersApi.resetPassword(id, password));
  }

  resetPin(id: number, pin: string | null): Observable<{ success: boolean; error?: string }> {
    return this.invoke(() => this.usersApi.resetPin(id, pin));
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
