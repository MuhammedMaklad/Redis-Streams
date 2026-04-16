import Redis from 'ioredis';
import pino from 'pino';

const logger = pino();

const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS || 'localhost:26379';
const masterName = process.env.REDIS_MASTER_NAME || 'mymaster';

const sentinels = sentinelHosts.split(',').map(host => {
    const [ip, port] = host.split(':');
    return { host: ip, port: parseInt(port, 10) };
});

export const redis = new Redis({
    sentinels: sentinels,
    name: masterName,
    role: 'master',
});

redis.on('connect', () => {
    logger.info('Connected to Redis via Sentinel');
});

redis.on('error', (err) => {
    logger.error('Redis connection error:', err);
});
