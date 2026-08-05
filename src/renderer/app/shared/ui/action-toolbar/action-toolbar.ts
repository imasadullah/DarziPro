import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dp-action-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-toolbar.html',
  styleUrls: ['./action-toolbar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionToolbarComponent {}
