import {
  Component,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DpMeasurementGridComponent
 *
 * Layout container for tailoring measurement fields.
 * Arranges DpMeasurementField instances into a compact 3-column or 4-column grid.
 *
 * Usage:
 *   <dp-measurement-grid [columns]="3">
 *     <dp-measurement-field ... />
 *     ...
 *   </dp-measurement-grid>
 *
 * Pure presentational — no inputs beyond layout config, no outputs.
 */
@Component({
  selector: 'dp-measurement-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './measurement-grid.html',
  styleUrls: ['./measurement-grid.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementGridComponent {
  /**
   * Number of columns in the grid.
   * 3 = default (shirts, trousers, most garments)
   * 4 = wider variant for garments with more measurement points
   */
  @Input() columns: 3 | 4 = 3;

  get gridClass(): string {
    return this.columns === 4 ? 'mg mg--4col' : 'mg';
  }
}
