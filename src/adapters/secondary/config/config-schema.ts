import { z } from 'zod';
import { FieldType } from '../../../domain/value-objects/field-type.js';

/**
 * Zod schema for validating dataset field definitions
 */
const DatasetFieldSchema = z.object({
  name: z.string().min(1, 'Field name cannot be empty').regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Field name must be a valid identifier'
  ),
  type: z.enum([FieldType.String, FieldType.Number, FieldType.Boolean, FieldType.Enum], {
    message: 'MVP supports only: string, number, boolean, enum'
  }),
  enumValues: z.array(z.string().min(1)).min(1).optional(),
  isKey: z.boolean(),
  isLookupKey: z.boolean(),
}).refine(
  (field) => {
    // If type is enum, enumValues must be provided and non-empty
    if (field.type === FieldType.Enum) {
      return field.enumValues && field.enumValues.length > 0;
    }
    return true;
  },
  {
    message: "Enum fields must have non-empty 'enumValues' array",
    path: ['enumValues'],
  }
);

/**
 * Zod schema for dataset limits
 */
const LimitsSchema = z.object({
  defaultLimit: z.number().int().positive('defaultLimit must be positive'),
  maxLimit: z.number().int().positive('maxLimit must be positive'),
}).refine(
  (limits) => limits.maxLimit >= limits.defaultLimit,
  {
    message: 'maxLimit must be greater than or equal to defaultLimit',
    path: ['maxLimit'],
  }
);

/**
 * Zod schema for a single dataset configuration
 */
const DatasetConfigSchema = z.object({
  id: z.string().min(1, 'Dataset ID cannot be empty').regex(
    /^[a-zA-Z0-9_-]+$/,
    'Dataset ID must contain only alphanumeric characters, hyphens, and underscores'
  ),
  name: z.string().min(1, 'Dataset name cannot be empty'),
  description: z.string().optional(),
  path: z.string().min(1, 'Path cannot be empty'),
  fields: z.array(DatasetFieldSchema).min(1, 'At least one field is required'),
  keyField: z.string().min(1, 'keyField cannot be empty'),
  lookupKeys: z.array(z.string().min(1)),
  visibleFields: z.array(z.string().min(1)).min(1, 'visibleFields cannot be empty'),
  limits: LimitsSchema,
}).refine(
  (config) => {
    // keyField must exist in fields
    const fieldNames = config.fields.map(f => f.name);
    return fieldNames.includes(config.keyField);
  },
  {
    message: 'keyField must exist in fields array',
    path: ['keyField'],
  }
).refine(
  (config) => {
    // All lookupKeys must exist in fields
    const fieldNames = config.fields.map(f => f.name);
    return config.lookupKeys.every(key => fieldNames.includes(key));
  },
  {
    message: 'All lookupKeys must exist in fields array',
    path: ['lookupKeys'],
  }
).refine(
  (config) => {
    // All visibleFields must exist in fields
    const fieldNames = config.fields.map(f => f.name);
    return config.visibleFields.every(field => fieldNames.includes(field));
  },
  {
    message: 'All visibleFields must exist in fields array',
    path: ['visibleFields'],
  }
).refine(
  (config) => {
    // Field names must be unique within a dataset
    const fieldNames = config.fields.map(f => f.name);
    return fieldNames.length === new Set(fieldNames).size;
  },
  {
    message: 'Field names must be unique within a dataset',
    path: ['fields'],
  }
);

/**
 * Zod schema for the project configuration (root)
 */
export const ProjectConfigSchema = z.object({
  datasets: z.array(DatasetConfigSchema).min(1, 'At least one dataset is required'),
}).refine(
  (config) => {
    // Dataset IDs must be unique
    const ids = config.datasets.map(d => d.id);
    return ids.length === new Set(ids).size;
  },
  {
    message: 'Dataset IDs must be unique across all datasets',
    path: ['datasets'],
  }
);

/**
 * Type inference from Zod schema
 */
export type ProjectConfigType = z.infer<typeof ProjectConfigSchema>;
export type DatasetConfigType = z.infer<typeof DatasetConfigSchema>;
