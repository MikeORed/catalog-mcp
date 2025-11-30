import { QueryDatasetUseCase } from '../../../../use-cases/query-dataset-use-case.js';
import { QueryRequest } from '../../../../domain/entities/query-request.js';
import { parseFilter } from '../filter-parser.js';
import { mapDomainErrorToMcp } from '../error-mapper.js';
import { logRequest, logError } from '../logger.js';

/**
 * MCP Tool: query_dataset
 * 
 * Query a dataset with optional filtering, field selection, and limits.
 */
export class QueryDatasetTool {
  constructor(private readonly useCase: QueryDatasetUseCase) {}

  /**
   * Get tool metadata for MCP registration
   */
  getMetadata() {
    return {
      name: 'query_dataset',
      description: 'Query a dataset with optional filtering, field selection, and limits',
      inputSchema: {
        type: 'object',
        properties: {
          datasetId: {
            type: 'string',
            description: 'The ID of the dataset to query'
          },
          filter: {
            type: 'object',
            description: 'Optional filter expression (supports eq, contains, and operators)',
            properties: {
              field: { type: 'string' },
              op: { type: 'string', enum: ['eq', 'contains'] },
              value: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
              and: { type: 'array' }
            }
          },
          selectFields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional array of field names to include in results'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of rows to return',
            minimum: 1
          }
        },
        required: ['datasetId']
      }
    };
  }

  /**
   * Execute the tool
   */
  async execute(params: {
    datasetId: string;
    filter?: unknown;
    selectFields?: string[];
    limit?: number;
  }): Promise<any> {
    const startTime = Date.now();

    if (!params.datasetId) {
      throw new Error('[invalid_request] datasetId parameter is required');
    }

    try {
      // Parse filter if provided
      let parsedFilter = undefined;
      if (params.filter) {
        try {
          parsedFilter = parseFilter(params.filter);
        } catch (error) {
          throw new Error(`[invalid_request] Invalid filter: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Build query request
      const request: QueryRequest = {
        datasetId: params.datasetId,
        filter: parsedFilter,
        selectFields: params.selectFields,
        limit: params.limit
      };

      // Execute query
      const result = await this.useCase.execute(request);

      const duration = Date.now() - startTime;
      logRequest({
        toolName: 'query_dataset',
        datasetId: params.datasetId,
        rowCount: result.count,
        fieldCount: result.fields.length,
        duration
      });

      return {
        rows: result.rows,
        count: result.count,
        truncated: result.truncated,
        fields: result.fields
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const mcpError = mapDomainErrorToMcp(error as Error);
      
      logError({
        toolName: 'query_dataset',
        datasetId: params.datasetId,
        error: mcpError.message
      });

      throw new Error(`[${mcpError.code}] ${mcpError.message}`);
    }
  }
}
