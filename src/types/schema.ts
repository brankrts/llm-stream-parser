/**
 * Schema types for LLM Stream Parser
 */

import { BaseTag, NestedTag, ValidationResult } from './base';

/**
 * Schema definition for automatic tag generation
 */
export interface SchemaDefinition {
  [tagName: string]: SchemaProperty;
}

/**
 * Schema property types
 */
export type SchemaProperty =
  | 'string'
  | 'number'
  | 'boolean'
  | SchemaDefinition
  | SchemaProperty[]
  | {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required?: boolean;
      default?: unknown;
      validation?: (value: unknown) => ValidationResult;
      transform?: (value: unknown) => unknown;
      children?: SchemaDefinition;
      items?: SchemaProperty;
    };

/**
 * Tag definition interface for registering custom tags
 */
export interface TagDefinition<T extends BaseTag = BaseTag> {
  readonly tagName: T['tagName'];

  /** Content validation function */
  validateContent?: (content: string) => ValidationResult;
  /** Attributes validation function */
  validateAttributes?: (attributes?: T['attributes']) => ValidationResult;
  /** Transform content before emitting events */
  transformContent?: (content: string) => string;
  /** Transform attributes before emitting events */
  transformAttributes?: (attributes?: Record<string, unknown>) => T['attributes'];

  // Enhanced validation for nested parsing
  /** Validate children structure (only for nested mode) */
  validateChildren?: (children: NestedTag[]) => ValidationResult;

  // Configuration options
  /** Whether this tag can have children (default: inferred from usage) */
  allowChildren?: boolean;
  /** Whether this tag can be self-closing (default: true) */
  allowSelfClosing?: boolean;

  // Default values
  /** Default content if tag is empty */
  defaultContent?: string;
  /** Default attributes if not provided */
  defaultAttributes?: Record<string, unknown>;

  // Event handlers
  /** Called when tag parsing starts */
  onStart?: (tagName: T['tagName'], attributes?: T['attributes']) => void;
  /** Called when tag content is being updated (streaming) */
  onContentUpdate?: (partialContent: string, tag: Partial<T>) => void;
  /** Called when tag parsing is completed */
  onComplete?: (tag: T) => void;
  /** Called when a child tag is added (nested mode only) */
  onChildAdded?: (child: NestedTag, parent: T) => void;
}

/**
 * Schema generation options
 */
export interface SchemaGenerationOptions {
  /** Enable strict validation for all generated tags */
  strictValidation?: boolean;
  /** Auto-transform content based on type */
  autoTransform?: boolean;
  /** Default behavior for self-closing tags */
  defaultSelfClosing?: boolean;
  /** Global event handlers */
  globalHandlers?: {
    onTagStart?: (tagName: string, attributes?: Record<string, unknown>) => void;
    onTagComplete?: (tag: any) => void;
    onContentUpdate?: (content: string, tag: any) => void;
  };
}

/**
 * Built-in schema templates
 */
export interface SchemaTemplates {
  /** Quiz/assessment schema */
  quiz: () => SchemaDefinition;
  /** Documentation schema */
  documentation: () => SchemaDefinition;
  /** Form schema */
  form: () => SchemaDefinition;
  /** Article/blog schema */
  article: () => SchemaDefinition;
  /** Code example schema */
  code: () => SchemaDefinition;
}

/**
 * Schema validation context
 */
export interface SchemaValidationContext {
  path: string[];
  depth: number;
  parent?: SchemaProperty;
  root: SchemaDefinition;
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  warnings: string[];
}

/**
 * Schema validation error
 */
export interface SchemaValidationError {
  path: string;
  property: string;
  message: string;
  expectedType?: string;
  actualType?: string;
  value?: unknown;
}
