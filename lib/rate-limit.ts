export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(options?: RateLimitConfig) {
  const tokenCache = new Map();
  const interval = options?.interval || 60000; // 1 minute default
  const limit = options?.uniqueTokenPerInterval || 500;

  return {
    check: (
      _res: Response,
      token: string,
      limitCount: number
    ): RateLimitResult => {
      const now = Date.now();
      const tokenCount = tokenCache.get(token) || [0];

      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1, now]);
      } else {
        const [count, timestamp] = tokenCount;
        if (now - timestamp < interval) {
          if (count >= limitCount) {
            const retryAfterMs = interval - (now - timestamp);
            return {
              allowed: false,
              retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
            };
          }
          tokenCache.set(token, [count + 1, timestamp]);
        } else {
          tokenCache.set(token, [1, now]);
        }
      }

      // Cleanup cache occasionally
      if (tokenCache.size > limit) {
        const oldestTimestamp = now - interval;
        for (const [key, value] of tokenCache.entries()) {
          if (value[1] < oldestTimestamp) {
            tokenCache.delete(key);
          }
        }
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
