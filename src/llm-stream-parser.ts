/**
 * LLM Stream Parser - Main user-facing API
 * High-level interface with convenience methods
 */

import { BaseTag, ParserState, ParserStats } from './types/base';
import { ParserConfig } from './types/config';
import { ParserEvents } from './types/events';
import { TagDefinition } from './types/schema';

import { StreamParser } from './core/stream-parser';

/**
 * Main LLM Stream Parser - simplified user-facing API
 */
export class LLMStreamParser<T extends BaseTag = BaseTag> {
  private readonly parser: StreamParser<T>;

  constructor(config?: ParserConfig) {
    this.parser = new StreamParser<T>(config);
  }

  /**
   * Parse a chunk of streaming data
   */
  parse(chunk: string): void {
    this.parser.parse(chunk);
  }

  /**
   * Register a new tag definition
   */
  defineTag(definition: TagDefinition<T>): this {
    this.parser.defineTag(definition);
    return this;
  }

  /**
   * Register multiple tag definitions
   */
  defineTags(definitions: TagDefinition<T>[]): this {
    for (const definition of definitions) {
      this.parser.defineTag(definition);
    }
    return this;
  }

  /**
   * Remove a tag definition
   */
  removeTag(tagName: string): boolean {
    return this.parser.removeTag(tagName);
  }

  /**
   * Check if a tag is registered
   */
  hasTag(tagName: string): boolean {
    return this.parser.hasTag(tagName);
  }

  /**
   * Get all registered tag names
   */
  getRegisteredTags(): readonly string[] {
    return this.parser.getRegisteredTags();
  }

  /**
   * Get current parser state
   */
  getState(): ParserState {
    return this.parser.getState();
  }

  /**
   * Get parser statistics
   */
  getStats(): Readonly<ParserStats> {
    return this.parser.getStats();
  }

  /**
   * Get current parsing depth (nested mode only)
   */
  getCurrentDepth(): number {
    return this.parser.getCurrentDepth();
  }

  /**
   * Get current parsing path (nested mode only)
   */
  getCurrentPath(): string {
    return this.parser.getCurrentPath();
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.parser.getBufferSize();
  }

  /**
   * Reset parser state and clear buffer
   */
  reset(): void {
    this.parser.reset();
  }

  /**
   * Finalize parsing and auto-close remaining tags
   */
  finalize(): void {
    this.parser.finalize();
  }

  /**
   * Event emitter methods (delegating to internal parser)
   */
  on<K extends keyof ParserEvents<T>>(event: K, listener: ParserEvents<T>[K]): this {
    this.parser.on(event as string, listener as any);
    return this;
  }

  off<K extends keyof ParserEvents<T>>(event: K, listener: ParserEvents<T>[K]): this {
    this.parser.off(event as string, listener as any);
    return this;
  }

  once<K extends keyof ParserEvents<T>>(event: K, listener: ParserEvents<T>[K]): this {
    this.parser.once(event as string, listener as any);
    return this;
  }

  emit<K extends keyof ParserEvents<T>>(
    event: K,
    ...args: Parameters<ParserEvents<T>[K]>
  ): boolean {
    return this.parser.emit(event as string, ...args);
  }

  /**
   * Create a new parser with the same configuration
   */
  clone(): LLMStreamParser<T> {
    return new LLMStreamParser<T>(); // Simple clone without config copying
  }

  /**
   * Convenience method to parse a complete string and finalize
   */
  parseComplete(content: string): void {
    this.parse(content);
    this.finalize();
  }

  /**
   * Convenience method to add a simple tag definition
   */
  addSimpleTag(
    tagName: string,
    options: {
      allowChildren?: boolean;
      allowSelfClosing?: boolean;
      defaultContent?: string;
      onComplete?: (tag: T) => void;
    } = {}
  ): this {
    const definition: TagDefinition<T> = {
      tagName: tagName as T['tagName'],
    };

    // Only add properties if they are defined
    if (options.allowChildren !== undefined) {
      definition.allowChildren = options.allowChildren;
    }
    if (options.allowSelfClosing !== undefined) {
      definition.allowSelfClosing = options.allowSelfClosing;
    }
    if (options.defaultContent !== undefined) {
      definition.defaultContent = options.defaultContent;
    }
    if (options.onComplete !== undefined) {
      definition.onComplete = options.onComplete;
    }

    return this.defineTag(definition);
  }

  /**
   * Convenience method to add multiple simple tags
   */
  addSimpleTags(tagNames: string[]): this {
    for (const tagName of tagNames) {
      this.addSimpleTag(tagName);
    }
    return this;
  }

  /**
   * Get a summary of parser status
   */
  getStatus(): {
    state: ParserState;
    registeredTags: number;
    bufferSize: number;
    totalParsed: number;
    errorCount: number;
  } {
    const stats = this.getStats();
    return {
      state: this.getState(),
      registeredTags: this.getRegisteredTags().length,
      bufferSize: this.getBufferSize(),
      totalParsed: stats.totalTagsParsed,
      errorCount: stats.errorCount,
    };
  }
}

/**
 * Factory function for creating a simple parser
 */
export function createParser<T extends BaseTag = BaseTag>(
  config?: ParserConfig
): LLMStreamParser<T> {
  return new LLMStreamParser<T>(config);
}

/**
 * Factory function for creating a parser with predefined tags
 */
export function createParserWithTags<T extends BaseTag = BaseTag>(
  tagNames: string[],
  config?: ParserConfig
): LLMStreamParser<T> {
  const parser = new LLMStreamParser<T>(config);
  parser.addSimpleTags(tagNames);
  return parser;
}


export { StreamParser } from './core/stream-parser';
