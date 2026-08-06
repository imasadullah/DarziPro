import { Injectable, signal, computed, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BackupService } from '../../../core/services/backup.service';

@Injectable({
  providedIn: 'root'
})
export class BackupStoreService {
  private readonly backupService = inject(BackupService);

  // ── Private Writable Signals ────────────────────────────────────────────────
  #backups        = signal<BackupEntry[]>([]);
  #loading        = signal<boolean>(false);
  #operating      = signal<boolean>(false);   // backup / restore in progress
  #error          = signal<string | null>(null);
  #successMessage = signal<string | null>(null);
  #autoConfig     = signal<AutoBackupConfig | null>(null);
  #savingConfig   = signal<boolean>(false);

  // ── Public Read-Only Signals ────────────────────────────────────────────────
  public readonly backups        = this.#backups.asReadonly();
  public readonly loading        = this.#loading.asReadonly();
  public readonly operating      = this.#operating.asReadonly();
  public readonly error          = this.#error.asReadonly();
  public readonly successMessage = this.#successMessage.asReadonly();
  public readonly autoConfig     = this.#autoConfig.asReadonly();
  public readonly savingConfig   = this.#savingConfig.asReadonly();

  // ── Computed ────────────────────────────────────────────────────────────────
  public readonly hasBackups     = computed(() => this.#backups().length > 0);
  public readonly backupCount    = computed(() => this.#backups().length);

  // ── Backup History ──────────────────────────────────────────────────────────

  public loadBackups(): void {
    this.#loading.set(true);
    this.#error.set(null);
    this.backupService.listBackups()
      .pipe(finalize(() => this.#loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#backups.set(res.data);
          } else {
            this.#error.set(res.error ?? 'Failed to load backup history.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to load backup history.')
      });
  }

  // ── Create Manual Backup ────────────────────────────────────────────────────

  public createBackup(): void {
    this.#operating.set(true);
    this.#error.set(null);
    this.#successMessage.set(null);
    this.backupService.createBackup()
      .pipe(finalize(() => this.#operating.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.#successMessage.set(
              `Backup created and verified successfully.\nLocation: ${res.data.path}`
            );
            this.loadBackups();   // Refresh history
          } else if (res.error && res.error !== 'Cancelled') {
            this.#error.set(res.error ?? 'Backup failed.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Backup failed.')
      });
  }

  // ── Restore ─────────────────────────────────────────────────────────────────

  /**
   * Step 1: Opens file picker, pre-validates the file.
   * Calls onConfirmNeeded with the selected path so the component can
   * show a confirmation dialog before calling executeRestore().
   */
  public initiateRestore(onConfirmNeeded: (filePath: string) => void): void {
    this.#operating.set(true);
    this.#error.set(null);
    this.#successMessage.set(null);
    this.backupService.restoreBackup()
      .pipe(finalize(() => this.#operating.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.path) {
            onConfirmNeeded(res.data.path);
          } else if (res.error && res.error !== 'Cancelled') {
            this.#error.set(res.error ?? 'Failed to select backup file.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to select backup file.')
      });
  }

  /**
   * Step 2: Executes restore. The app will restart automatically on success.
   */
  public executeRestore(filePath: string): void {
    this.#operating.set(true);
    this.#error.set(null);
    this.backupService.confirmRestore(filePath)
      .pipe(finalize(() => this.#operating.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.#error.set(res.error ?? 'Restore failed.');
          }
          // On success app.relaunch() is called — no further UI update needed
        },
        error: (err) => this.#error.set(err.message ?? 'Restore failed.')
      });
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  public deleteBackup(entry: BackupEntry): void {
    this.#error.set(null);
    this.backupService.deleteBackup(entry.path).subscribe({
      next: (res) => {
        if (res.success) {
          this.#backups.update(list => list.filter(b => b.path !== entry.path));
          this.#successMessage.set(`Backup "${entry.name}" deleted.`);
        } else {
          this.#error.set(res.error ?? 'Failed to delete backup.');
        }
      },
      error: (err) => this.#error.set(err.message ?? 'Failed to delete backup.')
    });
  }

  // ── Verify ──────────────────────────────────────────────────────────────────

  public verifyBackup(entry: BackupEntry): void {
    this.#error.set(null);
    this.#successMessage.set(null);
    this.backupService.verifyBackup(entry.path).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.valid) {
            this.#successMessage.set(`✅ "${entry.name}" is valid: ${res.data.message}`);
          } else {
            this.#error.set(`❌ "${entry.name}" failed verification: ${res.data.message}`);
          }
        } else {
          this.#error.set(res.error ?? 'Verification failed.');
        }
      },
      error: (err) => this.#error.set(err.message ?? 'Verification failed.')
    });
  }

  // ── Open Folder ─────────────────────────────────────────────────────────────

  public openFolder(entry: BackupEntry): void {
    this.backupService.openFolder(entry.path).subscribe();
  }

  // ── Auto Config ─────────────────────────────────────────────────────────────

  public loadAutoConfig(): void {
    this.backupService.getAutoConfig().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.#autoConfig.set(res.data);
        }
      },
      error: () => { /* non-critical */ }
    });
  }

  public saveAutoConfig(config: AutoBackupConfig): void {
    this.#savingConfig.set(true);
    this.#error.set(null);
    this.#successMessage.set(null);
    this.backupService.saveAutoConfig(config)
      .pipe(finalize(() => this.#savingConfig.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.#autoConfig.set(config);
            this.#successMessage.set('Automatic backup settings saved.');
          } else {
            this.#error.set(res.error ?? 'Failed to save auto-backup settings.');
          }
        },
        error: (err) => this.#error.set(err.message ?? 'Failed to save auto-backup settings.')
      });
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  public clearMessages(): void {
    this.#error.set(null);
    this.#successMessage.set(null);
  }
}
