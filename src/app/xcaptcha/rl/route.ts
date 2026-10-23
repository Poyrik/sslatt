import { type NextRequest, NextResponse } from 'next/server';

import { getInternalToken, INTERNAL_HEADER, safeEqual } from '@/lib/internalAuth';
import { getRedisCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Internal rate-limit counter. Only callable by this app (shared secret) and
 * can only increment a namespaced counter; it cannot read or write arbitrary
 * Redis keys.
 */
export async function POST(req: NextRequest) {
  const provided = req.headers.get(INTERNAL_HEADER) || '';
  let expected = '';
  try {
    expected = await getInternalToken();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const { key, ttl } = await req.json();
    const seconds = Math.min(Math.max(Math.round(+ttl || 60), 1), 3600);

    if (typeof key !== 'string' || !KEY_RE.test(key)) {
      return NextResponse.json({ error: 'bad key' }, { status: 400 });
    }

    const { redis } = getRedisCache();
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, seconds);
    }

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
}
