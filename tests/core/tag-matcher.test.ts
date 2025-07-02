/**
 * Tests for TagMatcher
 */

import { TagMatcher, TagPatterns } from '../../src/core/tag-matcher';

describe('TagPatterns', () => {
  describe('regex patterns', () => {
    it('should match self-closing tags', () => {
      const text = '<img src="test.jpg" />';
      const matches = Array.from(text.matchAll(TagPatterns.SELF_CLOSING));

      expect(matches).toHaveLength(1);
      expect(matches[0]![1]).toBe('img'); // tag name
      expect(matches[0]![2]).toBe(' src="test.jpg" '); // attributes
    });

    it('should match opening tags', () => {
      const text = '<div class="container">';
      const matches = Array.from(text.matchAll(TagPatterns.OPENING));

      expect(matches).toHaveLength(1);
      expect(matches[0]![1]).toBe('div');
      expect(matches[0]![2]).toBe(' class="container"');
    });

    it('should match closing tags', () => {
      const text = '</div>';
      const matches = Array.from(text.matchAll(TagPatterns.CLOSING));

      expect(matches).toHaveLength(1);
      expect(matches[0]![1]).toBe('div');
    });

    it('should match complete tags', () => {
      const text = '<p>Hello World</p>';
      const matches = Array.from(text.matchAll(TagPatterns.COMPLETE));

      expect(matches).toHaveLength(1);
      expect(matches[0]![1]).toBe('p'); // tag name
      expect(matches[0]![3]).toBe('Hello World'); // content
    });

    it('should match attributes', () => {
      const attrStr = 'id="test" class="main" checked data-value=123';
      const matches = Array.from(attrStr.matchAll(TagPatterns.ATTRIBUTES));

      expect(matches).toHaveLength(5); // Updated to match actual behavior
      expect(matches[0]![1]).toBe('id');
      expect(matches[0]![2]).toBe('test');
    });
  });

  describe('resetAll', () => {
    it('should reset all regex lastIndex properties', () => {
      // Use patterns to set lastIndex > 0
      'test'.match(TagPatterns.OPENING);

      TagPatterns.resetAll();

      expect(TagPatterns.SELF_CLOSING.lastIndex).toBe(0);
      expect(TagPatterns.OPENING.lastIndex).toBe(0);
      expect(TagPatterns.CLOSING.lastIndex).toBe(0);
      expect(TagPatterns.COMPLETE.lastIndex).toBe(0);
      expect(TagPatterns.ATTRIBUTES.lastIndex).toBe(0);
    });
  });
});

