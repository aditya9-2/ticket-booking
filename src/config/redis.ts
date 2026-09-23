import pkg from "ioredis"

const Redis = (pkg as any).default ?? pkg

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

redis.on("error", (err: Error) => console.error("Redis connection error:", err))