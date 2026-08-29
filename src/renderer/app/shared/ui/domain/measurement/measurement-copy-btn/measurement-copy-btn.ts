import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * DpMeasurementCopyBtnComponent
 *
 * Subtle inline text button for the measurement section header.
 * Emits `copyRequested` — the parent container handles the data logic
 * (fetching the customer's last measurement of the same garment type
 * and pre-filling form fields). This component is styling-only.
 *
 * Usage:
 *   <dp-measurement-copy-btn
 *     [disabled]="!hasPreviousMeasurement"
 *     (copyRequested)="onCopyFromPrevious()">
 *   </dp-measurement-copy-btn>
 */
@Component({
  selector: 'dp-measurement-copy-btn',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './measurement-copy-btn.html',
  styleUrls: ['./measurement-copy-btn.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementCopyBtnComponent {
  /** Disable when no previous measurement record exists for this garment type / customer. */
  @Input() disabled = false;

  /** Whether the copy operation is in-progress (show loading state). */
  @Input() loading = false;

  /** Emitted when the user clicks the button (and it is not disabled). */
  @Output() copyRequested = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.copyRequested.emit();
    }
  }
}
