import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ListDatasetsTool } from './tools/list-datasets-tool.js';
import { DescribeDatasetTool } from './tools/describe-dataset-tool.js';
import { QueryDatasetTool } from './tools/query-dataset-tool.js';
import { GetByIdTool } from './tools/get-by-id-tool.js';

import { ListDatasetsUseCase } from '../../../use-cases/list-datasets-use-case.js';
import { DescribeDatasetUseCase } from '../../../use-cases/describe-dataset-use-case.js';
import { QueryDatasetUseCase } from '../../../use-cases/query-dataset-use-case.js';
import { GetByIdUseCase } from '../../../use-cases/get-by-id-use-case.js';

import { DatasetStoragePort } from '../../../ports/secondary/dataset-storage-port.js';
import { DatasetCatalogService } from '../../../domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../../domain/services/field-validator.js';

/**
 * MCP Server Adapter
 * 
 * Exposes dataset catalog functionality through the Model Context Protocol.
 * Provides 4 tools: list_datasets, describe_dataset, query_dataset, get_by_id
 */
export class McpServer {
  private server: Server;
  private tools: {
    listDatasets: ListDatasetsTool;
    describeDataset: DescribeDatasetTool;
    queryDataset: QueryDatasetTool;
    getById: GetByIdTool;
  };

  constructor(
    storage: DatasetStoragePort,
    private readonly serverName: string = 'catalog-mcp',
    private readonly serverVersion: string = '1.0.0'
  ) {
    // Initialize domain services
    const schemas = storage.listSchemas();
    const catalog = new DatasetCatalogService(schemas);
    const fieldValidator = new FieldValidator();

    // Initialize use cases
    const listDatasetsUseCase = new ListDatasetsUseCase(storage);
    const describeDatasetUseCase = new DescribeDatasetUseCase(catalog);
    const queryDatasetUseCase = new QueryDatasetUseCase(storage, catalog, fieldValidator);
    const getByIdUseCase = new GetByIdUseCase(storage, catalog, fieldValidator);

    // Initialize tools
    this.tools = {
      listDatasets: new ListDatasetsTool(listDatasetsUseCase),
      describeDataset: new DescribeDatasetTool(describeDatasetUseCase),
      queryDataset: new QueryDatasetTool(queryDatasetUseCase),
      getById: new GetByIdTool(getByIdUseCase)
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.serverName,
        version: this.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          this.tools.listDatasets.getMetadata(),
          this.tools.describeDataset.getMetadata(),
          this.tools.queryDataset.getMetadata(),
          this.tools.getById.getMetadata()
        ]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'list_datasets':
            result = await this.tools.listDatasets.execute();
            break;

          case 'describe_dataset':
            result = await this.tools.describeDataset.execute(args as any);
            break;

          case 'query_dataset':
            result = await this.tools.queryDataset.execute(args as any);
            break;

          case 'get_by_id':
            result = await this.tools.getById.execute(args as any);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: errorMessage }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error(`${this.serverName} v${this.serverVersion} started`);
    console.error('MCP server ready on stdio');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
    console.error('MCP server stopped');
  }
}
