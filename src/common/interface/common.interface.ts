export interface PaginationMetadata {    
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
}

export interface ParsePageResult {
    page: number;
    limit: number;
    skip: number;
}