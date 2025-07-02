/**
 * Tests for BufferManager
 */

import { BufferManager } from '../../src/core/buffer-manager';
import { ParserError } from '../../src/types/errors';

describe('BufferManager', () => {
  let buffer: BufferManager;

  beforeEach(() => {
    buffer = new BufferManager(1024); // 1KB for testing
  });

  describe('constructor', () => {
    it('should create buffer with default size', () => {
      const defaultBuffer = new BufferManager();
      expect(defaultBuffer.getSize()).toBe(0);
      expect(defaultBuffer.getRemainingCapacity()).toBe(1024 * 1024); // 1MB default
    });

    it('should create buffer with custom size', () => {
      const customBuffer = new BufferManager(512);
      expect(customBuffer.getRemainingCapacity()).toBe(512);
    });
  });

  describe('append', () => {
    it('should append string content', () => {
      buffer.append('Hello');
      expect(buffer.getContent()).toBe('Hello');
      expect(buffer.getSize()).toBe(5);
    });

    it('should append multiple chunks', () => {
      buffer.append('Hello ');
      buffer.append('World');
      expect(buffer.getContent()).toBe('Hello World');
      expect(buffer.getSize()).toBe(11);
    });

    it('should track total bytes processed', () => {
      buffer.append('test');
      expect(buffer.getTotalProcessed()).toBe(4);

      buffer.append(' more');
      expect(buffer.getTotalProcessed()).toBe(9);
    });

    it('should throw error for non-string input', () => {
      expect(() => buffer.append(123 as any)).toThrow(ParserError);
    });

    it('should throw error on buffer overflow', () => {
      const smallBuffer = new BufferManager(5);
      smallBuffer.append('12345'); // Exactly at limit

      expect(() => smallBuffer.append('6')).toThrow(ParserError);
      expect(() => smallBuffer.append('6')).toThrow('Buffer overflow');
    });
  });

  describe('getContent', () => {
    it('should return empty string for new buffer', () => {
      expect(buffer.getContent()).toBe('');
    });

    it('should return current content', () => {
      buffer.append('test content');
      expect(buffer.getContent()).toBe('test content');
    });
  });

  describe('consume', () => {
    beforeEach(() => {
      buffer.append('Hello World Test');
    });

    it('should consume specified length from start', () => {
      const consumed = buffer.consume(5);
      expect(consumed).toBe('Hello');
      expect(buffer.getContent()).toBe(' World Test');
    });

    it('should consume entire buffer if length >= buffer size', () => {
      const consumed = buffer.consume(100);
      expect(consumed).toBe('Hello World Test');
      expect(buffer.getContent()).toBe('');
    });

    it('should return empty string for zero or negative length', () => {
      expect(buffer.consume(0)).toBe('');
      expect(buffer.consume(-5)).toBe('');
      expect(buffer.getContent()).toBe('Hello World Test'); // Unchanged
    });
  });

  describe('clear', () => {
    it('should clear all content', () => {
      buffer.append('some content');
      buffer.clear();

      expect(buffer.getContent()).toBe('');
      expect(buffer.getSize()).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
    });
  });

  describe('removeRange', () => {
    beforeEach(() => {
      buffer.append('0123456789');
    });

    it('should remove content in specified range', () => {
      buffer.removeRange(2, 5);
      expect(buffer.getContent()).toBe('0156789');
    });

    it('should handle invalid ranges gracefully', () => {
      buffer.removeRange(-1, 5); // Invalid start
      expect(buffer.getContent()).toBe('0123456789'); // Unchanged

      buffer.removeRange(5, 2); // End before start
      expect(buffer.getContent()).toBe('0123456789'); // Unchanged

      buffer.removeRange(20, 25); // Start beyond buffer
      expect(buffer.getContent()).toBe('0123456789'); // Unchanged
    });
  });

  describe('slice', () => {
    beforeEach(() => {
      buffer.append('Hello World');
    });

    it('should return slice without modifying buffer', () => {
      const slice = buffer.slice(0, 5);
      expect(slice).toBe('Hello');
      expect(buffer.getContent()).toBe('Hello World'); // Unchanged
    });

    it('should work with default parameters', () => {
      const slice = buffer.slice();
      expect(slice).toBe('Hello World');
    });

    it('should work with single parameter', () => {
      const slice = buffer.slice(6);
      expect(slice).toBe('World');
    });
  });

  describe('indexOf', () => {
    beforeEach(() => {
      buffer.append('Hello World Hello');
    });

    it('should find first occurrence', () => {
      expect(buffer.indexOf('Hello')).toBe(0);
      expect(buffer.indexOf('World')).toBe(6);
    });

    it('should return -1 if not found', () => {
      expect(buffer.indexOf('xyz')).toBe(-1);
    });

    it('should support fromIndex parameter', () => {
      expect(buffer.indexOf('Hello', 1)).toBe(12);
    });
  });

  describe('utility methods', () => {
    it('should check if buffer is empty', () => {
      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.hasContent()).toBe(false);

      buffer.append('test');
      expect(buffer.isEmpty()).toBe(false);
      expect(buffer.hasContent()).toBe(true);
    });

    it('should calculate utilization percentage', () => {
      const smallBuffer = new BufferManager(100);
      smallBuffer.append('12345'); // 5 bytes of 100

      expect(smallBuffer.getUtilization()).toBe(5);
    });

    it('should detect near full buffer', () => {
      const smallBuffer = new BufferManager(100);
      smallBuffer.append('a'.repeat(79)); // 79%
      expect(smallBuffer.isNearFull()).toBe(false);

      smallBuffer.append('a'); // 80%
      expect(smallBuffer.isNearFull()).toBe(true);
    });

    it('should provide comprehensive stats', () => {
      buffer.append('test');
      const stats = buffer.getStats();

      expect(stats).toEqual({
        size: 4,
        maxSize: 1024,
        utilization: expect.any(Number),
        totalProcessed: 4,
        remainingCapacity: 1020,
      });
    });
  });
});
