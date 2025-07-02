/**
 * Main Stream Parser - Core parsing engine
 * Supports both flat and nested XML parsing modes
 */

import { EventEmitter } from 'events';
import { BaseTag, NestedTag, ParserState, ParserStats, TagMatch } from '../types/base';
import { ParserConfig, mergeConfig, RequiredParserConfig } from '../types/config';
import { ParserError, ParserErrorCode } from '../types/errors';
import { TagDefinition } from '../types/schema';

import { BufferManager } from './buffer-manager';
import { TagMatcher } from './tag-matcher';
import { TagValidator } from './validator';
import { TagTransformer } from './transformer';

/**
 * Stack entry for tracking open tags in nested mode
 */
interface TagStackEntry {
  tag: NestedTag;
  startIndex: number;
  depth: number;
  path: string;
}

/**
 * Main stream parser with support for both flat and nested XML parsing
 */
export class StreamParser<T extends BaseTag = BaseTag> extends EventEmitter {
  private readonly config: RequiredParserConfig;
  private readonly bufferManager: BufferManager;
  private readonly tagMatcher: TagMatcher;
  private readonly tagRegistry = new Map<string, TagDefinition<T>>();

  private state: ParserState = ParserState.IDLE;
  private stats: ParserStats;

  // Nested parsing state
  private tagStack: TagStackEntry[] = [];
  private currentDepth = 0;
  private currentPath = '';

  constructor(config: ParserConfig = {}) {
    super();
    this.config = mergeConfig(config);
    this.bufferManager = new BufferManager(this.config.maxBufferSize);
    this.tagMatcher = new TagMatcher(this.config.caseSensitive);
    this.stats = this.initializeStats();
  }

  /**
   * Register a tag definition
   */
  defineTag(definition: TagDefinition<T>): this {
    this.tagRegistry.set(definition.tagName, definition);
    this.updateStats();
    return this;
  }

