import { ipcMain } from 'electron';
import { AppDataSource } from '../config/data-source';
import { User } from '../database/entities/user.entity';
import { AuthService } from '../services/auth.service';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateUserDto {
  fullName: string;
  username: string;
  password: string;
  pin?: string;
  role: 'owner' | 'staff';
}

export interface UpdateUserDto {
  fullName?: string;
  role?: 'owner' | 'staff';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserRepo() {
  return AppDataSource.getRepository(User);
}

function sanitizeUser(user: User) {
  return {
    id:         user.id,
    username:   user.username,
    fullName:   user.fullName,
    role:       user.role,
    status:     user.status,
    hasPin:     !!user.pinHash,
    created_at: user.created_at
  };
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerUserIPCHandlers(): void {
  // ── List all users ───────────────────────────────────────────────────────────
  ipcMain.handle('user:getAll', async () => {
    try {
      const repo = getUserRepo();
      const users = await repo.find({ order: { created_at: 'ASC' } });
      return { success: true, data: users.map(sanitizeUser) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Create user ──────────────────────────────────────────────────────────────
  ipcMain.handle('user:create', async (_event, data: CreateUserDto) => {
    try {
      const repo = getUserRepo();

      // Validate username uniqueness
      const existing = await repo.findOneBy({ username: data.username.toLowerCase() });
      if (existing) {
        throw new Error(`Username "${data.username}" is already taken.`);
      }

      const passwordHash = await AuthService.hash(data.password);
      const pinHash      = data.pin ? await AuthService.hash(data.pin) : undefined;

      const user          = new User();
      user.username       = data.username.toLowerCase().trim();
      user.fullName       = data.fullName.trim();
      user.passwordHash   = passwordHash;
      user.pinHash        = pinHash;
      user.role           = data.role;
      user.status         = 'active';

      const saved = await repo.save(user);
      return { success: true, data: sanitizeUser(saved) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Update user (full name / role only) ──────────────────────────────────────
  ipcMain.handle('user:update', async (_event, payload: { id: number; data: UpdateUserDto }) => {
    try {
      const repo = getUserRepo();
      const user = await repo.findOneBy({ id: payload.id });
      if (!user) throw new Error('User not found.');

      if (payload.data.fullName !== undefined) {
        user.fullName = payload.data.fullName.trim();
      }
      if (payload.data.role !== undefined) {
        user.role = payload.data.role;
      }

      const saved = await repo.save(user);
      return { success: true, data: sanitizeUser(saved) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Set user status (activate / deactivate) ───────────────────────────────────
  ipcMain.handle('user:setStatus', async (_event, payload: { id: number; status: 'active' | 'inactive' }) => {
    try {
      const repo = getUserRepo();
      const user = await repo.findOneBy({ id: payload.id });
      if (!user) throw new Error('User not found.');

      // Prevent deactivating the last active owner
      if (payload.status === 'inactive' && user.role === 'owner') {
        const activeOwners = await repo.count({ where: { role: 'owner', status: 'active' } });
        if (activeOwners <= 1) {
          throw new Error('Cannot deactivate the last active owner account.');
        }
      }

      user.status = payload.status;
      const saved = await repo.save(user);
      return { success: true, data: sanitizeUser(saved) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Reset password ────────────────────────────────────────────────────────────
  ipcMain.handle('user:resetPassword', async (_event, payload: { id: number; password: string }) => {
    try {
      const repo = getUserRepo();
      const user = await repo.findOneBy({ id: payload.id });
      if (!user) throw new Error('User not found.');
      if (!payload.password || payload.password.length < 4) {
        throw new Error('Password must be at least 4 characters.');
      }

      user.passwordHash = await AuthService.hash(payload.password);
      await repo.save(user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ── Reset PIN ─────────────────────────────────────────────────────────────────
  ipcMain.handle('user:resetPin', async (_event, payload: { id: number; pin: string | null }) => {
    try {
      const repo = getUserRepo();
      const user = await repo.findOneBy({ id: payload.id });
      if (!user) throw new Error('User not found.');

      if (payload.pin === null || payload.pin === '') {
        user.pinHash = undefined;
      } else {
        if (payload.pin.length < 4 || payload.pin.length > 6) {
          throw new Error('PIN must be 4 to 6 digits.');
        }
        user.pinHash = await AuthService.hash(payload.pin);
      }

      await repo.save(user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
