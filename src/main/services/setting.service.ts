import { AppDataSource } from '../config/data-source';
import { Setting } from '../database/entities/setting.entity';

// ── Default Setting Values ────────────────────────────────────────────────────

export const SETTING_DEFAULTS: Record<string, string> = {
  // Shop Information
  shopName:            'Darzi Pro',
  ownerName:           '',
  shopPhone:           '',
  shopWhatsApp:        '',
  shopEmail:           '',
  shopAddress:         '',
  shopCity:            '',
  shopLogoPath:        '',

  // Application Settings
  currencySymbol:      'Rs',
  currencyPosition:    'prefix',
  dateFormat:          'DD/MM/YYYY',
  defaultDeliveryDays: '7',

  // Receipt Settings
  receiptHeader:       '',
  footerMessage:       'Thank you for your business!',
  receiptShowLogo:     'true',
  receiptShowAddress:  'true',
  receiptShowPhone:    'true'
};

// ── SettingService ────────────────────────────────────────────────────────────

export class SettingService {
  private static getRepository() {
    return AppDataSource.getRepository(Setting);
  }

  /**
   * Get all settings as a key/value map.
   * Merges DB values over defaults so all keys are always present.
   */
  public static async getSettings(): Promise<Record<string, string>> {
    const repo = this.getRepository();
    const rows = await repo.find();
    const merged: Record<string, string> = { ...SETTING_DEFAULTS };
    rows.forEach(r => (merged[r.key] = r.value));
    return merged;
  }

  /**
   * Get a single setting value with an optional fallback default.
   */
  public static async getSetting(key: string, fallback?: string): Promise<string> {
    const repo = this.getRepository();
    const row = await repo.findOneBy({ key });
    if (row) return row.value;
    if (fallback !== undefined) return fallback;
    return SETTING_DEFAULTS[key] ?? '';
  }

  /**
   * Upsert a single setting key/value pair.
   */
  public static async saveSetting(key: string, value: string): Promise<void> {
    const repo = this.getRepository();
    let row = await repo.findOneBy({ key });
    if (!row) {
      row = new Setting();
      row.key = key;
    }
    row.value = value;
    await repo.save(row);
  }

  /**
   * Upsert multiple settings in one operation.
   */
  public static async saveSettings(settings: Record<string, string>): Promise<void> {
    const repo = this.getRepository();
    const entries = Object.entries(settings);

    for (const [key, value] of entries) {
      let row = await repo.findOneBy({ key });
      if (!row) {
        row = new Setting();
        row.key = key;
      }
      row.value = value;
      await repo.save(row);
    }
  }

  /**
   * Delete all settings rows and re-seed with defaults.
   */
  public static async resetSettings(): Promise<void> {
    const repo = this.getRepository();
    await repo.clear();
    const defaults = Object.entries(SETTING_DEFAULTS).map(([key, value]) => {
      const row = new Setting();
      row.key   = key;
      row.value = value;
      return row;
    });
    await repo.save(defaults);
  }
}
