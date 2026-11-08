import { describe, expect, it } from 'vitest';
import { getPaginationWindow } from './pagination';

describe('getPaginationWindow', () => {
  it('applies defaults and computes the offset', () => {
    expect(getPaginationWindow()).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(getPaginationWindow({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps invalid page bounds and oversized page sizes', () => {
    expect(getPaginationWindow({ page: 0, limit: 500 })).toEqual({ page: 1, limit: 100, skip: 0 });
  });
});
