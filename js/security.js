/* ============================================================
   StadiumAI Command — Security Utilities Module
   Centralized security functions for input sanitization,
   output escaping, rate limiting, and secure storage.
   OWASP Top 10 compliance for client-side SPA.
   ============================================================ */

// ─── Production Detection ────────────────────────────────────
const IS_PRODUCTION = typeof import.meta !== 'undefined'
  && import.meta.env?.PROD === true;

// ─── Logger (suppresses sensitive output in production) ──────
export const logger = {
  log(...args) {
    if (!IS_PRODUCTION) console.log(...args);
  },
  warn(...args) {
    if (!IS_PRODUCTION) console.warn(...args);
  },
  error(...args) {
    // Always log errors, but sanitize in production
    if (IS_PRODUCTION) {
      console.error('[StadiumAI Error]', args[0]?.message || 'An error occurred');
    } else {
      console.error(...args);
    }
  }
};

// ─── HTML Escaping (prevents XSS in innerHTML) ──────────────
/**
 * Escapes HTML special characters to prevent XSS when
 * inserting untrusted data into innerHTML contexts.
 * @param {string} str — raw string
 * @returns {string} — HTML-safe string
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Input Sanitization ─────────────────────────────────────
/**
 * Sanitizes user input by stripping HTML tags, trimming,
 * and enforcing a maximum length. Prevents script injection
 * and excessively long inputs that could cause performance issues.
 * @param {string} input — raw user input
 * @param {number} maxLength — maximum allowed characters (default 2000)
 * @returns {string} — sanitized string
 */
export function sanitizeInput(input, maxLength = 2000) {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
    // Enforce max length
    .slice(0, maxLength);
}

// ─── API Key Validation ─────────────────────────────────────
/**
 * Validates a Gemini API key format before storing.
 * Rejects empty, too-short, or obviously invalid keys.
 * @param {string} key — API key to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateApiKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = key.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: 'API key is too short' };
  }

  if (trimmed.length > 256) {
    return { valid: false, error: 'API key exceeds maximum length' };
  }

  // Reject keys containing HTML/script injection attempts
  if (/<[^>]*>/.test(trimmed) || /javascript:/i.test(trimmed)) {
    return { valid: false, error: 'API key contains invalid characters' };
  }

  // Allow alphanumeric + hyphens + underscores (typical API key chars)
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    return { valid: false, error: 'API key contains unsupported characters' };
  }

  return { valid: true };
}

// ─── Rate Limiter (Token Bucket) ────────────────────────────
/**
 * Client-side rate limiter using the token bucket algorithm.
 * Prevents abuse of external API calls (e.g., Gemini API).
 */
export class RateLimiter {
  /**
   * @param {number} maxTokens — maximum burst capacity
   * @param {number} refillRate — tokens added per second
   */
  constructor(maxTokens = 10, refillRate = 0.5) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  /**
   * Attempt to consume a token. Returns true if allowed.
   * @returns {boolean}
   */
  tryConsume() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Returns estimated seconds until next token is available.
   * @returns {number}
   */
  getWaitTime() {
    this._refill();
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRate);
  }

  /** @private */
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

// ─── Secure Storage ─────────────────────────────────────────
/**
 * Wraps localStorage with key-prefixed access and basic
 * obfuscation of sensitive values. NOT encryption — this
 * prevents casual snooping, not determined attackers.
 * True secrets should use a backend vault.
 */
export class SecureStorage {
  constructor(prefix = 'stadiumai_') {
    this.prefix = prefix;
  }

  /**
   * Store a value, optionally marking it as sensitive.
   * @param {string} key
   * @param {string} value
   * @param {{ sensitive?: boolean, ttlMs?: number }} options
   */
  set(key, value, options = {}) {
    const storageKey = this.prefix + key;
    const payload = {
      v: options.sensitive ? this._obfuscate(value) : value,
      s: !!options.sensitive,
      t: Date.now(),
      e: options.ttlMs ? Date.now() + options.ttlMs : null
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      logger.warn('[SecureStorage] Failed to write:', err.message);
    }
  }

  /**
   * Retrieve a value. Returns null if expired or missing.
   * @param {string} key
   * @returns {string|null}
   */
  get(key) {
    const storageKey = this.prefix + key;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      try {
        const payload = JSON.parse(raw);
        if (payload && typeof payload === 'object' && ('v' in payload)) {
          // Check expiry
          if (payload.e && Date.now() > payload.e) {
            localStorage.removeItem(storageKey);
            return null;
          }
          return payload.s ? this._deobfuscate(payload.v) : payload.v;
        }
      } catch {
        // Fallback to raw string if it is not valid JSON
      }
      return raw;
    } catch {
      return null;
    }
  }

  /**
   * Remove a stored value.
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  /** @private — simple base64 obfuscation (NOT encryption) */
  _obfuscate(value) {
    try {
      return btoa(encodeURIComponent(value));
    } catch {
      return value;
    }
  }

  /** @private */
  _deobfuscate(value) {
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return value;
    }
  }
}

// ─── Error Sanitization ─────────────────────────────────────
/**
 * Strips stack traces and internal details from errors
 * before showing to users. Prevents information leakage.
 * @param {Error|string} err
 * @returns {string} — safe user-facing error message
 */
export function sanitizeError(err) {
  if (!err) return 'An unexpected error occurred.';

  const message = typeof err === 'string' ? err : err.message || '';

  // Strip file paths, line numbers, and stack traces
  const sanitized = message
    .replace(/at\s+.*\(.*:\d+:\d+\)/g, '')
    .replace(/[A-Z]:\\[^\s]*/gi, '')
    .replace(/\/[^\s]*\.(js|ts|mjs)/g, '')
    .replace(/:\d+:\d+/g, '')
    .trim();

  // Return a generic message if nothing useful remains
  if (!sanitized || sanitized.length < 5) {
    return 'An unexpected error occurred. Please try again.';
  }

  return sanitized;
}

// ─── Environment Validation ─────────────────────────────────
/**
 * Validates the runtime environment on startup.
 * Warns about insecure configurations in production.
 */
export function validateEnvironment() {
  const warnings = [];

  // Check for HTTPS in production
  if (IS_PRODUCTION && typeof window !== 'undefined' && window.location?.protocol === 'http:') {
    warnings.push('⚠️ Application is running over HTTP in production. HTTPS is required for security.');
  }

  // Check for localStorage availability
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
  } catch {
    warnings.push('⚠️ localStorage is not available. Settings will not persist.');
  }

  if (warnings.length > 0 && !IS_PRODUCTION) {
    warnings.forEach(w => console.warn(w));
  }

  return warnings;
}
