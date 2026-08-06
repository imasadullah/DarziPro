/**
 * Unit Tests for SettingService (Main Process)
 *
 * Strategy: Mock 'data-source' and entity modules to avoid TypeORM
 * decorator evaluation in the Vitest/esbuild environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Repository Mocks ──────────────────────────────────────────────────────────

const mockSettingRepository = {
  find:      vi.fn(),
  findOneBy: vi.fn(),
  save:      vi.fn(),
  clear:     vi.fn()
};

// ── Module Mocks ──────────────────────────────────────────────────────────────

vi.mock('../main/database/entities/setting.entity', () => ({
  Setting: class MockSetting {
    key!: string;
    value!: string;
  }
}));

vi.mock('../main/config/data-source', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => mockSettingRepository)
  }
}));

// ── Import After Mocks ────────────────────────────────────────────────────────

const { SettingService, SETTING_DEFAULTS } = await import('../main/services/setting.service');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getSettings ────────────────────────────────────────────────────────────

  describe('getSettings', () => {
    it('returns defaults when DB is empty', async () => {
      mockSettingRepository.find.mockResolvedValue([]);
      const result = await SettingService.getSettings();

      expect(result['shopName']).toBe('Darzi Pro');
      expect(result['currencySymbol']).toBe('Rs');
      expect(result['footerMessage']).toBe('Thank you for your business!');
      expect(result['dateFormat']).toBe('DD/MM/YYYY');
    });

    it('merges DB values over defaults', async () => {
      mockSettingRepository.find.mockResolvedValue([
        { key: 'shopName', value: 'My Custom Shop' },
        { key: 'currencySymbol', value: 'PKR' }
      ]);
      const result = await SettingService.getSettings();

      expect(result['shopName']).toBe('My Custom Shop');
      expect(result['currencySymbol']).toBe('PKR');
      // Non-overridden defaults should remain
      expect(result['footerMessage']).toBe('Thank you for your business!');
    });

    it('all default keys are present in result', async () => {
      mockSettingRepository.find.mockResolvedValue([]);
      const result = await SettingService.getSettings();
      const defaultKeys = Object.keys(SETTING_DEFAULTS);
      for (const key of defaultKeys) {
        expect(result).toHaveProperty(key);
      }
    });
  });

  // ── getSetting ─────────────────────────────────────────────────────────────

  describe('getSetting', () => {
    it('returns DB value when key exists', async () => {
      mockSettingRepository.findOneBy.mockResolvedValue({ key: 'shopName', value: 'Test Shop' });
      const result = await SettingService.getSetting('shopName');
      expect(result).toBe('Test Shop');
    });

    it('returns module default when key does not exist', async () => {
      mockSettingRepository.findOneBy.mockResolvedValue(null);
      const result = await SettingService.getSetting('shopName');
      expect(result).toBe('Darzi Pro');
    });

    it('returns provided fallback when key not in defaults', async () => {
      mockSettingRepository.findOneBy.mockResolvedValue(null);
      const result = await SettingService.getSetting('unknownKey', 'my-fallback');
      expect(result).toBe('my-fallback');
    });

    it('returns empty string for unknown key with no fallback', async () => {
      mockSettingRepository.findOneBy.mockResolvedValue(null);
      const result = await SettingService.getSetting('unknownKey');
      expect(result).toBe('');
    });
  });

  // ── saveSetting ────────────────────────────────────────────────────────────

  describe('saveSetting', () => {
    it('updates an existing setting', async () => {
      const existingRow = { key: 'shopName', value: 'Old Name' };
      mockSettingRepository.findOneBy.mockResolvedValue(existingRow);
      mockSettingRepository.save.mockResolvedValue({ key: 'shopName', value: 'New Name' });

      await SettingService.saveSetting('shopName', 'New Name');

      expect(mockSettingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'shopName', value: 'New Name' })
      );
    });

    it('creates a new setting when key does not exist', async () => {
      mockSettingRepository.findOneBy.mockResolvedValue(null);
      mockSettingRepository.save.mockResolvedValue({ key: 'shopCity', value: 'Lahore' });

      await SettingService.saveSetting('shopCity', 'Lahore');

      expect(mockSettingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'shopCity', value: 'Lahore' })
      );
    });
  });

  // ── saveSettings ──────────────────────────────────────────────────────────

  describe('saveSettings', () => {
    it('upserts multiple settings in batch', async () => {
      mockSettingRepository.findOneBy.mockResolvedValue(null);
      mockSettingRepository.save.mockResolvedValue({});

      await SettingService.saveSettings({
        shopName:     'Batch Shop',
        shopPhone:    '03001234567',
        shopCity:     'Karachi'
      });

      expect(mockSettingRepository.save).toHaveBeenCalledTimes(3);
    });

    it('handles empty settings map gracefully', async () => {
      await SettingService.saveSettings({});
      expect(mockSettingRepository.save).not.toHaveBeenCalled();
    });
  });

  // ── resetSettings ─────────────────────────────────────────────────────────

  describe('resetSettings', () => {
    it('clears all rows then re-seeds defaults', async () => {
      mockSettingRepository.clear.mockResolvedValue(undefined);
      mockSettingRepository.save.mockResolvedValue({});

      await SettingService.resetSettings();

      expect(mockSettingRepository.clear).toHaveBeenCalledTimes(1);
      // Should save all default keys
      expect(mockSettingRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ key: 'shopName', value: 'Darzi Pro' }),
          expect.objectContaining({ key: 'currencySymbol', value: 'Rs' }),
          expect.objectContaining({ key: 'footerMessage', value: 'Thank you for your business!' })
        ])
      );
    });

    it('seeds exactly the number of default keys', async () => {
      mockSettingRepository.clear.mockResolvedValue(undefined);
      let savedRows: any[] = [];
      mockSettingRepository.save.mockImplementation((rows: any[]) => {
        savedRows = rows;
        return Promise.resolve(rows);
      });

      await SettingService.resetSettings();

      expect(savedRows).toHaveLength(Object.keys(SETTING_DEFAULTS).length);
    });
  });
});
