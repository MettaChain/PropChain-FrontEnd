import { z } from 'zod';

// Bounds the page size accepted by GET /api/properties so a caller can't
// force an unbounded/expensive listing query.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(12),
});
