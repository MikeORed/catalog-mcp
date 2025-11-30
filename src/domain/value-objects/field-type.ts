/**
 * Supported field types in MVP
 * Intentionally restricted to prevent complexity
 */
export enum FieldType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
}

/**
 * Type guard to check if a string is a valid FieldType
 */
export function isValidFieldType(value: unknown): value is FieldType {
  return (
    value === FieldType.String ||
    value === FieldType.Number ||
    value === FieldType.Boolean ||
    value === FieldType.Enum
  );
}

/**
 * Get all valid field type values
 */
export function getValidFieldTypes(): FieldType[] {
  return [FieldType.String, FieldType.Number, FieldType.Boolean, FieldType.Enum];
}
