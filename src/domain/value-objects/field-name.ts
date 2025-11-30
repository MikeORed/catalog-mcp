/**
 * Name of a field within a dataset
 * Must be a non-empty string
 */
export type FieldName = string;

/**
 * Validates that a field name is valid
 * @param name - The field name to validate
 * @returns true if valid
 */
export function validateFieldName(name: unknown): name is FieldName {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return false;
  }
  
  // Field names should be valid identifiers
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validPattern.test(name);
}
