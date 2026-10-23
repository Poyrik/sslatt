import Redis from 'ioredis';
import isEmpty from 'lodash/isEmpty';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost';

let redisCache: RedisCache;

export class RedisCache {
  redis;

  constructor() {
    this.redis = new Redis(REDIS_URL);
  }

  async ping() {
    return this.redis.ping();
  }

  async get(key: string, json = true): Promise<string | undefined> {
    return new Promise((resolve) => {
      this.redis.get(key, (err, result: any) => {
        if (err) {
          resolve(null);
        } else {
          resolve(json ? JSON.parse(result) : result);
        }
      });
    });
  }

  /** Atomically deletes a key. Resolves true only if the key existed. */
  async consume(key: string): Promise<boolean> {
    const removed = await this.redis.del(key);
    return removed === 1;
  }

  async save(key: string, value: any, expire: number, json = true) {
    if (!expire) {
      console.log('save', 'no expire');
      return this.redis.incr(key);
    }

    return this.redis.set(
      key,
      json ? JSON.stringify(value) : value,
      'EX',
      Math.round(expire),
    );
  }
}

export const getRedisCache = () => {
  if (!redisCache) {
    redisCache = new RedisCache();
  }

  return redisCache;
};

export const getRedisKey = async (
  key: string = '',
  json = true,
): Promise<string | undefined> => {
  try {
    if (isEmpty(key)) {
      throw new Error('key is empty');
    }
    const redis = getRedisCache();
    const data = await redis.get(key, json);
    return data;
  } catch (error) {
    console.log('getKeyFromLocalhost error', error);
    return undefined;
  }
};

export const saveRedisKey = async (
  key: string,
  data: any,
  expires?: number,
  json = true,
): Promise<any> => {
  try {
    if (!data) {
      throw new Error('data is empty');
    }
    const redis = getRedisCache();
    const resdata = await redis.save(key, data, expires || 0, json);
    return resdata;
  } catch (error) {
    console.log('saveKeyToLocalhost error', error);
    return undefined;
  }
};

/**
 * Single-use check: returns true exactly once per stored key (the first caller
 * deletes it). Used to stop captcha replay.
 */
export const consumeRedisKey = async (key: string): Promise<boolean> => {
  try {
    if (isEmpty(key)) return false;
    return await getRedisCache().consume(key);
  } catch (error) {
    console.log('consumeRedisKey error', error);
    return false;
  }
};
