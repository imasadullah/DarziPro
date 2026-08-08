import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type PageItem =
  | { type: 'page'; value: number }
  | { type: 'ellipsis' };

@Component({
  selector: 'dp-paginator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './paginator.html',
  styleUrls: ['./paginator.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent implements OnChanges {
  @Input({ required: true }) totalItems!: number;
  @Input() pageSize = 10;
  @Input({ required: true }) currentPage!: number;

  @Output() pageChanged = new EventEmitter<number>();

  // Recomputed whenever inputs change
  pages: PageItem[] = [];
  totalPages = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    this.pages = this.buildPages(this.currentPage, this.totalPages);
  }

  /**
   * Builds the visible page items with ellipsis truncation.
   * Always shows: first page, last page, current page, one neighbor
   * on each side of current; collapses the rest into single "…".
   *
   * Examples (current=2, total=44):
   *   [1] [2] [3] [...] [42] [43] [44]
   * Examples (current=23, total=44):
   *   [1] [...] [22] [23] [24] [...] [44]
   */
  private buildPages(current: number, total: number): PageItem[] {
    if (total <= 1) return [];

    const visible = new Set<number>();
    visible.add(1);
    visible.add(total);
    visible.add(current);
    if (current - 1 >= 1) visible.add(current - 1);
    if (current + 1 <= total) visible.add(current + 1);

    // For small totals, always show all pages
    if (total <= 7) {
      for (let i = 1; i <= total; i++) visible.add(i);
    }

    const sorted = Array.from(visible).sort((a, b) => a - b);
    const items: PageItem[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i];
      if (i > 0 && n - sorted[i - 1] > 1) {
        items.push({ type: 'ellipsis' });
      }
      items.push({ type: 'page', value: n });
    }

    return items;
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChanged.emit(page);
  }

  isPage(item: PageItem): item is { type: 'page'; value: number } {
    return item.type === 'page';
  }
}
