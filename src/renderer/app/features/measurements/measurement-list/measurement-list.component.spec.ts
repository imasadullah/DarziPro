import '@angular/compiler';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MeasurementListComponent } from './measurement-list.component';

function createComponentHarness() {
  const component = Object.create(MeasurementListComponent.prototype) as any;
  component.rows = signal([]);
  component.loading = signal(false);
  component.totalCount = signal(0);
  component.page = signal(1);
  component.pageSize = signal(10);
  component.error = signal(null);
  component.searchQuery = signal('');
  component.measurementType = signal('');
  component.destroy$ = new Subject<void>();
  component.searchSubject = new Subject<string>();

  const measurementService = {
    getAll: vi.fn((params: any) => of({
      success: true,
      data: { items: [], total: 0, page: params.page, limit: params.limit }
    })),
    delete: vi.fn(() => of({ success: true }))
  };
  component.measurementService = measurementService;
  component.toast = { success: vi.fn(), error: vi.fn() };

  return { component: component as MeasurementListComponent, measurementService };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('MeasurementListComponent pagination', () => {
  it('uses the Customer listing default and sends selected pages to the server', () => {
    const { component, measurementService } = createComponentHarness();

    component.onPageChange(1);
    component.onPageChange(4);

    expect(component.pageSize()).toBe(10);
    expect(measurementService.getAll).toHaveBeenNthCalledWith(1, {
      page: 1, limit: 10, search: undefined, measurementType: undefined
    });
    expect(measurementService.getAll).toHaveBeenNthCalledWith(2, {
      page: 4, limit: 10, search: undefined, measurementType: undefined
    });
  });

  it('resets to page one and reloads after page size changes', () => {
    const { component, measurementService } = createComponentHarness();
    component.page.set(3);

    component.onPageSizeChange(20);

    expect(component.page()).toBe(1);
    expect(component.pageSize()).toBe(20);
    expect(measurementService.getAll).toHaveBeenCalledWith({
      page: 1, limit: 20, search: undefined, measurementType: undefined
    });
  });

  it('resets pagination on search and retains the selected type filter', () => {
    vi.useFakeTimers();
    const { component, measurementService } = createComponentHarness();
    component.page.set(3);
    component.measurementType.set('pant');
    component.ngOnInit();

    component.onSearch('Ali');
    vi.advanceTimersByTime(300);

    expect(component.page()).toBe(1);
    expect(measurementService.getAll).toHaveBeenLastCalledWith({
      page: 1, limit: 10, search: 'Ali', measurementType: 'pant'
    });
    component.ngOnDestroy();
  });

  it('resets pagination on type filter and retains the search term', () => {
    const { component, measurementService } = createComponentHarness();
    component.page.set(4);
    component.searchQuery.set('Ali');

    component.onMeasurementTypeChange('pant');

    expect(component.page()).toBe(1);
    expect(measurementService.getAll).toHaveBeenCalledWith({
      page: 1, limit: 10, search: 'Ali', measurementType: 'pant'
    });
  });

  it('moves back one page after deleting the final row on the last page', () => {
    const { component, measurementService } = createComponentHarness();
    component.totalCount.set(21);
    component.page.set(3);
    vi.stubGlobal('confirm', () => true);

    component.deleteMeasurement(21, { stopPropagation: vi.fn() } as unknown as Event);

    expect(component.page()).toBe(2);
    expect(measurementService.getAll).toHaveBeenCalledWith({
      page: 2, limit: 10, search: undefined, measurementType: undefined
    });
  });
});
