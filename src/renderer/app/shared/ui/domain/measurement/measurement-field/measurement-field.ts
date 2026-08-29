import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DpMeasurementFieldComponent
 *
 * A specialised numeric input for tailoring measurements.
 * - 44px height (taller than standard 40px) — easier to use while holding a tape measure
 * - 16px font, weight 600, tabular-nums — readable from arm's length
 * - Inline non-interactive unit suffix (default "in")
 * - Tab-friendly: native input order preserved
 * - Pure presentational — no services, no state
 */
@Component({
  selector: 'dp-measurement-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './measurement-field.html',
  styleUrls: ['./measurement-field.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementFieldComponent {
  /** Field label displayed above the input (e.g. "Neck", "Chest") */
  @Input({ required: true }) label!: string;

  /** Current numeric value bound to the input */
  @Input() value: string | number | null = null;

  /** Unit suffix shown inline inside the input (default: "in") */
  @Input() unit = 'in';

  /** Whether this field is read-only */
  @Input() readonly = false;

  /** Whether this field is disabled */
  @Input() disabled = false;

  /** Unique ID forwarded to the native input (enables label association) */
  @Input() inputId = '';

  /** Emitted on every input event with the new string value */
  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
