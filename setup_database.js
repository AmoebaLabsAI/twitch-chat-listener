require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        channel VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL
      )
    `);
    console.log("Database setup completed successfully.");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
