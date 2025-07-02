/**
 * Integration Tests - Testing modules working together
 */

import { LLMStreamParser, createParserWithTags } from '../src/llm-stream-parser';
import { ContentTransformers, AttributeTransformers } from '../src/core/transformer';
import { ContentValidators, AttributeValidators } from '../src/core/validator';

describe('Integration Tests', () => {
  describe('Parser with Validation and Transformation', () => {
    it('should validate and transform content together', () => {
      const parser = new LLMStreamParser();
      const events: any[] = [];

      parser.on('parsing_complete', tags => events.push(tags));

      parser.defineTag({
        tagName: 'message',
        validateContent: ContentValidators.required(),
        transformContent: ContentTransformers.trim(),
      });

      parser.parseComplete('<message>  hello world  </message>');

      expect(events.length).toBeGreaterThan(0);
    });

    it('should validate and transform attributes together', () => {
      const parser = new LLMStreamParser();
      const events: any[] = [];

      parser.on('parsing_complete', tags => events.push(tags));

      parser.defineTag({
        tagName: 'user',
        validateAttributes: AttributeValidators.required(['id']),
        transformAttributes: AttributeTransformers.convertTypes({
          id: 'number',
          active: 'boolean',
        }),
      });

      parser.parseComplete('<user id="123" active="true">John</user>');

      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Parsing Scenarios', () => {
    it('should handle multiple tag types with different configurations', () => {
      const parser = createParserWithTags(['user', 'message', 'system']);
      const events: any[] = [];

      parser.on('parsing_complete', tags => events.push(tags));

      // Configure different behaviors for each tag
      parser.defineTag({
        tagName: 'user',
        validateContent: ContentValidators.required(),
        transformContent: ContentTransformers.trim(),
      });

      parser.defineTag({
        tagName: 'message',
        transformContent: ContentTransformers.toLowerCase(),
      });

      parser.defineTag({
        tagName: 'system',
        validateContent: ContentValidators.required(),
      });

      const input = `
        <user>John Doe</user>
        <message>HELLO WORLD</message>
        <system status="ok" extra="remove">OK</system>
      `;

      parser.parseComplete(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(eventTags => eventTags.some((tag: any) => tag.tagName === 'user'))).toBe(
        true
      );
    });

    it('should handle streaming with partial tag completion', () => {
      const parser = new LLMStreamParser();
      const events: any[] = [];

      parser.on('parsing_complete', tags => events.push(tags));

      parser.defineTag({ tagName: 'stream' });

      // Stream data in chunks
      parser.parse('<stream>');
      parser.parse('Part 1 ');
      parser.parse('Part 2 ');
      parser.parse('Part 3');
      parser.parse('</stream>');

      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large number of tags efficiently', () => {
      const parser = new LLMStreamParser();
      const events: any[] = [];

      parser.on('parsing_complete', tags => events.push(tags));
      parser.defineTag({ tagName: 'item' });

      const startTime = Date.now();

      // Generate large input
      let input = '';
      for (let i = 0; i < 50; i++) {
        input += `<item id="${i}">Content ${i}</item>`;
      }

      parser.parseComplete(input);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // Should be reasonably fast
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Use Cases', () => {
    it('should parse LLM chat conversation', () => {
      const parser = new LLMStreamParser();
      const conversation: any[] = [];

      parser.on('parsing_complete', tags => {
        tags.forEach((tag: any) => conversation.push(tag));
      });

      parser.addSimpleTags(['user', 'assistant', 'system']);

      const chatLog = `
        <system>You are a helpful assistant.</system>
        <user>What is the capital of France?</user>
        <assistant>The capital of France is Paris.</assistant>
        <user>What about Germany?</user>
        <assistant>The capital of Germany is Berlin.</assistant>
      `;

      parser.parseComplete(chatLog);

      expect(conversation.length).toBe(5);
      expect(conversation.filter(msg => msg.tagName === 'user')).toHaveLength(2);
      expect(conversation.filter(msg => msg.tagName === 'assistant')).toHaveLength(2);
      expect(conversation.filter(msg => msg.tagName === 'system')).toHaveLength(1);
    });

    it('should parse structured LLM reasoning', () => {
      const parser = new LLMStreamParser();
      const reasoning: any[] = [];

      parser.on('parsing_complete', tags => {
        tags.forEach((tag: any) => reasoning.push(tag));
      });

      parser.defineTag({
        tagName: 'thinking',
        transformContent: ContentTransformers.trim(),
      });

      parser.defineTag({
        tagName: 'analysis',
        validateContent: ContentValidators.minLength(10),
      });

      parser.defineTag({
        tagName: 'conclusion',
        transformContent: ContentTransformers.toLowerCase(),
      });

      const reasoningProcess = `
        <thinking>
          Let me think about this step by step...
          First, I need to consider the context.
        </thinking>
        <analysis>
          Based on the available information, there are several factors to consider:
          1. The current market conditions
          2. Historical data patterns
          3. Risk factors involved
        </analysis>
        <conclusion>
          THE RECOMMENDATION IS TO PROCEED WITH CAUTION
        </conclusion>
      `;

      parser.parseComplete(reasoningProcess);

      expect(reasoning.length).toBe(3);

      const conclusion = reasoning.find(r => r.tagName === 'conclusion');
      expect(conclusion).toBeDefined();
    });

    it('should handle streaming LLM response with incremental parsing', () => {
      const parser = new LLMStreamParser();
      const streamedTags: any[] = [];

      parser.on('parsing_complete', tags => {
        streamedTags.push(...tags);
      });

      parser.addSimpleTags(['response', 'metadata']);

      // Simulate streaming response from LLM
      parser.parse('<response>');
      parser.parse('This is a streaming');
      parser.parse(' response from the LLM.');
      parser.parse('</response>');

      parser.parse('<metadata status="complete"');
      parser.parse(' tokens="25">');
      parser.parse('Processing finished');
      parser.parse('</metadata>');

      expect(streamedTags.length).toBeGreaterThan(0);
      expect(streamedTags.some(tag => tag.tagName === 'response')).toBe(true);
      expect(streamedTags.some(tag => tag.tagName === 'metadata')).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should work with different buffer sizes', () => {
      const smallBuffer = new LLMStreamParser({ maxBufferSize: 100 });
      const largeBuffer = new LLMStreamParser({ maxBufferSize: 10000 });

      const content = '<test>' + 'x'.repeat(50) + '</test>';

      smallBuffer.defineTag({ tagName: 'test' });
      largeBuffer.defineTag({ tagName: 'test' });

      expect(() => {
        smallBuffer.parseComplete(content);
        largeBuffer.parseComplete(content);
      }).not.toThrow();
    });

    it('should work with case sensitivity settings', () => {
      const caseSensitive = new LLMStreamParser({ caseSensitive: true });
      const caseInsensitive = new LLMStreamParser({ caseSensitive: false });

      const events: { parser: string; tags: any[] }[] = [];

      caseSensitive.on('parsing_complete', tags => events.push({ parser: 'sensitive', tags }));

      caseInsensitive.on('parsing_complete', tags => events.push({ parser: 'insensitive', tags }));

      caseSensitive.defineTag({ tagName: 'Test' });
      caseInsensitive.defineTag({ tagName: 'test' });

      caseSensitive.parseComplete('<Test>Sensitive</Test>');
      caseInsensitive.parseComplete('<TEST>Insensitive</TEST>');

      expect(events.length).toBeGreaterThan(0);
    });

    it('should handle nested parsing mode', () => {
      const nestedParser = new LLMStreamParser({ enableNested: true });

      nestedParser.defineTag({ tagName: 'parent' });
      nestedParser.defineTag({ tagName: 'child' });

      nestedParser.parseComplete('<parent><child>Nested content</child></parent>');

      // Should handle nested parsing without errors
      expect(nestedParser.getCurrentDepth()).toBe(0);
    });
  });

  describe('Error Recovery', () => {
    it('should continue parsing after encountering unknown tags', () => {
      const parser = new LLMStreamParser();
      const events: any[] = [];
      const errorEvents: any[] = [];

      parser.on('parsing_complete', tags => events.push(tags));
      parser.on('parse_error', error => errorEvents.push(error));

      parser.defineTag({ tagName: 'known' });

      // Mix of known and unknown tags
      parser.parse('<known>Valid content</known>');
      parser.parse('<unknown>Invalid content</unknown>');
      parser.parse('<known>More valid content</known>');

      // Should process known tags even if unknown tags cause errors
      expect(events.length).toBeGreaterThan(0);
      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('should handle malformed XML gracefully', () => {
      const parser = new LLMStreamParser();

      parser.defineTag({ tagName: 'test' });

      expect(() => {
        parser.parse('<test>Content without closing tag');
        parser.finalize();
      }).not.toThrow();
    });
  });
});
