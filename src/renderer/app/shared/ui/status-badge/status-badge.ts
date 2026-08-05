import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'success' | 'warning' | 'danger' | 'info' | 'default';

@Component({
  selector: 'dp-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrls: ['./status-badge.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input() text?: string;
  @Input() color: BadgeColor = 'default';

  @Input() set status(val: string) {
    this.text = val;
    this.color = this.mapStatusToColor(val);
  }

  private mapStatusToColor(status: string): BadgeColor {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'ready':
      case 'completed':
      case 'success':
      case 'paid':
        return 'success';
      case 'quality check':
      case 'warning':
      case 'partial':
        return 'warning';
      case 'cancelled':
      case 'danger':
      case 'failed':
      case 'unpaid':
      case 'overdue':
        return 'danger';
      case 'cutting':
      case 'stitching':
      case 'info':
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  }
}
