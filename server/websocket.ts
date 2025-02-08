import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { User } from "@shared/schema";

type NotificationMessage = {
  type: "transaction" | "wallet_update";
  message: string;
  timestamp: string;
  recipientId: number;
};

class WebSocketManager {
  private wss: WebSocketServer;
  private userSockets: Map<number, WebSocket>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.userSockets = new Map();

    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === "auth" && data.userId) {
            this.userSockets.set(data.userId, ws);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        // Remove socket when disconnected
        for (const [userId, socket] of this.userSockets.entries()) {
          if (socket === ws) {
            this.userSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  sendNotification(notification: NotificationMessage) {
    const socket = this.userSockets.get(notification.recipientId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(notification));
    }
  }
}

let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(server: Server) {
  wsManager = new WebSocketManager(server);
}

export function sendNotification(notification: NotificationMessage) {
  wsManager?.sendNotification(notification);
}
