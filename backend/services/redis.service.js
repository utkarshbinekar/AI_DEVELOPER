import Redis from "ioredis";

const redisClient = new Redis({
  host: 'localhost', // Redis server host
  port: 6379,        // Redis server port
  connectTimeout: 10000, // Increase the connection timeout to 10 seconds
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redisClient;