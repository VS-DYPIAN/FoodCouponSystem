import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

type Notification = {
  type: "transaction" | "wallet_update";
  message: string;
  timestamp: string;
};

type NotificationsContextType = {
  notifications: Notification[];
  clearNotifications: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", userId: user.id }));
    };

    socket.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        setNotifications((prev) => [...prev, notification]);
        
        // Show toast notification
        toast({
          title: notification.type === "transaction" ? "New Transaction" : "Wallet Update",
          description: notification.message,
        });
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, clearNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
