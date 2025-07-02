/**
 * Error types for LLM Stream Parser
 */

/**
 * Error codes for different types of parsing errors
 */
export enum ParserErrorCode {
  INVALID_TAG_FORMAT = 'INVALID_TAG_FORMAT',
  UNKNOWN_TAG = 'UNKNOWN_TAG',
  CONTENT_VALIDATION_FAILED = 'CONTENT_VALIDATION_FAILED',
  ATTRIBUTE_VALIDATION_FAILED = 'ATTRIBUTE_VALIDATION_FAILED',
  BUFFER_OVERFLOW = 'BUFFER_OVERFLOW',
  MALFORMED_ATTRIBUTES = 'MALFORMED_ATTRIBUTES',
  UNCLOSED_TAG = 'UNCLOSED_TAG',
  TRANSFORMATION_FAILED = 'TRANSFORMATION_FAILED',

  // Enhanced error codes for nested parsing
  INVALID_NESTING = 'INVALID_NESTING',
  MISMATCHED_CLOSING_TAG = 'MISMATCHED_CLOSING_TAG',
  INVALID_SELF_CLOSING = 'INVALID_SELF_CLOSING',
  MAX_DEPTH_EXCEEDED = 'MAX_DEPTH_EXCEEDED',
  INVALID_CHILDREN = 'INVALID_CHILDREN',
  SCHEMA_VIOLATION = 'SCHEMA_VIOLATION',
}

/**
 * Custom error class for parsing errors
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public readonly code: ParserErrorCode,
    public readonly context?: unknown,
    public readonly path?: string,
    public readonly depth?: number
  ) {
    super(message);
    this.name = 'ParserError';
  }

  /**
   * Create error from validation failure
   */
  static fromValidation(
    tagName: string,
    validationMessage: string,
    type: 'content' | 'attributes' | 'children' = 'content'
  ): ParserError {
    const codeMap = {
      content: ParserErrorCode.CONTENT_VALIDATION_FAILED,
      attributes: ParserErrorCode.ATTRIBUTE_VALIDATION_FAILED,
      children: ParserErrorCode.INVALID_CHILDREN,
    };

    return new ParserError(
      `${type} validation failed for tag '${tagName}': ${validationMessage}`,
      codeMap[type]
    );
  }

  /**
   * Create error from transformation failure
   */
  static fromTransformation(tagName: string, error: Error): ParserError {
    return new ParserError(
      `Transformation failed for tag '${tagName}': ${error.message}`,
      ParserErrorCode.TRANSFORMATION_FAILED
    );
  }

  /**
   * Create error from unknown tag
   */
  static fromUnknownTag(tagName: string): ParserError {
    return new ParserError(`Unknown tag: ${tagName}`, ParserErrorCode.UNKNOWN_TAG);
  }

  /**
   * Create error from buffer overflow
   */
  static fromBufferOverflow(maxSize: number): ParserError {
    return new ParserError(
      `Buffer overflow: exceeds maximum size of ${maxSize} bytes`,
      ParserErrorCode.BUFFER_OVERFLOW
    );
  }

  /**
   * Create error from max depth exceeded
   */
  static fromMaxDepth(maxDepth: number, path?: string): ParserError {
    return new ParserError(
      `Maximum nesting depth of ${maxDepth} exceeded`,
      ParserErrorCode.MAX_DEPTH_EXCEEDED,
      undefined,
      path,
      maxDepth
    );
  }

  /**
   * Create error from mismatched closing tag
   */
  static fromMismatchedClosing(expected: string, actual: string, path?: string): ParserError {
    return new ParserError(
      `Mismatched closing tag: expected ${expected}, got ${actual}`,
      ParserErrorCode.MISMATCHED_CLOSING_TAG,
      { expected, actual },
      path
    );
  }
}
