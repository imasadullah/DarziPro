import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dp-app-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-shell.html',
  styleUrls: ['./app-shell.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();
}
