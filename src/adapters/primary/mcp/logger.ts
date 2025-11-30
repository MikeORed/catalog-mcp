/**
 * Log format for MCP requests
 */
interface RequestLogData {
  toolName: string;
  datasetId?: string;
  rowCount?: number;
  fieldCount?: number;
  duration?: number;
  error?: string;
}

/**
 * Log a successful request
 * 
 * Format: [INFO] {tool}: dataset={id}, rows={count}, fields={count}, duration={ms}ms
 */
export function logRequest(data: RequestLogData): void {
  const timestamp = new Date().toISOString();
  const parts = [`[INFO] ${data.toolName}`];

  if (data.datasetId) {
    parts.push(`dataset=${data.datasetId}`);
  }

  if (data.rowCount !== undefined) {
    parts.push(`rows=${data.rowCount}`);
  }

  if (data.fieldCount !== undefined) {
    parts.push(`fields=${data.fieldCount}`);
  }

  if (data.duration !== undefined) {
    parts.push(`duration=${data.duration}ms`);
  }

  console.log(`${timestamp} ${parts.join(', ')}`);
}

/**
 * Log an error
 * 
 * Format: [ERROR] {tool}: dataset={id}, error={message}
 */
export function logError(data: RequestLogData): void {
  const timestamp = new Date().toISOString();
  const parts = [`[ERROR] ${data.toolName}`];

  if (data.datasetId) {
    parts.push(`dataset=${data.datasetId}`);
  }

  if (data.error) {
    parts.push(`error=${data.error}`);
  }

  console.error(`${timestamp} ${parts.join(', ')}`);
}
