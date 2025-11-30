import type { DatasetId } from '../domain/value-objects/dataset-id.js';
import type { FieldName } from '../domain/value-objects/field-name.js';
import type { QueryResult } from '../domain/entities/query-result.js';
import type { DatasetStoragePort } from '../ports/secondary/dataset-storage-port.js';
import { DatasetCatalogService } from '../domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../domain/services/field-validator.js';
import { ProjectionService } from '../domain/services/projection-service.js';

/**
 * Use case for retrieving a single row by its key field value.
 * 
 * Fetches one specific row from a dataset and optionally projects
 * selected fields.
 */
export class GetByIdUseCase {
  private readonly projectionService = new ProjectionService();

  constructor(
    private readonly storage: DatasetStoragePort,
    private readonly catalog: DatasetCatalogService,
    private readonly fieldValidator: FieldValidator
  ) {}

  /**
   * Execute the get by ID operation.
   * 
   * @param datasetId - The ID of the dataset
   * @param keyValue - The value of the key field to search for
   * @param selectFields - Optional fields to return (defaults to visible fields)
   * @returns Query result with the matching row, or empty result if not found
   * @throws DatasetNotFoundError if the dataset doesn't exist
   * @throws InvalidFieldError if select fields are invalid
   */
  async execute(
    datasetId: DatasetId,
    keyValue: string | number,
    selectFields?: FieldName[]
  ): Promise<QueryResult> {
    // Get dataset schema
    const schema = this.catalog.getSchema(datasetId);

    // Determine fields to return (select fields or visible fields)
    const fieldsToReturn = selectFields && selectFields.length > 0 
      ? selectFields 
      : schema.visibleFields;

    // Validate select fields
    this.fieldValidator.validateSelectFields(fieldsToReturn, schema);

    // Load the specific row by key
    const row = await this.storage.loadById(datasetId, keyValue);

    // If not found, return empty result
    if (!row) {
      return {
        rows: [],
        count: 0,
        truncated: false,
        fields: fieldsToReturn,
      };
    }

    // Project fields
    const projectedRows = this.projectionService.projectRows([row], fieldsToReturn);

    // Return result
    return {
      rows: projectedRows,
      count: 1,
      truncated: false,
      fields: fieldsToReturn,
    };
  }
}
