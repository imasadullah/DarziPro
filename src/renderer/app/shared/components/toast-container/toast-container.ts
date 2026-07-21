import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  readonly toastService = inject(ToastService);

  iconFor(type: string): string {
    switch (type) {
      case 'success': return 'fa-circle-check';
      case 'error': return 'fa-circle-exclamation';
      case 'warning': return 'fa-triangle-exclamation';
      default: return 'fa-circle-info';
    }
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}