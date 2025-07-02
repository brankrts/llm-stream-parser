/**
 * Configuration types for LLM Stream Parser
 */

import { ParserError } from './errors';

/**
 * Configuration options for the parser
 */
export interface ParserConfig {
  /** Whether tag names are case sensitive (default: false) */
  caseSensitive?: boolean;
  /** Whether to trim whitespace from content (default: true) */
  trimWhitespace?: boolean;
  /** Maximum buffer size in bytes (default: 1MB) */
  maxBufferSize?: number;
  /** Whether to preserve attributes order (default: false) */
  preserveAttributeOrder?: boolean;
  /** Custom error handler for parsing errors */
  errorHandler?: ((error: ParserError) => void) | undefined;

  // Enhanced options for nested parsing
  /** Maximum nesting depth (default: 50) */
  maxDepth?: number;
  /** Whether to preserve whitespace in nested content (default: false) */
  preserveWhitespace?: boolean;
  /** Whether to auto-close unclosed tags at EOF (default: true) */
  autoCloseUnclosed?: boolean;
  /** Enable nested parsing mode (default: false for backward compatibility) */
  enableNested?: boolean;
}

/**
 * Required configuration with all defaults applied
 */
export interface RequiredParserConfig {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  maxBufferSize: number;
  preserveAttributeOrder: boolean;
  errorHandler: ((error: ParserError) => void) | undefined;
  maxDepth: number;
  preserveWhitespace: boolean;
  autoCloseUnclosed: boolean;
  enableNested: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: RequiredParserConfig = {
  caseSensitive: false,
  trimWhitespace: true,
  maxBufferSize: 1024 * 1024, // 1MB
  preserveAttributeOrder: false,
  errorHandler: undefined,
  maxDepth: 50,
  preserveWhitespace: false,
  autoCloseUnclosed: true,
  enableNested: false,
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(config: ParserConfig = {}): RequiredParserConfig {
  return {
    caseSensitive: config.caseSensitive ?? DEFAULT_CONFIG.caseSensitive,
    trimWhitespace: config.trimWhitespace ?? DEFAULT_CONFIG.trimWhitespace,
    maxBufferSize: config.maxBufferSize ?? DEFAULT_CONFIG.maxBufferSize,
    preserveAttributeOrder: config.preserveAttributeOrder ?? DEFAULT_CONFIG.preserveAttributeOrder,
    errorHandler: config.errorHandler ?? DEFAULT_CONFIG.errorHandler,
    maxDepth: config.maxDepth ?? DEFAULT_CONFIG.maxDepth,
    preserveWhitespace: config.preserveWhitespace ?? DEFAULT_CONFIG.preserveWhitespace,
    autoCloseUnclosed: config.autoCloseUnclosed ?? DEFAULT_CONFIG.autoCloseUnclosed,
    enableNested: config.enableNested ?? DEFAULT_CONFIG.enableNested,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: ParserConfig): string[] {
  const errors: string[] = [];

  if (config.maxBufferSize !== undefined && config.maxBufferSize <= 0) {
    errors.push('maxBufferSize must be greater than 0');
  }

  if (config.maxDepth !== undefined && config.maxDepth <= 0) {
    errors.push('maxDepth must be greater than 0');
  }

  if (config.maxBufferSize !== undefined && config.maxBufferSize > 100 * 1024 * 1024) {
    errors.push('maxBufferSize should not exceed 100MB for performance reasons');
  }

  if (config.maxDepth !== undefined && config.maxDepth > 1000) {
    errors.push('maxDepth should not exceed 1000 for performance reasons');
  }

  return errors;
}
