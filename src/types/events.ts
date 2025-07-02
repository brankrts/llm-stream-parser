/**
 * Event types for LLM Stream Parser
 */

import { BaseTag, TagMatch, ParserStats } from './base';
import { ParserError } from './errors';

/**
 * Parser event types with type-safe handlers
 */
export interface ParserEvents<T extends BaseTag = BaseTag> {
  /** Emitted when a tag starts being parsed */
  tag_started: (tagName: T['tagName'], attributes?: T['attributes']) => void;
  /** Emitted when a tag's content is updated during streaming */
  tag_content_update: (tagName: T['tagName'], partialContent: string) => void;
  /** Emitted when a tag is completely parsed */
  tag_completed: (tag: T) => void;
  /** Emitted when a parsing error occurs */
  parse_error: (error: ParserError, context: TagMatch | string) => void;
  /** Emitted when parsing is complete for the current buffer */
  parsing_complete: (parsedTags: T[]) => void;
  /** Emitted when buffer is cleared */
  buffer_cleared: () => void;
  /** Emitted when parser statistics are updated */
  stats_updated: (stats: ParserStats) => void;
  /** Emitted when parser is reset */
  parser_reset: () => void;
  /** Emitted when parsing is finalized */
  parsing_finalized: (stats: ParserStats) => void;

  // Enhanced events for nested parsing
  /** Emitted when a tag is opened (nested mode) */
  tag_opened: (tag: Partial<T>, depth: number, path: string) => void;
  /** Emitted when a tag is closed (nested mode) */
  tag_closed: (tag: T, depth: number, path: string) => void;
  /** Emitted when a subtree is completed (nested mode) */
  subtree_completed: (rootTag: T, depth: number) => void;
  /** Emitted when entire document is parsed (nested mode) */
  document_completed: (rootTags: T[]) => void;
}

/**
 * Event handler function type
 */
export type EventHandler<
  T extends BaseTag = BaseTag,
  K extends keyof ParserEvents<T> = keyof ParserEvents<T>
> = ParserEvents<T>[K];

/**
 * Event emitter interface
 */
export interface EventEmitter<T extends BaseTag = BaseTag> {
  on<K extends keyof ParserEvents<T>>(event: K, listener: ParserEvents<T>[K]): this;
  off<K extends keyof ParserEvents<T>>(event: K, listener: ParserEvents<T>[K]): this;
  once<K extends keyof ParserEvents<T>>(event: K, listener: ParserEvents<T>[K]): this;
  emit<K extends keyof ParserEvents<T>>(event: K, ...args: Parameters<ParserEvents<T>[K]>): boolean;
}

/**
 * Event listener options
 */
export interface ListenerOptions {
  /** Remove listener after first emission */
  once?: boolean;
  /** Priority for listener ordering (higher = called first) */
  priority?: number;
  /** Context object for listener */
  context?: any;
}

/**
 * Event subscription handle
 */
export interface EventSubscription {
  /** Remove this event listener */
  unsubscribe(): void;
  /** Check if subscription is still active */
  isActive(): boolean;
}

/**
 * Batch event data for bulk processing
 */
export interface BatchEventData<T extends BaseTag = BaseTag> {
  type: 'batch_completed';
  tags: T[];
  totalProcessingTime: number;
  averageTagSize: number;
}

/**
 * Progress event data for long-running operations
 */
export interface ProgressEventData {
  type: 'parsing_progress';
  processed: number;
  total: number;
  percentage: number;
  estimatedTimeRemaining?: number;
}

/**
 * Performance metrics event data
 */
export interface PerformanceEventData {
  type: 'performance_metrics';
  memoryUsage: number;
  processingSpeed: number; // tags per second
  bufferUtilization: number; // percentage
  errorRate: number; // errors per 1000 tags
}

/**
 * Debug event data for development
 */
export interface DebugEventData {
  type: 'debug_info';
  message: string;
  data?: any;
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn';
}

/**
 * Extended events for advanced use cases
 */
export interface ExtendedParserEvents<T extends BaseTag = BaseTag> extends ParserEvents<T> {
  /** Emitted for batch operations */
  batch_completed: (data: BatchEventData<T>) => void;
  /** Emitted for progress tracking */
  parsing_progress: (data: ProgressEventData) => void;
  /** Emitted for performance monitoring */
  performance_metrics: (data: PerformanceEventData) => void;
  /** Emitted for debug information */
  debug_info: (data: DebugEventData) => void;
}
