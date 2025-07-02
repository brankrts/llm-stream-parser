/**
 * Validation utilities for LLM Stream Parser
 */

import { BaseTag, NestedTag, ValidationResult } from '../types/base';
import { TagDefinition } from '../types/schema';
import { ParserError } from '../types/errors';

/**
 * Content validators for common use cases
 */
export class ContentValidators {
  /**
   * Validate minimum length
   */
  static minLength(min: number): (content: string) => ValidationResult {
    return (content: string) => {
      return content.length >= min ? true : `Content must be at least ${min} characters`;
    };
  }

  /**
   * Validate maximum length
   */
  static maxLength(max: number): (content: string) => ValidationResult {
    return (content: string) => {
      return content.length <= max ? true : `Content must be no more than ${max} characters`;
    };
  }

  /**
   * Validate pattern match
   */
  static pattern(regex: RegExp, message?: string): (content: string) => ValidationResult {
    return (content: string) => {
      return regex.test(content) ? true : message || 'Content does not match required pattern';
    };
  }

  /**
   * Validate enumerated values
   */
  static enum(
    allowedValues: string[],
    caseSensitive = false
  ): (content: string) => ValidationResult {
    const values = caseSensitive ? allowedValues : allowedValues.map(v => v.toLowerCase());

    return (content: string) => {
      const testValue = caseSensitive ? content : content.toLowerCase();
      return values.includes(testValue)
        ? true
        : `Value must be one of: ${allowedValues.join(', ')}`;
    };
  }

  /**
   * Validate numeric content
   */
  static numeric(
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): (content: string) => ValidationResult {
    return (content: string) => {
      const num = parseFloat(content.trim());

      if (isNaN(num)) {
        return 'Content must be a valid number';
      }

      if (options.integer && !Number.isInteger(num)) {
        return 'Content must be an integer';
      }

      if (options.min !== undefined && num < options.min) {
        return `Value must be at least ${options.min}`;
      }

      if (options.max !== undefined && num > options.max) {
        return `Value must be no more than ${options.max}`;
      }

      return true;
    };
  }

  /**
   * Validate URL format
   */
  static url(
    allowedProtocols: string[] = ['http', 'https']
  ): (content: string) => ValidationResult {
    return (content: string) => {
      try {
        const url = new URL(content.trim());
        const protocol = url.protocol.slice(0, -1);

        if (!allowedProtocols.includes(protocol)) {
          return `URL must use one of these protocols: ${allowedProtocols.join(', ')}`;
        }

        return true;
      } catch {
        return 'Invalid URL format';
      }
    };
  }

  /**
   * Validate email format
   */
  static email(): (content: string) => ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return ContentValidators.pattern(emailPattern, 'Invalid email format');
  }

  /**
   * Validate required (non-empty)
   */
  static required(): (content: string) => ValidationResult {
    return (content: string) => {
      return content.trim().length > 0 ? true : 'Content is required';
    };
  }

  /**
   * Combine multiple validators
   */
  static combine(
    ...validators: Array<(content: string) => ValidationResult>
  ): (content: string) => ValidationResult {
    return (content: string) => {
      for (const validator of validators) {
        const result = validator(content);
        if (result !== true) {
          return result;
        }
      }
      return true;
    };
  }
}

/**
 * Attribute validators
 */
export class AttributeValidators {
  /**
   * Validate required attributes
   */
  static required(
    requiredAttrs: string[]
  ): (attributes?: Record<string, unknown>) => ValidationResult {
    return attributes => {
      if (!attributes) {
        return requiredAttrs.length > 0
          ? `Missing required attributes: ${requiredAttrs.join(', ')}`
          : true;
      }

      const missing = requiredAttrs.filter(attr => !(attr in attributes));
      return missing.length === 0 ? true : `Missing required attributes: ${missing.join(', ')}`;
    };
  }

  /**
   * Validate allowed attributes
   */
  static allowed(
    allowedAttrs: string[]
  ): (attributes?: Record<string, unknown>) => ValidationResult {
    return attributes => {
      if (!attributes) return true;

      const invalid = Object.keys(attributes).filter(attr => !allowedAttrs.includes(attr));
      return invalid.length === 0 ? true : `Invalid attributes: ${invalid.join(', ')}`;
    };
  }

  /**
   * Validate attribute types
   */
  static types(
    typeMap: Record<string, 'string' | 'number' | 'boolean'>
  ): (attributes?: Record<string, unknown>) => ValidationResult {
    return attributes => {
      if (!attributes) return true;

      for (const [attr, expectedType] of Object.entries(typeMap)) {
        if (attr in attributes) {
          const value = attributes[attr];
          const actualType = typeof value;

          if (expectedType === 'number' && typeof value === 'string' && !isNaN(Number(value))) {
            // Allow string numbers
            continue;
          }

          if (actualType !== expectedType) {
            return `Attribute '${attr}' must be of type ${expectedType}, got ${actualType}`;
          }
        }
      }

      return true;
    };
  }
}

/**
 * Tag validator that handles validation according to tag definition
 */
export class TagValidator {
  /**
   * Validate a tag according to its definition
   */
  static validate<T extends BaseTag>(tag: T | NestedTag, definition: TagDefinition<T>): void {
    // Content validation
    if (definition.validateContent && tag.content) {
      const result = definition.validateContent(tag.content);
      if (result !== true) {
        throw ParserError.fromValidation(tag.tagName, result, 'content');
      }
    }

    // Attributes validation
    if (definition.validateAttributes && tag.attributes) {
      const result = definition.validateAttributes(tag.attributes);
      if (result !== true) {
        throw ParserError.fromValidation(tag.tagName, result, 'attributes');
      }
    }

    // Children validation (for nested tags)
    if (definition.validateChildren && 'children' in tag && tag.children) {
      const result = definition.validateChildren(tag.children);
      if (result !== true) {
        throw ParserError.fromValidation(tag.tagName, result, 'children');
      }
    }
  }

  /**
   * Validate tag structure for nested parsing
   */
  static validateNested(tag: NestedTag, definition: TagDefinition): void {
    // Check if self-closing is allowed
    if (tag.isSelfClosing && definition.allowSelfClosing === false) {
      throw new ParserError(
        `Tag ${tag.tagName} cannot be self-closing`,
        'INVALID_SELF_CLOSING' as any
      );
    }

    // Check if children are allowed
    if (tag.children && tag.children.length > 0 && definition.allowChildren === false) {
      throw new ParserError(`Tag ${tag.tagName} cannot have children`, 'INVALID_CHILDREN' as any);
    }
  }
}
