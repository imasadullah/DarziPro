import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private get systemApi(): Window['api']['system'] {
    if (!window.api?.system) {
      throw new Error('Electron API is unavailable. Run the app via Electron (npm start).');
    }
    return window.api.system;
  }

  getSettings(): Observable<{ success: boolean; data?: Record<string, string>; error?: string }> {
    return this.invoke(() => this.systemApi.getSettings());
  }

  saveSettings(settings: Record<string, string>): Observable<{ success: boolean; error?: string }> {
    return this.invoke(() => this.systemApi.saveSettings(settings));
  }

  uploadLogo(): Observable<{ success: boolean; data?: string; error?: string }> {
    return this.invoke(() => this.systemApi.uploadLogo());
  }

  resetSettings(): Observable<{ success: boolean; data?: Record<string, string>; error?: string }> {
    return this.invoke(() => this.systemApi.resetSettings());
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
