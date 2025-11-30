/**
 * Unique identifier for a dataset
 * Must be a non-empty string that follows naming conventions
 */
export type DatasetId = string;

/**
 * Validates that a dataset ID is valid
 * @param id - The dataset ID to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateDatasetId(id: unknown): id is DatasetId {
  if (typeof id !== 'string' || id.trim().length === 0) {
    return false;
  }
  
  // Dataset IDs should be reasonable identifiers (alphanumeric, hyphens, underscores)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(id);
}
