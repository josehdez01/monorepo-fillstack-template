import { Redis as IORedisClient } from 'ioredis';
import { getEnv } from '../config/env.ts';

let redisInstance: IORedisClient | undefined;

export function makeRedis(): IORedisClient {
    if (redisInstance) {
        return redisInstance;
    }
    const env = getEnv();
    redisInstance = new IORedisClient(env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });
    return redisInstance;
}
