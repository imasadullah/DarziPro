import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { LayoutShellComponent } from '../../shared/components/layout-shell/layout-shell.component';
import { SettingsStoreService } from './store/settings-store.service';
import { ShopInfoTabComponent } from './shop-info/shop-info-tab.component';
import { UserManagementTabComponent } from './user-management/user-management-tab.component';
import { AppConfigTabComponent } from './app-config/app-config-tab.component';
import { ReceiptSettingsTabComponent } from './receipt-settings/receipt-settings-tab.component';
import { BackupTabComponent } from './backup/backup-tab.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    LayoutShellComponent,
    ShopInfoTabComponent,
    UserManagementTabComponent,
    AppConfigTabComponent,
    ReceiptSettingsTabComponent,
    BackupTabComponent
  ],
  template: `
    <app-layout-shell>
      <div class="settings-page">

        <!-- Page Title -->
        <div class="page-header">
          <div class="page-title-wrap">
            <div class="page-icon">
              <mat-icon>settings</mat-icon>
            </div>
            <div>
              <h1 class="page-title">Settings</h1>
              <p class="page-subtitle">Manage shop information, users and application preferences.</p>
            </div>
          </div>
        </div>

        <!-- Global Feedback -->
        @if (store.successMessage()) {
          <div class="feedback-bar success-bar">
            <mat-icon>check_circle</mat-icon>
            {{ store.successMessage() }}
          </div>
        }
        @if (store.error()) {
          <div class="feedback-bar error-bar">
            <mat-icon>error_outline</mat-icon>
            {{ store.error() }}
          </div>
        }

        <!-- Tab Container -->
        <div class="tab-shell">
          <mat-tab-group
            animationDuration="200ms"
            class="settings-tabs"
            (selectedTabChange)="store.clearMessages()"
          >
            <!-- Tab 1: Shop Information -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">store</mat-icon>
                Shop Information
              </ng-template>
              <div class="tab-panel">
                <app-shop-info-tab />
              </div>
            </mat-tab>

            <!-- Tab 2: User Management -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">group</mat-icon>
                User Management
              </ng-template>
              <div class="tab-panel">
                <app-user-management-tab />
              </div>
            </mat-tab>

            <!-- Tab 3: Application Settings -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">tune</mat-icon>
                Application
              </ng-template>
              <div class="tab-panel">
                <app-app-config-tab />
              </div>
            </mat-tab>

            <!-- Tab 4: Receipt Settings -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">receipt_long</mat-icon>
                Receipt Settings
              </ng-template>
              <div class="tab-panel">
                <app-receipt-settings-tab />
              </div>
            </mat-tab>

            <!-- Tab 5: Backup & Restore -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">backup</mat-icon>
                Backup &amp; Restore
              </ng-template>
              <div class="tab-panel">
                <app-backup-tab />
              </div>
            </mat-tab>

          </mat-tab-group>
        </div>

      </div>
    </app-layout-shell>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .page-title-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .page-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(99,102,241,0.15);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent, #6366f1);
    }
    .page-icon mat-icon { font-size: 22px; }
    .page-title {
      font-size: 1.35rem; font-weight: 700;
      color: var(--text-primary, #e2e8f0);
      margin: 0 0 2px;
    }
    .page-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }

    /* Feedback */
    .feedback-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      flex-shrink: 0;
    }
    .feedback-bar mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .success-bar {
      background: rgba(16,185,129,0.12);
      border: 1px solid rgba(16,185,129,0.3);
      color: #6ee7b7;
    }
    .error-bar {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
    }

    /* Tabs */
    .tab-shell {
      background: var(--surface-primary, rgba(255,255,255,0.03));
      border: 1px solid var(--border, rgba(255,255,255,0.07));
      border-radius: 16px;
      overflow: hidden;
      flex: 1;
      min-height: 0;
    }

    .settings-tabs {
      height: 100%;
    }

    /* Tab labels */
    ::ng-deep .settings-tabs .mat-mdc-tab {
      min-width: 140px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    ::ng-deep .settings-tabs .mat-mdc-tab:not(.mdc-tab--active) .mdc-tab__text-label {
      color: var(--text-muted, #64748b);
    }
    ::ng-deep .settings-tabs .mdc-tab--active .mdc-tab__text-label {
      color: var(--accent, #6366f1) !important;
    }
    ::ng-deep .settings-tabs .mdc-tab-indicator__content--underline {
      border-color: var(--accent, #6366f1) !important;
    }
    ::ng-deep .settings-tabs .mat-mdc-tab-header {
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
      background: var(--surface-secondary, rgba(255,255,255,0.02));
    }
    ::ng-deep .settings-tabs .mat-mdc-tab-body-wrapper {
      flex: 1;
    }

    .tab-icon {
      font-size: 18px; width: 18px; height: 18px;
      margin-right: 6px; vertical-align: middle;
    }

    .tab-panel {
      padding: 28px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  readonly store = inject(SettingsStoreService);

  ngOnInit(): void {
    this.store.loadSettings();
  }
}
