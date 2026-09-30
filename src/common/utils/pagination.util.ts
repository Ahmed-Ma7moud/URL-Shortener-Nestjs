import { PaginationDto } from '../dto/pagination.dto';
import { PaginationMetadata } from '../interface/common.interface';
import { ParsePageResult } from '../interface/common.interface';

export function parsePage(query: PaginationDto): ParsePageResult {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPagination(
  page: number,
  limit: number,
  totalCount: number,
): PaginationMetadata {
  return {
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
  };
}
