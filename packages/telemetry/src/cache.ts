interface TelemetryCache {
  cadVersion: string | null;
  node: string | null;
  yarn: string | null;
  npm: string | null;
}

const cache: Partial<TelemetryCache> = {};

export function set(key: keyof TelemetryCache, value: string) {
  cache[key] = value;
  return value;
}

export function get(key: keyof TelemetryCache) {
  return cache[key];
}
