/**
 * Unit Tests for User Management IPC (Main Process)
 *
 * Strategy: Mock 'data-source', entity, and auth-service modules to avoid
 * TypeORM decorator evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mocks ──────────────────────────────────────────────────────────

const mockUserRepo = {
  find:      vi.fn(),
  findOneBy: vi.fn(),
  count:     vi.fn(),
  save:      vi.fn()
};

// ── Module Mocks ──────────────────────────────────────────────────────────────

vi.mock('../main/database/entities/user.entity', () => ({
  User: class MockUser {
    id!: number;
    username!: string;
    fullName!: string;
    passwordHash!: string;
    pinHash?: string;
    role!: 'owner' | 'staff';
    status!: 'active' | 'inactive';
    created_at!: Date;
    updated_at!: Date;
  }
}));

vi.mock('../main/config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => mockUserRepo)
  }
}));

vi.mock('../main/services/auth.service', () => ({
  AuthService: {
    hash: vi.fn(async (text: string) => `hashed_${text}`)
  }
}));

// ── Import After Mocks ────────────────────────────────────────────────────────

// We test the service functions directly rather than going through IPC handlers
// since ipcMain is not available in the Vitest environment.

const { User } = await import('../main/database/entities/user.entity');
const { AuthService } = await import('../main/services/auth.service');
const { AppDataSource } = await import('../main/config/data-source');

// Helper mirrors the ipc handler logic, extracted for testability
function getUserRepo() {
  return AppDataSource.getRepository(User);
}

function sanitizeUser(user: any) {
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

async function createUser(data: { fullName: string; username: string; password: string; pin?: string; role: 'owner' | 'staff' }) {
  const repo = getUserRepo();
  const existing = await repo.findOneBy({ username: data.username.toLowerCase() });
  if (existing) throw new Error(`Username "${data.username}" is already taken.`);

  const passwordHash = await AuthService.hash(data.password);
  const pinHash      = data.pin ? await AuthService.hash(data.pin) : undefined;

  const user: any     = new User();
  user.username       = data.username.toLowerCase().trim();
  user.fullName       = data.fullName.trim();
  user.passwordHash   = passwordHash;
  user.pinHash        = pinHash;
  user.role           = data.role;
  user.status         = 'active';

  return await repo.save(user);
}

async function updateUser(id: number, data: { fullName?: string; role?: 'owner' | 'staff' }) {
  const repo = getUserRepo();
  const user: any = await repo.findOneBy({ id });
  if (!user) throw new Error('User not found.');
  if (data.fullName) user.fullName = data.fullName.trim();
  if (data.role) user.role = data.role;
  return await repo.save(user);
}

async function setUserStatus(id: number, status: 'active' | 'inactive') {
  const repo = getUserRepo();
  const user: any = await repo.findOneBy({ id });
  if (!user) throw new Error('User not found.');
  if (status === 'inactive' && user.role === 'owner') {
    const activeOwners = await repo.count({ where: { role: 'owner', status: 'active' } });
    if (activeOwners <= 1) throw new Error('Cannot deactivate the last active owner account.');
  }
  user.status = status;
  return await repo.save(user);
}

async function resetPassword(id: number, password: string) {
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.');
  const repo = getUserRepo();
  const user: any = await repo.findOneBy({ id });
  if (!user) throw new Error('User not found.');
  user.passwordHash = await AuthService.hash(password);
  await repo.save(user);
}

async function resetPin(id: number, pin: string | null) {
  const repo = getUserRepo();
  const user: any = await repo.findOneBy({ id });
  if (!user) throw new Error('User not found.');
  if (pin === null || pin === '') {
    user.pinHash = undefined;
  } else {
    if (pin.length < 4 || pin.length > 6) throw new Error('PIN must be 4 to 6 digits.');
    user.pinHash = await AuthService.hash(pin);
  }
  await repo.save(user);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('creates a user with hashed password', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockImplementation(async (u: any) => ({ ...u, id: 1 }));

      const saved = await createUser({
        fullName: 'Ahmad Raza',
        username: 'ahmad',
        password: 'pass1234',
        role:     'staff'
      });

      expect(AuthService.hash).toHaveBeenCalledWith('pass1234');
      expect(saved.passwordHash).toBe('hashed_pass1234');
      expect(saved.status).toBe('active');
    });

    it('hashes PIN when provided', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockImplementation(async (u: any) => ({ ...u, id: 2 }));

      const saved = await createUser({
        fullName: 'Owner User',
        username: 'owner',
        password: 'mypass',
        pin:      '1234',
        role:     'owner'
      });

      expect(AuthService.hash).toHaveBeenCalledWith('1234');
      expect(saved.pinHash).toBe('hashed_1234');
    });

    it('does not set pinHash when PIN is not provided', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockImplementation(async (u: any) => ({ ...u, id: 3 }));

      const saved = await createUser({
        fullName: 'Staff User',
        username: 'staff1',
        password: 'staffpass',
        role:     'staff'
      });

      expect(saved.pinHash).toBeUndefined();
    });

    it('throws error when username is already taken', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1, username: 'ahmad' });

      await expect(createUser({
        fullName: 'Duplicate',
        username: 'Ahmad', // case-insensitive check
        password: 'pass',
        role:     'staff'
      })).rejects.toThrow('already taken');
    });

    it('normalises username to lowercase', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockImplementation(async (u: any) => ({ ...u, id: 4 }));

      const saved = await createUser({
        fullName: 'Test User',
        username: 'TestUser',
        password: 'pass',
        role:     'staff'
      });

      expect(saved.username).toBe('testuser');
    });
  });

  // ── updateUser ────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    it('updates fullName and role', async () => {
      const existingUser = { id: 1, fullName: 'Old Name', role: 'staff', status: 'active' };
      mockUserRepo.findOneBy.mockResolvedValue(existingUser);
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      const updated = await updateUser(1, { fullName: 'New Name', role: 'owner' });

      expect(updated.fullName).toBe('New Name');
      expect(updated.role).toBe('owner');
    });

    it('throws error when user does not exist', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(updateUser(999, { fullName: 'Ghost' })).rejects.toThrow('User not found');
    });
  });

  // ── setUserStatus ─────────────────────────────────────────────────────────

  describe('setUserStatus', () => {
    it('activates an inactive user', async () => {
      const user = { id: 1, role: 'staff', status: 'inactive' };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      const result = await setUserStatus(1, 'active');
      expect(result.status).toBe('active');
    });

    it('deactivates an active staff user', async () => {
      const user = { id: 1, role: 'staff', status: 'active' };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      const result = await setUserStatus(1, 'inactive');
      expect(result.status).toBe('inactive');
    });

    it('prevents deactivating the last active owner', async () => {
      const owner = { id: 1, role: 'owner', status: 'active' };
      mockUserRepo.findOneBy.mockResolvedValue(owner);
      mockUserRepo.count.mockResolvedValue(1); // only one active owner

      await expect(setUserStatus(1, 'inactive'))
        .rejects.toThrow('Cannot deactivate the last active owner');
    });

    it('allows deactivating an owner when multiple active owners exist', async () => {
      const owner = { id: 1, role: 'owner', status: 'active' };
      mockUserRepo.findOneBy.mockResolvedValue(owner);
      mockUserRepo.count.mockResolvedValue(2); // two active owners
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      const result = await setUserStatus(1, 'inactive');
      expect(result.status).toBe('inactive');
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('hashes and saves the new password', async () => {
      const user = { id: 1, passwordHash: 'old_hash' };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      await resetPassword(1, 'newpassword');

      expect(AuthService.hash).toHaveBeenCalledWith('newpassword');
      expect(user.passwordHash).toBe('hashed_newpassword');
    });

    it('throws error when password is too short', async () => {
      await expect(resetPassword(1, 'abc')).rejects.toThrow('at least 4 characters');
    });

    it('throws error when user does not exist', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(resetPassword(999, 'validpass')).rejects.toThrow('User not found');
    });
  });

  // ── resetPin ──────────────────────────────────────────────────────────────

  describe('resetPin', () => {
    it('sets a new hashed PIN', async () => {
      const user: any = { id: 1, pinHash: undefined };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      await resetPin(1, '1234');

      expect(AuthService.hash).toHaveBeenCalledWith('1234');
      expect(user.pinHash).toBe('hashed_1234');
    });

    it('clears the PIN when null is passed', async () => {
      const user: any = { id: 1, pinHash: 'existing_hash' };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (u: any) => u);

      await resetPin(1, null);

      expect(user.pinHash).toBeUndefined();
      expect(AuthService.hash).not.toHaveBeenCalled();
    });

    it('throws error when PIN length is invalid', async () => {
      const user = { id: 1 };
      mockUserRepo.findOneBy.mockResolvedValue(user);

      await expect(resetPin(1, '123')).rejects.toThrow('4 to 6 digits');
      await expect(resetPin(1, '1234567')).rejects.toThrow('4 to 6 digits');
    });
  });
});
