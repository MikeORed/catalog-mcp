import type { QueryRequest } from '../domain/entities/query-request.js';
import type { QueryResult } from '../domain/entities/query-result.js';
import type { DatasetStoragePort } from '../ports/secondary/dataset-storage-port.js';
import { DatasetCatalogService } from '../domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../domain/services/field-validator.js';
import { FilterService } from '../domain/services/filter-service.js';
import { ProjectionService } from '../domain/services/projection-service.js';
import { LimitService } from '../domain/services/limit-service.js';

/**
 * Use case for querying datasets with filtering, projection, and limits.
 * 
 * Orchestrates the complete query process:
 * 1. Validate filter and select fields
 * 2. Load dataset
 * 3. Apply filters
 * 4. Apply limit
 * 5. Project fields
 * 6. Return results with metadata
 */
export class QueryDatasetUseCase {
  private readonly filterService = new FilterService();
  private readonly projectionService = new ProjectionService();
  private readonly limitService = new LimitService();

  constructor(
    private readonly storage: DatasetStoragePort,
    private readonly catalog: DatasetCatalogService,
    private readonly fieldValidator: FieldValidator
  ) {}

  /**
   * Execute a query against a dataset.
   * 
   * @param request - The query request with dataset ID, filters, fields, and limit
   * @returns Query result with data and metadata
   * @throws DatasetNotFoundError if the dataset doesn't exist
   * @throws InvalidFieldError if filter or select fields are invalid
   * @throws InvalidFilterError if unsupported filter operators are used
   */
  async execute(request: QueryRequest): Promise<QueryResult> {
    const { datasetId, filter, selectFields, limit } = request;

    // Get dataset schema
    const schema = this.catalog.getSchema(datasetId);

    // Validate filter fields if filter provided
    if (filter) {
      this.fieldValidator.validateFilterFields(filter, schema);
    }

    // Determine fields to return (select fields or visible fields)
    const fieldsToReturn = selectFields && selectFields.length > 0 
      ? selectFields 
      : schema.visibleFields;

    // Validate select fields
    this.fieldValidator.validateSelectFields(fieldsToReturn, schema);

    // Load all data from storage
    const allRows = await this.storage.loadDataset(datasetId);

    // Apply filter if provided
    const filteredRows = this.filterService.applyFilter(allRows, filter);

    // Compute effective limit
    const effectiveLimit = this.limitService.computeEffectiveLimit(schema, limit);

    // Apply limit
    const limitedRows = filteredRows.slice(0, effectiveLimit);

    // Project fields
    const projectedRows = this.projectionService.projectRows(limitedRows, fieldsToReturn);

    // Determine if result was truncated
    const wasTruncated = this.limitService.wasTruncated(filteredRows.length, effectiveLimit);

    // Return result with complete truncation metadata
    return {
      rows: projectedRows,
      count: projectedRows.length,
      limitApplied: true, // A limit is always applied (either default or explicit)
      truncated: wasTruncated,
      totalMatched: filteredRows.length,
      fields: fieldsToReturn,
    };
  }
}
