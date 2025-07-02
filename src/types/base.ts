/**
 * Base types for LLM Stream Parser
 */

/**
 * Base interface that all custom tag definitions must extend
 */
export interface BaseTag {
  readonly tagName: string;
  content: string;
  attributes?: Record<string, unknown>;
}

/**
 * Enhanced base tag interface that supports nested structure
 * Backward compatible with BaseTag
 */
export interface NestedTag extends BaseTag {
  children?: NestedTag[];
  parent: NestedTag | undefined;
  path: string | undefined;
  depth?: number;
  isSelfClosing?: boolean;
}

/**
 * Tag match information from the parser
 */
export interface TagMatch {
  readonly tagName: string;
  readonly content: string;
  readonly attributes: Record<string, unknown> | undefined;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly fullMatch: string;
  readonly type?: 'opening' | 'closing' | 'self-closing' | 'complete';
  readonly depth?: number;
  readonly path?: string;
}

/**
 * Validation result for tag content or attributes
 */
export type ValidationResult = true | string;

/**
 * Parser state enumeration
 */
export enum ParserState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
}

/**
 * Statistics about parsing operations
 */
export interface ParserStats {
  readonly totalTagsParsed: number;
  readonly totalBytesProcessed: number;
  readonly errorCount: number;
  readonly bufferSize: number;
  readonly state: ParserState;
  readonly registeredTagsCount: number;
  readonly maxDepthReached?: number;
  readonly totalNestedTags?: number;
  readonly selfClosingTags?: number;
}

/**
 * Parse result interface
 */
export interface ParsedResult<T = any> {
  success: boolean;
  data?: T;
  errors?: any[];
  warnings?: string[];
  stats: ParserStats;
}
