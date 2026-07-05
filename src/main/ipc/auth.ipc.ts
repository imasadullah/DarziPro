import { ipcMain } from 'electron';
import { AuthService } from '../services/auth.service';

export function registerAuthIPCHandlers() {
  ipcMain.handle('auth:hasUsers', async () => {
    try {
      return await AuthService.hasUsers();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:registerOwner', async (_event, data) => {
    try {
      const session = await AuthService.registerOwner(data);
      return { success: true, data: session };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:login', async (_event, credentials) => {
    try {
      const session = await AuthService.login(credentials);
      return { success: true, data: session };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:loginWithPIN', async (_event, pin) => {
    try {
      const session = await AuthService.loginWithPIN(pin);
      return { success: true, data: session };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:logout', () => {
    AuthService.logout();
    return { success: true };
  });

  ipcMain.handle('auth:getCurrentUser', () => {
    const user = AuthService.getCurrentUser();
    return { success: true, data: user };
  });
}
