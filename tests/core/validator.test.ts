/**
 * Tests for Validator classes
 */

import { ContentValidators, AttributeValidators, TagValidator } from '../../src/core/validator';
import { TagDefinition } from '../../src/types/schema';
import { BaseTag } from '../../src/types/base';
import { ParserError } from '../../src/types/errors';

describe('ContentValidators', () => {
  describe('required', () => {
    const validator = ContentValidators.required();

    it('should pass for non-empty content', () => {
      expect(validator('hello')).toBe(true);
      expect(validator('  valid  ')).toBe(true);
    });

    it('should fail for empty content', () => {
      expect(validator('')).toBe('Content is required');
      expect(validator('   ')).toBe('Content is required');
    });
  });

  describe('minLength', () => {
    const validator = ContentValidators.minLength(5);

    it('should pass for content with sufficient length', () => {
      expect(validator('hello')).toBe(true);
      expect(validator('longer text')).toBe(true);
    });

    it('should fail for content too short', () => {
      expect(validator('hi')).toBe('Content must be at least 5 characters');
    });
  });

  describe('maxLength', () => {
    const validator = ContentValidators.maxLength(10);

    it('should pass for content within limit', () => {
      expect(validator('short')).toBe(true);
      expect(validator('exactly10!')).toBe(true);
    });

    it('should fail for content too long', () => {
      expect(validator('this is too long')).toBe('Content must be no more than 10 characters');
    });
  });

  describe('pattern', () => {
    const emailValidator = ContentValidators.pattern(/\S+@\S+\.\S+/, 'Invalid email format');

    it('should pass for matching pattern', () => {
      expect(emailValidator('user@example.com')).toBe(true);
      expect(emailValidator('test.email@domain.org')).toBe(true);
    });

    it('should fail for non-matching pattern', () => {
      expect(emailValidator('invalid-email')).toBe('Invalid email format');
      expect(emailValidator('@domain.com')).toBe('Invalid email format');
    });
  });

  describe('enum', () => {
    const statusValidator = ContentValidators.enum(['active', 'inactive', 'pending']);

    it('should pass for allowed values', () => {
      expect(statusValidator('active')).toBe(true);
      expect(statusValidator('pending')).toBe(true);
    });

    it('should fail for disallowed values', () => {
      expect(statusValidator('unknown')).toBe('Value must be one of: active, inactive, pending');
    });

    it('should handle case sensitivity', () => {
      const caseSensitive = ContentValidators.enum(['Yes', 'No'], true);
      const caseInsensitive = ContentValidators.enum(['Yes', 'No'], false);

      expect(caseSensitive('yes')).toBe('Value must be one of: Yes, No');
      expect(caseInsensitive('yes')).toBe(true);
    });
  });

  describe('numeric', () => {
    it('should validate basic numbers', () => {
      const validator = ContentValidators.numeric();

      expect(validator('42')).toBe(true);
      expect(validator('3.14')).toBe(true);
      expect(validator('not-a-number')).toBe('Content must be a valid number');
    });

    it('should validate with min/max constraints', () => {
      const validator = ContentValidators.numeric({ min: 0, max: 100 });

      expect(validator('50')).toBe(true);
      expect(validator('-1')).toBe('Value must be at least 0');
      expect(validator('101')).toBe('Value must be no more than 100');
    });

    it('should validate integers', () => {
      const validator = ContentValidators.numeric({ integer: true });

      expect(validator('42')).toBe(true);
      expect(validator('3.14')).toBe('Content must be an integer');
    });
  });

  describe('url', () => {
    const validator = ContentValidators.url();

    it('should pass for valid URLs', () => {
      expect(validator('https://example.com')).toBe(true);
      expect(validator('http://test.org/path')).toBe(true);
    });

    it('should fail for invalid URLs', () => {
      expect(validator('not-a-url')).toBe('Invalid URL format');
      expect(validator('ftp://example.com')).toBe(
        'URL must use one of these protocols: http, https'
      );
    });

    it('should allow custom protocols', () => {
      const ftpValidator = ContentValidators.url(['ftp', 'sftp']);
      expect(ftpValidator('ftp://example.com')).toBe(true);
    });
  });

  describe('email', () => {
    const validator = ContentValidators.email();

    it('should pass for valid emails', () => {
      expect(validator('user@example.com')).toBe(true);
      expect(validator('test.email@domain.org')).toBe(true);
    });

    it('should fail for invalid emails', () => {
      expect(validator('invalid-email')).toBe('Invalid email format');
      expect(validator('@domain.com')).toBe('Invalid email format');
    });
  });

  describe('combine', () => {
    const combinedValidator = ContentValidators.combine(
      ContentValidators.required(),
      ContentValidators.minLength(3),
      ContentValidators.maxLength(10)
    );

    it('should pass when all validators pass', () => {
      expect(combinedValidator('hello')).toBe(true);
    });

    it('should fail on first failing validator', () => {
      expect(combinedValidator('')).toBe('Content is required');
      expect(combinedValidator('hi')).toBe('Content must be at least 3 characters');
      expect(combinedValidator('way too long content')).toBe(
        'Content must be no more than 10 characters'
      );
    });
  });
});

