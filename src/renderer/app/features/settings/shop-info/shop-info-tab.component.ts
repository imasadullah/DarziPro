import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsStoreService } from '../store/settings-store.service';
import {
  mapToShopInfo, ShopInfoForm
} from '../models/settings.model';

@Component({
  selector: 'app-shop-info-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <div>
          <h2 class="tab-title">Shop Information</h2>
          <p class="tab-subtitle">Your shop details appear on all receipts and documents.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSave()" class="settings-form" novalidate>

        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-preview-wrap">
            @if (logoPreview()) {
              <img [src]="'file://' + logoPreview()" alt="Shop Logo" class="logo-preview" />
            } @else {
              <div class="logo-placeholder">
                <mat-icon>store</mat-icon>
                <span>No Logo</span>
              </div>
            }
          </div>
          <div class="logo-actions">
            <button type="button" mat-stroked-button class="btn-secondary"
                    (click)="onUploadLogo()" [disabled]="store.saving()">
              <mat-icon>upload</mat-icon>
              Upload Logo
            </button>
            @if (logoPreview()) {
              <button type="button" mat-button class="btn-ghost" (click)="onRemoveLogo()">
                <mat-icon>delete_outline</mat-icon>
                Remove
              </button>
            }
            <p class="logo-hint">PNG, JPG, SVG or WEBP. Displayed on receipts.</p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Shop Name -->
          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Shop Name *</mat-label>
            <input matInput formControlName="shopName" placeholder="e.g. Al-Madina Tailors" />
            @if (form.get('shopName')?.hasError('required') && form.get('shopName')?.touched) {
              <mat-error>Shop name is required.</mat-error>
            }
          </mat-form-field>

          <!-- Owner Name -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>Owner Name</mat-label>
            <input matInput formControlName="ownerName" placeholder="e.g. Muhammad Ali" />
          </mat-form-field>

          <!-- City -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>City</mat-label>
            <input matInput formControlName="shopCity" placeholder="e.g. Lahore" />
          </mat-form-field>

          <!-- Phone -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>Phone Number *</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput formControlName="shopPhone" placeholder="03XX-XXXXXXX" />
            @if (form.get('shopPhone')?.hasError('required') && form.get('shopPhone')?.touched) {
              <mat-error>Phone number is required.</mat-error>
            }
          </mat-form-field>

          <!-- WhatsApp -->
          <mat-form-field appearance="outline" class="field-half">
            <mat-label>WhatsApp Number</mat-label>
            <mat-icon matPrefix>chat</mat-icon>
            <input matInput formControlName="shopWhatsApp" placeholder="03XX-XXXXXXX" />
          </mat-form-field>

          <!-- Email -->
          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Email Address</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput formControlName="shopEmail" type="email" placeholder="shop@example.com" />
            @if (form.get('shopEmail')?.hasError('email') && form.get('shopEmail')?.touched) {
              <mat-error>Please enter a valid email address.</mat-error>
            }
          </mat-form-field>

          <!-- Address -->
          <mat-form-field appearance="outline" class="field-full">
            <mat-label>Address</mat-label>
            <textarea matInput formControlName="shopAddress" rows="3"
                      placeholder="Shop street address..."></textarea>
          </mat-form-field>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="onReset()">
            <mat-icon>refresh</mat-icon>
            Reset
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

    .tab-header {
      margin-bottom: 28px;
    }
    .tab-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-primary, #e2e8f0);
      margin: 0 0 4px;
    }
    .tab-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted, #94a3b8);
      margin: 0;
    }

    /* Logo */
    .logo-section {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 20px;
      background: var(--surface-secondary, rgba(255,255,255,0.03));
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .logo-preview-wrap {
      flex-shrink: 0;
      width: 96px;
      height: 96px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border, rgba(255,255,255,0.1));
    }
    .logo-preview {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #fff;
    }
    .logo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--surface-tertiary, rgba(255,255,255,0.05));
      color: var(--text-muted, #94a3b8);
      gap: 4px;
      font-size: 0.7rem;
    }
    .logo-placeholder mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.5; }
    .logo-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
    .logo-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 4px 0 0;
    }

    /* Form */
    .settings-form { display: flex; flex-direction: column; gap: 0; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .field-full  { grid-column: 1 / -1; }
    .field-half  { grid-column: span 1; }

    mat-form-field { width: 100%; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border, rgba(255,255,255,0.07));
    }

    .btn-primary {
      background: var(--accent, #6366f1) !important;
      color: #fff !important;
      padding: 0 24px;
      height: 40px;
      border-radius: 8px;
    }
    .btn-secondary {
      border-color: var(--border, rgba(255,255,255,0.15)) !important;
      color: var(--text-secondary, #94a3b8) !important;
      height: 40px;
      border-radius: 8px;
    }
    .btn-ghost {
      color: var(--error, #ef4444) !important;
      height: 36px;
    }
    .inline-spinner { display: inline-block; margin-right: 6px; }
  `]
})
export class ShopInfoTabComponent implements OnInit {
  readonly store = inject(SettingsStoreService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  logoPreview = signal<string>('');

  constructor() {
    // Sync form when settings are loaded
    effect(() => {
      const s = this.store.settings();
      if (s && !this.form.dirty) {
        const info = mapToShopInfo(s as any);
        this.form?.patchValue(info, { emitEvent: false });
        this.logoPreview.set(info.shopLogoPath);
      }
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      shopName:     ['', Validators.required],
      ownerName:    [''],
      shopPhone:    ['', Validators.required],
      shopWhatsApp: [''],
      shopEmail:    ['', [Validators.email]],
      shopAddress:  [''],
      shopCity:     [''],
      shopLogoPath: ['']
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value: ShopInfoForm = { ...this.form.value, shopLogoPath: this.logoPreview() };
    this.store.saveShopInfo(value);
    this.form.markAsPristine();
  }

  onReset(): void {
    const s = this.store.settings();
    if (s) {
      const info = mapToShopInfo(s as any);
      this.form.patchValue(info, { emitEvent: false });
      this.logoPreview.set(info.shopLogoPath);
      this.form.markAsPristine();
    }
  }

  onUploadLogo(): void {
    this.store.uploadLogo((path) => {
      this.logoPreview.set(path);
    });
  }

  onRemoveLogo(): void {
    this.logoPreview.set('');
    this.store.saveShopInfo({ ...this.form.value, shopLogoPath: '' });
  }
}