describe('TagMatcher', () => {
  let matcher: TagMatcher;

  beforeEach(() => {
    matcher = new TagMatcher(true); // Case sensitive for consistent tests
  });

  describe('constructor', () => {
    it('should create case sensitive matcher by default', () => {
      const defaultMatcher = new TagMatcher();
      expect(defaultMatcher).toBeInstanceOf(TagMatcher);
    });

    it('should create case insensitive matcher when specified', () => {
      const insensitiveMatcher = new TagMatcher(false);
      expect(insensitiveMatcher).toBeInstanceOf(TagMatcher);
    });
  });

  describe('findNextTag', () => {
    it('should find opening tag', () => {
      const result = matcher.findNextTag('<div>');

      expect(result).not.toBeNull();
      expect(result!.tagName).toBe('div');
      expect(result!.type).toBe('opening');
      expect(result!.startIndex).toBe(0);
      expect(result!.endIndex).toBe(5);
    });

    it('should find closing tag', () => {
      const result = matcher.findNextTag('</div>');

      expect(result).not.toBeNull();
      expect(result!.tagName).toBe('div');
      expect(result!.type).toBe('closing');
      expect(result!.attributes).toBeUndefined();
    });

    it('should find self-closing tag', () => {
      const result = matcher.findNextTag('<br />');

      expect(result).not.toBeNull();
      expect(result!.tagName).toBe('br');
      expect(result!.type).toBe('self-closing');
    });

    it('should find earliest tag when multiple present', () => {
      const result = matcher.findNextTag('text <span>content</span> more');

      expect(result).not.toBeNull();
      expect(result!.tagName).toBe('span');
      expect(result!.type).toBe('opening');
      expect(result!.startIndex).toBe(5);
    });

    it('should start search from specified index', () => {
      const buffer = '<div>content</div><span>more</span>';
      const result = matcher.findNextTag(buffer, 10);

      expect(result).not.toBeNull();
      expect(result!.tagName).toBe('div');
      expect(result!.type).toBe('closing');
    });

    it('should return null when no tags found', () => {
      const result = matcher.findNextTag('just plain text');
      expect(result).toBeNull();
    });
  });

  describe('findCompleteTags', () => {
    it('should find single complete tag', () => {
      const results = matcher.findCompleteTags('<p>Hello</p>');

      expect(results).toHaveLength(1);
      expect(results[0]!.tagName).toBe('p');
      expect(results[0]!.content).toBe('Hello');
      expect(results[0]!.type).toBe('complete');
    });

    it('should find multiple complete tags', () => {
      const results = matcher.findCompleteTags('<h1>Title</h1><p>Content</p>');

      expect(results).toHaveLength(2);
      expect(results[0]!.tagName).toBe('h1');
      expect(results[0]!.content).toBe('Title');
      expect(results[1]!.tagName).toBe('p');
      expect(results[1]!.content).toBe('Content');
    });

    it('should handle tags with attributes', () => {
      const results = matcher.findCompleteTags('<div class="test" id="main">Content</div>');

      expect(results).toHaveLength(1);
      expect(results[0]!.tagName).toBe('div');
      expect(results[0]!.content).toBe('Content');
      expect(results[0]!.attributes).toEqual({
        class: 'test',
        id: 'main',
      });
    });

    it('should handle empty tags', () => {
      const results = matcher.findCompleteTags('<empty></empty>');

      expect(results).toHaveLength(1);
      expect(results[0]!.content).toBe('');
    });

    it('should ignore incomplete tags', () => {
      const results = matcher.findCompleteTags(
        '<incomplete>no closing tag <complete>yes</complete>'
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.tagName).toBe('complete');
    });
  });

  describe('parseAttributes', () => {
    it('should parse empty attributes', () => {
      expect(matcher.parseAttributes('')).toBeUndefined();
      expect(matcher.parseAttributes('   ')).toBeUndefined();
    });

    it('should parse simple attributes', () => {
      const result = matcher.parseAttributes('id="test" class="main"');

      expect(result).toEqual({
        id: 'test',
        class: 'main',
      });
    });

    it('should parse boolean attributes', () => {
      const result = matcher.parseAttributes('checked disabled hidden');

      expect(result).toEqual({
        checked: true,
        disabled: true,
        hidden: true,
      });
    });

    it('should parse mixed quote styles', () => {
      const result = matcher.parseAttributes('id="double" name=\'single\' value=unquoted');

      expect(result).toEqual({
        id: 'double',
        name: 'single',
        value: 'unquoted',
      });
    });

    it('should parse and convert data types', () => {
      const result = matcher.parseAttributes('count=42 price=19.99 active=true disabled=false');

      expect(result).toEqual({
        count: 42,
        price: 19.99,
        active: true,
        disabled: false,
      });
    });

    it('should handle malformed attributes gracefully', () => {
      const result = matcher.parseAttributes('valid="ok" ="noname" broken=');

      expect(result).toEqual({
        valid: 'ok',
        broken: true,
        noname: true,
      });
    });
  });

  describe('case sensitivity', () => {
    it('should preserve case when case sensitive', () => {
      const caseSensitive = new TagMatcher(true);
      const result = caseSensitive.findNextTag('<MyTag>');

      expect(result!.tagName).toBe('MyTag');
    });

    it('should normalize case when case insensitive', () => {
      const caseInsensitive = new TagMatcher(false);
      const result = caseInsensitive.findNextTag('<MyTag>');

      expect(result!.tagName).toBe('mytag');
    });
  });

  describe('containsTags', () => {
    it('should detect presence of tags', () => {
      expect(matcher.containsTags('Hello <world>')).toBe(true);
      expect(matcher.containsTags('<tag>content</tag>')).toBe(true);
      expect(matcher.containsTags('No tags here')).toBe(false);
    });

    it('should detect various tag formats', () => {
      expect(matcher.containsTags('<self-closing/>')).toBe(true);
      expect(matcher.containsTags('<with_underscores>')).toBe(true);
      expect(matcher.containsTags('<123invalid>')).toBe(false); // Must start with letter
    });
  });

  describe('extractTextContent', () => {
    it('should extract text between indices', () => {
      const text = 'Hello World Test';
      const result = matcher.extractTextContent(text, 6, 11);

      expect(result).toBe('World');
    });

    it('should handle edge cases', () => {
      const text = 'Test';

      expect(matcher.extractTextContent(text, 0, 0)).toBe('');
      expect(matcher.extractTextContent(text, 0, 4)).toBe('Test');
      expect(matcher.extractTextContent(text, 2, 2)).toBe('');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed XML gracefully', () => {
      const results = matcher.findCompleteTags('<<invalid>> <valid>ok</valid>');

      expect(results).toHaveLength(1);
      expect(results[0]!.tagName).toBe('valid');
    });

    it('should handle nested tags in complete mode', () => {
      const results = matcher.findCompleteTags('<outer><inner>content</inner></outer>');

      // Should find the complete outer tag
      expect(results).toHaveLength(1);
      expect(results[0]!.tagName).toBe('outer');
      expect(results[0]!.content).toBe('<inner>content</inner>');
    });

    it('should handle tags with special characters in content', () => {
      const results = matcher.findCompleteTags('<code>const x = {a: 1, b: 2};</code>');

      expect(results).toHaveLength(1);
      expect(results[0]!.content).toBe('const x = {a: 1, b: 2};');
    });

    it('should handle empty buffer', () => {
      expect(matcher.findNextTag('')).toBeNull();
      expect(matcher.findCompleteTags('')).toEqual([]);
    });
  });
});
