import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  escapeHTML, 
  sanitizeInput, 
  validateApiKey, 
  RateLimiter, 
  SecureStorage, 
  sanitizeError, 
  validateEnvironment, 
  logger 
} from '../js/security.js';

describe('Security Utilities Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. escapeHTML Tests
  describe('escapeHTML', () => {
    test('should escape HTML characters correctly', () => {
      expect(escapeHTML('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      // Let's test the specific outputs
      expect(escapeHTML('<')).toBe('&lt;');
      expect(escapeHTML('>')).toBe('&gt;');
      expect(escapeHTML('"')).toBe('&quot;');
      expect(escapeHTML("'")).toBe('&#039;');
      expect(escapeHTML('&')).toBe('&amp;');
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
    });
  });

  // 2. sanitizeInput Tests
  describe('sanitizeInput', () => {
    test('should strip HTML tags and trim whitespace', () => {
      const input = '   <div>Hello <b>World</b></div>   ';
      expect(sanitizeInput(input)).toBe('Hello World');
    });

    test('should handle null bytes and slice to max length', () => {
      const input = 'a\0b\0c';
      expect(sanitizeInput(input)).toBe('abc');

      const longInput = 'a'.repeat(2100);
      expect(sanitizeInput(longInput, 100).length).toBe(100);
    });

    test('should return empty string for non-string inputs', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  // 3. validateApiKey Tests
  describe('validateApiKey', () => {
    test('should validate correct Gemini API key formats', () => {
      expect(validateApiKey('AIzaSyValidApiKey123').valid).toBe(true);
      expect(validateApiKey('AIzaSy-Some_Key-With-Hyphens').valid).toBe(true);
    });

    test('should reject empty or invalid key types', () => {
      expect(validateApiKey(null).valid).toBe(false);
      expect(validateApiKey('').valid).toBe(false);
      expect(validateApiKey('short').valid).toBe(false);
    });

    test('should reject keys with XSS/scripts or special chars', () => {
      expect(validateApiKey('AIzaSy<script>alert(1)</script>').valid).toBe(false);
      expect(validateApiKey('AIzaSyKey With Spaces').valid).toBe(false);
      expect(validateApiKey('AIzaSyKey$Special').valid).toBe(false);
    });
  });

  // 4. RateLimiter Tests
  describe('RateLimiter', () => {
    test('should consume tokens and block requests when empty', () => {
      const limiter = new RateLimiter(2, 1); // 2 capacity, refill 1 per second
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(false); // exhausted
    });

    test('should refill tokens over time', () => {
      vi.useFakeTimers();
      const limiter = new RateLimiter(2, 1);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(false);

      // Advance time by 1s
      vi.advanceTimersByTime(1000);
      expect(limiter.tryConsume()).toBe(true); // refilled 1 token
      expect(limiter.tryConsume()).toBe(false);
      vi.useRealTimers();
    });

    test('should calculate wait times correctly', () => {
      const limiter = new RateLimiter(2, 0.5); // capacity 2, refill 0.5 tokens/sec
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(false);

      const wait = limiter.getWaitTime();
      expect(wait).toBeGreaterThan(0);
      expect(wait).toBe(2); // needs 1 token, refill rate 0.5/s -> 2s
    });
  });

  // 5. SecureStorage Tests
  describe('SecureStorage', () => {
    let storage;
    beforeEach(() => {
      storage = new SecureStorage('test_prefix_');
    });

    test('should set and get raw and obfuscated items', () => {
      storage.set('key1', 'plain_value');
      expect(storage.get('key1')).toBe('plain_value');

      storage.set('key2', 'secret_value', { sensitive: true });
      expect(storage.get('key2')).toBe('secret_value');
      
      // Verify obfuscation in localStorage
      const rawStored = localStorage.getItem('test_prefix_key2');
      expect(rawStored).toContain('"s":true');
      expect(rawStored).not.toContain('secret_value');
    });

    test('should respect TTL expiry', () => {
      vi.useFakeTimers();
      storage.set('expiring', 'temp', { ttlMs: 1000 });
      expect(storage.get('expiring')).toBe('temp');

      // Advance time by 1.1s
      vi.advanceTimersByTime(1100);
      expect(storage.get('expiring')).toBeNull();
      vi.useRealTimers();
    });

    test('should fallback to raw text if JSON is corrupted', () => {
      localStorage.setItem('test_prefix_corrupt', 'raw_plain_text');
      expect(storage.get('corrupt')).toBe('raw_plain_text');
    });

    test('should remove items correctly', () => {
      storage.set('key', 'val');
      expect(storage.get('key')).toBe('val');
      storage.remove('key');
      expect(storage.get('key')).toBeNull();
    });
  });

  // 6. sanitizeError Tests
  describe('sanitizeError', () => {
    test('should sanitize stack traces and filesystem paths', () => {
      const errorMsg = 'Error occurred at Object.openSync (C:\\Ai Hackathon\\js\\app.js:12:35)';
      const sanitized = sanitizeError(new Error(errorMsg));
      expect(sanitized).not.toContain('C:\\Ai Hackathon');
      expect(sanitized).not.toContain('at Object.openSync');
    });

    test('should return default message for empty or invalid errors', () => {
      expect(sanitizeError(null)).toBe('An unexpected error occurred.');
      expect(sanitizeError('')).toBe('An unexpected error occurred.');
    });

    test('should return default message if sanitized error is too short', () => {
      expect(sanitizeError('ab')).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // 7. validateEnvironment Tests
  describe('validateEnvironment', () => {
    test('should check localStorage availability and handle errors', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage disabled');
      });
      const warnings = validateEnvironment();
      expect(warnings).toContain('⚠️ localStorage is not available. Settings will not persist.');
      setItemSpy.mockRestore();
    });
  });

  // 8. Logger Tests
  describe('logger', () => {
    test('should delegate logs to console', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.log('test log');
      logger.warn('test warn');
      logger.error(new Error('test error'));

      expect(logSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
