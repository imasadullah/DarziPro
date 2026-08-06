import * as fs   from 'fs';
import * as path from 'path';
import { app }   from 'electron';
import { AppDataSource } from '../config/data-source';
import { SettingService } from './setting.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BackupType = 'manual' | 'automatic' | 'pre-restore';

export interface BackupEntry {
  name:      string;
  path:      string;
  createdAt: string;   // ISO-8601
  type:      BackupType;
  sizeBytes: number;
}

export interface BackupResult {
  path:      string;
  createdAt: string;
  sizeBytes: number;
  verified:  boolean;
}

export interface VerifyResult {
  valid:   boolean;
  message: string;
}

export interface AutoBackupConfig {
  frequency:  'disabled' | 'daily' | 'weekly' | 'monthly';
  maxBackups: number;   // 5 | 10 | 20
}

// ── Manifest helpers ──────────────────────────────────────────────────────────

const MANIFEST_FILENAME = 'backups-manifest.json';

function getBackupDir(): string {
  return path.join(app.getPath('userData'), 'backups');
}

function getManifestPath(): string {
  return path.join(getBackupDir(), MANIFEST_FILENAME);
}

function ensureBackupDir(): void {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readManifest(): BackupEntry[] {
  const manifestPath = getManifestPath();
  if (!fs.existsSync(manifestPath)) return [];
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw) as BackupEntry[];
  } catch {
    return [];
  }
}

function writeManifest(entries: BackupEntry[]): void {
  ensureBackupDir();
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  fs.writeFileSync(getManifestPath(), JSON.stringify(sorted, null, 2), 'utf8');
}

function addToManifest(entry: BackupEntry): void {
  const entries = readManifest();
  entries.push(entry);
  writeManifest(entries);
}

