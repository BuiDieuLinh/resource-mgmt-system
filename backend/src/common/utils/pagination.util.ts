import { PaginationDto } from '../dto/pagination.dto';

export interface PaginationMeta {
  skip: number;
  take: number;
  pageIndex: number;
  pageSize: number;
}

export function resolvePagination(dto: PaginationDto): PaginationMeta {
  const pageIndex = dto.pageIndex ?? 1;
  const pageSize =
    dto.pageSize != null && dto.pageSize > 0 ? dto.pageSize : 999;

  return {
    pageIndex,
    pageSize,
    skip: (pageIndex - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  count: number,
  meta: PaginationMeta,
) {
  return {
    data,
    count,
    pageIndex: meta.pageIndex,
    pageSize: meta.pageSize,
    totalPages: Math.ceil(count / meta.pageSize),
  };
}
