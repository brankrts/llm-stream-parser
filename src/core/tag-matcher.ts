/**
 * Tag matching and pattern management for LLM Stream Parser
 */

import { TagMatch } from '../types/base';

/**
 * Regular expression patterns for tag matching
 */
export class TagPatterns {
  // Self-closing tags: <tag />
  static readonly SELF_CLOSING = /<([a-zA-Z][a-zA-Z0-9_-]*)((?:\s+[^>]*)?)\s*\/>/g;

  // Opening tags: <tag>
  static readonly OPENING = /<([a-zA-Z][a-zA-Z0-9_-]*)((?:\s+[^>]*)?)\s*>/g;

  // Closing tags: </tag>
  static readonly CLOSING = /<\/([a-zA-Z][a-zA-Z0-9_-]*)\s*>/g;

  // Complete flat tags: <tag>content</tag>
  static readonly COMPLETE = /<([a-zA-Z][a-zA-Z0-9_-]*)((?:\s+[^>]*)?)\s*>(.*?)<\/\1\s*>/gs;

  // Attributes parsing
  static readonly ATTRIBUTES = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

  /**
   * Reset all regex patterns to start from beginning
   */
  static resetAll(): void {
    this.SELF_CLOSING.lastIndex = 0;
    this.OPENING.lastIndex = 0;
    this.CLOSING.lastIndex = 0;
    this.COMPLETE.lastIndex = 0;
    this.ATTRIBUTES.lastIndex = 0;
  }
}

/**
 * Tag matcher for finding and parsing XML-like tags
 */
export class TagMatcher {
  private readonly caseSensitive: boolean;

  constructor(caseSensitive = false) {
    this.caseSensitive = caseSensitive;
  }

  /**
   * Find the next tag in the buffer starting from given index
   */
  findNextTag(buffer: string, startIndex = 0): TagMatch | null {
    const searchBuffer = buffer.slice(startIndex);
    let earliestMatch: TagMatch | null = null;
    let earliestIndex = Infinity;

    // Reset regex patterns
    TagPatterns.resetAll();

    // Check for self-closing tags
    const selfClosingMatch = TagPatterns.SELF_CLOSING.exec(searchBuffer);
    if (selfClosingMatch && selfClosingMatch.index < earliestIndex) {
      earliestIndex = selfClosingMatch.index;
      earliestMatch = this.createTagMatch(selfClosingMatch, startIndex, 'self-closing');
    }

    // Reset and check for opening tags
    TagPatterns.OPENING.lastIndex = 0;
    const openingMatch = TagPatterns.OPENING.exec(searchBuffer);
    if (openingMatch && openingMatch.index < earliestIndex) {
      earliestIndex = openingMatch.index;
      earliestMatch = this.createTagMatch(openingMatch, startIndex, 'opening');
    }

    // Reset and check for closing tags
    TagPatterns.CLOSING.lastIndex = 0;
    const closingMatch = TagPatterns.CLOSING.exec(searchBuffer);
    if (closingMatch && closingMatch.index < earliestIndex) {
      earliestIndex = closingMatch.index;
      earliestMatch = this.createTagMatch(closingMatch, startIndex, 'closing');
    }

    return earliestMatch;
  }

  /**
   * Find all complete tags in buffer (flat mode)
   */
  findCompleteTags(buffer: string): TagMatch[] {
    const matches: TagMatch[] = [];
    TagPatterns.COMPLETE.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = TagPatterns.COMPLETE.exec(buffer)) !== null) {
      const [fullMatch, tagName, attributesStr, content] = match;

      if (!tagName || content === undefined) continue;

      matches.push({
        tagName: this.normalizeTagName(tagName),
        content: content,
        attributes: this.parseAttributes(attributesStr || ''),
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        fullMatch,
        type: 'complete',
      });
    }

    return matches;
  }

  /**
   * Parse attributes from attribute string
   */
  parseAttributes(attributesStr: string): Record<string, unknown> | undefined {
    if (!attributesStr.trim()) {
      return undefined;
    }

    const attributes: Record<string, unknown> = {};
    TagPatterns.ATTRIBUTES.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = TagPatterns.ATTRIBUTES.exec(attributesStr)) !== null) {
      const [, name, doubleQuotedValue, singleQuotedValue, unquotedValue] = match;
      if (!name) continue;

      const value = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? true;
      attributes[name] = this.parseAttributeValue(value);
    }

    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

  /**
   * Create TagMatch object from regex match
   */
  private createTagMatch(
    match: RegExpExecArray,
    startIndex: number,
    type: 'opening' | 'closing' | 'self-closing'
  ): TagMatch {
    const [fullMatch, tagName, attributesStr] = match;

    return {
      tagName: this.normalizeTagName(tagName!),
      content: '',
      attributes: type === 'closing' ? undefined : this.parseAttributes(attributesStr || ''),
      startIndex: startIndex + match.index,
      endIndex: startIndex + match.index + fullMatch.length,
      fullMatch,
      type,
    };
  }

  /**
   * Parse individual attribute value with type coercion
   */
  private parseAttributeValue(value: string | boolean): unknown {
    if (typeof value === 'boolean') {
      return value;
    }

    // Try to parse as number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  }

  /**
   * Normalize tag name according to case sensitivity
   */
  private normalizeTagName(tagName: string): string {
    return this.caseSensitive ? tagName : tagName.toLowerCase();
  }

  /**
   * Check if a string contains any XML-like tags
   */
  containsTags(content: string): boolean {
    return /<[a-zA-Z][a-zA-Z0-9_-]*/.test(content);
  }

  /**
   * Extract text content between tags
   */
  extractTextContent(buffer: string, startIndex: number, endIndex: number): string {
    return buffer.slice(startIndex, endIndex);
  }
}