  /**
   * Remove a tag definition
   */
  removeTag(tagName: string): boolean {
    const deleted = this.tagRegistry.delete(tagName);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Check if a tag is registered
   */
  hasTag(tagName: string): boolean {
    return this.tagRegistry.has(tagName);
  }

  /**
   * Get all registered tag names
   */
  getRegisteredTags(): readonly string[] {
    return Array.from(this.tagRegistry.keys());
  }

  /**
   * Parse a chunk of streaming data
   */
  parse(chunk: string): void {
    try {
      this.state = ParserState.PARSING;
      this.bufferManager.append(chunk);

      // Choose parsing strategy based on configuration
      if (this.config.enableNested) {
        this.processBufferNested();
      } else {
        this.processBufferFlat();
      }

      this.state = ParserState.COMPLETED;
    } catch (error) {
      this.state = ParserState.ERROR;
      this.stats = { ...this.stats, errorCount: this.stats.errorCount + 1 };
      this.emitError(
        error instanceof ParserError
          ? error
          : new ParserError(
              `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
              ParserErrorCode.INVALID_TAG_FORMAT
            ),
        chunk
      );
    }
  }

  /**
   * Process buffer for flat parsing mode
   */
  private processBufferFlat(): void {
    const buffer = this.bufferManager.getContent();
    const completeTags = this.tagMatcher.findCompleteTags(buffer);
    const parsedTags: T[] = [];

    for (const match of completeTags) {
      try {
        const tag = this.processTagFlat(match);
        if (tag) {
          parsedTags.push(tag);
          this.stats = { ...this.stats, totalTagsParsed: this.stats.totalTagsParsed + 1 };
        }
      } catch (error) {
        this.emitError(
          error instanceof ParserError
            ? error
            : new ParserError('Failed to process tag', ParserErrorCode.TRANSFORMATION_FAILED),
          match
        );
      }
    }

    // Remove processed content from buffer
    this.removeProcessedContent(completeTags);

    if (parsedTags.length > 0) {
      this.emit('parsing_complete', parsedTags);
      this.emit('document_completed', parsedTags);
    }

    this.updateStats();
  }

  /**
   * Process buffer for nested parsing mode
   */
  private processBufferNested(): void {
    const buffer = this.bufferManager.getContent();
    let lastProcessedIndex = 0;

    while (lastProcessedIndex < buffer.length) {
      const nextTag = this.tagMatcher.findNextTag(buffer, lastProcessedIndex);

      if (!nextTag) break;

      // Extract text content between tags
      if (nextTag.startIndex > lastProcessedIndex) {
        const textContent = this.tagMatcher.extractTextContent(
          buffer,
          lastProcessedIndex,
          nextTag.startIndex
        );
        this.handleTextContent(textContent);
      }

      // Process the tag
      this.processTagNested(nextTag);
      lastProcessedIndex = nextTag.endIndex;
    }

    // Update buffer to remaining content
    if (lastProcessedIndex > 0) {
      this.bufferManager.consume(lastProcessedIndex);
    }
  }

  /**
   * Process a single tag match in flat mode
   */
  private processTagFlat(match: TagMatch): T | null {
    const definition = this.tagRegistry.get(match.tagName);

    if (!definition) {
      throw ParserError.fromUnknownTag(match.tagName);
    }

    // Emit tag started event
    this.emit('tag_started', match.tagName as T['tagName'], match.attributes as T['attributes']);
    definition.onStart?.(match.tagName as T['tagName'], match.attributes as T['attributes']);

    // Create tag object
    const tag: T = {
      tagName: match.tagName,
      content: this.config.trimWhitespace ? match.content.trim() : match.content,
      attributes: match.attributes,
    } as T;

    // Apply defaults
    TagTransformer.applyDefaults(tag, definition);

    // Validate and transform
    TagValidator.validate(tag, definition);
    TagTransformer.transform(tag, definition);

    // Emit completion events
    this.emit('tag_completed', tag);
    definition.onComplete?.(tag);

    return tag;
  }

  /**
   * Process a tag in nested mode
   */
  private processTagNested(tagMatch: TagMatch): void {
    switch (tagMatch.type) {
      case 'opening':
        this.handleOpeningTag(tagMatch);
        break;
      case 'closing':
        this.handleClosingTag(tagMatch);
        break;
      case 'self-closing':
        this.handleSelfClosingTag(tagMatch);
        break;
    }
  }

  /**
   * Handle opening tag in nested mode
   */
  private handleOpeningTag(tagMatch: TagMatch): void {
    // Check depth limits
    if (this.currentDepth >= this.config.maxDepth) {
      throw ParserError.fromMaxDepth(this.config.maxDepth, tagMatch.path);
    }

    const definition = this.tagRegistry.get(tagMatch.tagName);

    // Create new nested tag
    const newTag: NestedTag = {
      tagName: tagMatch.tagName,
      content: definition?.defaultContent || '',
      children: [],
      attributes: { ...definition?.defaultAttributes, ...tagMatch.attributes },
      parent: this.getCurrentParent(),
      path: this.buildPath(tagMatch.tagName),
      depth: this.currentDepth + 1,
      isSelfClosing: false,
    };

    // Add to current parent's children if we have a parent
    const currentParent = this.getCurrentParent();
    if (currentParent && currentParent.children) {
      currentParent.children.push(newTag);
    }

    // Update state
    this.currentDepth++;
    this.currentPath = newTag.path || '';
    this.stats = {
      ...this.stats,
      maxDepthReached: Math.max(this.stats.maxDepthReached || 0, this.currentDepth),
      totalNestedTags: (this.stats.totalNestedTags || 0) + 1,
    };

    // Push to stack
    this.tagStack.push({
      tag: newTag,
      startIndex: tagMatch.startIndex,
      depth: this.currentDepth,
      path: newTag.path || '',
    });

    // Emit events
    this.emit('tag_opened', newTag as unknown as Partial<T>, this.currentDepth, newTag.path || '');
    this.emit('tag_started', newTag.tagName as T['tagName'], newTag.attributes as T['attributes']);
    definition?.onStart?.(newTag.tagName as T['tagName'], newTag.attributes as T['attributes']);
  }

  /**
   * Handle closing tag in nested mode
   */
  private handleClosingTag(tagMatch: TagMatch): void {
    if (this.tagStack.length === 0) {
      throw new ParserError(
        `Unexpected closing tag: ${tagMatch.tagName}`,
        ParserErrorCode.MISMATCHED_CLOSING_TAG
      );
    }

    const currentEntry = this.tagStack[this.tagStack.length - 1]!;

    // Check if closing tag matches the most recent opening tag
    if (currentEntry.tag.tagName !== tagMatch.tagName) {
      if (this.config.autoCloseUnclosed) {
        // Auto-close intervening tags
        while (
          this.tagStack.length > 0 &&
          this.tagStack[this.tagStack.length - 1]!.tag.tagName !== tagMatch.tagName
        ) {
          this.autoCloseTag();
        }
      } else {
        throw ParserError.fromMismatchedClosing(currentEntry.tag.tagName, tagMatch.tagName);
      }
    }

    // Pop from stack and complete the tag
    const completedEntry = this.tagStack.pop()!;
    this.completeTag(completedEntry.tag);

    // Update state
    this.currentDepth--;
    this.currentPath =
      this.tagStack.length > 0 ? this.tagStack[this.tagStack.length - 1]!.path : '';
  }

  /**
   * Auto-close unclosed tag
   */
  private autoCloseTag(): void {
    if (this.tagStack.length === 0) return;

    const entry = this.tagStack.pop()!;
    this.completeTag(entry.tag);

    this.currentDepth--;
    this.currentPath =
      this.tagStack.length > 0 ? this.tagStack[this.tagStack.length - 1]!.path : '';
  }

  /**
   * Complete a tag with validation and transformation
   */
  private completeTag(tag: NestedTag): void {
    const definition = this.tagRegistry.get(tag.tagName);

    if (definition) {
      TagValidator.validate(tag, definition);
      TagTransformer.transform(tag, definition);
      definition.onComplete?.(tag as unknown as T);
    }

    this.stats = { ...this.stats, totalTagsParsed: this.stats.totalTagsParsed + 1 };

    this.emit('tag_closed', tag as unknown as T, tag.depth || 0, tag.path || '');
    this.emit('tag_completed', tag as unknown as T);

    // Emit subtree_completed if tag has children (indicating a completed subtree)
    if (tag.children && tag.children.length > 0) {
      this.emit('subtree_completed', tag as unknown as T, tag.depth || 0);
    }
  }

  /**
   * Handle self-closing tag in nested mode
   */
  private handleSelfClosingTag(tagMatch: TagMatch): void {
    const definition = this.tagRegistry.get(tagMatch.tagName);

    // Create self-closing tag
    const tag: NestedTag = {
      tagName: tagMatch.tagName,
      content: definition?.defaultContent || '',
      children: [],
      attributes: { ...definition?.defaultAttributes, ...tagMatch.attributes },
      parent: this.getCurrentParent(),
      path: this.buildPath(tagMatch.tagName),
      depth: this.currentDepth + 1,
      isSelfClosing: true,
    };

    // Add to current parent's children if we have a parent
    const currentParent = this.getCurrentParent();
    if (currentParent && currentParent.children) {
      currentParent.children.push(tag);
    }

    // Complete the tag immediately
    this.completeTag(tag);
  }

  /**
   * Get current parent tag from stack
   */
  private getCurrentParent(): NestedTag | undefined {
    return this.tagStack.length > 0 ? this.tagStack[this.tagStack.length - 1]!.tag : undefined;
  }

  /**
   * Build path string for current tag
   */
  private buildPath(tagName: string): string {
    return this.currentPath ? `${this.currentPath}/${tagName}` : tagName;
  }

  /**
   * Handle text content between tags
   */
  private handleTextContent(textContent: string): void {
    if (!textContent || textContent.trim() === '') return;

    const currentParent = this.getCurrentParent();
    if (currentParent) {
      // Add text content to current parent
      if (currentParent.content) {
        currentParent.content += textContent;
      } else {
        currentParent.content = textContent;
      }

      // Emit with correct parameters: tagName and partialContent
      this.emit('tag_content_update', currentParent.tagName as T['tagName'], textContent);
    }
  }

  /**
   * Remove processed content from buffer
   */
  private removeProcessedContent(matches: TagMatch[]): void {
    if (matches.length === 0) return;

    // Find the end of the last processed tag
    const lastMatch = matches[matches.length - 1]!;
    this.bufferManager.consume(lastMatch.endIndex);
  }

  /**
   * Initialize parser statistics
   */
  private initializeStats(): ParserStats {
    return {
      totalTagsParsed: 0,
      totalBytesProcessed: 0,
      errorCount: 0,
      bufferSize: 0,
      state: ParserState.IDLE,
      registeredTagsCount: 0,
      maxDepthReached: 0,
      totalNestedTags: 0,
    };
  }

  /**
   * Update parser statistics
   */
  private updateStats(): void {
    this.stats = {
      ...this.stats,
      totalBytesProcessed: this.bufferManager.getTotalProcessed(),
      bufferSize: this.bufferManager.getSize(),
      registeredTagsCount: this.tagRegistry.size,
    };

    this.emit('stats_updated', this.stats);
  }

  /**
   * Emit error event with context
   */
  private emitError(error: ParserError, context: unknown): void {
    this.emit('parse_error', error, context);
  }

  /**
   * Get current parser state
   */
  getState(): ParserState {
    return this.state;
  }

  /**
   * Get parser statistics
   */
  getStats(): Readonly<ParserStats> {
    return { ...this.stats };
  }

  /**
   * Get current parsing depth (nested mode only)
   */
  getCurrentDepth(): number {
    return this.currentDepth;
  }

  /**
   * Get current parsing path (nested mode only)
   */
  getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.bufferManager.getSize();
  }

  /**
   * Clear buffer and reset parser state
   */
  reset(): void {
    this.bufferManager.clear();
    this.emit('buffer_cleared');

    this.tagStack = [];
    this.currentDepth = 0;
    this.currentPath = '';
    this.state = ParserState.IDLE;
    this.stats = this.initializeStats();

    this.emit('parser_reset');
  }

  /**
   * Finalize parsing and auto-close any remaining open tags
   */
  finalize(): void {
    // Collect root tags before auto-closing
    const rootTags: T[] = [];
    for (const entry of this.tagStack) {
      if (entry.depth === 1) {
        // Root level tags
        rootTags.push(entry.tag as unknown as T);
      }
    }

    // Auto-close any remaining open tags in nested mode
    while (this.tagStack.length > 0) {
      this.autoCloseTag();
    }

    this.state = ParserState.COMPLETED;
    this.updateStats();

    // Emit document completed with root tags
    if (rootTags.length > 0) {
      this.emit('document_completed', rootTags);
    }

    this.emit('parsing_finalized', this.stats);
  }
}
