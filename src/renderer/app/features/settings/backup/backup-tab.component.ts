import {
  Component, ChangeDetectionStrategy, OnInit, inject, effect
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatSelectModule }          from '@angular/material/select';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatTableModule }           from '@angular/material/table';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BackupStoreService }       from './backup-store.service';

// ── Confirm Dialog ────────────────────────────────────────────────────────────

@Component({
  selector: 'app-restore-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="dialog-shell">
      <div class="dialog-icon">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <h2 class="dialog-title">Restore Backup?</h2>
      <p class="dialog-body">
        This will <strong>replace your current database</strong> with the selected backup.
        Your current data will be automatically saved as a pre-restore backup first.
      </p>
      <p class="dialog-body dialog-path">{{ filePath }}</p>
      <p class="dialog-warning">The application will restart automatically after restore.</p>
      <div class="dialog-actions">
        <button mat-stroked-button class="btn-cancel" [mat-dialog-close]="false">Cancel</button>
        <button mat-raised-button class="btn-restore" [mat-dialog-close]="true">
          <mat-icon>restore</mat-icon> Restore & Restart
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-shell {
      padding: 28px 24px 20px;
      max-width: 420px;
      text-align: center;
    }
    .dialog-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(245,158,11,0.15);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .dialog-icon mat-icon {
      font-size: 28px; width: 28px; height: 28px;
      color: #f59e0b;
    }
    .dialog-title {
      font-size: 1.15rem; font-weight: 700;
      color: var(--text-primary, #e2e8f0); margin: 0 0 12px;
    }
    .dialog-body {
      font-size: 0.875rem; color: var(--text-secondary, #94a3b8);
      margin: 0 0 10px; line-height: 1.6;
    }
    .dialog-path {
      font-size: 0.78rem; font-family: monospace;
      background: rgba(255,255,255,0.05); border-radius: 6px;
      padding: 6px 10px; word-break: break-all;
      color: var(--text-muted, #64748b);
    }
    .dialog-warning {
      font-size: 0.8rem; color: #f59e0b;
      margin: 4px 0 20px;
    }
    .dialog-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-cancel {
      border-color: var(--border, rgba(255,255,255,0.15)) !important;
      color: var(--text-secondary, #94a3b8) !important;
      height: 40px; border-radius: 8px;
    }
    .btn-restore {
      background: #ef4444 !important; color: #fff !important;
      height: 40px; border-radius: 8px;
    }
  `]
})
export class RestoreConfirmDialogComponent {
  filePath = '';
}

// ── Main Backup Tab ───────────────────────────────────────────────────────────

@Component({
  selector: 'app-backup-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatSelectModule, MatFormFieldModule, MatTableModule, MatTooltipModule,
    MatDialogModule, RestoreConfirmDialogComponent
  ],
  template: `
    <div class="tab-content">

      <!-- ── Header ───────────────────────────────────────────────────────── -->
      <div class="tab-header">
        <div>
          <h2 class="tab-title">Backup &amp; Restore</h2>
          <p class="tab-subtitle">
            Protect your business data with regular backups. All backups include
            the complete SQLite database.
          </p>
        </div>
      </div>

      <!-- ── Feedback Bar ──────────────────────────────────────────────────── -->
      @if (store.successMessage()) {
        <div class="feedback-bar success-bar" role="alert">
          <mat-icon>check_circle</mat-icon>
          <span>{{ store.successMessage() }}</span>
        </div>
      }
      @if (store.error()) {
        <div class="feedback-bar error-bar" role="alert">
          <mat-icon>error_outline</mat-icon>
          <span>{{ store.error() }}</span>
        </div>
      }

      <!-- ── Row: Manual + Restore Cards ──────────────────────────────────── -->
      <div class="cards-row">

        <!-- Create Backup Card -->
        <div class="action-card">
          <div class="card-icon-wrap card-icon--blue">
            <mat-icon>backup</mat-icon>
          </div>
          <div class="card-body">
            <h3 class="card-title">Create Backup</h3>
            <p class="card-desc">
              Save a verified copy of your database. You will be prompted to choose
              a save location.
            </p>
            <div class="card-meta">
              <span class="meta-badge meta-badge--blue">Manual</span>
              <span class="meta-text">Includes full SQLite database</span>
            </div>
          </div>
          <button
            id="btn-create-backup"
            mat-raised-button
            class="btn-primary card-action-btn"
            [disabled]="store.operating()"
            (click)="onCreateBackup()"
          >
            @if (store.operating()) {
              <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
              Working…
            } @else {
              <mat-icon>backup</mat-icon>
              Create Backup
            }
          </button>
        </div>

        <!-- Restore Card -->
        <div class="action-card">
          <div class="card-icon-wrap card-icon--amber">
            <mat-icon>restore</mat-icon>
          </div>
          <div class="card-body">
            <h3 class="card-title">Restore Backup</h3>
            <p class="card-desc">
              Replace the current database with a backup file. A pre-restore
              backup is created automatically before proceeding.
            </p>
            <div class="card-meta">
              <span class="meta-badge meta-badge--amber">⚠ Destructive</span>
              <span class="meta-text">App will restart after restore</span>
            </div>
          </div>
          <button
            id="btn-restore-backup"
            mat-stroked-button
            class="btn-restore card-action-btn"
            [disabled]="store.operating()"
            (click)="onRestore()"
          >
            @if (store.operating()) {
              <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
              Working…
            } @else {
              <mat-icon>restore</mat-icon>
              Restore Backup
            }
          </button>
        </div>

      </div>

      <!-- ── Auto Backup Settings ──────────────────────────────────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-icon-wrap section-icon--purple">
            <mat-icon>schedule</mat-icon>
          </div>
          <div>
            <h3 class="section-title">Automatic Backups</h3>
            <p class="section-subtitle">
              Schedule backups to run in the background. Oldest backups are deleted
              automatically when the limit is reached.
            </p>
          </div>
        </div>

        <form [formGroup]="autoForm" (ngSubmit)="onSaveAutoConfig()" novalidate>
          <div class="auto-form-grid">

            <mat-form-field appearance="outline" class="auto-field">
              <mat-label>Backup Frequency</mat-label>
              <mat-select formControlName="frequency" id="select-backup-frequency">
                <mat-option value="disabled">Disabled</mat-option>
                <mat-option value="daily">Daily</mat-option>
                <mat-option value="weekly">Weekly</mat-option>
                <mat-option value="monthly">Monthly</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="auto-field">
              <mat-label>Maximum Retained Backups</mat-label>
              <mat-select formControlName="maxBackups" id="select-max-backups">
                <mat-option [value]="5">5 backups</mat-option>
                <mat-option [value]="10">10 backups</mat-option>
                <mat-option [value]="20">20 backups</mat-option>
              </mat-select>
              <mat-hint>Oldest automatic backups are deleted when exceeded</mat-hint>
            </mat-form-field>

          </div>

          <div class="section-actions">
            <button
              id="btn-save-auto-config"
              type="submit"
              mat-raised-button
              class="btn-primary"
              [disabled]="autoForm.invalid || store.savingConfig()"
            >
              @if (store.savingConfig()) {
                <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
              } @else {
                <mat-icon>save</mat-icon>
              }
              Save Schedule
            </button>
          </div>
        </form>
      </div>

      <!-- ── Backup History ────────────────────────────────────────────────── -->
      <div class="section-card history-section">
        <div class="section-header">
          <div class="section-icon-wrap section-icon--teal">
            <mat-icon>history</mat-icon>
          </div>
          <div>
            <h3 class="section-title">Backup History</h3>
            <p class="section-subtitle">{{ store.backupCount() }} backup(s) on record.</p>
          </div>
          <button
            mat-icon-button
            class="btn-refresh"
            (click)="store.loadBackups()"
            [disabled]="store.loading()"
            matTooltip="Refresh history"
            id="btn-refresh-history"
          >
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" class="history-progress"></mat-progress-bar>
        }

        @if (!store.loading() && !store.hasBackups()) {
          <div class="empty-state">
            <mat-icon class="empty-icon">cloud_off</mat-icon>
            <p class="empty-title">No backups yet</p>
            <p class="empty-sub">Create your first backup using the button above.</p>
          </div>
        }

        @if (store.hasBackups()) {
          <div class="table-wrap">
            <table mat-table [dataSource]="store.backups()" class="backup-table">

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">
                  <div class="cell-name">
                    <mat-icon class="file-icon">storage</mat-icon>
                    <span class="filename-text">{{ row.name }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let row">
                  <span class="type-chip" [class]="'type-chip--' + row.type">
                    {{ typeLabel(row.type) }}
                  </span>
                </td>
              </ng-container>

              <!-- Created Column -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let row" class="cell-date">
                  {{ row.createdAt | date:'dd MMM yyyy, HH:mm' }}
                </td>
              </ng-container>

              <!-- Size Column -->
              <ng-container matColumnDef="size">
                <th mat-header-cell *matHeaderCellDef>Size</th>
                <td mat-cell *matCellDef="let row" class="cell-size">
                  {{ formatBytes(row.sizeBytes) }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
                <td mat-cell *matCellDef="let row" class="col-actions">
                  <div class="action-btns">
                    <button
                      mat-icon-button
                      class="icon-btn icon-btn--blue"
                      (click)="onRestoreFromHistory(row)"
                      [disabled]="store.operating()"
                      matTooltip="Restore this backup"
                      [attr.id]="'btn-restore-' + row.name"
                    >
                      <mat-icon>restore</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      class="icon-btn icon-btn--teal"
                      (click)="store.openFolder(row)"
                      matTooltip="Open containing folder"
                      [attr.id]="'btn-folder-' + row.name"
                    >
                      <mat-icon>folder_open</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      class="icon-btn icon-btn--green"
                      (click)="store.verifyBackup(row)"
                      matTooltip="Verify backup integrity"
                      [attr.id]="'btn-verify-' + row.name"
                    >
                      <mat-icon>verified</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      class="icon-btn icon-btn--red"
                      (click)="onDelete(row)"
                      matTooltip="Delete backup"
                      [attr.id]="'btn-delete-' + row.name"
                    >
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="backup-row"></tr>
            </table>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .tab-content { padding: 0; display: flex; flex-direction: column; gap: 20px; }

    /* Header */
    .tab-header { margin-bottom: 4px; }
    .tab-title { font-size: 1.15rem; font-weight: 600; color: var(--text-primary, #e2e8f0); margin: 0 0 4px; }
    .tab-subtitle { font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin: 0; }

    /* Feedback */
    .feedback-bar {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; border-radius: 10px;
      font-size: 0.875rem; font-weight: 500;
    }
    .feedback-bar mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .feedback-bar span { white-space: pre-wrap; word-break: break-word; }
    .success-bar {
      background: rgba(16,185,129,0.10); border: 1px solid rgba(16,185,129,0.28); color: #6ee7b7;
    }
    .error-bar {
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.28); color: #f87171;
    }

    /* Cards Row */
    .cards-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }

    .action-card {
      background: var(--surface-primary, rgba(255,255,255,0.03));
      border: 1px solid var(--border, rgba(255,255,255,0.07));
      border-radius: 14px; padding: 24px;
      display: flex; flex-direction: column; gap: 14px;
    }

    .card-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .card-icon--blue  { background: rgba(99,102,241,0.15); color: #818cf8; }
    .card-icon--amber { background: rgba(245,158,11,0.15); color: #fbbf24; }

    .card-body { flex: 1; }
    .card-title { font-size: 1rem; font-weight: 600; color: var(--text-primary, #e2e8f0); margin: 0 0 6px; }
    .card-desc  { font-size: 0.82rem; color: var(--text-secondary, #94a3b8); margin: 0 0 12px; line-height: 1.55; }

    .card-meta { display: flex; align-items: center; gap: 8px; }
    .meta-badge {
      font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
      padding: 2px 8px; border-radius: 6px; text-transform: uppercase;
    }
    .meta-badge--blue  { background: rgba(99,102,241,0.18); color: #a5b4fc; }
    .meta-badge--amber { background: rgba(245,158,11,0.18); color: #fcd34d; }
    .meta-text { font-size: 0.78rem; color: var(--text-muted, #64748b); }

    .card-action-btn { height: 40px; border-radius: 8px; font-size: 0.875rem; align-self: flex-start; }
    .btn-primary {
      background: var(--accent, #6366f1) !important; color: #fff !important;
    }
    .btn-restore {
      border-color: rgba(245,158,11,0.4) !important; color: #fbbf24 !important;
    }

    /* Section Card */
    .section-card {
      background: var(--surface-primary, rgba(255,255,255,0.03));
      border: 1px solid var(--border, rgba(255,255,255,0.07));
      border-radius: 14px; padding: 24px;
      display: flex; flex-direction: column; gap: 20px;
    }
    .section-header {
      display: flex; align-items: flex-start; gap: 14px;
    }
    .section-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .section-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .section-icon--purple { background: rgba(139,92,246,0.15); color: #a78bfa; }
    .section-icon--teal   { background: rgba(20,184,166,0.15); color: #5eead4; }

    .section-title    { font-size: 0.975rem; font-weight: 600; color: var(--text-primary, #e2e8f0); margin: 0 0 2px; }
    .section-subtitle { font-size: 0.82rem; color: var(--text-muted, #94a3b8); margin: 0; }

    /* Auto config form */
    .auto-form-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .auto-field { width: 100%; }
    .section-actions { display: flex; justify-content: flex-end; }

    /* History */
    .btn-refresh { margin-left: auto; color: var(--text-muted, #64748b); }
    .history-progress { border-radius: 4px; margin-bottom: 8px; }

    .empty-state {
      text-align: center; padding: 36px 16px;
      color: var(--text-muted, #64748b);
    }
    .empty-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.4; margin-bottom: 10px; }
    .empty-title { font-size: 0.95rem; font-weight: 600; margin: 0 0 4px; }
    .empty-sub   { font-size: 0.8rem; margin: 0; }

    /* Table */
    .table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--border, rgba(255,255,255,0.07)); }
    .backup-table { width: 100%; }

    ::ng-deep .backup-table .mat-mdc-header-row {
      background: var(--surface-secondary, rgba(255,255,255,0.02));
    }
    ::ng-deep .backup-table .mat-mdc-header-cell {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--text-muted, #64748b);
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
    }
    ::ng-deep .backup-table .mat-mdc-cell {
      color: var(--text-primary, #e2e8f0);
      font-size: 0.85rem;
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.04));
    }
    ::ng-deep .backup-table .backup-row:hover {
      background: rgba(255,255,255,0.02);
    }

    .cell-name {
      display: flex; align-items: center; gap: 8px;
      max-width: 300px; overflow: hidden;
    }
    .file-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-muted, #64748b); flex-shrink: 0; }
    .filename-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cell-date { color: var(--text-secondary, #94a3b8); white-space: nowrap; }
    .cell-size { color: var(--text-secondary, #94a3b8); white-space: nowrap; }
    .col-actions { text-align: right; }

    /* Type Chips */
    .type-chip {
      font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
      padding: 3px 9px; border-radius: 6px; text-transform: capitalize;
      white-space: nowrap;
    }
    .type-chip--manual      { background: rgba(99,102,241,0.18); color: #a5b4fc; }
    .type-chip--automatic   { background: rgba(20,184,166,0.18); color: #5eead4; }
    .type-chip--pre-restore { background: rgba(245,158,11,0.18); color: #fcd34d; }

    /* Action Icon Buttons */
    .action-btns { display: flex; justify-content: flex-end; gap: 2px; }
    .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .icon-btn--blue  { color: #818cf8; }
    .icon-btn--teal  { color: #5eead4; }
    .icon-btn--green { color: #6ee7b7; }
    .icon-btn--red   { color: #f87171; }

    .inline-spinner { display: inline-block; margin-right: 6px; }
  `]
})
export class BackupTabComponent implements OnInit {
  readonly store  = inject(BackupStoreService);
  private readonly fb     = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  autoForm!: FormGroup;

  readonly displayedColumns = ['name', 'type', 'createdAt', 'size', 'actions'];

  constructor() {
    // Patch auto form when store loads config
    effect(() => {
      const cfg = this.store.autoConfig();
      if (cfg && this.autoForm && !this.autoForm.dirty) {
        this.autoForm.patchValue(cfg, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.autoForm = this.fb.group({
      frequency:  ['disabled', Validators.required],
      maxBackups: [10, Validators.required]
    });

    this.store.loadBackups();
    this.store.loadAutoConfig();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  onCreateBackup(): void {
    this.store.clearMessages();
    this.store.createBackup();
  }

  onRestore(): void {
    this.store.clearMessages();
    this.store.initiateRestore((filePath) => this.showRestoreConfirm(filePath));
  }

  onRestoreFromHistory(entry: BackupEntry): void {
    this.store.clearMessages();
    this.showRestoreConfirm(entry.path);
  }

  private showRestoreConfirm(filePath: string): void {
    const ref = this.dialog.open(RestoreConfirmDialogComponent, {
      width: '460px',
      panelClass: 'dark-dialog'
    });
    const instance = ref.componentInstance as RestoreConfirmDialogComponent;
    instance.filePath = filePath;

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.executeRestore(filePath);
      }
    });
  }

  onDelete(entry: BackupEntry): void {
    this.store.clearMessages();
    this.store.deleteBackup(entry);
  }

  onSaveAutoConfig(): void {
    if (this.autoForm.invalid) { this.autoForm.markAllAsTouched(); return; }
    this.store.saveAutoConfig(this.autoForm.value as AutoBackupConfig);
    this.autoForm.markAsPristine();
  }

  // ── Display Helpers ──────────────────────────────────────────────────────────

  typeLabel(type: BackupEntry['type']): string {
    const labels: Record<string, string> = {
      manual:       'Manual',
      automatic:    'Automatic',
      'pre-restore': 'Pre-Restore'
    };
    return labels[type] ?? type;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
