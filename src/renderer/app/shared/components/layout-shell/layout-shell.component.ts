import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStateService } from '../../../core/store/auth-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppShellComponent } from '../../ui/app-shell/app-shell';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    AppShellComponent
  ],
  templateUrl: './layout-shell.component.html',
  styleUrls: ['./layout-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutShellComponent {
  public readonly authState = inject(AuthStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly isCollapsed = signal(false);

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.authState.setSession(null);
      this.router.navigate(['/login']);
    });
  }
}
