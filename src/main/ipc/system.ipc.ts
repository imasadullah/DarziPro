import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { SettingService } from '../services/setting.service';

export function registerSystemIPCHandlers() {
  // ── Get all settings (merged with defaults) ─────────────────────────────────
  ipcMain.handle('system:getSettings', async () => {
    try {
      const data = await SettingService.getSettings();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Save multiple settings ───────────────────────────────────────────────────
  ipcMain.handle('system:saveSettings', async (_event, settings: Record<string, string>) => {
    try {
      await SettingService.saveSettings(settings);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Reset settings to defaults ───────────────────────────────────────────────
  ipcMain.handle('system:resetSettings', async () => {
    try {
      await SettingService.resetSettings();
      const data = await SettingService.getSettings();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Logo upload ──────────────────────────────────────────────────────────────
  // Opens a file picker, copies the chosen image to userData/logos/, and
  // saves the absolute path in the shopLogoPath setting key.
  ipcMain.handle('system:uploadLogo', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Shop Logo',
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'No file selected.' };
      }

      const srcPath = result.filePaths[0];
      const logoDir = path.join(app.getPath('userData'), 'logos');

      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }

      const ext      = path.extname(srcPath);
      const destName = `shop_logo_${Date.now()}${ext}`;
      const destPath = path.join(logoDir, destName);

      fs.copyFileSync(srcPath, destPath);
      await SettingService.saveSetting('shopLogoPath', destPath);

      return { success: true, data: destPath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
