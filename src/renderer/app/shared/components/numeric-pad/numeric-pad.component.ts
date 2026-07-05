import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-numeric-pad',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './numeric-pad.component.html',
  styleUrls: ['./numeric-pad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumericPadComponent {
  @Input() maxLength = 6;
  @Output() pinEntered = new EventEmitter<string>();

  // Use Signals to manage input digits internally
  #digits = signal<string>('');
  
  public readonly digits = this.#digits.asReadonly();
  public readonly length = computed(() => this.#digits().length);

  pressKey(num: string): void {
    if (this.#digits().length < this.maxLength) {
      const updated = this.#digits() + num;
      this.#digits.set(updated);
      this.pinEntered.emit(updated);
    }
  }

  deleteDigit(): void {
    if (this.#digits().length > 0) {
      const updated = this.#digits().slice(0, -1);
      this.#digits.set(updated);
      this.pinEntered.emit(updated);
    }
  }

  clear(): void {
    this.#digits.set('');
    this.pinEntered.emit('');
  }
}