function removeFromManifest(filePath: string): void {
  const entries = readManifest().filter(e => e.path !== filePath);
  writeManifest(entries);
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatBackupFilename(prefix = 'DarziPro_Backup'): string {
  const now   = new Date();
  const yyyy  = now.getFullYear();
  const mm    = String(now.getMonth() + 1).padStart(2, '0');
  const dd    = String(now.getDate()).padStart(2, '0');
  const hh    = String(now.getHours()).padStart(2, '0');
  const min   = String(now.getMinutes()).padStart(2, '0');
  return `${prefix}_${yyyy}-${mm}-${dd}_${hh}-${min}.db`;
}

function getSourceDbPath(): string {
  // Mirrors the logic in data-source.ts
  try {
    if (app && app.getPath) {
      return path.join(app.getPath('userData'), 'database.sqlite');
    }
  } catch { /* ignore */ }
  return path.join(process.cwd(), 'database.sqlite');
}

// ── BackupService ─────────────────────────────────────────────────────────────

export class BackupService {

  // ── Verification ────────────────────────────────────────────────────────────

  /**
   * Opens the given file with better-sqlite3 in read-only mode
   * and runs PRAGMA integrity_check. Safe to call on any .db/.sqlite file.
   */
  public static verifyBackup(filePath: string): VerifyResult {
    if (!fs.existsSync(filePath)) {
      return { valid: false, message: 'File not found.' };
    }

    let db: any;
    try {
      // Dynamic require so the import stays compatible with ESM+CJS hybrid build
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const BetterSqlite3 = require('better-sqlite3');
      db = new BetterSqlite3(filePath, { readonly: true, fileMustExist: true });
      const rows: any[] = db.pragma('integrity_check');
      const ok = rows.length === 1 && rows[0]['integrity_check'] === 'ok';
      return ok
        ? { valid: true,  message: 'Database integrity verified.' }
        : { valid: false, message: `Integrity check failed: ${rows.map((r: any) => r['integrity_check']).join(', ')}` };
    } catch (err: any) {
      return { valid: false, message: err.message ?? 'Could not open database file.' };
    } finally {
      try { db?.close(); } catch { /* ignore */ }
    }
  }

  // ── Create Backup ────────────────────────────────────────────────────────────

  /**
   * Copies the live SQLite database to `destPath` using better-sqlite3's
   * .backup() API (online, non-locking). Verifies integrity before and after.
   */
  public static async createBackup(
    destPath: string,
    type: BackupType = 'manual'
  ): Promise<BackupResult> {
    const srcPath = getSourceDbPath();

    if (!fs.existsSync(srcPath)) {
      throw new Error('Source database file does not exist.');
    }

    // Pre-backup integrity check on the live DB
    const srcVerify = BackupService.verifyBackup(srcPath);
    if (!srcVerify.valid) {
      throw new Error(`Source database integrity check failed: ${srcVerify.message}`);
    }

    ensureBackupDir();

    // Use better-sqlite3's .backup() for a safe online backup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BetterSqlite3 = require('better-sqlite3');
    const db = new BetterSqlite3(srcPath, { readonly: true });
    try {
      await db.backup(destPath);
    } finally {
      db.close();
    }

    // Post-backup verification on the copy
    const copyVerify = BackupService.verifyBackup(destPath);
    if (!copyVerify.valid) {
      // Remove the bad copy to avoid confusion
      try { fs.unlinkSync(destPath); } catch { /* ignore */ }
      throw new Error(`Backup file failed verification: ${copyVerify.message}`);
    }

    const stat      = fs.statSync(destPath);
    const createdAt = new Date().toISOString();
    const name      = path.basename(destPath);

    const entry: BackupEntry = { name, path: destPath, createdAt, type, sizeBytes: stat.size };
    addToManifest(entry);

    return { path: destPath, createdAt, sizeBytes: stat.size, verified: true };
  }

  // ── Restore ──────────────────────────────────────────────────────────────────

  /**
   * Validates the restore source, auto-saves current DB, then replaces it.
   * Calls app.relaunch() + app.exit(0) — the renderer must trigger this.
   */
  public static async restoreBackup(srcPath: string): Promise<void> {
    if (!fs.existsSync(srcPath)) {
      throw new Error('Backup file not found.');
    }

    // Validate the file the user wants to restore
    const verify = BackupService.verifyBackup(srcPath);
    if (!verify.valid) {
      throw new Error(`The selected file is not a valid database: ${verify.message}`);
    }

    const liveDbPath = getSourceDbPath();

    // Auto-save current DB before restore
    ensureBackupDir();
    const preRestoreDest = path.join(
      getBackupDir(),
      formatBackupFilename('DarziPro_PreRestore')
    );
    try {
      await BackupService.createBackup(preRestoreDest, 'pre-restore');
    } catch {
      // Continue even if pre-restore backup fails (live DB may be corrupt)
    }

    // Close TypeORM connection so the file is not locked
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    } catch { /* ignore */ }

    // Replace the live database
    fs.copyFileSync(srcPath, liveDbPath);

    // Relaunch the application
    app.relaunch();
    app.exit(0);
  }

  // ── List Backups ─────────────────────────────────────────────────────────────

  public static listBackups(): BackupEntry[] {
    ensureBackupDir();
    const entries = readManifest();

    // Filter to entries whose files actually still exist on disk
    const live = entries.filter(e => fs.existsSync(e.path));

    // If entries were pruned, persist the cleaned manifest
    if (live.length !== entries.length) {
      writeManifest(live);
    }

    return live;
  }

  // ── Delete Backup ────────────────────────────────────────────────────────────

  public static deleteBackup(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    removeFromManifest(filePath);
  }

  // ── Auto Backup Config ───────────────────────────────────────────────────────

  public static async getAutoBackupConfig(): Promise<AutoBackupConfig> {
    const frequency  = await SettingService.getSetting('backupFrequency',  'disabled') as AutoBackupConfig['frequency'];
    const maxBackups = parseInt(await SettingService.getSetting('backupMaxCount', '10'), 10);
    return { frequency, maxBackups };
  }

  public static async saveAutoBackupConfig(config: AutoBackupConfig): Promise<void> {
    await SettingService.saveSettings({
      backupFrequency: config.frequency,
      backupMaxCount:  String(config.maxBackups)
    });
  }

  // ── Auto Backup Execution ────────────────────────────────────────────────────

  /**
   * Checks whether a scheduled backup is due and, if so, runs one.
   * Trims oldest automatic backups to stay within the configured limit.
   */
  public static async runAutoBackupIfDue(): Promise<void> {
    const config = await BackupService.getAutoBackupConfig();
    if (config.frequency === 'disabled') return;

    const backups   = BackupService.listBackups();
    const autoOnes  = backups.filter(b => b.type === 'automatic');
    const lastAuto  = autoOnes[0]; // sorted newest-first by manifest helper

    if (lastAuto) {
      const lastDate = new Date(lastAuto.createdAt);
      const now      = new Date();
      const msDiff   = now.getTime() - lastDate.getTime();
      const daysDiff = msDiff / (1000 * 60 * 60 * 24);

      const dueDays: Record<string, number> = {
        daily:   1,
        weekly:  7,
        monthly: 30
      };

      if (daysDiff < dueDays[config.frequency]) {
        return; // Not due yet
      }
    }

    // Create automatic backup in the default backups folder
    const destPath = path.join(getBackupDir(), formatBackupFilename('DarziPro_Auto'));
    try {
      await BackupService.createBackup(destPath, 'automatic');
    } catch (err: any) {
      console.error('[BackupService] Auto-backup failed:', err.message);
      return;
    }

    // Enforce max-backup retention (automatic only)
    const allAuto = BackupService.listBackups().filter(b => b.type === 'automatic');
    if (allAuto.length > config.maxBackups) {
      const toDelete = allAuto.slice(config.maxBackups); // oldest are at the end
      for (const entry of toDelete) {
        try { BackupService.deleteBackup(entry.path); } catch { /* ignore */ }
      }
    }
  }

  // ── Scheduler ────────────────────────────────────────────────────────────────

  private static _schedulerTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Starts an hourly interval that checks if a scheduled backup is due.
   * Safe to call multiple times — only one interval runs at a time.
   */
  public static initAutoBackupScheduler(): void {
    if (BackupService._schedulerTimer !== null) return;

    // Run once immediately on startup, then every hour
    BackupService.runAutoBackupIfDue().catch(() => { /* silent */ });

    BackupService._schedulerTimer = setInterval(() => {
      BackupService.runAutoBackupIfDue().catch(() => { /* silent */ });
    }, 60 * 60 * 1000); // 1 hour
  }

  public static stopAutoBackupScheduler(): void {
    if (BackupService._schedulerTimer !== null) {
      clearInterval(BackupService._schedulerTimer);
      BackupService._schedulerTimer = null;
    }
  }
}
