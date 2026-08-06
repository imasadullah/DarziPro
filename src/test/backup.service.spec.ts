/**
 * Unit Tests for BackupService (Main Process)
 *
 * Strategy:
 *  - Mock 'better-sqlite3' to avoid native binary loading in Vitest.
 *  - Mock 'fs' for filesystem operations.
 *  - Mock 'electron' so app.getPath() resolves predictably.
 *  - Mock SettingService for auto-config persistence tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';

// ── Constants ─────────────────────────────────────────────────────────────────

const MOCK_USER_DATA   = '/mock/userData';
const MOCK_DB_PATH     = `${MOCK_USER_DATA}/database.sqlite`;
const MOCK_BACKUP_DIR  = `${MOCK_USER_DATA}/backups`;
const MOCK_MANIFEST    = `${MOCK_BACKUP_DIR}/backups-manifest.json`;
const MOCK_DEST_PATH   = `${MOCK_BACKUP_DIR}/DarziPro_Backup_2025-01-01_10-00.db`;

// ── Electron Mock ─────────────────────────────────────────────────────────────

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => (name === 'userData' ? MOCK_USER_DATA : '/mock')),
    relaunch: vi.fn(),
    exit:     vi.fn()
  }
}));

// ── better-sqlite3 Mock ───────────────────────────────────────────────────────
// The service calls require('better-sqlite3') inside each method body (dynamic
// require), so vi.mock() is insufficient.  We intercept Module._resolveFilename
// and inject a synthetic module instead.

const mockPragma = vi.fn();
const mockBackup = vi.fn();
const mockClose  = vi.fn();

const mockDbInstance = {
  pragma: mockPragma,
  backup: mockBackup,
  close:  mockClose
};

const MockDatabaseConstructor = vi.fn(() => mockDbInstance);

// Patch Node's require cache so 'better-sqlite3' resolves to our mock
const Module = await import('node:module');
const originalLoad = (Module as any).default._resolveFilename?.bind((Module as any).default);

// Override require for better-sqlite3 by injecting into the require cache
const fakeBs3ModuleId = require.resolve('better-sqlite3');
(require as any).cache[fakeBs3ModuleId] = {
  id:       fakeBs3ModuleId,
  filename: fakeBs3ModuleId,
  loaded:   true,
  exports:  MockDatabaseConstructor,
  children: [],
  paths:    []
};


// ── fs Mock ───────────────────────────────────────────────────────────────────

const mockFs = {
  existsSync:    vi.fn(),
  mkdirSync:     vi.fn(),
  readFileSync:  vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync:    vi.fn(),
  statSync:      vi.fn(),
  copyFileSync:  vi.fn()
};

vi.mock('fs', () => mockFs);

// ── path Mock (pass-through for real path logic) ──────────────────────────────
// path is not mocked — real path.join is used

// ── AppDataSource Mock ────────────────────────────────────────────────────────

vi.mock('../main/config/data-source', () => ({
  AppDataSource: {
    isInitialized: true,
    destroy: vi.fn().mockResolvedValue(undefined)
  }
}));

// ── SettingService Mock ───────────────────────────────────────────────────────

vi.mock('../main/database/entities/setting.entity', () => ({
  Setting: class MockSetting { key!: string; value!: string; }
}));
vi.mock('../main/config/data-source', () => ({
  AppDataSource: { isInitialized: true, destroy: vi.fn().mockResolvedValue(undefined), getRepository: vi.fn() }
}));

const mockSettingService = {
  getSetting:   vi.fn(),
  saveSettings: vi.fn()
};

vi.mock('../main/services/setting.service', () => ({
  SettingService: mockSettingService
}));

// ── Import After Mocks ────────────────────────────────────────────────────────

const { BackupService } = await import('../main/services/backup.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeManifestEntry(overrides: Partial<any> = {}) {
  return {
    name:      'DarziPro_Backup_2025-01-01_10-00.db',
    path:      MOCK_DEST_PATH,
    createdAt: new Date().toISOString(),
    type:      'manual',
    sizeBytes: 204800,
    ...overrides
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: files exist
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('[]');
    mockFs.statSync.mockReturnValue({ size: 204800 });
    mockFs.writeFileSync.mockImplementation(() => {});
    // Default: pragma returns 'ok'
    mockPragma.mockReturnValue([{ integrity_check: 'ok' }]);
    mockBackup.mockResolvedValue(undefined);
  });

  // ── verifyBackup ──────────────────────────────────────────────────────────

  describe('verifyBackup', () => {
    it('returns valid:true when PRAGMA integrity_check returns ok', () => {
      mockPragma.mockReturnValue([{ integrity_check: 'ok' }]);
      const result = BackupService.verifyBackup('/some/file.db');
      expect(result.valid).toBe(true);
      expect(result.message).toContain('verified');
    });

    it('returns valid:false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      const result = BackupService.verifyBackup('/missing/file.db');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('returns valid:false when PRAGMA reports errors', () => {
      mockPragma.mockReturnValue([{ integrity_check: 'page 42: wrong page type' }]);
      const result = BackupService.verifyBackup('/corrupt.db');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Integrity check failed');
    });

    it('returns valid:false when better-sqlite3 throws (corrupt file)', () => {
      MockDatabaseConstructor.mockImplementationOnce(() => { throw new Error('file is not a database'); });
      const result = BackupService.verifyBackup('/bad.db');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('file is not a database');
    });
  });

  // ── createBackup ──────────────────────────────────────────────────────────

  describe('createBackup', () => {
    it('creates backup file and returns result with verified:true', async () => {
      const result = await BackupService.createBackup(MOCK_DEST_PATH, 'manual');

      expect(mockBackup).toHaveBeenCalledWith(MOCK_DEST_PATH);
      expect(result.verified).toBe(true);
      expect(result.path).toBe(MOCK_DEST_PATH);
      expect(result.sizeBytes).toBe(204800);
    });

    it('writes an entry to the manifest after successful backup', async () => {
      await BackupService.createBackup(MOCK_DEST_PATH, 'manual');

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const written = mockFs.writeFileSync.mock.calls.find(
        (c: any[]) => c[0] === MOCK_MANIFEST
      );
      expect(written).toBeDefined();
      const manifest = JSON.parse(written![1] as string);
      expect(manifest).toHaveLength(1);
      expect(manifest[0].type).toBe('manual');
    });

    it('throws when source DB does not exist', async () => {
      mockFs.existsSync.mockImplementation((p: string) => p !== MOCK_DB_PATH);
      await expect(BackupService.createBackup(MOCK_DEST_PATH)).rejects.toThrow(
        'Source database file does not exist'
      );
    });

    it('throws and removes dest file when post-backup verification fails', async () => {
      // First pragma call (source verify) succeeds; second (copy verify) fails
      mockPragma
        .mockReturnValueOnce([{ integrity_check: 'ok' }])
        .mockReturnValueOnce([{ integrity_check: 'corrupt' }]);

      await expect(BackupService.createBackup(MOCK_DEST_PATH)).rejects.toThrow(
        'Backup file failed verification'
      );
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(MOCK_DEST_PATH);
    });

    it('throws when source integrity check fails', async () => {
      mockPragma.mockReturnValueOnce([{ integrity_check: 'page 5: btree page corrupted' }]);
      await expect(BackupService.createBackup(MOCK_DEST_PATH)).rejects.toThrow(
        'Source database integrity check failed'
      );
    });
  });

  // ── listBackups ───────────────────────────────────────────────────────────

  describe('listBackups', () => {
    it('returns empty array when manifest does not exist', () => {
      mockFs.readFileSync.mockReturnValue('[]');
      const list = BackupService.listBackups();
      expect(list).toEqual([]);
    });

    it('returns backups from manifest when files exist', () => {
      const entry = makeManifestEntry();
      mockFs.readFileSync.mockReturnValue(JSON.stringify([entry]));
      const list = BackupService.listBackups();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe(entry.name);
    });

    it('filters out entries whose files no longer exist on disk', () => {
      const entry = makeManifestEntry({ path: '/deleted/file.db' });
      mockFs.readFileSync.mockReturnValue(JSON.stringify([entry]));
      mockFs.existsSync.mockImplementation((p: string) => p !== '/deleted/file.db');
      const list = BackupService.listBackups();
      expect(list).toHaveLength(0);
    });
  });

  // ── deleteBackup ──────────────────────────────────────────────────────────

  describe('deleteBackup', () => {
    it('unlinks the file and removes entry from manifest', () => {
      const entry = makeManifestEntry();
      mockFs.readFileSync.mockReturnValue(JSON.stringify([entry]));

      BackupService.deleteBackup(MOCK_DEST_PATH);

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(MOCK_DEST_PATH);
      const written = mockFs.writeFileSync.mock.calls.find(
        (c: any[]) => c[0] === MOCK_MANIFEST
      );
      const manifest = JSON.parse(written![1] as string);
      expect(manifest).toHaveLength(0);
    });

    it('does not throw when file does not exist (already deleted)', () => {
      mockFs.existsSync.mockImplementation((p: string) => p !== MOCK_DEST_PATH);
      mockFs.readFileSync.mockReturnValue('[]');
      expect(() => BackupService.deleteBackup(MOCK_DEST_PATH)).not.toThrow();
    });
  });

  // ── restoreBackup ─────────────────────────────────────────────────────────

  describe('restoreBackup', () => {
    it('throws when backup file does not exist', async () => {
      mockFs.existsSync.mockImplementation((p: string) => p !== MOCK_DEST_PATH);
      await expect(BackupService.restoreBackup(MOCK_DEST_PATH)).rejects.toThrow(
        'Backup file not found'
      );
    });

    it('throws when backup file fails integrity check', async () => {
      mockPragma.mockReturnValueOnce([{ integrity_check: 'damaged' }]);
      await expect(BackupService.restoreBackup(MOCK_DEST_PATH)).rejects.toThrow(
        'not a valid database'
      );
    });

    it('copies the backup file over the live DB and relaunches on success', async () => {
      // All integrity checks pass, backup creation for pre-restore succeeds
      mockPragma.mockReturnValue([{ integrity_check: 'ok' }]);

      const { app } = await import('electron');
      await BackupService.restoreBackup(MOCK_DEST_PATH);

      expect(mockFs.copyFileSync).toHaveBeenCalledWith(MOCK_DEST_PATH, MOCK_DB_PATH);
      expect(app.relaunch).toHaveBeenCalled();
      expect(app.exit).toHaveBeenCalledWith(0);
    });
  });

  // ── Auto-backup scheduler ─────────────────────────────────────────────────

  describe('runAutoBackupIfDue', () => {
    it('does nothing when frequency is disabled', async () => {
      mockSettingService.getSetting
        .mockResolvedValueOnce('disabled')
        .mockResolvedValueOnce('10');
      mockFs.readFileSync.mockReturnValue('[]');

      await BackupService.runAutoBackupIfDue();

      expect(mockBackup).not.toHaveBeenCalled();
    });

    it('creates backup when no previous auto backup exists (daily)', async () => {
      mockSettingService.getSetting
        .mockResolvedValueOnce('daily')
        .mockResolvedValueOnce('10');
      mockFs.readFileSync.mockReturnValue('[]');   // empty manifest = no prior backups

      await BackupService.runAutoBackupIfDue();

      expect(mockBackup).toHaveBeenCalled();
    });

    it('skips backup when last daily backup was less than 1 day ago', async () => {
      mockSettingService.getSetting
        .mockResolvedValueOnce('daily')
        .mockResolvedValueOnce('10');

      const recentEntry = makeManifestEntry({
        type:      'automatic',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()  // 1 hour ago
      });
      mockFs.readFileSync.mockReturnValue(JSON.stringify([recentEntry]));

      await BackupService.runAutoBackupIfDue();

      expect(mockBackup).not.toHaveBeenCalled();
    });

    it('deletes oldest auto backups when maxBackups is exceeded', async () => {
      mockSettingService.getSetting
        .mockResolvedValueOnce('daily')  // first call: frequency
        .mockResolvedValueOnce('2')      // second call: maxBackups (limit = 2)
        .mockResolvedValueOnce('daily')  // called again inside createBackup → getAutoConfig inside retention
        .mockResolvedValueOnce('2');

      // No prior backups → backup runs
      const createCalls: string[] = [];
      mockFs.readFileSync
        .mockReturnValueOnce('[]')                             // listBackups() before create
        .mockReturnValueOnce('[]')                             // createBackup reads manifest
        .mockReturnValueOnce(JSON.stringify([                  // listBackups() after create (3 auto entries > max 2)
          makeManifestEntry({ type: 'automatic', createdAt: new Date(Date.now()).toISOString(), path: '/b/3.db', name: '3.db' }),
          makeManifestEntry({ type: 'automatic', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), path: '/b/2.db', name: '2.db' }),
          makeManifestEntry({ type: 'automatic', createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), path: '/b/1.db', name: '1.db' })
        ]));

      await BackupService.runAutoBackupIfDue();

      // The oldest backup (/b/1.db) should have been deleted
      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/b/1.db');
    });
  });

  // ── Scheduler ─────────────────────────────────────────────────────────────

  describe('initAutoBackupScheduler', () => {
    afterEach(() => {
      BackupService.stopAutoBackupScheduler();
    });

    it('starts without error and can be stopped', () => {
      mockSettingService.getSetting
        .mockResolvedValue('disabled');
      mockFs.readFileSync.mockReturnValue('[]');

      expect(() => BackupService.initAutoBackupScheduler()).not.toThrow();
      BackupService.stopAutoBackupScheduler();
    });

    it('calling initAutoBackupScheduler twice does not create duplicate intervals', () => {
      mockSettingService.getSetting.mockResolvedValue('disabled');
      mockFs.readFileSync.mockReturnValue('[]');

      BackupService.initAutoBackupScheduler();
      const timerRef1 = (BackupService as any)._schedulerTimer;
      BackupService.initAutoBackupScheduler();  // second call should be no-op
      const timerRef2 = (BackupService as any)._schedulerTimer;

      expect(timerRef1).toBe(timerRef2);
    });
  });
});
