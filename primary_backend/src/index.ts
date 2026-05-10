import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import usersRouter from "./routes/users";
import requestsRouter from "./routes/requests";
import messagesRouter from "./routes/messages";
import db from "./config/db";
import redisClient from "./config/redis";
import { socketService } from "./services/socket_service";
import { initCleanupJob } from "./services/cleanup_service";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/users", usersRouter);
app.use("/requests", requestsRouter);
app.use("/messages", messagesRouter);

const PORT = process.env.PORT || 3000;

// Basic test route to verify DB connection
app.get("/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Standalone Express with Conditional WebSocket Server
const startServer = async () => {
  let redisConnected = false;

  try {
    // Attempt to connect to Redis
    await redisClient
      .connect()
      .then(() => {
        redisConnected = true;
        console.log("Redis connected successfully.");
      })
      .catch((err) => {
        console.warn(
          "Redis connection failed. WebSocket server will be disabled:",
          err.message,
        );
      });

    // Only start WebSocket service if Redis is available
    if (redisConnected) {
      socketService.init(server);
    } else {
      console.log("Running in standalone Express mode (No WebSockets).");
    }

    // Initialize automated file cleanup job
    initCleanupJob();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Critical error during server startup:", err);
    // Fallback to starting just the HTTP server if everything else fails
    server.listen(PORT, () => {
      console.log(`Server fallback running on port ${PORT}`);
    });
  }
};

startServer();
