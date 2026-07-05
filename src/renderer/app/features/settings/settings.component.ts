import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutShellComponent } from '../../shared/components/layout-shell/layout-shell.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LayoutShellComponent],
  template: `
    <app-layout-shell>
      <div class="settings-container">
        <h1>System Settings</h1>
        <p>Settings configuration panel placeholder (Owner access verified).</p>
      </div>
    </app-layout-shell>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {}
