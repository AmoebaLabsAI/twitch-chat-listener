require("dotenv").config();
const tmi = require("tmi.js");
const Redis = require("redis");
const { Pool } = require("pg");
const cron = require("node-cron");

// Initialize Redis client
const redisClient = Redis.createClient({
  // Your Redis configuration options
});

// Connect to Redis
async function main() {
  await redisClient.connect();
}

main().catch(console.error());

// Initialize PostgreSQL pool
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

// Initialize Twitch client
const twitchClient = new tmi.Client({
  channels: [process.env.TWITCH_CHANNEL],
});

// Connect to Twitch
twitchClient.connect();

// Listen for chat messages
twitchClient.on("message", async (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot itself

  const chatMessage = {
    channel,
    username: tags.username,
    message,
    timestamp: new Date().toISOString(),
  };

  // Only save the message to Redis if it is exactly "1" or "2"
  if (message === "1" || message === "2") {
    // Save message to Redis
    await redisClient.lPush("chat_messages", JSON.stringify(chatMessage));
    console.log(`Saved message "${message}" from ${tags.username} to Redis`);
  } else {
    console.log(`Ignored message "${message}" from ${tags.username}`);
  }

  // Save message to Redis
  await redisClient.lPush("chat_messages", JSON.stringify(chatMessage));
});

// Function to dump Redis data to PostgreSQL
async function dumpRedisToPostgres() {
  try {
    // Check if the Redis client is connected
    if (!redisClient.isOpen) {
      console.error(
        "Redis client is not connected. Attempting to reconnect..."
      );
      await redisClient.connect();
    }

    const messages = await redisClient.lRange("chat_messages", 0, -1);

    if (messages.length === 0) {
      console.log("No messages to dump.");
      return;
    }

    const client = await pgPool.connect();

    try {
      await client.query("BEGIN");

      for (const messageJson of messages) {
        const message = JSON.parse(messageJson);
        await client.query(
          "INSERT INTO twitch_chat_messages (channel, username, message, timestamp) VALUES ($1, $2, $3, $4)",
          [
            message.channel,
            message.username,
            message.message,
            message.timestamp,
          ]
        );
      }

      await client.query("COMMIT");
      console.log(`Dumped ${messages.length} messages to PostgreSQL.`);

      // Clear Redis after successful dump
      await redisClient.del("chat_messages");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error dumping data to PostgreSQL:", error);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in dumpRedisToPostgres:", error);
  }
}

// Schedule periodic dump (every 5 seconds in this example)
setInterval(dumpRedisToPostgres, 5000);

console.log("Twitch chat logger started.");

// Ensure proper cleanup when the server is shutting down
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await redisClient.quit();
  // Close other connections if necessary
  process.exit(0);
});
