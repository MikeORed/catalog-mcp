#!/usr/bin/env node

import { CsvStorageAdapter } from './adapters/secondary/csv/csv-storage-adapter.js';
import { McpServer } from './adapters/primary/mcp/mcp-server.js';

/**
 * Main entry point for the Catalog MCP Server
 * 
 * Loads configuration, initializes storage, and starts the MCP server
 */
async function main() {
  try {
    // Get config path from environment variable or command line argument
    const configPath = process.env.CATALOG_CONFIG_PATH || process.argv[2];

    if (!configPath) {
      console.error('Error: Configuration path not provided');
      console.error('Usage: catalog-mcp <config-path>');
      console.error('  Or set CATALOG_CONFIG_PATH environment variable');
      process.exit(1);
    }

    console.error(`Initializing Catalog MCP Server...`);
    console.error(`Config path: ${configPath}`);

    // Initialize storage adapter
    const storage = new CsvStorageAdapter(configPath);
    await storage.initialize();

    // Create and start MCP server
    const mcpServer = new McpServer(storage, 'catalog-mcp', '1.0.0');
    await mcpServer.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      console.error('Shutting down...');
      await storage.shutdown();
      await mcpServer.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('Fatal error during startup:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
