const cache = new Map();

function getCache(key) {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function setCache(key, value, ttlMs = 60000) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function deleteCache(key) {
  cache.delete(key);
}

function clearCacheByPrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCacheByPrefix
};
