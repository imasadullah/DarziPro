import {
  Component, ChangeDetectionStrategy, OnInit, inject, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsStoreService } from '../store/settings-store.service';
import { mapToAppConfig, AppConfigForm } from '../models/settings.model';

@Component({
  selector: 'app-app-config-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <div>
          <h2 class="tab-title">Application Settings</h2>
          <p class="tab-subtitle">Configure defaults used across the application.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSave()" class="settings-form" novalidate>
        <div class="form-grid">

          <!-- Currency Symbol -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>Currency Symbol</mat-label>
            <input matInput formControlName="currencySymbol" placeholder="e.g. Rs or PKR" />
            @if (form.get('currencySymbol')?.hasError('required') && form.get('currencySymbol')?.touched) {
              <mat-error>Currency symbol is required.</mat-error>
            }
            <mat-hint>Displayed next to all monetary values.</mat-hint>
          </mat-form-field>

          <!-- Currency Position -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>Currency Position</mat-label>
            <mat-select formControlName="currencyPosition">
              <mat-option value="prefix">Prefix — Rs 1,500</mat-option>
              <mat-option value="suffix">Suffix — 1,500 Rs</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Date Format -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>Date Format</mat-label>
            <mat-select formControlName="dateFormat">
              <mat-option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/08/2025)</mat-option>
              <mat-option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/15/2025)</mat-option>
              <mat-option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2025-08-15)</mat-option>
            </mat-select>
            <mat-hint>Used for order and delivery dates.</mat-hint>
          </mat-form-field>

          <!-- Default Delivery Days -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>Default Delivery Days</mat-label>
            <input matInput formControlName="defaultDeliveryDays" type="number" min="1" max="365"
                   placeholder="e.g. 7" />
            @if (form.get('defaultDeliveryDays')?.hasError('required') && form.get('defaultDeliveryDays')?.touched) {
              <mat-error>Delivery days is required.</mat-error>
            }
            @if (form.get('defaultDeliveryDays')?.hasError('min') && form.get('defaultDeliveryDays')?.touched) {
              <mat-error>Must be at least 1 day.</mat-error>
            }
            <mat-hint>Pre-filled when creating new orders.</mat-hint>
          </mat-form-field>

        </div>

        <!-- Preview -->
        <div class="preview-card">
          <div class="preview-label">Live Preview</div>
          <div class="preview-row">
            <span class="preview-item-label">Order Total</span>
            <span class="preview-value">{{ currencyPreview }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-item-label">Delivery Date</span>
            <span class="preview-value">{{ datePreview }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="onReset()">
            <mat-icon>refresh</mat-icon> Reset
          </button>
          <button type="submit" mat-raised-button class="btn-primary"
                  [disabled]="form.invalid || store.saving()">
            @if (store.saving()) {
              <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tab-content { padding: 0; }
    .tab-header { margin-bottom: 28px; }
    .tab-title { font-size: 1.15rem; font-weight: 600; color: var(--text-primary, #e2e8f0); margin: 0 0 4px; }
    .tab-subtitle { font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin: 0; }

    .settings-form { display: flex; flex-direction: column; gap: 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field-half { grid-column: span 1; }
    mat-form-field { width: 100%; }

    /* Preview */
    .preview-card {
      margin-top: 20px;
      padding: 16px 20px;
      background: var(--surface-secondary, rgba(99,102,241,0.06));
      border: 1px solid var(--accent-muted, rgba(99,102,241,0.25));
      border-radius: 10px;
    }
    .preview-label {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--accent-light, #a5b4fc);
      margin-bottom: 12px;
    }
    .preview-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 0;
    }
    .preview-item-label { font-size: 0.82rem; color: var(--text-secondary, #94a3b8); }
    .preview-value { font-size: 0.9rem; font-weight: 600; color: var(--text-primary, #e2e8f0); }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 12px;
      margin-top: 24px; padding-top: 20px;
      border-top: 1px solid var(--border, rgba(255,255,255,0.07));
    }
    .btn-primary {
      background: var(--accent, #6366f1) !important;
      color: #fff !important; height: 40px; border-radius: 8px;
    }
    .btn-secondary {
      border-color: var(--border, rgba(255,255,255,0.15)) !important;
      color: var(--text-secondary, #94a3b8) !important;
      height: 40px; border-radius: 8px;
    }
    .inline-spinner { display: inline-block; margin-right: 6px; }
  `]
})
export class AppConfigTabComponent implements OnInit {
  readonly store = inject(SettingsStoreService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  get currencyPreview(): string {
    const sym = this.form?.get('currencySymbol')?.value ?? 'Rs';
    const pos = this.form?.get('currencyPosition')?.value ?? 'prefix';
    return pos === 'prefix' ? `${sym} 2,500` : `2,500 ${sym}`;
  }

  get datePreview(): string {
    const fmt = this.form?.get('dateFormat')?.value ?? 'DD/MM/YYYY';
    const d = new Date();
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    switch (fmt) {
      case 'MM/DD/YYYY':  return `${mm}/${dd}/${yyyy}`;
      case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
      default:           return `${dd}/${mm}/${yyyy}`;
    }
  }

  constructor() {
    effect(() => {
      const s = this.store.settings();
      if (s && !this.form?.dirty) {
        const cfg = mapToAppConfig(s as any);
        this.form?.patchValue(cfg, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      currencySymbol:      ['Rs', Validators.required],
      currencyPosition:    ['prefix', Validators.required],
      dateFormat:          ['DD/MM/YYYY', Validators.required],
      defaultDeliveryDays: [7, [Validators.required, Validators.min(1)]]
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.store.saveAppConfig(this.form.value as AppConfigForm);
    this.form.markAsPristine();
  }

  onReset(): void {
    const s = this.store.settings();
    if (s) {
      this.form.patchValue(mapToAppConfig(s as any), { emitEvent: false });
      this.form.markAsPristine();
    }
  }
}
