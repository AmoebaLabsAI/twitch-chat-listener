# Twitch Chat Logger

A Node.js application that listens to Twitch chat messages, temporarily stores them in Redis, and periodically dumps them to a PostgreSQL database.

## Features

- Real-time Twitch chat message capture
- Temporary storage in Redis for efficient handling
- Periodic dumping of messages to PostgreSQL for long-term storage
- Configurable settings via environment variables

## Prerequisites

- Node.js (version 14 or higher)
- Redis server
- PostgreSQL database
- Twitch channel name

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/twitch-chat-logger.git
   cd twitch-chat-logger
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```
   TWITCH_CHANNEL=your_twitch_channel
   POSTGRES_CONNECTION_STRING=your_postgres_connection_string
   REDIS_URL=your_redis_url
   ```

4. Set up the PostgreSQL database:
   Create a table named `twitch_chat_messages` with the following schema:
   ```sql
   CREATE TABLE twitch_chat_messages (
     id SERIAL PRIMARY KEY,
     channel VARCHAR(255) NOT NULL,
     username VARCHAR(255) NOT NULL,
     message TEXT NOT NULL,
     timestamp TIMESTAMP NOT NULL
   );
   ```

## Usage

Start the application:
