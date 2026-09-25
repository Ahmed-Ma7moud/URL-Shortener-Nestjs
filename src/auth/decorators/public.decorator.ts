import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE = 'isPublic';

export const Public = () => SetMetadata('isPublic', true);
