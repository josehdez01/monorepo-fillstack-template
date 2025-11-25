import { Redis as IORedisClient } from 'ioredis';
import { getEnv } from '../config/env.ts';

export function makeRedis(): IORedisClient {
    const env = getEnv();
    return new IORedisClient(env.REDIS_URL);
}
