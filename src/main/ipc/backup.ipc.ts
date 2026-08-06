import { ipcMain, dialog, shell, app } from 'electron';
import * as path from 'path';
import { BackupService } from '../services/backup.service';

// ── Filename helper ───────────────────────────────────────────────────────────

function defaultBackupFilename(): string {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');
  return `DarziPro_Backup_${yyyy}-${mm}-${dd}_${hh}-${min}.db`;
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

export function registerBackupIPCHandlers(): void {

  // ── Create Backup (opens Save Dialog) ───────────────────────────────────────
  ipcMain.handle('backup:createBackup', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title:       'Save Backup',
        defaultPath: defaultBackupFilename(),
        filters: [
          { name: 'SQLite Database', extensions: ['db', 'sqlite'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Cancelled' };
      }

      const data = await BackupService.createBackup(result.filePath, 'manual');
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Restore Backup (opens Open Dialog) ──────────────────────────────────────
  ipcMain.handle('backup:restoreBackup', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title:      'Select Backup to Restore',
        filters: [
          { name: 'SQLite Database', extensions: ['db', 'sqlite'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Cancelled' };
      }

      const srcPath = result.filePaths[0];

      // Pre-validate before asking the renderer to confirm
      const verify = BackupService.verifyBackup(srcPath);
      if (!verify.valid) {
        return { success: false, error: `Invalid backup file: ${verify.message}` };
      }

      // Pass back the path so the renderer can show a confirmation dialog,
      // then call backup:confirmRestore with the path.
      return { success: true, data: { path: srcPath } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Confirm & Execute Restore ────────────────────────────────────────────────
  ipcMain.handle('backup:confirmRestore', async (_event, filePath: string) => {
    try {
      await BackupService.restoreBackup(filePath);
      // app.relaunch() + app.exit(0) is called inside restoreBackup
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── List Backups ─────────────────────────────────────────────────────────────
  ipcMain.handle('backup:listBackups', async () => {
    try {
      const data = BackupService.listBackups();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Delete Backup ────────────────────────────────────────────────────────────
  ipcMain.handle('backup:deleteBackup', async (_event, filePath: string) => {
    try {
      BackupService.deleteBackup(filePath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Verify Backup ────────────────────────────────────────────────────────────
  ipcMain.handle('backup:verifyBackup', async (_event, filePath: string) => {
    try {
      const data = BackupService.verifyBackup(filePath);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Open Backup Folder in OS File Manager ────────────────────────────────────
  ipcMain.handle('backup:openFolder', async (_event, folderPath: string) => {
    try {
      const dir = folderPath.endsWith('.db') || folderPath.endsWith('.sqlite')
        ? path.dirname(folderPath)
        : folderPath;
      await shell.openPath(dir);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Get Auto Backup Config ───────────────────────────────────────────────────
  ipcMain.handle('backup:getAutoConfig', async () => {
    try {
      const data = await BackupService.getAutoBackupConfig();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Save Auto Backup Config ──────────────────────────────────────────────────
  ipcMain.handle('backup:saveAutoConfig', async (_event, config: any) => {
    try {
      await BackupService.saveAutoBackupConfig(config);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
