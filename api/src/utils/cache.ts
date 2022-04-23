import redis from "redis"
const cache = redis.createClient({url: process.env.REDIS_URL});

export default cache