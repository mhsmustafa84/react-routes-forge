// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivePath, useNavigateTo, useRouteParams, useTypedSearchParams } from '../../next';
import * as navigation from 'next/navigation';
import type { Mock } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useParams: vi.fn(),
}));

// Helpers to get the mocked functions with correct types
const mockUsePathname = () => navigation.usePathname as unknown as Mock;
const mockUseRouter = () => navigation.useRouter as unknown as Mock;
const mockUseSearchParams = () => navigation.useSearchParams as unknown as Mock;
const mockUseParams = () => navigation.useParams as unknown as Mock;

describe('Next.js hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useActivePath', () => {
    it('matches exact path', () => {
      mockUsePathname().mockReturnValue('/users/123');
      const { result } = renderHook(() => useActivePath('/users/:id', { exact: true }));
      expect(result.current).toBe(true);
    });

    it('returns false when path does not match', () => {
      mockUsePathname().mockReturnValue('/posts/123');
      const { result } = renderHook(() => useActivePath('/users/:id'));
      expect(result.current).toBe(false);
    });
  });

  describe('useNavigateTo', () => {
    it('calls router.push by default', () => {
      const push = vi.fn();
      const replace = vi.fn();
      const prefetch = vi.fn();
      mockUseRouter().mockReturnValue({ push, replace, prefetch });
      
      const { result } = renderHook(() => useNavigateTo());
      
      act(() => {
        result.current('/test');
      });
      
      expect(push).toHaveBeenCalledWith('/test', undefined);
      expect(replace).not.toHaveBeenCalled();
    });

    it('calls router.replace when option is provided', () => {
      const push = vi.fn();
      const replace = vi.fn();
      const prefetch = vi.fn();
      mockUseRouter().mockReturnValue({ push, replace, prefetch });
      
      const { result } = renderHook(() => useNavigateTo());
      
      act(() => {
        result.current('/test', { replace: true, scroll: false });
      });
      
      expect(replace).toHaveBeenCalledWith('/test', { scroll: false });
      expect(push).not.toHaveBeenCalled();
    });

    it('exposes prefetch method', () => {
      const push = vi.fn();
      const replace = vi.fn();
      const prefetch = vi.fn();
      mockUseRouter().mockReturnValue({ push, replace, prefetch });
      
      const { result } = renderHook(() => useNavigateTo());
      
      act(() => {
        result.current.prefetch('/test');
      });
      
      expect(prefetch).toHaveBeenCalledWith('/test', undefined);
    });
  });

  describe('useRouteParams', () => {
    it('returns params from Next.js useParams', () => {
      mockUseParams().mockReturnValue({ id: '123' });
      const { result } = renderHook(() => useRouteParams<'/users/:id'>());
      expect(result.current).toEqual({ id: '123' });
    });
  });

  describe('useTypedSearchParams', () => {
    it('parses search params correctly', () => {
      mockUsePathname().mockReturnValue('/search');
      mockUseSearchParams().mockReturnValue(new URLSearchParams('?q=test&page=1'));
      
      const { result } = renderHook(() => useTypedSearchParams({ coerceNumbers: true }));
      expect(result.current[0]).toEqual({ q: 'test', page: 1 });
    });

    it('updates search params via router.push', () => {
      const push = vi.fn();
      const replace = vi.fn();
      mockUseRouter().mockReturnValue({ push, replace });
      mockUsePathname().mockReturnValue('/search');
      mockUseSearchParams().mockReturnValue(new URLSearchParams('?q=test'));
      
      const { result } = renderHook(() => useTypedSearchParams());
      
      act(() => {
        result.current[1]({ q: 'new', tags: ['a', 'b'] });
      });
      
      expect(push).toHaveBeenCalledWith('/search?q=new&tags=a&tags=b', undefined);
    });
  });
});
