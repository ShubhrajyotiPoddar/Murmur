import { createClient } from "redis";
import * as dotenv from "dotenv";
dotenv.config();

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT || "6379";
const redisUrl = `redis://${redisHost}:${redisPort}`;

const client = createClient({ url: redisUrl });
const subClient = createClient({ url: redisUrl });

client.on("error", (err) => console.error("Redis Client Error", err));
subClient.on("error", (err) => console.error("Redis Sub Client Error", err));

export { client as default, subClient };
