import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

type ParamValue = string | number | null | undefined;

/**
 * Sync filter/pagination/search state với URL search params.
 * Khi reload trang, state được khôi phục từ URL.
 *
 * @example
 * const { get, set, getInt } = useUrlParams({ page: '1', size: '10' });
 * const page   = getInt('page');
 * const search = get('search');
 * set({ search: 'john', page: '1' }); // reset page khi search
 */
export function useUrlParams(defaults: Record<string, string> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  /** Đọc 1 param, fallback về default nếu không có */
  const get = useCallback(
    (key: string): string => searchParams.get(key) ?? defaults[key] ?? '',
    [searchParams, defaults],
  );

  /** Đọc param dạng number */
  const getInt = useCallback(
    (key: string, fallback?: number): number => {
      const raw = searchParams.get(key) ?? defaults[key];
      const parsed = parseInt(raw ?? '');
      return isNaN(parsed) ? (fallback ?? parseInt(defaults[key] ?? '0')) : parsed;
    },
    [searchParams, defaults],
  );

  /**
   * Cập nhật một hoặc nhiều params cùng lúc.
   * Truyền null/undefined/''/0 để xóa param khỏi URL.
   */
  const set = useCallback(
    (updates: Record<string, ParamValue>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          const str = v == null || v === '' ? null : String(v);
          // nếu giá trị bằng default thì xóa khỏi URL cho sạch
          const isDefault = str === (defaults[k] ?? null);
          if (str === null || isDefault) {
            next.delete(k);
          } else {
            next.set(k, str);
          }
        });
        return next;
      });
    },
    [setSearchParams, defaults],
  );

  /** Xóa toàn bộ params, về trạng thái mặc định */
  const reset = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { get, getInt, set, reset, searchParams };
}
