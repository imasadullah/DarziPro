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
import { ToastService } from '../../../shared/components/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsStoreService {
    private readonly toast = inject(ToastService);
  private readonly settingsService     = inject(SettingsService);
  private readonly userManagementService = inject(UserManagementService);

  // ── Private Writable Signals ──────────────────────────────────────────────
  #settings       = signal<AppSettingsMap | null>(null);
  #users          = signal<UserDto[]>([]);
  #loading        = signal<boolean>(false);
  #saving         = signal<boolean>(false);

  // ── Public Read-Only Signals ──────────────────────────────────────────────
  public readonly settings       = this.#settings.asReadonly();
  public readonly users          = this.#users.asReadonly();
  public readonly loading        = this.#loading.asReadonly();
  public readonly saving         = this.#saving.asReadonly();

  // ── Computed Signals ──────────────────────────────────────────────────────
  public readonly isSettingsLoaded = computed(() => this.#settings() !== null);

  // ── Settings Actions ─────────────────────────────────────────────────────

  public loadSettings(): void {
    this.#loading.set(true);
    this.settingsService.getSettings()
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#settings.set(res.data as AppSettingsMap);
          } else {
            this.toast.error(res.error ?? 'Failed to load settings.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to load settings.', 3000)
      });
  }

  public saveShopInfo(form: ShopInfoForm): void {
    this.#saving.set(true);
    this.settingsService.saveSettings(shopInfoToMap(form))
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#settings.update(prev => prev ? { ...prev, ...shopInfoToMap(form) } : prev);
            this.toast.success('Shop information saved successfully.', 3000);
          } else {
            this.toast.error(res.error ?? 'Failed to save shop information.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to save shop information.', 3000)
      });
  }

  public saveAppConfig(form: AppConfigForm): void {
    this.#saving.set(true);
    this.settingsService.saveSettings(appConfigToMap(form))
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#settings.update(prev => prev ? { ...prev, ...appConfigToMap(form) } : prev);
            this.toast.success('Application settings saved successfully.', 3000);
          } else {
            this.toast.error(res.error ?? 'Failed to save application settings.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to save application settings.', 3000)
      });
  }

  public saveReceiptSettings(form: ReceiptSettingsForm): void {
    this.#saving.set(true);
    this.settingsService.saveSettings(receiptSettingsToMap(form))
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#settings.update(prev => prev ? { ...prev, ...receiptSettingsToMap(form) } : prev);
            this.toast.success('Receipt settings saved successfully.', 3000);
          } else {
            this.toast.error(res.error ?? 'Failed to save receipt settings.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to save receipt settings.', 3000)
      });
  }

  public uploadLogo(onSuccess: (path: string) => void): void {
    this.#saving.set(true);
    this.settingsService.uploadLogo()
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#settings.update(prev => prev ? { ...prev, shopLogoPath: res.data! } : prev);
            onSuccess(res.data);
          } else if (res.error && res.error !== 'No file selected.') {
            this.toast.error(res.error ?? 'Failed to upload logo.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to upload logo.', 3000)
      });
  }

  public resetSettings(): void {
    this.#saving.set(true);
    this.settingsService.resetSettings()
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#settings.set(res.data as AppSettingsMap);
            this.toast.success('Settings have been reset to defaults.', 3000);
          } else {
            this.toast.error(res.error ?? 'Failed to reset settings.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to reset settings.', 3000)
      });
  }

  // ── User Management Actions ───────────────────────────────────────────────

  public loadUsers(): void {
    this.#loading.set(true);
    this.userManagementService.getAll()
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.set(res.data);
          } else {
            this.toast.error(res.error ?? 'Failed to load users.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to load users.', 3000)
      });
  }

  public createUser(data: CreateUserDto, onSuccess: () => void): void {
    this.#saving.set(true);
    this.userManagementService.create(data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.update(list => [...list, res.data!]);
            this.toast.success(`User "${data.username}" created successfully.`, 3000);
            onSuccess();
          } else {
            this.toast.error(res.error ?? 'Failed to create user.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to create user.', 3000)
      });
  }

  public updateUser(id: number, data: UpdateUserDto, onSuccess: () => void): void {
    this.#saving.set(true);
    this.userManagementService.update(id, data)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.update(list => list.map(u => u.id === id ? res.data! : u));
            this.toast.success('User updated successfully.', 3000);
            onSuccess();
          } else {
            this.toast.error(res.error ?? 'Failed to update user.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to update user.', 3000)
      });
  }

  public setUserStatus(id: number, status: 'active' | 'inactive'): void {
    this.#saving.set(true);
    this.userManagementService.setStatus(id, status)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#users.update(list => list.map(u => u.id === id ? res.data! : u));
            this.toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully.`, 3000);
          } else {
            this.toast.error(res.error ?? 'Failed to update user status.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to update user status.', 3000)
      });
  }

  public resetPassword(id: number, password: string, onSuccess: () => void): void {
    this.#saving.set(true);
    this.userManagementService.resetPassword(id, password)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Password reset successfully.', 3000);
            onSuccess();
          } else {
            this.toast.error(res.error ?? 'Failed to reset password.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to reset password.', 3000)
      });
  }

  public resetPin(id: number, pin: string | null, onSuccess: () => void): void {
    this.#saving.set(true);
    this.userManagementService.resetPin(id, pin)
      .pipe(finalize(() => this.#saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success(pin ? 'PIN reset successfully.' : 'PIN cleared successfully.', 3000);
            this.#users.update(list => list.map(u => u.id === id ? { ...u, hasPin: !!pin } : u));
            onSuccess();
          } else {
            this.toast.error(res.error ?? 'Failed to reset PIN.', 3000);
          }
        },
        error: (err) => this.toast.error(err.message ?? 'Failed to reset PIN.', 3000)
      });
  }
}
