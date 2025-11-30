import type { FieldName } from '../value-objects/field-name.js';
import type { QueryResultRow } from '../entities/query-result.js';

/**
 * Service for projecting (selecting) specific fields from dataset rows.
 * 
 * Handles field selection to limit the data returned to only the
 * fields requested by the client.
 */
export class ProjectionService {
  /**
   * Project rows to include only specified fields.
   * 
   * @param rows - The rows to project
   * @param fields - The fields to include in the result
   * @returns Rows with only the specified fields
   */
  projectRows(rows: QueryResultRow[], fields: FieldName[]): QueryResultRow[] {
    if (fields.length === 0) {
      return rows;
    }

    return rows.map((row) => this.projectRow(row, fields));
  }

  /**
   * Project a single row to include only specified fields.
   * 
   * @param row - The row to project
   * @param fields - The fields to include
   * @returns A new row with only the specified fields
   */
  private projectRow(row: QueryResultRow, fields: FieldName[]): QueryResultRow {
    const projectedRow: QueryResultRow = {};

    for (const field of fields) {
      projectedRow[field] = row[field];
    }

    return projectedRow;
  }
}
