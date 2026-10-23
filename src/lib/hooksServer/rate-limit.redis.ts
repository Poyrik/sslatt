import { addMinutes, differenceInSeconds } from 'date-fns';

import { getInternalToken, INTERNAL_HEADER } from '@/lib/internalAuth';

// The Edge middleware cannot use ioredis (Node only), so counters are bumped
// through an internal, secret-protected route that only increments `rl:*` keys.
const getBaseUrl = () => `http://127.0.0.1:${process.env.PORT || 3000}`;

type Options = {
  minutes: number;
};

const bumpCounter = async (
  key: string,
  ttlSeconds: number,
): Promise<number | undefined> => {
  try {
    const fetchRes = await fetch(`${getBaseUrl()}/xcaptcha/rl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [INTERNAL_HEADER]: await getInternalToken(),
      },
      body: JSON.stringify({ key, ttl: ttlSeconds }),
    });

    if (!fetchRes.ok) {
      throw new Error(`rate limit counter failed: ${fetchRes.status}`);
    }

    const { count } = await fetchRes.json();
    return Number(count);
  } catch (error) {
    console.log('rateLimit bumpCounter error', error);
    return undefined;
  }
};

export default function rateLimit(options?: Options) {
  const interval = options?.minutes || 1;

  const timeExpire = () =>
    differenceInSeconds(addMinutes(new Date(), interval), new Date());

  return {
    /** Returns true when the request is allowed, false when rate limited. */
    check: async (headers: Headers, limit: number, token: string) => {
      const currentUsage = await bumpCounter(token, timeExpire());

      // If the counter is unreachable we fail open so an outage does not lock
      // every user out; the failure is logged above.
      if (currentUsage === undefined) return true;

      const isRateLimited = currentUsage >= limit;

      headers.set('X-RateLimit-Limit', `${limit}`);
      headers.set(
        'X-RateLimit-Remaining',
        `${isRateLimited ? 0 : limit - currentUsage}`,
      );

      return !isRateLimited;
    },
  };
}
