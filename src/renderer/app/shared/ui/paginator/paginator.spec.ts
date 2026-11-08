import '@angular/compiler';
import { SimpleChanges } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { PaginatorComponent } from './paginator';

describe('PaginatorComponent', () => {
  it('shows the requested range on the last page', () => {
    const paginator = new PaginatorComponent();
    paginator.totalItems = 21;
    paginator.pageSize = 10;
    paginator.currentPage = 3;

    paginator.ngOnChanges({} as SimpleChanges);

    expect(paginator.rangeStart).toBe(21);
    expect(paginator.rangeEnd).toBe(21);
    expect(paginator.pages).toEqual([{ type: 'page', value: 1 }, { type: 'page', value: 2 }, { type: 'page', value: 3 }]);
  });

  it('shows a zero range and emits valid page-size changes for an empty result', () => {
    const paginator = new PaginatorComponent();
    paginator.totalItems = 0;
    paginator.currentPage = 1;
    paginator.ngOnChanges({} as SimpleChanges);
    const sizeChanged = vi.fn();
    paginator.pageSizeChanged.subscribe(sizeChanged);

    paginator.changePageSize({ target: { value: '20' } } as unknown as Event);

    expect(paginator.rangeStart).toBe(0);
    expect(paginator.rangeEnd).toBe(0);
    expect(sizeChanged).toHaveBeenCalledWith(20);
  });

  it('emits page navigation events for the first and last numbered pages', () => {
    const paginator = new PaginatorComponent();
    paginator.totalItems = 100;
    paginator.pageSize = 10;
    paginator.currentPage = 5;
    paginator.ngOnChanges({} as SimpleChanges);
    const pageChanged = vi.fn();
    paginator.pageChanged.subscribe(pageChanged);

    paginator.go(1);
    paginator.go(10);

    expect(pageChanged.mock.calls.map(([page]) => page)).toEqual([1, 10]);
  });
});
