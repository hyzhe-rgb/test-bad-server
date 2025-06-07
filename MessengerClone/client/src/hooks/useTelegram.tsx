import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  phone: string;
  firstName: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  isOnline: boolean;
  showPhone: boolean;
  isPremium: boolean;
}

interface TelegramContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

interface TelegramProviderProps {
  children: ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    const sessionId = localStorage.getItem("telegram_session");
    if (sessionId) {
      // Fetch user data
      fetchUser(sessionId);
      // Connect to WebSocket immediately
      connectWebSocket(sessionId);
    }

    // Prevent session loss on page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Keep session in localStorage
      const currentSession = localStorage.getItem("telegram_session");
      if (currentSession) {
        console.log("Preserving session on page unload");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const fetchUser = async (sessionId: string) => {
    try {
      console.log("Fetching user data with session:", sessionId);
      const response = await fetch("/api/users/me", {
        headers: {
          "Authorization": `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched successfully:", userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.error("Session invalid, clearing storage");
        localStorage.removeItem("telegram_session");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("telegram_session");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const login = async (phone: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error("Failed to send code");
    }
  };

  const verifyCode = async (phone: string, code: string) => {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
      throw new Error("Invalid code");
    }

    const data = await response.json();
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem("telegram_session", data.sessionId);
    localStorage.setItem("current_user_id", data.user.id.toString());

    // Connect to WebSocket
    connectWebSocket(data.sessionId);
  };

  const logout = async () => {
    const sessionId = localStorage.getItem("telegram_session");
    if (sessionId) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionId}`,
        },
      });
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("telegram_session");
  };

  const updateUser = async (updates: Partial<User>) => {
    const sessionId = localStorage.getItem("telegram_session");
    if (!sessionId) return;

    const response = await fetch("/api/users/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionId}`,
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const updatedUser = await response.json();
      setUser(updatedUser);
    }
  };

  const connectWebSocket = (sessionId: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?sessionId=${sessionId}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "new_message":
            // Handle new message notification
            toast({
              title: `${data.message.sender.firstName}`,
              description: data.message.content,
            });
            break;
          case "incoming_call":
            // Handle incoming call
            toast({
              title: "Входящий звонок",
              description: "У вас входящий звонок",
            });
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      // Попытка переподключения через 3 секунды
      setTimeout(() => {
        const currentSessionId = localStorage.getItem("telegram_session");
        if (currentSessionId && isAuthenticated) {
          connectWebSocket(currentSessionId);
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        verifyCode,
        logout,
        updateUser,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}

// Create a wrapper component
export default function TelegramWrapper({ children }: { children: ReactNode }) {
  return <TelegramProvider>{children}</TelegramProvider>;
}