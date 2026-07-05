import { ipcMain } from 'electron';
import { AppDataSource } from '../config/data-source';
import { Setting } from '../database/entities/setting.entity';

export function registerSystemIPCHandlers() {
  ipcMain.handle('system:getSettings', async () => {
    try {
      const settingRepository = AppDataSource.getRepository(Setting);
      const allSettings = await settingRepository.find();
      const settingsMap: Record<string, string> = {};
      allSettings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      return { success: true, data: settingsMap };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:saveSettings', async (_event, settings: Record<string, string>) => {
    try {
      const settingRepository = AppDataSource.getRepository(Setting);
      for (const [key, value] of Object.entries(settings)) {
        let setting = await settingRepository.findOneBy({ key });
        if (!setting) {
          setting = new Setting();
          setting.key = key;
        }
        setting.value = value;
        await settingRepository.save(setting);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
