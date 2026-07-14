import { describe, it, expect, vi } from 'vitest';

// Mock TypeORM entities and data-source to avoid decorator evaluation in esbuild
vi.mock('../database/entities/user.entity', () => ({
  User: class User {}
}));

vi.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => ({
      findOne: vi.fn(),
      findOneBy: vi.fn(),
      find: vi.fn(),
      count: vi.fn(),
      save: vi.fn(),
      remove: vi.fn()
    }))
  }
}));

const { AuthService } = await import('./auth.service');


describe('AuthService Cryptography & Sessions (Main Process)', () => {
  describe('hash & verify', () => {
    it('should generate password hashes and verify matches correctly', async () => {
      const password = 'mypassword123';
      const hash = await AuthService.hash(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(':');

      const matches = await AuthService.verify(password, hash);
      expect(matches).toBe(true);
    });

    it('should fail validation for incorrect passwords', async () => {
      const password = 'mypassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await AuthService.hash(password);

      const matches = await AuthService.verify(wrongPassword, hash);
      expect(matches).toBe(false);
    });

    it('should handle malformed hashes gracefully', async () => {
      const result = await AuthService.verify('test', 'malformedhashstring');
      expect(result).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should initialize with null session', () => {
      AuthService.logout();
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    it('should save and retrieve user session records', () => {
      const mockUser: any = {
        id: 10,
        username: 'asad',
        fullName: 'Muhammad Asad',
        role: 'owner'
      };

      AuthService.setCurrentUser(mockUser);
      
      const session = AuthService.getCurrentUser();
      expect(session).not.toBeNull();
      expect(session?.id).toBe(10);
      expect(session?.username).toBe('asad');
      expect(session?.fullName).toBe('Muhammad Asad');
      expect(session?.role).toBe('owner');
    });

    it('should clear session upon calling logout', () => {
      const mockUser: any = { id: 12, username: 'staff', fullName: 'Staff User', role: 'staff' };
      AuthService.setCurrentUser(mockUser);
      expect(AuthService.getCurrentUser()).not.toBeNull();

      AuthService.logout();
      expect(AuthService.getCurrentUser()).toBeNull();
    });
  });
});
