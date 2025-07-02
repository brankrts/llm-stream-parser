/**
 * Content and attribute transformation utilities
 */

import { BaseTag, NestedTag } from '../types/base';
import { TagDefinition } from '../types/schema';
import { ParserError } from '../types/errors';

/**
 * Content transformers for common use cases
 */
export class ContentTransformers {
  /**
   * Trim whitespace from content
   */
  static trim(): (content: string) => string {
    return (content: string) => content.trim();
  }

  /**
   * Convert to lowercase
   */
  static toLowerCase(): (content: string) => string {
    return (content: string) => content.toLowerCase();
  }

  /**
   * Convert to uppercase
   */
  static toUpperCase(): (content: string) => string {
    return (content: string) => content.toUpperCase();
  }

  /**
   * Capitalize first letter
   */
  static capitalize(): (content: string) => string {
    return (content: string) => {
      if (content.length === 0) return content;
      return content.charAt(0).toUpperCase() + content.slice(1).toLowerCase();
    };
  }

  /**
   * Replace patterns
   */
  static replace(searchValue: string | RegExp, replaceValue: string): (content: string) => string {
    return (content: string) => content.replace(searchValue, replaceValue);
  }

  /**
   * Remove HTML tags
   */
  static stripHtml(): (content: string) => string {
    return (content: string) => content.replace(/<[^>]*>/g, '');
  }

  /**
   * Normalize whitespace (collapse multiple spaces/newlines)
   */
  static normalizeWhitespace(): (content: string) => string {
    return (content: string) => content.replace(/\s+/g, ' ').trim();
  }

  /**
   * Parse as number
   */
  static toNumber(
    options: { integer?: boolean; defaultValue?: number } = {}
  ): (content: string) => string {
    return (content: string) => {
      const num = parseFloat(content.trim());

      if (isNaN(num)) {
        return options.defaultValue !== undefined ? options.defaultValue.toString() : content;
      }

      return options.integer ? Math.round(num).toString() : num.toString();
    };
  }

  /**
   * Parse as boolean
   */
  static toBoolean(
    options: { trueValues?: string[]; falseValues?: string[] } = {}
  ): (content: string) => string {
    const trueValues = options.trueValues || ['true', '1', 'yes', 'on'];
    const falseValues = options.falseValues || ['false', '0', 'no', 'off'];

    return (content: string) => {
      const normalized = content.toLowerCase().trim();

      if (trueValues.includes(normalized)) {
        return 'true';
      }

      if (falseValues.includes(normalized)) {
        return 'false';
      }

      return content;
    };
  }

  /**
   * Apply multiple transformers in sequence
   */
  static chain(...transformers: Array<(content: string) => string>): (content: string) => string {
    return (content: string) => {
      return transformers.reduce((result, transformer) => transformer(result), content);
    };
  }

  /**
   * Custom transformer with error handling
   */
  static custom(
    fn: (content: string) => string,
    errorMessage?: string
  ): (content: string) => string {
    return (content: string) => {
      try {
        return fn(content);
      } catch (error) {
        throw new ParserError(
          errorMessage ||
            `Content transformation failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          'TRANSFORMATION_FAILED' as any
        );
      }
    };
  }
}

/**
 * Attribute transformers
 */
export class AttributeTransformers {
  /**
   * Convert attribute types
   */
  static convertTypes(
    typeMap: Record<string, 'string' | 'number' | 'boolean'>
  ): (attributes?: Record<string, unknown>) => Record<string, unknown> {
    return attributes => {
      if (!attributes) return {};

      const result: Record<string, unknown> = { ...attributes };

      for (const [attr, targetType] of Object.entries(typeMap)) {
        if (attr in result) {
          const value = result[attr];

          switch (targetType) {
            case 'number':
              result[attr] = typeof value === 'string' ? parseFloat(value) : Number(value);
              break;
            case 'boolean':
              result[attr] =
                typeof value === 'string'
                  ? ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
                  : Boolean(value);
              break;
            case 'string':
              result[attr] = String(value);
              break;
          }
        }
      }

      return result;
    };
  }

  /**
   * Rename attributes
   */
  static rename(
    mapping: Record<string, string>
  ): (attributes?: Record<string, unknown>) => Record<string, unknown> {
    return attributes => {
      if (!attributes) return {};

      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(attributes)) {
        const newKey = mapping[key] || key;
        result[newKey] = value;
      }

      return result;
    };
  }

  /**
   * Filter attributes (keep only specified ones)
   */
  static filter(
    allowedAttributes: string[]
  ): (attributes?: Record<string, unknown>) => Record<string, unknown> {
    return attributes => {
      if (!attributes) return {};

      const result: Record<string, unknown> = {};

      for (const attr of allowedAttributes) {
        if (attr in attributes) {
          result[attr] = attributes[attr];
        }
      }

      return result;
    };
  }

  /**
   * Add default attributes
   */
  static addDefaults(
    defaults: Record<string, unknown>
  ): (attributes?: Record<string, unknown>) => Record<string, unknown> {
    return attributes => {
      return { ...defaults, ...attributes };
    };
  }
}

/**
 * Tag transformer that applies transformations according to definition
 */
export class TagTransformer {
  /**
   * Apply transformations to a tag according to its definition
   */
  static transform<T extends BaseTag>(tag: T | NestedTag, definition: TagDefinition<T>): void {
    try {
      // Transform content
      if (definition.transformContent && tag.content) {
        tag.content = definition.transformContent(tag.content);
      }

      // Transform attributes
      if (definition.transformAttributes && tag.attributes) {
        tag.attributes = definition.transformAttributes(tag.attributes) as Record<string, unknown>;
      }
    } catch (error) {
      if (error instanceof ParserError) {
        throw error;
      }

      throw ParserError.fromTransformation(
        tag.tagName,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Apply default values to tag
   */
  static applyDefaults<T extends BaseTag>(tag: T | NestedTag, definition: TagDefinition<T>): void {
    // Apply default content if empty
    if (definition.defaultContent && (!tag.content || tag.content.trim() === '')) {
      tag.content = definition.defaultContent;
    }

    // Apply default attributes
    if (definition.defaultAttributes) {
      tag.attributes = { ...definition.defaultAttributes, ...tag.attributes };
    }
  }

  /**
   * Clean tag content and attributes
   */
  static clean<T extends BaseTag>(
    tag: T | NestedTag,
    options: {
      trimContent?: boolean;
      normalizeWhitespace?: boolean;
      removeEmptyAttributes?: boolean;
    } = {}
  ): void {
    const {
      trimContent = true,
      normalizeWhitespace = false,
      removeEmptyAttributes = false,
    } = options;

    // Clean content
    if (tag.content) {
      if (trimContent) {
        tag.content = tag.content.trim();
      }

      if (normalizeWhitespace) {
        tag.content = tag.content.replace(/\s+/g, ' ').trim();
      }
    }

    // Clean attributes
    if (tag.attributes && removeEmptyAttributes) {
      const cleaned: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(tag.attributes)) {
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = value;
        }
      }

      if (Object.keys(cleaned).length > 0) {
        tag.attributes = cleaned;
      } else {
        delete tag.attributes;
      }
    }
  }
}
