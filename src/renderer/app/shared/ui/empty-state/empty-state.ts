import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'dp-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
}
