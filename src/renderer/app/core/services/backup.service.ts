import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackupService {

  private get backupApi(): Window['api']['backup'] {
    if (!window.api?.backup) {
      throw new Error('Electron Backup API is unavailable. Run the app via Electron (npm start).');
    }
    return window.api.backup;
  }

  createBackup(): Observable<ApiResponse<BackupResult>> {
    return this.invoke(() => this.backupApi.createBackup());
  }

  /** Step 1: Opens file picker and pre-validates. Returns selected path or cancellation. */
  restoreBackup(): Observable<ApiResponse<{ path: string }>> {
    return this.invoke(() => this.backupApi.restoreBackup());
  }

  /** Step 2: Executes the actual restore after user confirmation. App will restart. */
  confirmRestore(filePath: string): Observable<ApiResponse> {
    return this.invoke(() => this.backupApi.confirmRestore(filePath));
  }

  listBackups(): Observable<ApiResponse<BackupEntry[]>> {
    return this.invoke(() => this.backupApi.listBackups());
  }

  deleteBackup(filePath: string): Observable<ApiResponse> {
    return this.invoke(() => this.backupApi.deleteBackup(filePath));
  }

  verifyBackup(filePath: string): Observable<ApiResponse<VerifyResult>> {
    return this.invoke(() => this.backupApi.verifyBackup(filePath));
  }

  openFolder(folderPath: string): Observable<ApiResponse> {
    return this.invoke(() => this.backupApi.openFolder(folderPath));
  }

  getAutoConfig(): Observable<ApiResponse<AutoBackupConfig>> {
    return this.invoke(() => this.backupApi.getAutoConfig());
  }

  saveAutoConfig(config: AutoBackupConfig): Observable<ApiResponse> {
    return this.invoke(() => this.backupApi.saveAutoConfig(config));
  }

  private invoke<T>(fn: () => Promise<T>): Observable<T> {
    try {
      return from(fn());
    } catch (error) {
      return throwError(() => error);
    }
  }
}
