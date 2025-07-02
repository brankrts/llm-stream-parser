/**
 * Buffer management for LLM Stream Parser
 */

import { ParserError, ParserErrorCode } from '../types/errors';

/**
 * Buffer manager for handling streaming content
 */
export class BufferManager {
  private buffer = '';
  private readonly maxSize: number;
  private totalBytesProcessed = 0;

  constructor(maxSize: number = 1024 * 1024) {
    this.maxSize = maxSize;
  }

  /**
   * Append content to buffer
   */
  append(chunk: string): void {
    if (typeof chunk !== 'string') {
      throw new ParserError('Chunk must be a string', ParserErrorCode.INVALID_TAG_FORMAT);
    }

    // Check for buffer overflow before appending
    if (this.buffer.length + chunk.length > this.maxSize) {
      throw ParserError.fromBufferOverflow(this.maxSize);
    }

    this.buffer += chunk;
    this.totalBytesProcessed += chunk.length;
  }

  /**
   * Get current buffer content
   */
  getContent(): string {
    return this.buffer;
  }

  /**
   * Get buffer size
   */
  getSize(): number {
    return this.buffer.length;
  }

  /**
   * Get total bytes processed
   */
  getTotalProcessed(): number {
    return this.totalBytesProcessed;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = '';
  }

  /**
   * Remove content from start of buffer
   */
  consume(length: number): string {
    if (length <= 0) {
      return '';
    }

    if (length >= this.buffer.length) {
      const content = this.buffer;
      this.buffer = '';
      return content;
    }

    const content = this.buffer.slice(0, length);
    this.buffer = this.buffer.slice(length);
    return content;
  }

  /**
   * Remove content from buffer by index range
   */
  removeRange(startIndex: number, endIndex: number): void {
    if (startIndex < 0 || endIndex < startIndex || startIndex >= this.buffer.length) {
      return;
    }

    this.buffer = this.buffer.slice(0, startIndex) + this.buffer.slice(endIndex);
  }

  /**
   * Get a slice of buffer without modifying it
   */
  slice(start?: number, end?: number): string {
    return this.buffer.slice(start, end);
  }

  /**
   * Search for pattern in buffer
   */
  indexOf(searchValue: string, fromIndex?: number): number {
    return this.buffer.indexOf(searchValue, fromIndex);
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Check if buffer has content
   */
  hasContent(): boolean {
    return this.buffer.length > 0;
  }

  /**
   * Get buffer utilization percentage
   */
  getUtilization(): number {
    return (this.buffer.length / this.maxSize) * 100;
  }

  /**
   * Get remaining capacity
   */
  getRemainingCapacity(): number {
    return this.maxSize - this.buffer.length;
  }

  /**
   * Check if buffer is near full (80% capacity)
   */
  isNearFull(): boolean {
    return this.getUtilization() >= 80;
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    utilization: number;
    totalProcessed: number;
    remainingCapacity: number;
  } {
    return {
      size: this.buffer.length,
      maxSize: this.maxSize,
      utilization: this.getUtilization(),
      totalProcessed: this.totalBytesProcessed,
      remainingCapacity: this.getRemainingCapacity(),
    };
  }
}
