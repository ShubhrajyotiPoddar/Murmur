import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";

const ONLINE_USERS_KEY = process.env.REDIS_ONLINE_USERS_KEY || "online_users";
const EVENT_CHANNEL = process.env.REDIS_EVENT_CHANNEL || "group_events";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  uid?: string;
  isAlive?: boolean;
}

class SocketService {
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, AuthenticatedWebSocket> = new Map();

  constructor() {}

  public init(server: HttpServer) {
    try {
      this.wss = new WebSocketServer({ server });
      console.log("WebSocket Server initialized.");

      this.wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
        // Simple heartbeat
        ws.isAlive = true;
        ws.on("pong", () => (ws.isAlive = true));

        // Get token from query params or headers
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
          console.log("WS Connection rejected: No token provided.");
          ws.close(1008, "No token");
          return;
        }

        try {
          const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as any;
          ws.userId = decoded.id;
          ws.uid = decoded.uid;

          this.userSockets.set(ws.uid!, ws);
          console.log(`User ${ws.uid} connected to WebSocket.`);

          // Mark user online in Redis (Optional)
          this.markOnline(ws.uid!);

          ws.on("close", () => {
            this.handleDisconnect(ws.uid!);
          });

          ws.on("error", (err) => {
            console.error(`WS Error for user ${ws.uid}:`, err);
            this.handleDisconnect(ws.uid!);
          });

        } catch (err) {
          console.error("WS Token verification failed:", err);
          ws.close(1008, "Invalid token");
        }
      });

      // Heartbeat interval
      setInterval(() => {
        this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
          if (ws.isAlive === false) return ws.terminate();
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000);

    } catch (err) {
      console.error("Failed to initialize WebSocket Server:", err);
    }
  }

  private async markOnline(uid: string) {
    try {
      if (redisClient.isOpen) {
        await redisClient.sAdd(ONLINE_USERS_KEY, uid);
      }
    } catch (err) {
      // Optional: Ignore redis errors if it's optional
      console.warn("Redis MarkOnline failed (optional):", err);
    }
  }

  private async handleDisconnect(uid: string) {
    this.userSockets.delete(uid);
    console.log(`User ${uid} disconnected from WebSocket.`);
    try {
      if (redisClient.isOpen) {
        await redisClient.sRem(ONLINE_USERS_KEY, uid);
      }
    } catch (err) {
      console.warn("Redis HandleDisconnect failed (optional):", err);
    }
  }

  /**
   * Notifies a specific user if they are online.
   */
  public notifyUser(uid: string, event: string, payload: any) {
    const ws = this.userSockets.get(uid);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, payload }));
    }
  }

  /**
   * Checks if a specific UID is currently online via Redis (global) or Local.
   */
  public async isUserOnline(uid: string): Promise<boolean> {
    if (this.userSockets.has(uid)) return true;
    try {
      if (redisClient.isOpen) {
        return await redisClient.sIsMember(ONLINE_USERS_KEY, uid);
      }
    } catch (err) {
      console.warn("Redis isUserOnline check failed (optional):", err);
    }
    return false;
  }
}

export const socketService = new SocketService();
