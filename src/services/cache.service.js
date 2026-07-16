const redis = require('../config/redis');

/**
 * Get from cache, or compute + cache if missing.
 * @param {string} key - cache key
 * @param {number} ttlSeconds - how long to cache the result
 * @param {Function} computeFn - async function that returns the data if not cached
 */
async function getOrSetCache(key, ttlSeconds, computeFn) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return { data: JSON.parse(cached), fromCache: true };
    }
  } catch (err) {
    console.warn('⚠️  Redis read failed, falling back to direct compute:', err.message);
  }

  const fresh = await computeFn();

  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('⚠️  Redis write failed:', err.message);
  }

  return { data: fresh, fromCache: false };
}

async function invalidateCache(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  return keys.length;
}

module.exports = { getOrSetCache, invalidateCache };