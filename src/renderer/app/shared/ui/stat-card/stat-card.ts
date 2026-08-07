import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type IconTint = 'blue' | 'indigo' | 'amber' | 'red' | 'green' | 'teal';

@Component({
  selector: 'dp-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stat-card.html',
  styleUrls: ['./stat-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: string;
  @Input() iconTint: IconTint = 'blue';
  @Input() trendText?: string;
  @Input() isOverdue = false;

  @Output() clicked = new EventEmitter<void>();
}
