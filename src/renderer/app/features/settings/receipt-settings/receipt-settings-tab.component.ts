import {
  Component, ChangeDetectionStrategy, OnInit, inject, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsStoreService } from '../store/settings-store.service';
import { mapToReceiptSettings, ReceiptSettingsForm } from '../models/settings.model';

@Component({
  selector: 'app-receipt-settings-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSlideToggleModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <div>
          <h2 class="tab-title">Receipt Settings</h2>
          <p class="tab-subtitle">
            Control what appears on printed receipts. Changes apply to the next print job.
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSave()" class="settings-form" novalidate>

        <!-- Text Fields -->
        <div class="fields-section">
          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Receipt Header</mat-label>
            <textarea matInput formControlName="receiptHeader" rows="3"
                      placeholder="Optional header text (e.g. Welcome to Al-Madina Tailors)"></textarea>
            <mat-hint>Appears at the top of every receipt, below the shop name.</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Footer Message</mat-label>
            <textarea matInput formControlName="footerMessage" rows="3"
                      placeholder="e.g. Thank you for your business!"></textarea>
            <mat-hint>Appears at the bottom of every receipt.</mat-hint>
          </mat-form-field>
        </div>

        <!-- Toggle Options -->
        <div class="toggle-section">
          <h3 class="section-label">Receipt Content</h3>

          <div class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Show Shop Logo</span>
              <span class="toggle-desc">Print your uploaded logo on each receipt.</span>
            </div>
            <mat-slide-toggle formControlName="receiptShowLogo" class="accent-toggle"></mat-slide-toggle>
          </div>

          <div class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Show Address</span>
              <span class="toggle-desc">Include your shop address on receipts.</span>
            </div>
            <mat-slide-toggle formControlName="receiptShowAddress" class="accent-toggle"></mat-slide-toggle>
          </div>

          <div class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Show Phone Number</span>
              <span class="toggle-desc">Include your contact number on receipts.</span>
            </div>
            <mat-slide-toggle formControlName="receiptShowPhone" class="accent-toggle"></mat-slide-toggle>
          </div>
        </div>

        <!-- Preview Card -->
        <div class="receipt-preview">
          <div class="preview-label">Receipt Preview</div>
          <div class="receipt-mock">
            <div class="mock-header">
              @if (form.get('receiptShowLogo')?.value) {
                <div class="mock-logo">🏪</div>
              }
              <div class="mock-shop-name">{{ shopName() }}</div>
              @if (form.get('receiptShowAddress')?.value) {
                <div class="mock-detail">123 Main Street, Lahore</div>
              }
              @if (form.get('receiptShowPhone')?.value) {
                <div class="mock-detail">📞 0300-1234567</div>
              }
              @if (form.get('receiptHeader')?.value) {
                <div class="mock-receipt-header">{{ form.get('receiptHeader')?.value }}</div>
              }
            </div>
            <div class="mock-divider">- - - - - - - - - - - - - - - - -</div>
            <div class="mock-body">
              <div class="mock-row"><span>Item 1</span><span>Rs 1,200</span></div>
              <div class="mock-row"><span>Item 2</span><span>Rs 800</span></div>
              <div class="mock-row mock-total"><span>Total</span><span>Rs 2,000</span></div>
            </div>
            <div class="mock-divider">- - - - - - - - - - - - - - - - -</div>
            <div class="mock-footer">{{ form.get('footerMessage')?.value || 'Thank you!' }}</div>
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

    .settings-form { display: flex; flex-direction: column; gap: 24px; }
    .fields-section { display: flex; flex-direction: column; gap: 0; }
    .field-full { width: 100%; }
    mat-form-field { width: 100%; }

    /* Toggle section */
    .toggle-section {
      padding: 20px;
      background: var(--surface-secondary, rgba(255,255,255,0.02));
      border: 1px solid var(--border, rgba(255,255,255,0.07));
      border-radius: 12px;
    }
    .section-label {
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.07em;
      text-transform: uppercase; color: var(--text-muted, #64748b);
      margin: 0 0 16px;
    }
    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.04));
    }
    .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
    .toggle-info { display: flex; flex-direction: column; gap: 2px; }
    .toggle-title { font-size: 0.88rem; font-weight: 500; color: var(--text-primary, #e2e8f0); }
    .toggle-desc { font-size: 0.78rem; color: var(--text-muted, #64748b); }

    /* Receipt preview mock */
    .receipt-preview {
      padding: 20px;
      background: var(--surface-secondary, rgba(99,102,241,0.04));
      border: 1px solid var(--accent-muted, rgba(99,102,241,0.2));
      border-radius: 12px;
    }
    .preview-label {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--accent-light, #a5b4fc);
      margin-bottom: 16px;
    }
    .receipt-mock {
      max-width: 260px;
      margin: 0 auto;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: var(--text-primary, #e2e8f0);
      background: var(--surface-tertiary, rgba(255,255,255,0.03));
      padding: 16px;
      border-radius: 6px;
    }
    .mock-header { text-align: center; margin-bottom: 8px; }
    .mock-logo { font-size: 1.5rem; margin-bottom: 4px; }
    .mock-shop-name { font-weight: bold; font-size: 0.9rem; }
    .mock-detail { font-size: 0.7rem; color: var(--text-muted, #94a3b8); }
    .mock-receipt-header {
      margin-top: 6px; font-style: italic;
      color: var(--text-secondary, #cbd5e1); font-size: 0.72rem;
    }
    .mock-divider {
      color: var(--text-muted, #475569); text-align: center;
      font-size: 0.65rem; margin: 8px 0;
    }
    .mock-body { display: flex; flex-direction: column; gap: 4px; }
    .mock-row { display: flex; justify-content: space-between; font-size: 0.72rem; }
    .mock-total { font-weight: bold; border-top: 1px solid var(--border, rgba(255,255,255,0.1)); padding-top: 4px; }
    .mock-footer { text-align: center; margin-top: 8px; font-size: 0.7rem; color: var(--text-muted, #64748b); font-style: italic; }

    /* Actions */
    .form-actions {
      display: flex; justify-content: flex-end; gap: 12px;
      padding-top: 20px;
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
export class ReceiptSettingsTabComponent implements OnInit {
  readonly store = inject(SettingsStoreService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  shopName() {
    return this.store.settings()?.['shopName'] ?? 'Darzi Pro';
  }

  constructor() {
    effect(() => {
      const s = this.store.settings();
      if (s && !this.form?.dirty) {
        this.form?.patchValue(mapToReceiptSettings(s as any), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      receiptHeader:      [''],
      footerMessage:      ['Thank you for your business!'],
      receiptShowLogo:    [true],
      receiptShowAddress: [true],
      receiptShowPhone:   [true]
    });
  }

  onSave(): void {
    this.store.saveReceiptSettings(this.form.value as ReceiptSettingsForm);
    this.form.markAsPristine();
  }

  onReset(): void {
    const s = this.store.settings();
    if (s) {
      this.form.patchValue(mapToReceiptSettings(s as any), { emitEvent: false });
      this.form.markAsPristine();
    }
  }
}
