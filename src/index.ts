/**
 * LLM Stream Parser - Main exports
 */

// Main API classes
export {
  LLMStreamParser,
  StreamParser,
  createParser,
  createParserWithTags,
} from './llm-stream-parser';

// Core classes
export { BufferManager } from './core/buffer-manager';
export { TagMatcher, TagPatterns } from './core/tag-matcher';
export { TagValidator, ContentValidators, AttributeValidators } from './core/validator';
export { TagTransformer, ContentTransformers, AttributeTransformers } from './core/transformer';

// Type exports
export * from './types';

// Version info
export const version = '1.0.0';
