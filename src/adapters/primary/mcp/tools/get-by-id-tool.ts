import { GetByIdUseCase } from '../../../../use-cases/get-by-id-use-case.js';
import { mapDomainErrorToMcp } from '../error-mapper.js';
import { logRequest, logError } from '../logger.js';

/**
 * MCP Tool: get_by_id
 * 
 * Retrieve a single row by its key field value.
 */
export class GetByIdTool {
  constructor(private readonly useCase: GetByIdUseCase) {}

  /**
   * Get tool metadata for MCP registration
   */
  getMetadata() {
    return {
      name: 'get_by_id',
      description: 'Retrieve a single row by its key field value',
      inputSchema: {
        type: 'object',
        properties: {
          datasetId: {
            type: 'string',
            description: 'The ID of the dataset to query'
          },
          id: {
            oneOf: [
              { type: 'string' },
              { type: 'number' }
            ],
            description: 'The value of the key field to search for'
          },
          selectFields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional array of field names to include in results'
          }
        },
        required: ['datasetId', 'id']
      }
    };
  }

  /**
   * Execute the tool
   */
  async execute(params: {
    datasetId: string;
    id: string | number;
    selectFields?: string[];
  }): Promise<any> {
    const startTime = Date.now();

    if (!params.datasetId) {
      throw new Error('[invalid_request] datasetId parameter is required');
    }

    if (params.id === undefined || params.id === null) {
      throw new Error('[invalid_request] id parameter is required');
    }

    try {
      // Execute get by ID
      const result = await this.useCase.execute(
        params.datasetId,
        params.id,
        params.selectFields
      );

      const duration = Date.now() - startTime;
      logRequest({
        toolName: 'get_by_id',
        datasetId: params.datasetId,
        rowCount: result.count,
        fieldCount: result.fields.length,
        duration
      });

      return {
        rows: result.rows,
        count: result.count,
        fields: result.fields
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const mcpError = mapDomainErrorToMcp(error as Error);
      
      logError({
        toolName: 'get_by_id',
        datasetId: params.datasetId,
        error: mcpError.message
      });

      throw new Error(`[${mcpError.code}] ${mcpError.message}`);
    }
  }
}
