import { readFile } from 'fs/promises';
import { ProjectConfigSchema, ProjectConfigType } from './config-schema.js';
import { ProjectConfig } from '../../../domain/entities/dataset-config.js';
import { ConfigError } from '../../../domain/errors/config-error.js';
import { ZodError } from 'zod';

/**
 * Loads and validates a project configuration from a JSON file
 * @param path Path to the configuration file
 * @returns Validated project configuration
 * @throws ConfigError if file cannot be read or validation fails
 */
export async function loadConfig(path: string): Promise<ProjectConfig> {
  try {
    // Read the file
    const fileContent = await readFile(path, 'utf-8');
    
    // Parse JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new ConfigError(
        `Failed to parse JSON from '${path}': ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }
    
    // Validate with Zod schema
    const validatedConfig = ProjectConfigSchema.parse(jsonData);
    
    // Convert to domain types
    return validatedConfig as ProjectConfig;
    
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    
    if (error instanceof ZodError) {
      // Format Zod validation errors into user-friendly messages
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      }).join('\n');
      
      throw new ConfigError(
        `Configuration validation failed:\n${errorMessages}`
      );
    }
    
    // File system or other errors
    if (error instanceof Error) {
      throw new ConfigError(
        `Failed to load configuration from '${path}': ${error.message}`
      );
    }
    
    throw new ConfigError(`Unknown error loading configuration from '${path}'`);
  }
}
