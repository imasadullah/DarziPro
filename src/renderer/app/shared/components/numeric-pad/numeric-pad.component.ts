import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-numeric-pad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numeric-pad.component.html',
  styleUrls: ['./numeric-pad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumericPadComponent implements AfterViewInit {
  @Input() maxLength = 6;
  @Output() pinEntered = new EventEmitter<string>();

  @ViewChild('hiddenInput') private hiddenInputRef!: ElementRef<HTMLInputElement>;

  // Use Signals to manage input digits internally
  #digits = signal<string>('');

  public readonly digits = this.#digits.asReadonly();
  public readonly length = computed(() => this.#digits().length);

  ngAfterViewInit(): void {
    // Grab keyboard focus as soon as the pad is on screen — no click needed.
    this.focusHiddenInput();
  }

  // Any click anywhere in the pad (including on a number button) hands
  // focus back to the invisible capture field, so a clicked button never
  // stays visibly focused/highlighted.
  @HostListener('click')
  onHostClick(): void {
    setTimeout(() => this.focusHiddenInput());
  }

  private focusHiddenInput(): void {
    this.hiddenInputRef?.nativeElement.focus();
  }

  // The hidden input never actually holds a value — every keystroke is
  // intercepted and discarded, so nothing typed is ever rendered or stored.
  onHiddenKeydown(event: KeyboardEvent): void {
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      this.pressKey(event.key);
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.deleteDigit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clear();
    }
  }

  refocus(): void {
    this.focusHiddenInput();
  }

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