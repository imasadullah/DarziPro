import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '../../../core/services/settings.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import {
  AppSettingsMap,
  ShopInfoForm,
  AppConfigForm,
  ReceiptSettingsForm,
  shopInfoToMap,
  appConfigToMap,
  receiptSettingsToMap
} from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsStoreService {
  private readonly settingsService     = inject(SettingsService);
  private readonly userManagementService = inject(UserManagementService);

  // ── Private Writable Signals ──────────────────────────────────────────────
  #settings       = signal<AppSettingsMap | null>(null);
  #users          = signal<UserDto[]>([]);
  #loading        = signal<boolean>(false);
  #saving         = signal<boolean>(false);
  #error          = signal<string | null>(null);
  #successMessage = signal<string | null>(null);

  // ── Public Read-Only Signals ──────────────────────────────────────────────
  public readonly settings       = this.#settings.asReadonly();
  public readonly users          = this.#users.asReadonly();
  public readonly loading        = this.#loading.asReadonly();
  public readonly saving         = this.#saving.asReadonly();
  public readonly error          = this.#error.asReadonly();
  public readonly successMessage = this.#successMessage.asReadonly();

  // ── Computed Signals ──────────────────────────────────────────────────────
  public readonly isSettingsLoaded = computed(() => this.#settings() !== null);

  // ── Settings Actions ─────────────────────────────────────────────────────

  public loadSettings(): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.settingsService.getSettings()
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#settings.set(res.data as AppSettingsMap);
          } else {
            this.#error.set(res.error ?? 'Failed to load settings.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load settings.')
      });
  }

  public saveShopInfo(form: ShopInfoForm): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.#successMessage.set(null);
    this.settingsService.saveSettings(shopInfoToMap(form))
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#settings.update(prev => prev ? { ...prev, ...shopInfoToMap(form) } : prev);
            this.#successMessage.set('Shop information saved successfully.');
          } else {
            this.#error.set(res.error ?? 'Failed to save shop information.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to save shop information.')
      });
  }

  public saveAppConfig(form: AppConfigForm): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.#successMessage.set(null);
    this.settingsService.saveSettings(appConfigToMap(form))
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#settings.update(prev => prev ? { ...prev, ...appConfigToMap(form) } : prev);
            this.#successMessage.set('Application settings saved successfully.');
          } else {
            this.#error.set(res.error ?? 'Failed to save application settings.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to save application settings.')
      });
  }

  public saveReceiptSettings(form: ReceiptSettingsForm): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.#successMessage.set(null);
    this.settingsService.saveSettings(receiptSettingsToMap(form))
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#settings.update(prev => prev ? { ...prev, ...receiptSettingsToMap(form) } : prev);
            this.#successMessage.set('Receipt settings saved successfully.');
          } else {
            this.#error.set(res.error ?? 'Failed to save receipt settings.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to save receipt settings.')
      });
  }

  public uploadLogo(onSuccess: (path: string) => void): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.settingsService.uploadLogo()
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#settings.update(prev => prev ? { ...prev, shopLogoPath: res.data! } : prev);
            onSuccess(res.data);
          } else if (res.error && res.error !== 'No file selected.') {
            this.#error.set(res.error);
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to upload logo.')
      });
  }

  public resetSettings(): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.settingsService.resetSettings()
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#settings.set(res.data as AppSettingsMap);
            this.#successMessage.set('Settings have been reset to defaults.');
          } else {
            this.#error.set(res.error ?? 'Failed to reset settings.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to reset settings.')
      });
  }

  // ── User Management Actions ───────────────────────────────────────────────

  public loadUsers(): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.userManagementService.getAll()
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.set(res.data);
          } else {
            this.#error.set(res.error ?? 'Failed to load users.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load users.')
      });
  }

  public createUser(data: CreateUserDto, onSuccess: () => void): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.userManagementService.create(data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.update(list => [...list, res.data!]);
            this.#successMessage.set(`User "${data.username}" created successfully.`);
            onSuccess();
          } else {
            this.#error.set(res.error ?? 'Failed to create user.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to create user.')
      });
  }

  public updateUser(id: number, data: UpdateUserDto, onSuccess: () => void): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.userManagementService.update(id, data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.update(list => list.map(u => u.id === id ? res.data! : u));
            this.#successMessage.set('User updated successfully.');
            onSuccess();
          } else {
            this.#error.set(res.error ?? 'Failed to update user.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to update user.')
      });
  }

  public setUserStatus(id: number, status: 'active' | 'inactive'): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.userManagementService.setStatus(id, status)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.update(list => list.map(u => u.id === id ? res.data! : u));
            this.#successMessage.set(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully.`);
          } else {
            this.#error.set(res.error ?? 'Failed to update user status.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to update user status.')
      });
  }

  public resetPassword(id: number, password: string, onSuccess: () => void): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.userManagementService.resetPassword(id, password)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#successMessage.set('Password reset successfully.');
            onSuccess();
          } else {
            this.#error.set(res.error ?? 'Failed to reset password.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to reset password.')
      });
  }

  public resetPin(id: number, pin: string | null, onSuccess: () => void): void {
    this.#saving.set(true);
    this.#error.set(null);
    this.userManagementService.resetPin(id, pin)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#successMessage.set(pin ? 'PIN reset successfully.' : 'PIN cleared successfully.');
            this.#users.update(list => list.map(u => u.id === id ? { ...u, hasPin: !!pin } : u));
            onSuccess();
          } else {
            this.#error.set(res.error ?? 'Failed to reset PIN.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to reset PIN.')
      });
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  public clearMessages(): void {
    this.#error.set(null);
    this.#successMessage.set(null);
  }
}
