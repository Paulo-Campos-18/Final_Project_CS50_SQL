/**
 * In-memory sliding-window rate limiter. Good for single-instance Next.js
 * deployments (which is what we run today). For multi-region or serverless
 * with cold starts, swap for Upstash/Redis later — same API.
 *
 * Usage:
 *   const r = rateLimit('login:' + ip, { max: 5, windowMs: 15 * 60_000 });
 *   if (!r.ok) return 429;
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

interface Options {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryInSeconds: number;
}

export function rateLimit(key: string, opts: Options): RateLimitResult {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  // drop old hits outside window
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= opts.max) {
    const oldest = bucket.hits[0];
    const retryInSeconds = Math.max(1, Math.ceil((oldest + opts.windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryInSeconds };
  }

  bucket.hits.push(now);
  return {
    ok: true,
    remaining: opts.max - bucket.hits.length,
    retryInSeconds: 0,
  };
}

// Light GC every 5 minutes so the map doesn't grow forever.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      // 1h horizon for cleanup — buckets are usually small
      bucket.hits = bucket.hits.filter((t) => t > now - 60 * 60 * 1000);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}
