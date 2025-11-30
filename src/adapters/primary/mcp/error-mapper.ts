import { DatasetNotFoundError } from '../../../domain/errors/dataset-not-found-error.js';
import { InvalidFilterError } from '../../../domain/errors/invalid-filter-error.js';
import { InvalidFieldError } from '../../../domain/errors/invalid-field-error.js';
import { ConfigError } from '../../../domain/errors/config-error.js';

/**
 * MCP Error Response structure
 */
export interface McpError {
  code: string;
  message: string;
}

/**
 * Map domain errors to MCP error responses
 * 
 * @param error - The error to map
 * @returns MCP error response
 */
export function mapDomainErrorToMcp(error: Error): McpError {
  // Dataset not found -> not_found
  if (error instanceof DatasetNotFoundError) {
    return {
      code: 'not_found',
      message: error.message
    };
  }

  // Invalid filter -> invalid_request
  if (error instanceof InvalidFilterError) {
    return {
      code: 'invalid_request',
      message: error.message
    };
  }

  // Invalid field -> invalid_request with field context
  if (error instanceof InvalidFieldError) {
    const validFieldsList = error.validFields.join(', ');
    return {
      code: 'invalid_request',
      message: `${error.message} Valid fields: ${validFieldsList}`
    };
  }

  // Configuration error -> server_error
  if (error instanceof ConfigError) {
    return {
      code: 'server_error',
      message: `Configuration error: ${error.message}`
    };
  }

  // Generic error -> server_error
  return {
    code: 'server_error',
    message: error.message || 'An unexpected error occurred'
  };
}
