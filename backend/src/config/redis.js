import { createClient } from "redis";

const redisClient = createClient({
   url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
   console.error("Redis Client Error", err);
});

(async () => {
   try {
      await redisClient.connect();
      console.log("Redis Connected successfully");
   } catch (err) {
      console.error("Could not connect to Redis", err);
   }
})();

export default redisClient;