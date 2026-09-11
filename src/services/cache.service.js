/**
 * TaskFlow API - High Performance In-Memory Cache Service
 * Provides sub-millisecond read responses for high-traffic endpoints
 * with automatic TTL expiration and tag/prefix-based invalidation.
 */

const config = require('../config/env');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.store = new Map();
    this.enabled = config.cache.enabled;
    this.defaultTTL = config.cache.ttlSeconds * 1000;

    // Periodic sweep every 60s to prevent memory leaks from expired keys
    if (process.env.NODE_ENV !== 'test') {
      this.sweepInterval = setInterval(() => this.sweep(), 60000);
      if (this.sweepInterval.unref) this.sweepInterval.unref();
    }
  }

  /**
   * Set a cache entry with optional TTL in milliseconds.
   */
  set(key, value, ttlMs = this.defaultTTL) {
    if (!this.enabled) return;
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get a cached entry. Returns null if expired or missing.
   */
  get(key) {
    if (!this.enabled) return null;
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a specific cache key.
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys starting with any of the provided prefixes.
   * Useful for invalidating related caches on resource mutations (e.g. 'tasks', 'projects').
   *
   * @param {...string} prefixes
   */
  invalidatePrefix(...prefixes) {
    if (!this.enabled) return;
    let purgedCount = 0;
    for (const key of this.store.keys()) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        this.store.delete(key);
        purgedCount++;
      }
    }
    if (purgedCount > 0) {
      logger.debug(`[CACHE] Purged ${purgedCount} keys matching prefix(es): ${prefixes.join(', ')}`);
    }
  }

  /**
   * Clear entire cache store.
   */
  clear() {
    this.store.clear();
  }

  /**
   * Remove expired keys from memory.
   */
  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Express middleware for caching GET route responses.
   *
   * @param {string} keyPrefix - Namespace for the cache entry (e.g., 'tasks', 'projects')
   * @param {number} [ttlSeconds] - Custom TTL in seconds
   */
  middleware(keyPrefix, ttlSeconds) {
    return (req, res, next) => {
      // Only cache GET requests
      if (!this.enabled || req.method !== 'GET') {
        return next();
      }

      // Construct a deterministic cache key including query params
      const sortedQuery = Object.keys(req.query)
        .sort()
        .map((k) => `${k}=${encodeURIComponent(req.query[k])}`)
        .join('&');
      const cacheKey = `${keyPrefix}:${req.baseUrl}${req.path}${sortedQuery ? `?${sortedQuery}` : ''}`;

      const cachedData = this.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      res.setHeader('X-Cache', 'MISS');

      // Intercept res.json to capture response payload into cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode === 200) {
          const ttlMs = (ttlSeconds || config.cache.ttlSeconds) * 1000;
          this.set(cacheKey, body, ttlMs);
        }
        return originalJson(body);
      };

      next();
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;
