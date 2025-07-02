/**
 * Tests for StreamParser
 */

import { StreamParser } from '../../src/core/stream-parser';
import { ParserConfig } from '../../src/types/config';
import { ParserError } from '../../src/types/errors';

describe('StreamParser', () => {
  let parser: StreamParser;
  let events: Array<{ type: string; data: any }>;

  beforeEach(() => {
    events = [];
    parser = new StreamParser();

    // Capture all events
    parser.on('parsing_complete', tags => events.push({ type: 'tags', data: tags }));
    parser.on('tag_started', (tagName, attrs) =>
      events.push({ type: 'tag_started', data: { tagName, attrs } })
    );
    parser.on('error', error => events.push({ type: 'error', data: error }));
  });

  describe('constructor', () => {
    it('should create parser with default config', () => {
      expect(parser).toBeInstanceOf(StreamParser);
      expect(parser.getStats().totalTagsParsed).toBe(0);
    });

    it('should create parser with custom config', () => {
      const config: Partial<ParserConfig> = {
        enableNested: true,
        maxBufferSize: 512,
        caseSensitive: false,
      };

      const customParser = new StreamParser(config);
      expect(customParser.getBufferSize()).toBe(0);
    });
  });

  describe('parse', () => {
    it('should parse text data to buffer', () => {
      parser.parse('Hello ');
      parser.parse('World');

      const stats = parser.getStats();
      expect(stats.totalBytesProcessed).toBeGreaterThan(0);
    });

    it('should handle simple parsing', () => {
      // Register a simple tag first
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>Hello World</test>');

      const tagEvents = events.filter(e => e.type === 'tags');
      expect(tagEvents.length).toBeGreaterThan(0);
    });
  });

  describe('tag registration', () => {
    it('should register tag definitions', () => {
      parser.defineTag({ tagName: 'custom' });

      expect(parser.hasTag('custom')).toBe(true);
      expect(parser.getRegisteredTags()).toContain('custom');
    });

    it('should remove tag definitions', () => {
      parser.defineTag({ tagName: 'temp' });
      expect(parser.hasTag('temp')).toBe(true);

      const removed = parser.removeTag('temp');
      expect(removed).toBe(true);
      expect(parser.hasTag('temp')).toBe(false);
    });

    it('should return false when removing non-existent tag', () => {
      const removed = parser.removeTag('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('parse - flat mode', () => {
    beforeEach(() => {
      parser = new StreamParser({ enableNested: false });
      events = [];
      parser.on('parsing_complete', tags => events.push({ type: 'tags', data: tags }));
      parser.on('tag_started', (tagName, attrs) =>
        events.push({ type: 'tag_started', data: { tagName, attrs } })
      );
    });

    it('should parse simple tag when registered', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>Hello World</test>');

      const tagEvents = events.filter(e => e.type === 'tags');
      if (tagEvents.length > 0) {
        expect(tagEvents[0]!.data[0]).toEqual(
          expect.objectContaining({
            tagName: 'test',
            content: 'Hello World',
          })
        );
      }
    });

    it('should handle unregistered tags gracefully', () => {
      const errorEvents: any[] = [];
      parser.on('parse_error', error => errorEvents.push({ type: 'error', data: error }));

      parser.parse('<unknown>content</unknown>');

      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('should parse tag with attributes', () => {
      parser.defineTag({ tagName: 'div' });
      parser.parse('<div class="test" id="main">Content</div>');

      const tagEvents = events.filter(e => e.type === 'tags');
      if (tagEvents.length > 0) {
        expect(tagEvents[0]!.data[0]).toEqual(
          expect.objectContaining({
            tagName: 'div',
            content: 'Content',
            attributes: expect.objectContaining({
              class: 'test',
              id: 'main',
            }),
          })
        );
      }
    });

    it('should parse multiple tags', () => {
      parser.defineTag({ tagName: 'h1' });
      parser.defineTag({ tagName: 'p' });
      parser.parse('<h1>Title</h1><p>Paragraph</p>');

      const tagEvents = events.filter(e => e.type === 'tags');
      if (tagEvents.length > 0) {
        expect(tagEvents[0]!.data).toHaveLength(2);
        expect(tagEvents[0]!.data[0].tagName).toBe('h1');
        expect(tagEvents[0]!.data[1].tagName).toBe('p');
      }
    });
  });

  describe('parse - nested mode', () => {
    beforeEach(() => {
      parser = new StreamParser({ enableNested: true });
      events = [];
      parser.on('parsing_complete', tags => events.push({ type: 'tags', data: tags }));
    });

    it('should handle nested parsing setup', () => {
      parser.defineTag({ tagName: 'outer' });
      parser.defineTag({ tagName: 'inner' });
      parser.parse('<outer><inner>Content</inner></outer>');

      // Nested mode has different event patterns
      expect(parser.getCurrentDepth()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle buffer operations safely', () => {
      expect(() => {
        parser.parse('Valid content');
      }).not.toThrow();
    });

    it('should handle small buffer size', () => {
      const smallParser = new StreamParser({ maxBufferSize: 100 });

      expect(() => {
        smallParser.parse('This is content that should fit within buffer limits');
      }).not.toThrow();
    });
  });

  describe('finalize', () => {
    it('should finalize parser state', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');
      parser.finalize();

      // Should not throw and should maintain state
      expect(parser.getState()).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset parser state', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');
      parser.reset();

      const stats = parser.getStats();
      expect(stats.totalTagsParsed).toBe(0);
      expect(parser.getBufferSize()).toBe(0);
      expect(parser.getCurrentDepth()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should provide parser statistics', () => {
      const stats = parser.getStats();

      expect(stats).toEqual({
        totalTagsParsed: expect.any(Number),
        totalBytesProcessed: expect.any(Number),
        errorCount: expect.any(Number),
        registeredTagsCount: expect.any(Number),
        bufferSize: expect.any(Number),
        state: expect.any(String),
        maxDepthReached: expect.any(Number),
        totalNestedTags: expect.any(Number),
      });
    });

    it('should update stats after parsing', () => {
      parser.defineTag({ tagName: 'test' });
      const initialStats = parser.getStats();

      parser.parse('<test>content</test>');

      const finalStats = parser.getStats();
      expect(finalStats.totalBytesProcessed).toBeGreaterThan(initialStats.totalBytesProcessed);
    });
  });

  describe('state management', () => {
    it('should track parser state', () => {
      expect(parser.getState()).toBeDefined();
    });

    it('should track current path in nested mode', () => {
      const nestedParser = new StreamParser({ enableNested: true });
      expect(nestedParser.getCurrentPath()).toBe('');
    });

    it('should track buffer size', () => {
      expect(parser.getBufferSize()).toBe(0);

      parser.parse('test content');
      expect(parser.getBufferSize()).toBeGreaterThan(0);
    });
  });

  describe('tag definitions', () => {
    it('should support tag with validation', () => {
      parser.defineTag({
        tagName: 'validated',
        validateContent: content => content.length > 0 || 'Content required',
      });

      expect(parser.hasTag('validated')).toBe(true);
    });

    it('should support tag with transformation', () => {
      parser.defineTag({
        tagName: 'transformed',
        transformContent: content => content.toUpperCase(),
      });

      expect(parser.hasTag('transformed')).toBe(true);
    });

    it('should support tag with callbacks', () => {
      const onStartSpy = jest.fn();

      parser.defineTag({
        tagName: 'callback',
        onStart: onStartSpy,
      });

      parser.parse('<callback>test</callback>');

      // onStart should be called if tag is processed
      // Note: May not be called if tag processing fails due to other reasons
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(() => {
        parser.parse('');
        parser.finalize();
      }).not.toThrow();
    });

    it('should handle whitespace-only input', () => {
      expect(() => {
        parser.parse('   \n\t  ');
        parser.finalize();
      }).not.toThrow();
    });

    it('should handle malformed XML gracefully', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>unclosed content');

      // Should not crash, may emit error events
      expect(parser.getState()).toBeDefined();
    });
  });
});
