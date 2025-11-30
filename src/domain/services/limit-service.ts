import type { DatasetSchema } from '../entities/dataset-schema.js';

/**
 * Service for computing effective row limits for query results.
 * 
 * Handles the logic for determining the actual number of rows to return
 * based on dataset limits and user requests.
 */
export class LimitService {
  /**
   * Compute the effective limit for a query.
   * 
   * Logic:
   * - If no limit requested, use dataset's defaultLimit
   * - If limit requested, use min(requested, maxLimit)
   * - Always enforce maxLimit as upper bound
   * 
   * @param schema - The dataset schema containing limit configuration
   * @param requestedLimit - The limit requested by the client (optional)
   * @returns The effective limit to apply
   */
  computeEffectiveLimit(schema: DatasetSchema, requestedLimit?: number): number {
    const { defaultLimit, maxLimit } = schema.limits;

    // If no limit requested, use default
    if (requestedLimit === undefined || requestedLimit === null) {
      return defaultLimit;
    }

    // If limit is <= 0, use default
    if (requestedLimit <= 0) {
      return defaultLimit;
    }

    // Return the minimum of requested and max limit
    return Math.min(requestedLimit, maxLimit);
  }

  /**
   * Check if the result set was truncated due to limit.
   * 
   * @param totalRows - The total number of rows available
   * @param effectiveLimit - The limit that was applied
   * @returns true if more rows exist beyond the limit
   */
  wasTruncated(totalRows: number, effectiveLimit: number): boolean {
    return totalRows > effectiveLimit;
  }
}