describe('AttributeValidators', () => {
  describe('required', () => {
    const validator = AttributeValidators.required(['id', 'class']);

    it('should pass when all required attributes present', () => {
      expect(validator({ id: '1', class: 'main', extra: 'ok' })).toBe(true);
    });

    it('should fail when required attributes missing', () => {
      expect(validator({ id: '1' })).toBe('Missing required attributes: class');
      expect(validator({})).toBe('Missing required attributes: id, class');
    });

    it('should handle undefined attributes', () => {
      expect(validator(undefined)).toBe('Missing required attributes: id, class');
    });
  });

  describe('allowed', () => {
    const validator = AttributeValidators.allowed(['id', 'class', 'data-test']);

    it('should pass when only allowed keys present', () => {
      expect(validator({ id: '1', class: 'main' })).toBe(true);
      expect(validator({ 'data-test': 'value' })).toBe(true);
    });

    it('should fail when disallowed keys present', () => {
      const result = validator({ id: '1', forbidden: 'bad', another: 'also bad' });
      expect(result).toBe('Invalid attributes: forbidden, another');
    });

    it('should handle undefined attributes', () => {
      expect(validator(undefined)).toBe(true);
    });
  });

  describe('types', () => {
    const validator = AttributeValidators.types({
      id: 'string',
      count: 'number',
      active: 'boolean',
    });

    it('should pass for correct types', () => {
      expect(validator({ id: 'test', count: 42, active: true })).toBe(true);
    });

    it('should allow string numbers', () => {
      expect(validator({ id: 'test', count: '42' })).toBe(true);
    });

    it('should fail for incorrect types', () => {
      const result = validator({ id: 'test', count: 'not-a-number' });
      expect(result).toBe("Attribute 'count' must be of type number, got string");
    });

    it('should handle partial attribute sets', () => {
      expect(validator({ id: 'test' })).toBe(true); // Missing attributes are okay
    });
  });
});

describe('TagValidator', () => {
  interface TestTag extends BaseTag {
    tagName: 'test';
    content: string;
    attributes?: { id?: string; class?: string; count?: number };
  }

  let tag: TestTag;

  beforeEach(() => {
    tag = {
      tagName: 'test',
      content: 'test content',
      attributes: { id: 'test-id', class: 'test-class' },
    };
  });

  describe('validate', () => {
    it('should pass for valid tag with no validation rules', () => {
      const definition: TagDefinition<TestTag> = { tagName: 'test' };
      expect(() => TagValidator.validate(tag, definition)).not.toThrow();
    });

    it('should validate content successfully', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        validateContent: content => content.length > 5 || 'Content too short',
      };

      expect(() => TagValidator.validate(tag, definition)).not.toThrow();
    });

    it('should throw error for invalid content', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        validateContent: content => content.length > 50 || 'Content too short',
      };

      expect(() => TagValidator.validate(tag, definition)).toThrow(ParserError);
    });

    it('should validate attributes successfully', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        validateAttributes: attrs => attrs?.id !== undefined || 'ID required',
      };

      expect(() => TagValidator.validate(tag, definition)).not.toThrow();
    });

    it('should throw error for invalid attributes', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        validateAttributes: attrs =>
          (attrs as any)?.notfound !== undefined || 'Required attribute missing',
      };

      expect(() => TagValidator.validate(tag, definition)).toThrow(ParserError);
    });

    it('should handle tag without attributes', () => {
      const tagNoAttrs: TestTag = {
        tagName: 'test',
        content: 'content',
      };

      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        validateAttributes: attrs => attrs === undefined || 'Should have no attributes',
      };

      expect(() => TagValidator.validate(tagNoAttrs, definition)).not.toThrow();
    });
  });
});
