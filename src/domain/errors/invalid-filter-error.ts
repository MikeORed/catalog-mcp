/**
 * Error thrown when a filter expression is invalid
 */
export class InvalidFilterError extends Error {
  constructor(
    message: string,
    public readonly operator?: string
  ) {
    super(message);
    this.name = 'InvalidFilterError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidFilterError);
    }
  }
}
