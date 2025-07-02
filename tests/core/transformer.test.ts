/**
 * Tests for Transformer classes
 */

import {
  ContentTransformers,
  AttributeTransformers,
  TagTransformer,
} from '../../src/core/transformer';
import { TagDefinition } from '../../src/types/schema';
import { BaseTag } from '../../src/types/base';
import { ParserError } from '../../src/types/errors';

describe('ContentTransformers', () => {
  describe('trim', () => {
    const transformer = ContentTransformers.trim();

    it('should trim whitespace from content', () => {
      expect(transformer('  hello world  ')).toBe('hello world');
      expect(transformer('\n\ttest\n\t')).toBe('test');
    });

    it('should handle empty strings', () => {
      expect(transformer('')).toBe('');
      expect(transformer('   ')).toBe('');
    });
  });

  describe('toLowerCase', () => {
    const transformer = ContentTransformers.toLowerCase();

    it('should convert content to lowercase', () => {
      expect(transformer('HELLO WORLD')).toBe('hello world');
      expect(transformer('MiXeD cAsE')).toBe('mixed case');
    });

    it('should handle empty strings', () => {
      expect(transformer('')).toBe('');
    });
  });

  describe('toUpperCase', () => {
    const transformer = ContentTransformers.toUpperCase();

    it('should convert content to uppercase', () => {
      expect(transformer('hello world')).toBe('HELLO WORLD');
      expect(transformer('MiXeD cAsE')).toBe('MIXED CASE');
    });
  });

  describe('capitalize', () => {
    const transformer = ContentTransformers.capitalize();

    it('should capitalize first letter and lowercase rest', () => {
      expect(transformer('hello world')).toBe('Hello world');
      expect(transformer('HELLO WORLD')).toBe('Hello world');
      expect(transformer('tEST')).toBe('Test');
    });

    it('should handle edge cases', () => {
      expect(transformer('')).toBe('');
      expect(transformer('a')).toBe('A');
    });
  });

  describe('replace', () => {
    it('should replace string patterns', () => {
      const transformer = ContentTransformers.replace('old', 'new');
      expect(transformer('old text old')).toBe('new text old'); // Only first occurrence
    });

    it('should replace regex patterns', () => {
      const transformer = ContentTransformers.replace(/\s+/g, '-');
      expect(transformer('hello world test')).toBe('hello-world-test');
      expect(transformer('multiple   spaces')).toBe('multiple-spaces');
    });
  });

  describe('stripHtml', () => {
    const transformer = ContentTransformers.stripHtml();

    it('should remove HTML tags', () => {
      expect(transformer('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
      expect(transformer('<div class="test">Content</div>')).toBe('Content');
    });

    it('should handle self-closing tags', () => {
      expect(transformer('Line 1<br/>Line 2')).toBe('Line 1Line 2');
    });

    it('should handle text without HTML', () => {
      expect(transformer('Plain text')).toBe('Plain text');
    });
  });

  describe('normalizeWhitespace', () => {
    const transformer = ContentTransformers.normalizeWhitespace();

    it('should normalize whitespace', () => {
      expect(transformer('hello    world\n\ntest')).toBe('hello world test');
      expect(transformer('  multiple   spaces  ')).toBe('multiple spaces');
    });

    it('should handle empty strings', () => {
      expect(transformer('')).toBe('');
      expect(transformer('   ')).toBe('');
    });
  });

  describe('toNumber', () => {
    it('should convert numeric strings and return as string', () => {
      const transformer = ContentTransformers.toNumber();
      expect(transformer('42')).toBe('42');
      expect(transformer('3.14')).toBe('3.14');
      expect(transformer('-10')).toBe('-10');
    });

    it('should handle integer option', () => {
      const transformer = ContentTransformers.toNumber({ integer: true });
      expect(transformer('3.14')).toBe('3');
      expect(transformer('3.9')).toBe('4');
    });

    it('should handle default value option', () => {
      const transformer = ContentTransformers.toNumber({ defaultValue: 0 });
      expect(transformer('not-a-number')).toBe('0');
      expect(transformer('valid123')).toBe('0'); // NaN case
    });

    it('should preserve original for invalid numbers without default', () => {
      const transformer = ContentTransformers.toNumber();
      expect(transformer('not-a-number')).toBe('not-a-number');
    });

    it('should handle whitespace', () => {
      const transformer = ContentTransformers.toNumber();
      expect(transformer('  123  ')).toBe('123');
    });
  });

  describe('toBoolean', () => {
    it('should convert truthy strings to "true"', () => {
      const transformer = ContentTransformers.toBoolean();
      expect(transformer('true')).toBe('true');
      expect(transformer('True')).toBe('true');
      expect(transformer('TRUE')).toBe('true');
      expect(transformer('yes')).toBe('true');
      expect(transformer('1')).toBe('true');
      expect(transformer('on')).toBe('true');
    });

    it('should convert falsy strings to "false"', () => {
      const transformer = ContentTransformers.toBoolean();
      expect(transformer('false')).toBe('false');
      expect(transformer('False')).toBe('false');
      expect(transformer('FALSE')).toBe('false');
      expect(transformer('no')).toBe('false');
      expect(transformer('0')).toBe('false');
      expect(transformer('off')).toBe('false');
    });

    it('should handle custom true/false values', () => {
      const transformer = ContentTransformers.toBoolean({
        trueValues: ['yep', 'sure'],
        falseValues: ['nope', 'never'],
      });
      expect(transformer('yep')).toBe('true');
      expect(transformer('nope')).toBe('false');
      expect(transformer('maybe')).toBe('maybe'); // Preserved
    });

    it('should handle whitespace', () => {
      const transformer = ContentTransformers.toBoolean();
      expect(transformer('  true  ')).toBe('true');
      expect(transformer('  false  ')).toBe('false');
    });

    it('should preserve unrecognized strings', () => {
      const transformer = ContentTransformers.toBoolean();
      expect(transformer('maybe')).toBe('maybe');
      expect(transformer('')).toBe('');
    });
  });

  describe('chain', () => {
    it('should apply transformations in sequence', () => {
      const chained = ContentTransformers.chain(
        ContentTransformers.trim(),
        ContentTransformers.toLowerCase(),
        ContentTransformers.replace(/\s+/g, '-')
      );
      expect(chained('  HELLO WORLD  ')).toBe('hello-world');
      expect(chained(' Mixed   Case TEXT ')).toBe('mixed-case-text');
    });

    it('should handle single transformer', () => {
      const single = ContentTransformers.chain(ContentTransformers.trim());
      expect(single('  test  ')).toBe('test');
    });

    it('should handle empty chain', () => {
      const empty = ContentTransformers.chain();
      expect(empty('unchanged')).toBe('unchanged');
    });
  });

  describe('custom', () => {
    it('should apply custom transformation', () => {
      const reverse = ContentTransformers.custom(content => content.split('').reverse().join(''));
      expect(reverse('hello')).toBe('olleh');
      expect(reverse('12345')).toBe('54321');
    });

    it('should throw ParserError on transformation failure', () => {
      const failing = ContentTransformers.custom(() => {
        throw new Error('Custom error');
      });

      expect(() => failing('test')).toThrow(ParserError);
      expect(() => failing('test')).toThrow('Content transformation failed: Custom error');
    });

    it('should use custom error message', () => {
      const failing = ContentTransformers.custom(() => {
        throw new Error('Internal error');
      }, 'Custom transformation failed');

      expect(() => failing('test')).toThrow('Custom transformation failed');
    });
  });
});

describe('AttributeTransformers', () => {
  describe('convertTypes', () => {
    const transformer = AttributeTransformers.convertTypes({
      count: 'number',
      active: 'boolean',
      name: 'string',
    });

    it('should convert specified attribute types', () => {
      const result = transformer({
        id: 'test',
        count: '42',
        active: 'true',
        name: 123,
      });

      expect(result).toEqual({
        id: 'test',
        count: 42,
        active: true,
        name: '123',
      });
    });

    it('should preserve attributes not in type map', () => {
      const result = transformer({ other: 'value', count: '10' });
      expect(result).toEqual({ other: 'value', count: 10 });
    });

    it('should handle boolean conversion variations', () => {
      const boolTransformer = AttributeTransformers.convertTypes({
        active1: 'boolean',
        active2: 'boolean',
        active3: 'boolean',
        active4: 'boolean',
        inactive1: 'boolean',
        inactive2: 'boolean',
      });

      const result = boolTransformer({
        active1: 'true',
        active2: '1',
        active3: 'yes',
        active4: 'on',
        inactive1: 'false',
        inactive2: 'no',
      });
      expect(result.active1).toBe(true);
      expect(result.active2).toBe(true);
      expect(result.active3).toBe(true);
      expect(result.active4).toBe(true);
      expect(result.inactive1).toBe(false);
      expect(result.inactive2).toBe(false);
    });

    it('should handle number conversion edge cases', () => {
      const result = transformer({ count: 'not-a-number' });
      expect(result.count).toBeNaN();
    });

    it('should handle undefined attributes', () => {
      expect(transformer(undefined)).toEqual({});
    });

    it('should skip missing attributes', () => {
      const result = transformer({ other: 'value' });
      expect(result).toEqual({ other: 'value' });
    });
  });

  describe('rename', () => {
    const transformer = AttributeTransformers.rename({
      'old-name': 'newName',
      legacy: 'modern',
    });

    it('should rename specified keys', () => {
      const result = transformer({
        'old-name': 'value1',
        legacy: 'value2',
        unchanged: 'value3',
      });

      expect(result).toEqual({
        newName: 'value1',
        modern: 'value2',
        unchanged: 'value3',
      });
    });

    it('should handle missing keys gracefully', () => {
      const result = transformer({ other: 'value' });
      expect(result).toEqual({ other: 'value' });
    });

    it('should handle undefined attributes', () => {
      expect(transformer(undefined)).toEqual({});
    });
  });

  describe('filter', () => {
    const transformer = AttributeTransformers.filter(['id', 'class', 'data-test']);

    it('should keep only allowed keys', () => {
      const result = transformer({
        id: 'test',
        class: 'main',
        'data-test': 'value',
        forbidden: 'remove',
        also: 'remove',
      });

      expect(result).toEqual({
        id: 'test',
        class: 'main',
        'data-test': 'value',
      });
    });

    it('should handle empty allowed list', () => {
      const empty = AttributeTransformers.filter([]);
      expect(empty({ a: 1, b: 2 })).toEqual({});
    });

    it('should handle undefined attributes', () => {
      expect(transformer(undefined)).toEqual({});
    });

    it('should handle missing allowed attributes', () => {
      const result = transformer({ other: 'value' });
      expect(result).toEqual({});
    });
  });

  describe('addDefaults', () => {
    const transformer = AttributeTransformers.addDefaults({
      defaultProp: 'default',
      count: 0,
    });

    it('should add default attributes', () => {
      const result = transformer({ id: 'test' });
      expect(result).toEqual({
        defaultProp: 'default',
        count: 0,
        id: 'test',
      });
    });

    it('should not override existing attributes', () => {
      const result = transformer({ count: 5, id: 'test' });
      expect(result).toEqual({
        defaultProp: 'default',
        count: 5,
        id: 'test',
      });
    });

    it('should handle undefined attributes', () => {
      const result = transformer(undefined);
      expect(result).toEqual({
        defaultProp: 'default',
        count: 0,
      });
    });
  });
});

describe('TagTransformer', () => {
  interface TestTag extends BaseTag {
    tagName: 'test';
    content: string;
    attributes?: Record<string, unknown>;
  }

  let tag: TestTag;

  beforeEach(() => {
    tag = {
      tagName: 'test',
      content: '  Hello World  ',
      attributes: { id: 'test-id', count: '42', active: 'true' },
    };
  });

  describe('transform', () => {
    it('should transform tag without any transformations', () => {
      const definition: TagDefinition<TestTag> = { tagName: 'test' };
      TagTransformer.transform(tag, definition);

      expect(tag.content).toBe('  Hello World  '); // Unchanged
      expect(tag.attributes).toEqual({ id: 'test-id', count: '42', active: 'true' });
    });

    it('should transform content in-place', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        transformContent: ContentTransformers.chain(
          ContentTransformers.trim(),
          ContentTransformers.toLowerCase()
        ),
      };

      TagTransformer.transform(tag, definition);
      expect(tag.content).toBe('hello world');
      expect(tag.tagName).toBe('test');
      expect(tag.attributes).toEqual({ id: 'test-id', count: '42', active: 'true' });
    });

    it('should transform attributes in-place', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        transformAttributes: AttributeTransformers.convertTypes({
          count: 'number',
          active: 'boolean',
        }),
      };

      TagTransformer.transform(tag, definition);
      expect(tag.content).toBe('  Hello World  ');
      expect(tag.attributes).toEqual({
        id: 'test-id',
        count: 42,
        active: true,
      });
    });

    it('should transform both content and attributes', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        transformContent: ContentTransformers.trim(),
        transformAttributes: AttributeTransformers.rename({ id: 'identifier' }),
      };

      TagTransformer.transform(tag, definition);
      expect(tag.content).toBe('Hello World');
      expect(tag.attributes).toEqual({
        identifier: 'test-id',
        count: '42',
        active: 'true',
      });
    });

    it('should handle tag without attributes', () => {
      const tagNoAttrs: TestTag = {
        tagName: 'test',
        content: 'content',
      };

      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        transformContent: ContentTransformers.toUpperCase(),
        transformAttributes: AttributeTransformers.addDefaults({ default: 'value' }),
      };

      TagTransformer.transform(tagNoAttrs, definition);
      expect(tagNoAttrs.content).toBe('CONTENT');
      expect(tagNoAttrs.attributes).toBeUndefined(); // No attributes to transform
    });

    it('should handle tag without content', () => {
      const tagNoContent: TestTag = {
        tagName: 'test',
        content: '',
        attributes: { id: 'test' },
      };

      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        transformContent: ContentTransformers.trim(),
        transformAttributes: AttributeTransformers.rename({ id: 'identifier' }),
      };

      TagTransformer.transform(tagNoContent, definition);
      expect(tagNoContent.content).toBe(''); // No content to transform
      expect(tagNoContent.attributes).toEqual({ identifier: 'test' });
    });

    it('should throw ParserError on transformation failure', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        transformContent: ContentTransformers.custom(() => {
          throw new Error('Transform error');
        }),
      };

      expect(() => TagTransformer.transform(tag, definition)).toThrow(ParserError);
    });
  });

  describe('applyDefaults', () => {
    it('should apply default content when empty', () => {
      const emptyTag: TestTag = { tagName: 'test', content: '' };
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        defaultContent: 'Default content',
      };

      TagTransformer.applyDefaults(emptyTag, definition);
      expect(emptyTag.content).toBe('Default content');
    });

    it('should apply default content when whitespace only', () => {
      const spaceTag: TestTag = { tagName: 'test', content: '   ' };
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        defaultContent: 'Default content',
      };

      TagTransformer.applyDefaults(spaceTag, definition);
      expect(spaceTag.content).toBe('Default content');
    });

    it('should not override existing content', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        defaultContent: 'Default content',
      };

      TagTransformer.applyDefaults(tag, definition);
      expect(tag.content).toBe('  Hello World  '); // Unchanged
    });

    it('should apply default attributes', () => {
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        defaultAttributes: { type: 'default', count: '0' },
      };

      TagTransformer.applyDefaults(tag, definition);
      expect(tag.attributes).toEqual({
        type: 'default',
        count: '42', // Original value preserved
        id: 'test-id',
        active: 'true',
      });
    });

    it('should handle tag without attributes', () => {
      const tagNoAttrs: TestTag = { tagName: 'test', content: 'test' };
      const definition: TagDefinition<TestTag> = {
        tagName: 'test',
        defaultAttributes: { type: 'default' },
      };

      TagTransformer.applyDefaults(tagNoAttrs, definition);
      expect(tagNoAttrs.attributes).toEqual({ type: 'default' });
    });
  });

  describe('clean', () => {
    it('should trim content by default', () => {
      TagTransformer.clean(tag);
      expect(tag.content).toBe('Hello World');
    });

    it('should normalize whitespace when enabled', () => {
      const messyTag: TestTag = {
        tagName: 'test',
        content: '  hello    world\n\ntest  ',
      };

      TagTransformer.clean(messyTag, { normalizeWhitespace: true });
      expect(messyTag.content).toBe('hello world test');
    });

    it('should not trim when disabled', () => {
      TagTransformer.clean(tag, { trimContent: false });
      expect(tag.content).toBe('  Hello World  ');
    });

    it('should remove empty attributes when enabled', () => {
      const messyTag: TestTag = {
        tagName: 'test',
        content: 'test',
        attributes: { id: 'test', empty: '', nullValue: null, undefinedValue: undefined },
      };

      TagTransformer.clean(messyTag, { removeEmptyAttributes: true });
      expect(messyTag.attributes).toEqual({ id: 'test' });
    });

    it('should delete attributes object when all are empty', () => {
      const emptyAttrsTag: TestTag = {
        tagName: 'test',
        content: 'test',
        attributes: { empty: '', nullValue: null },
      };

      TagTransformer.clean(emptyAttrsTag, { removeEmptyAttributes: true });
      expect(emptyAttrsTag.attributes).toBeUndefined();
    });

    it('should handle tag without content', () => {
      const noContentTag: TestTag = { tagName: 'test', content: '' };
      TagTransformer.clean(noContentTag);
      expect(noContentTag.content).toBe('');
    });

    it('should handle tag without attributes', () => {
      const noAttrsTag: TestTag = { tagName: 'test', content: 'test' };
      TagTransformer.clean(noAttrsTag, { removeEmptyAttributes: true });
      expect(noAttrsTag.attributes).toBeUndefined();
    });
  });
});
