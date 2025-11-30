import { ListDatasetsUseCase } from '../../../../use-cases/list-datasets-use-case.js';
import { mapDomainErrorToMcp } from '../error-mapper.js';
import { logRequest, logError } from '../logger.js';

/**
 * MCP Tool: list_datasets
 * 
 * Lists all available datasets with their schemas.
 * No parameters required.
 */
export class ListDatasetsTool {
  constructor(private readonly useCase: ListDatasetsUseCase) {}

  /**
   * Get tool metadata for MCP registration
   */
  getMetadata() {
    return {
      name: 'list_datasets',
      description: 'List all available datasets with their schemas',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  /**
   * Execute the tool
   */
  async execute(): Promise<any> {
    const startTime = Date.now();

    try {
      const schemas = await this.useCase.execute();

      const duration = Date.now() - startTime;
      logRequest({
        toolName: 'list_datasets',
        rowCount: schemas.length,
        duration
      });

      return {
        datasets: schemas.map(schema => ({
          id: schema.id,
          name: schema.name,
          description: schema.description,
          fieldCount: schema.fields.length,
          keyField: schema.keyField,
          lookupKeys: schema.lookupKeys,
          visibleFields: schema.visibleFields,
          limits: schema.limits
        }))
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const mcpError = mapDomainErrorToMcp(error as Error);
      
      logError({
        toolName: 'list_datasets',
        error: mcpError.message
      });

      throw new Error(`[${mcpError.code}] ${mcpError.message}`);
    }
  }
}
