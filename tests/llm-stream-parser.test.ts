/**
 * Tests for LLMStreamParser main API
 */

import { LLMStreamParser, createParser, createParserWithTags } from '../src/llm-stream-parser';
import { ParserConfig } from '../src/types/config';
import { ParserError } from '../src/types/errors';

describe('LLMStreamParser', () => {
  let parser: LLMStreamParser;
  let events: Array<{ type: string; data: any }>;

  beforeEach(() => {
    events = [];
    parser = new LLMStreamParser();

    // Capture events
    parser.on('parsing_complete', tags => events.push({ type: 'parsing_complete', data: tags }));
    parser.on('tag_started', (tagName, attrs) =>
      events.push({ type: 'tag_started', data: { tagName, attrs } })
    );
  });

  describe('constructor', () => {
    it('should create parser with default configuration', () => {
      expect(parser).toBeInstanceOf(LLMStreamParser);
      expect(parser.getStats()).toBeDefined();
    });

    it('should create parser with custom configuration', () => {
      const config: Partial<ParserConfig> = {
        enableNested: true,
        caseSensitive: false,
        maxBufferSize: 2048,
      };

      const customParser = new LLMStreamParser(config);
      expect(customParser.getBufferSize()).toBe(0);
    });
  });

  describe('parse', () => {
    it('should parse single chunk with registered tag', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>Hello World</test>');

      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });

    it('should handle multiple chunks', () => {
      parser.defineTag({ tagName: 'test' });

      parser.parse('<test>Part 1');
      parser.parse(' Part 2');
      parser.parse('</test>');

      // Should eventually emit parsing_complete
      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });

    it('should handle streaming data properly', () => {
      parser.defineTag({ tagName: 'stream' });

      parser.parse('<stream>');
      parser.parse('content');
      parser.parse('</stream>');

      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });
  });

  describe('parseComplete', () => {
    it('should parse complete input in one call', () => {
      parser.defineTag({ tagName: 'message' });

      parser.parseComplete('<message>Hello</message>');

      // parseComplete is void, check events instead
      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });

    it('should parse multiple tags in complete input', () => {
      parser.defineTag({ tagName: 'title' });
      parser.defineTag({ tagName: 'content' });

      parser.parseComplete('<title>Header</title><content>Body</content>');

      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });

    it('should handle empty input', () => {
      expect(() => {
        parser.parseComplete('');
      }).not.toThrow();
    });
  });

  describe('factory functions', () => {
    it('should create parser using createParser', () => {
      const factoryParser = createParser();
      expect(factoryParser).toBeInstanceOf(LLMStreamParser);
    });

    it('should create parser with config using createParser', () => {
      const config: ParserConfig = {
        enableNested: true,
        caseSensitive: false,
        maxBufferSize: 1024,
      };

      const factoryParser = createParser(config);
      expect(factoryParser).toBeInstanceOf(LLMStreamParser);
    });

    it('should create parser with tags using createParserWithTags', () => {
      const tagNames = ['user', 'message', 'system'];
      const taggedParser = createParserWithTags(tagNames);

      expect(taggedParser.hasTag('user')).toBe(true);
      expect(taggedParser.hasTag('message')).toBe(true);
      expect(taggedParser.hasTag('system')).toBe(true);
    });

    it('should create parser with tags and config', () => {
      const tagNames = ['test'];
      const config: ParserConfig = { enableNested: true };
      const taggedParser = createParserWithTags(tagNames, config);

      expect(taggedParser.hasTag('test')).toBe(true);
    });
  });

  describe('tag definition management', () => {
    it('should define tags with fluent interface', () => {
      const result = parser.defineTag({ tagName: 'first' }).defineTag({ tagName: 'second' });

      expect(result).toBe(parser); // Should return same instance
      expect(parser.hasTag('first')).toBe(true);
      expect(parser.hasTag('second')).toBe(true);
    });

    it('should define multiple tags at once', () => {
      const definitions = [{ tagName: 'tag1' }, { tagName: 'tag2' }, { tagName: 'tag3' }];

      parser.defineTags(definitions);

      expect(parser.hasTag('tag1')).toBe(true);
      expect(parser.hasTag('tag2')).toBe(true);
      expect(parser.hasTag('tag3')).toBe(true);
    });

    it('should define tag with validation', () => {
      parser.defineTag({
        tagName: 'validated',
        validateContent: content => content.length > 0 || 'Content required',
      });

      expect(parser.hasTag('validated')).toBe(true);
    });

    it('should define tag with transformation', () => {
      parser.defineTag({
        tagName: 'transformed',
        transformContent: content => content.toUpperCase(),
      });

      expect(parser.hasTag('transformed')).toBe(true);
    });

    it('should define tag with callbacks', () => {
      const onStartSpy = jest.fn();
      const onCompleteSpy = jest.fn();

      parser.defineTag({
        tagName: 'callback',
        onStart: onStartSpy,
        onComplete: onCompleteSpy,
      });

      expect(parser.hasTag('callback')).toBe(true);
    });

    it('should remove tag definitions', () => {
      parser.defineTag({ tagName: 'temporary' });
      expect(parser.hasTag('temporary')).toBe(true);

      const removed = parser.removeTag('temporary');
      expect(removed).toBe(true);
      expect(parser.hasTag('temporary')).toBe(false);
    });

    it('should get all registered tags', () => {
      parser.defineTag({ tagName: 'tag1' });
      parser.defineTag({ tagName: 'tag2' });

      const tags = parser.getRegisteredTags();
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
    });
  });

  describe('convenience methods', () => {
    it('should add simple tags', () => {
      parser.addSimpleTag('simple');
      expect(parser.hasTag('simple')).toBe(true);
    });

    it('should add simple tags with options', () => {
      const onComplete = jest.fn();

      parser.addSimpleTag('configured', {
        allowChildren: true,
        allowSelfClosing: false,
        defaultContent: 'default',
        onComplete,
      });

      expect(parser.hasTag('configured')).toBe(true);
    });

    it('should add multiple simple tags', () => {
      parser.addSimpleTags(['tag1', 'tag2', 'tag3']);

      expect(parser.hasTag('tag1')).toBe(true);
      expect(parser.hasTag('tag2')).toBe(true);
      expect(parser.hasTag('tag3')).toBe(true);
    });
  });

  describe('state management', () => {
    it('should provide current state', () => {
      const state = parser.getState();
      expect(state).toBeDefined();
    });

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

    it('should provide status information', () => {
      const status = parser.getStatus();
      expect(status).toEqual({
        state: expect.any(String),
        registeredTags: expect.any(Number),
        bufferSize: expect.any(Number),
        totalParsed: expect.any(Number),
        errorCount: expect.any(Number),
      });
    });

    it('should track buffer size', () => {
      expect(parser.getBufferSize()).toBe(0);

      parser.parse('some content');
      expect(parser.getBufferSize()).toBeGreaterThan(0);
    });

    it('should track current depth in nested mode', () => {
      const nestedParser = new LLMStreamParser({ enableNested: true });
      expect(nestedParser.getCurrentDepth()).toBe(0);
    });

    it('should track current path in nested mode', () => {
      const nestedParser = new LLMStreamParser({ enableNested: true });
      expect(nestedParser.getCurrentPath()).toBe('');
    });

    it('should reset parser state', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');

      parser.reset();

      const stats = parser.getStats();
      expect(stats.totalTagsParsed).toBe(0);
      expect(parser.getBufferSize()).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should emit parsing_complete events', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');

      const completeEvents = events.filter(e => e.type === 'parsing_complete');
      expect(completeEvents.length).toBeGreaterThan(0);
    });

    it('should emit tag_started events', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');

      const startEvents = events.filter(e => e.type === 'tag_started');
      expect(startEvents.length).toBeGreaterThan(0);
    });

    it('should support event listener management', () => {
      const listener = jest.fn();

      parser.on('parsing_complete', listener);
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');

      expect(listener).toHaveBeenCalled();
    });

    it('should support once listeners', () => {
      const listener = jest.fn();

      parser.once('parsing_complete', listener);
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content1</test>');
      parser.parse('<test>content2</test>');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support removing listeners', () => {
      const listener = jest.fn();

      parser.on('parsing_complete', listener);
      parser.off('parsing_complete', listener);

      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>content</test>');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('finalization', () => {
    it('should finalize parsing', () => {
      parser.defineTag({ tagName: 'test' });
      parser.parse('<test>partial content');

      expect(() => parser.finalize()).not.toThrow();
    });
  });

  describe('cloning', () => {
    it('should clone parser', () => {
      const cloned = parser.clone();
      expect(cloned).toBeInstanceOf(LLMStreamParser);
      expect(cloned).not.toBe(parser);
    });
  });

  describe('error handling', () => {
    it('should handle parsing gracefully', () => {
      expect(() => {
        parser.parse('invalid xml content');
      }).not.toThrow();
    });

    it('should handle buffer operations safely', () => {
      const smallParser = new LLMStreamParser({ maxBufferSize: 50 });

      expect(() => {
        smallParser.parse('This content should be handled gracefully');
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle LLM streaming response simulation', () => {
      parser.defineTag({ tagName: 'thinking' });
      parser.defineTag({ tagName: 'response' });

      // Simulate streaming LLM response
      parser.parse('<thinking>Let me consider this...');
      parser.parse('</thinking><response>The answer is');
      parser.parse(' 42</response>');

      // Should eventually process all tags
      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });

    it('should handle complex nested structure', () => {
      const nestedParser = new LLMStreamParser({ enableNested: true });

      nestedParser.defineTag({ tagName: 'document' });
      nestedParser.defineTag({ tagName: 'section' });
      nestedParser.defineTag({ tagName: 'paragraph' });

      nestedParser.parseComplete(`
        <document>
          <section>
            <paragraph>First paragraph</paragraph>
            <paragraph>Second paragraph</paragraph>
          </section>
        </document>
      `);

      // Should handle nested parsing
      expect(nestedParser.getCurrentDepth()).toBe(0);
    });

    it('should handle real-world LLM output patterns', () => {
      parser.addSimpleTags(['analysis', 'recommendation', 'confidence']);

      const llmOutput = `
        <analysis>This problem requires careful consideration of multiple factors...</analysis>
        <recommendation priority="high">I recommend option A because...</recommendation>
        <confidence level="0.85">I am quite confident in this assessment</confidence>
      `;

      parser.parseComplete(llmOutput);

      // Should process all registered tags
      expect(events.some(e => e.type === 'parsing_complete')).toBe(true);
    });
  });
});
