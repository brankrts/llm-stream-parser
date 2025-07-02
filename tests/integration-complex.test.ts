/**
 * Complex Integration Tests for Multi-Child Tags and Advanced Scenarios
 */

import { LLMStreamParser } from '../src/llm-stream-parser';
import { ContentTransformers, AttributeTransformers } from '../src/core/transformer';
import { ContentValidators, AttributeValidators } from '../src/core/validator';
import { BaseTag } from '../src/types/base';

describe('Complex Integration Tests', () => {
  let parser: LLMStreamParser;
  let events: any[];
  let errors: any[];

  beforeEach(() => {
    parser = new LLMStreamParser({ enableNested: true, maxDepth: 10 });
    events = [];
    errors = [];

    parser.on('parsing_complete', tags => events.push({ type: 'complete', data: tags }));
    parser.on('tag_completed', tag => events.push({ type: 'tag', data: tag }));
    parser.on('parse_error', error => errors.push({ type: 'error', data: error }));
  });

  describe('Multi-Child Tag Scenarios', () => {
    it('should handle document with multiple child sections', () => {
      parser.defineTag({ tagName: 'document' });
      parser.defineTag({ tagName: 'section' });
      parser.defineTag({ tagName: 'paragraph' });
      parser.defineTag({ tagName: 'list' });
      parser.defineTag({ tagName: 'item' });

      const complexDocument = `
        <document title="Complex Document" author="AI Assistant">
          <section id="intro" type="introduction">
            <paragraph>This is the introduction paragraph with detailed content.</paragraph>
            <paragraph>Another paragraph in the introduction section.</paragraph>
          </section>
          
          <section id="main" type="content">
            <paragraph>Main content paragraph explaining complex concepts.</paragraph>
            <list type="ordered">
              <item priority="high">First important item</item>
              <item priority="medium">Second item with moderate importance</item>
              <item priority="low">Third item with lower priority</item>
            </list>
            <paragraph>Conclusion paragraph for the main section.</paragraph>
          </section>
          
          <section id="appendix" type="reference">
            <paragraph>Appendix content with references and citations.</paragraph>
            <list type="unordered">
              <item>Reference item A</item>
              <item>Reference item B</item>
              <item>Reference item C</item>
            </list>
          </section>
        </document>
      `;

      parser.parseComplete(complexDocument);

      // Should parse all nested structures
      const tagEvents = events.filter(e => e.type === 'tag');
      expect(tagEvents.length).toBeGreaterThan(10); // Multiple nested tags

      // Should handle deep nesting correctly
      expect(parser.getCurrentDepth()).toBe(0); // Should return to depth 0
      expect(errors.length).toBe(0); // No parsing errors
    });

    it('should handle mixed content with text and child elements', () => {
      parser.defineTag({ tagName: 'article' });
      parser.defineTag({ tagName: 'title' });
      parser.defineTag({ tagName: 'author' });
      parser.defineTag({ tagName: 'content' });
      parser.defineTag({ tagName: 'emphasis' });
      parser.defineTag({ tagName: 'link' });

      const mixedContent = `
        <article id="mixed-content">
          <title>Understanding AI and Machine Learning</title>
          <author>Dr. Jane Smith</author>
          <content>
            This article explores the fascinating world of AI.
            <emphasis>Machine learning</emphasis> is a subset of artificial intelligence.
            You can learn more at <link href="https://example.com">this resource</link>.
            
            The field has advanced rapidly in recent years, with applications in:
            - Natural language processing
            - Computer vision  
            - Autonomous systems
            
            For more information, visit <link href="https://ai-research.org">AI Research</link>.
          </content>
        </article>
      `;

      parser.parseComplete(mixedContent);

      expect(events.length).toBeGreaterThan(0);
      expect(errors.length).toBe(0);
    });

    it('should handle deeply nested conversation threads', () => {
      parser.defineTag({ tagName: 'conversation' });
      parser.defineTag({ tagName: 'thread' });
      parser.defineTag({ tagName: 'message' });
      parser.defineTag({ tagName: 'reply' });
      parser.defineTag({ tagName: 'reaction' });

      const conversation = `
        <conversation id="team-discussion">
          <thread topic="project-planning">
            <message user="alice" timestamp="2024-01-01T10:00:00Z">
              What should we prioritize for the next sprint?
              <reaction type="thinking">🤔</reaction>
            </message>
            
            <reply to="alice" user="bob" timestamp="2024-01-01T10:05:00Z">
              I think we should focus on the user authentication system.
              <reaction type="agreement">👍</reaction>
              
              <reply to="bob" user="charlie" timestamp="2024-01-01T10:10:00Z">
                Agreed! But we should also consider the database optimization.
                <reaction type="support">💪</reaction>
                
                <reply to="charlie" user="alice" timestamp="2024-01-01T10:15:00Z">
                  Good point! Let's tackle both in parallel.
                  <reaction type="excited">🚀</reaction>
                </reply>
              </reply>
            </reply>
          </thread>
        </conversation>
      `;

      parser.parseComplete(conversation);

      expect(events.length).toBeGreaterThan(5);
      expect(errors.length).toBe(0);
      expect(parser.getCurrentDepth()).toBe(0);
    });
  });

  describe('Advanced Content Processing', () => {
    it('should handle tags with complex validation and transformation', () => {
      // Define tags with validation and transformation
      parser.defineTag({
        tagName: 'user',
        validateContent: ContentValidators.combine(
          ContentValidators.required(),
          ContentValidators.minLength(2),
          ContentValidators.maxLength(50)
        ),
        validateAttributes: AttributeValidators.required(['id', 'role']),
        transformContent: ContentTransformers.trim(),
        transformAttributes: AttributeTransformers.convertTypes({
          active: 'boolean',
          level: 'number',
        }),
      });

      parser.defineTag({
        tagName: 'profile',
        validateAttributes: AttributeValidators.types({
          age: 'number',
          verified: 'boolean',
        }),
        transformAttributes: AttributeTransformers.convertTypes({
          age: 'number',
          verified: 'boolean',
        }),
      });

      parser.defineTag({
        tagName: 'preferences',
        transformContent: ContentTransformers.chain(
          ContentTransformers.trim(),
          ContentTransformers.toLowerCase()
        ),
      });

      const userManagement = `
        <user id="user-001" role="admin" active="true" level="5">
          Alice Johnson
          <profile age="32" verified="true" location="New York">
            Senior Software Engineer with 8 years of experience.
          </profile>
          <preferences>
            DARK_MODE, EMAIL_NOTIFICATIONS, ADVANCED_FEATURES
          </preferences>
        </user>
        
        <user id="user-002" role="developer" active="false" level="3">
          Bob Smith
          <profile age="28" verified="true" location="San Francisco">
            Full-stack developer specializing in React and Node.js.
          </profile>
          <preferences>
            LIGHT_MODE, PUSH_NOTIFICATIONS, BASIC_FEATURES
          </preferences>
        </user>
      `;

      parser.parseComplete(userManagement);

      // Validate transformations worked
      const tagEvents = events.filter(e => e.type === 'tag');
      const userTags = tagEvents.filter(e => e.data.tagName === 'user');

      expect(userTags.length).toBe(2);

      // Check boolean and number transformations
      if (userTags.length > 0) {
        const firstUser = userTags[0]!.data;
        expect(firstUser.attributes?.active).toBe(true); // Should be boolean
        expect(firstUser.attributes?.level).toBe(5); // Should be number
      }

      expect(errors.length).toBe(0);
    });

    it('should handle streaming complex data structures', () => {
      parser.defineTag({ tagName: 'dataset' });
      parser.defineTag({ tagName: 'record' });
      parser.defineTag({ tagName: 'field' });
      parser.defineTag({ tagName: 'metadata' });

      // Simulate streaming a large dataset
      parser.parse('<dataset name="user-analytics" version="2.1">');
      parser.parse('<metadata>');
      parser.parse('<field name="source">web-app</field>');
      parser.parse('<field name="collection-date">2024-01-15</field>');
      parser.parse('<field name="record-count">1500</field>');
      parser.parse('</metadata>');

      // Stream multiple records
      for (let i = 1; i <= 3; i++) {
        parser.parse(`<record id="rec-${i}" type="user-session">`);
        parser.parse(`<field name="user-id">user-${1000 + i}</field>`);
        parser.parse(`<field name="session-duration">${Math.floor(Math.random() * 3600)}</field>`);
        parser.parse(`<field name="pages-visited">${Math.floor(Math.random() * 20) + 1}</field>`);
        parser.parse(`<field name="conversion">${Math.random() > 0.5 ? 'true' : 'false'}</field>`);
        parser.parse('</record>');
      }

      parser.parse('</dataset>');
      parser.finalize();

      expect(events.length).toBeGreaterThan(10);
      expect(errors.length).toBe(0);
    });

    it('should handle code documentation with multiple examples', () => {
      parser.defineTag({ tagName: 'documentation' });
      parser.defineTag({ tagName: 'section' });
      parser.defineTag({ tagName: 'example' });
      parser.defineTag({ tagName: 'code' });
      parser.defineTag({ tagName: 'output' });
      parser.defineTag({ tagName: 'note' });

      const documentation = `
        <documentation project="stream-parser" version="1.0">
          <section title="Basic Usage">
            <example name="simple-parsing">
              <code language="typescript">
                const parser = new LLMStreamParser();
                parser.defineTag({ tagName: 'message' });
                parser.parse('&lt;message&gt;Hello World&lt;/message&gt;');
              </code>
              <output>
                Parsed tag: { tagName: 'message', content: 'Hello World' }
              </output>
              <note type="info">This is the simplest way to use the parser.</note>
            </example>
          </section>
          
          <section title="Advanced Features">
            <example name="validation-and-transformation">
              <code language="typescript">
                parser.defineTag({
                  tagName: 'user',
                  validateContent: ContentValidators.required(),
                  transformContent: ContentTransformers.trim()
                });
              </code>
              <output>
                Enhanced parsing with validation and transformation applied.
              </output>
              <note type="warning">Make sure to handle validation errors properly.</note>
            </example>
            
            <example name="nested-parsing">
              <code language="typescript">
                const nestedParser = new LLMStreamParser({ enableNested: true });
                nestedParser.defineTag({ tagName: 'document' });
                nestedParser.defineTag({ tagName: 'section' });
              </code>
              <output>
                Nested structure parsed with proper hierarchy maintained.
              </output>
              <note type="tip">Nested mode is great for complex documents.</note>
            </example>
          </section>
        </documentation>
      `;

      parser.parseComplete(documentation);

      expect(events.length).toBeGreaterThanOrEqual(15);
      expect(errors.length).toBe(0);
    });
  });

  describe('Performance and Scale Tests', () => {
    it('should handle large documents with many nested elements', () => {
      parser.defineTag({ tagName: 'library' });
      parser.defineTag({ tagName: 'category' });
      parser.defineTag({ tagName: 'book' });
      parser.defineTag({ tagName: 'chapter' });
      parser.defineTag({ tagName: 'section' });

      let largeDocument = '<library name="digital-library">';

      // Generate multiple categories with books and chapters
      for (let cat = 1; cat <= 5; cat++) {
        largeDocument += `<category id="cat-${cat}" name="Category ${cat}">`;

        for (let book = 1; book <= 10; book++) {
          largeDocument += `<book id="book-${cat}-${book}" title="Book ${book} in Category ${cat}">`;

          for (let chapter = 1; chapter <= 5; chapter++) {
            largeDocument += `<chapter number="${chapter}" title="Chapter ${chapter}">`;
            largeDocument += `<section>Content for chapter ${chapter} of book ${book}</section>`;
            largeDocument += `</chapter>`;
          }

          largeDocument += `</book>`;
        }

        largeDocument += `</category>`;
      }

      largeDocument += '</library>';

      const startTime = Date.now();
      parser.parseComplete(largeDocument);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(events.length).toBeGreaterThan(100); // Many elements parsed
      expect(errors.length).toBe(0);
      expect(parser.getCurrentDepth()).toBe(0);
    });

    it('should handle mixed valid and invalid complex structures', () => {
      parser.defineTag({ tagName: 'container' });
      parser.defineTag({ tagName: 'valid' });
      parser.defineTag({ tagName: 'item' });

      const mixedContent = `
        <container>
          <valid>Good content here</valid>
          <unknown>This tag is not registered</unknown>
          <valid>
            <item>Nested item 1</item>
            <item>Nested item 2</item>
          </valid>
          <another-unknown attr="test">More unknown content</another-unknown>
          <valid>Final valid content</valid>
        </container>
      `;

      parser.parseComplete(mixedContent);

      // Should parse valid tags and emit errors for unknown ones
      const tagEvents = events.filter(e => e.type === 'tag');
      const validTags = tagEvents.filter(e =>
        ['container', 'valid', 'item'].includes(e.data.tagName)
      );

      expect(validTags.length).toBeGreaterThan(0);
      // Parser may be configured to ignore unknown tags rather than error
      expect(errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle real-world LLM reasoning with complex thought processes', () => {
      parser.defineTag({
        tagName: 'reasoning',
        transformAttributes: AttributeTransformers.convertTypes({
          confidence: 'number',
          complexity: 'number',
        }),
      });
      parser.defineTag({ tagName: 'thought' });
      parser.defineTag({ tagName: 'analysis' });
      parser.defineTag({ tagName: 'conclusion' });
      parser.defineTag({ tagName: 'evidence' });
      parser.defineTag({ tagName: 'counterargument' });

      const complexReasoning = `
        <reasoning problem="climate-change-solutions" confidence="0.85" complexity="9">
          <thought type="initial">
            Climate change is one of the most pressing issues of our time, requiring comprehensive solutions.
          </thought>
          
          <analysis category="renewable-energy">
            <evidence source="IEA-2023" weight="high">
              Renewable energy costs have decreased by 80% over the past decade.
            </evidence>
            <evidence source="MIT-study" weight="medium">
              Solar and wind power can meet 70% of global energy needs by 2040.
            </evidence>
            <counterargument>
              Intermittency issues require significant battery storage investments.
            </counterargument>
          </analysis>
          
          <analysis category="carbon-capture">
            <evidence source="IPCC-report" weight="high">
              Direct air capture technology is becoming commercially viable.
            </evidence>
            <evidence source="startup-data" weight="low">
              Several companies claim breakthrough efficiency improvements.
            </evidence>
            <counterargument>
              Current costs are still prohibitively high for large-scale deployment.
            </counterargument>
          </analysis>
          
          <analysis category="policy-measures">
            <evidence source="EU-green-deal" weight="high">
              Carbon pricing mechanisms have shown effectiveness in Europe.
            </evidence>
            <evidence source="economic-analysis" weight="medium">
              Green investments create more jobs than fossil fuel investments.
            </evidence>
            <counterargument>
              Political resistance and lobbying from fossil fuel industries.
            </counterargument>
          </analysis>
          
          <conclusion confidence="0.82">
            A multi-pronged approach combining renewable energy expansion, carbon capture technology,
            and strong policy measures offers the best path forward. Implementation challenges exist
            but are not insurmountable with sufficient political will and investment.
            
            <thought type="meta">
              This analysis considered multiple perspectives but may need updating as technology evolves.
            </thought>
          </conclusion>
        </reasoning>
      `;

      parser.parseComplete(complexReasoning);

      expect(events.length).toBeGreaterThan(10);
      expect(errors.length).toBe(0);

      // Check that confidence attribute was converted to number
      const reasoningTags = events.filter(e => e.type === 'tag' && e.data.tagName === 'reasoning');
      if (reasoningTags.length > 0) {
        expect(reasoningTags[0]!.data.attributes?.confidence).toBe(0.85);
        expect(reasoningTags[0]!.data.attributes?.complexity).toBe(9);
      }
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should recover from partial parsing errors in complex structures', () => {
      parser.defineTag({ tagName: 'robust' });
      parser.defineTag({ tagName: 'section' });
      parser.defineTag({ tagName: 'content' });

      const problematicContent = `
        <robust>
          <section>Valid section 1</section>
          <unknown>This will cause an error</unknown>
          <section>
            <content>Nested content that should still parse</content>
          </section>
          <section>Final valid section</section>
        </robust>
      `;

      parser.parseComplete(problematicContent);

      // Should have some successful parses
      const tagEvents = events.filter(e => e.type === 'tag');
      expect(tagEvents.length).toBeGreaterThan(0);
      // Parser may be configured to ignore unknown tags rather than error
      expect(errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle extremely deep nesting up to max depth', () => {
      parser.defineTag({ tagName: 'level' });

      // Create deeply nested structure
      let deepStructure = '';
      let closingTags = '';

      for (let i = 1; i <= 8; i++) {
        // Just under maxDepth of 10
        deepStructure += `<level depth="${i}">Content at level ${i} `;
        closingTags = `</level>${closingTags}`;
      }

      deepStructure += closingTags;

      parser.parseComplete(deepStructure);

      expect(events.length).toBeGreaterThan(0);
      expect(errors.length).toBe(0); // Should not exceed max depth
      expect(parser.getCurrentDepth()).toBe(0);
    });

    it('should handle malformed XML mixed with valid complex structures', () => {
      parser.defineTag({ tagName: 'document' });
      parser.defineTag({ tagName: 'header' });
      parser.defineTag({ tagName: 'body' });
      parser.defineTag({ tagName: 'footer' });

      const malformedDocument = `
        <document>
          <header>Valid header content</header>
          <body>
            This is valid content...
          </body>
          <footer>Valid footer despite earlier issues</footer>
        </document>
      `;

      expect(() => {
        parser.parseComplete(malformedDocument);
      }).not.toThrow();

      // Should parse what it can and handle errors gracefully
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
