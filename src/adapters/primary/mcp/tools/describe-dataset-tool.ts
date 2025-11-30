import { DescribeDatasetUseCase } from '../../../../use-cases/describe-dataset-use-case.js';
import { mapDomainErrorToMcp } from '../error-mapper.js';
import { logRequest, logError } from '../logger.js';

/**
 * MCP Tool: describe_dataset
 * 
 * Get detailed schema information for a specific dataset.
 */
export class DescribeDatasetTool {
  constructor(private readonly useCase: DescribeDatasetUseCase) {}

  /**
   * Get tool metadata for MCP registration
   */
  getMetadata() {
    return {
      name: 'describe_dataset',
      description: 'Get detailed schema information for a specific dataset',
      inputSchema: {
        type: 'object',
        properties: {
          datasetId: {
            type: 'string',
            description: 'The ID of the dataset to describe'
          }
        },
        required: ['datasetId']
      }
    };
  }

  /**
   * Execute the tool
   */
  async execute(params: { datasetId: string }): Promise<any> {
    const startTime = Date.now();

    if (!params.datasetId) {
      throw new Error('[invalid_request] datasetId parameter is required');
    }

    try {
      const schema = await this.useCase.execute(params.datasetId);

      const duration = Date.now() - startTime;
      logRequest({
        toolName: 'describe_dataset',
        datasetId: params.datasetId,
        fieldCount: schema.fields.length,
        duration
      });

      return {
        id: schema.id,
        name: schema.name,
        description: schema.description,
        fields: schema.fields.map(field => ({
          name: field.name,
          type: field.type,
          enumValues: field.enumValues,
          isKey: field.isKey,
          isLookupKey: field.isLookupKey
        })),
        keyField: schema.keyField,
        lookupKeys: schema.lookupKeys,
        visibleFields: schema.visibleFields,
        limits: schema.limits
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const mcpError = mapDomainErrorToMcp(error as Error);
      
      logError({
        toolName: 'describe_dataset',
        datasetId: params.datasetId,
        error: mcpError.message
      });

      throw new Error(`[${mcpError.code}] ${mcpError.message}`);
    }
  }
}
