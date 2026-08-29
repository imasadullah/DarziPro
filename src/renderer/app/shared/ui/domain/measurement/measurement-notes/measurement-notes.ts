import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DpMeasurementNotesComponent
 *
 * Textarea pre-configured for tailor-specific notes:
 * fabric instructions, stitching notes, special requests.
 * Styled to match the measurement section aesthetic, not the generic DpInput textarea.
 *
 * Usage:
 *   <dp-measurement-notes
 *     label="General Notes"
 *     placeholder="Any special fitting notes…"
 *     [value]="form.get('notes')?.value"
 *     [inputId]="'notes-input'"
 *     (valueChange)="onNotesChange($event)">
 *   </dp-measurement-notes>
 */
@Component({
  selector: 'dp-measurement-notes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './measurement-notes.html',
  styleUrls: ['./measurement-notes.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementNotesComponent {
  /** Label text shown above the textarea */
  @Input({ required: true }) label!: string;

  /** Optional placeholder text */
  @Input() placeholder = '';

  /** Current string value */
  @Input() value: string | null = '';

  /** Number of visible text rows (default 3) */
  @Input() rows = 3;

  /** Unique ID for the textarea (enables label association) */
  @Input() inputId = '';

  /** Whether the textarea is disabled */
  @Input() disabled = false;

  /** Emitted on every input event */
  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }
}
