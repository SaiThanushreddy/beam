import { useState, useEffect, useRef, useCallback } from "react";
import { MessageBus } from "../services/messageBus";
import { WebSocketBus, createWebSocketBus } from "../services/websocketBus";
import type { Message } from "../types/messages";
import { MessageType } from "../types/messages";

interface UseMessageBusConfig {
  wsUrl: string;
  token: string;
  sessionId?: string;
  handlers?: {
    [K in MessageType]?: (message: Message) => void;
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

interface UseMessageBusReturn {
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (type: MessageType, payload: Record<string, any>) => void;
}

export const useMessageBus = ({
  wsUrl,
  token,
  sessionId,
  handlers = {},
  onConnect,
  onDisconnect,
  onError,
}: UseMessageBusConfig): UseMessageBusReturn => {

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageBusRef = useRef<MessageBus | null>(null);
  const webSocketRef = useRef<WebSocketBus | null>(null);
  const handlersRef = useRef(handlers);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isConnectedRef = useRef(false);
  const connectPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    console.log("🔄 useMessageBus: Handlers updated");
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (messageBusRef.current) {
      console.log("⚠️ useMessageBus: MessageBus already initialized, skipping");
      return;
    }

    console.log("🚀 useMessageBus: Initializing MessageBus");
    messageBusRef.current = new MessageBus({
      onMessage: (message) => {
        if (!isMountedRef.current) {
          console.log("⚠️ useMessageBus: Component unmounted, ignoring message");
          return;
        }

        if (message.type === MessageType.PING) {
          return;
        }

        console.log("📨 useMessageBus: MessageBus received message:", message.type, message);

        const handler = handlersRef.current[message.type];
        if (handler) {
          console.log("✅ useMessageBus: Calling handler for:", message.type);
          try {
            handler(message);
          } catch (error) {
            console.error(`❌ useMessageBus: Error in handler for ${message.type}:`, error);
            onError?.(`Handler error for ${message.type}: ${error}`);
          }
        } else {
          console.log(`⚠️ useMessageBus: No handler registered for message type: ${message.type}`);
        }
      },

      onError: (errorMsg) => {
        if (!isMountedRef.current) return;

        console.error("❌ useMessageBus: MessageBus error:", errorMsg);
        setError(errorMsg);
        onError?.(errorMsg);
      },
      onConnect: () => {
        if (!isMountedRef.current) return;

        console.log("✅ useMessageBus: MessageBus connected");
        setIsConnected(true);
        isConnectedRef.current = true; // ADD THIS
        setIsConnecting(false);
        isConnectingRef.current = false;
        setError(null);
        onConnect?.();
      },
      onDisconnect: () => {
        if (!isMountedRef.current) return;

        console.log("❌ useMessageBus: MessageBus disconnected");
        setIsConnected(false);
        isConnectedRef.current = false;
        setIsConnecting(false);
        isConnectingRef.current = false;
        onDisconnect?.();
      },
    });

    return () => {
      console.log("🧹 useMessageBus: Cleaning up MessageBus");
      messageBusRef.current?.clear();
      messageBusRef.current = null;
    };
  }, []);

  const connect = useCallback(async () => {

    if (connectPromiseRef.current) {
      return connectPromiseRef.current;
    }

    if (!messageBusRef.current) {
      throw new Error("MessageBus not initialized");
    }

    if (isConnectingRef.current || isConnectedRef.current) {
      console.log("⚠️ useMessageBus: Already connected or connecting, skipping...");
      return;
    }

    // Disconnect existing connection first
    if (webSocketRef.current) {
      console.log("🔄 useMessageBus: Disconnecting existing connection before reconnecting...");
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    const connectionPromise = (async () => {
      try {
        console.log("🌐 useMessageBus: Creating new WebSocket connection", {
          wsUrl,
          sessionId,
          hasToken: !!token
        });

        webSocketRef.current = createWebSocketBus(
          wsUrl,
          token,
          messageBusRef.current!,
          sessionId
        );

        console.log("⏳ useMessageBus: Awaiting WebSocket connection...");
        await webSocketRef.current.connect();
        console.log("✅ useMessageBus: WebSocket connection established");

        // Check if component is still mounted after async operation
        if (!isMountedRef.current) {
          console.log("⚠️ useMessageBus: Component unmounted during connection, cleaning up...");
          webSocketRef.current?.disconnect();
          webSocketRef.current = null;
          return;
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        console.error("❌ useMessageBus: Failed to connect:", err);
        setIsConnecting(false);
        setIsConnected(false);
        isConnectingRef.current = false;
        setError(err instanceof Error ? err.message : "Failed to connect");
      } finally {
        connectPromiseRef.current = null;
      }
    })();

    connectPromiseRef.current = connectionPromise;
    return connectionPromise;
  }, [wsUrl, token, sessionId, isConnected]);

  const disconnect = useCallback(() => {
    console.log("🔌 useMessageBus: disconnect() called - manually disconnecting WebSocket");
    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
    }
    isConnectingRef.current = false;
    connectPromiseRef.current = null;
    setIsConnecting(false);
    setIsConnected(false);
  }, []);

  const send = useCallback(
    (type: MessageType, payload: Record<string, any> = {}) => {
      console.log("📤 useMessageBus: send() called", { type, payload, isConnected });

      if (isConnected && webSocketRef.current) {
        try {
          const message = {
            type,
            data: {
              ...payload,
              ...(sessionId && { session_id: sessionId }),
            },
            timestamp: Date.now(),
          };
          console.log("📨 useMessageBus: Sending message via WebSocket:", message);
          webSocketRef.current.sendMessage(message);
        } catch (err) {
          console.error("❌ useMessageBus: Failed to send message:", err);
          setError("Failed to send message. Please check your connection.");
        }
      } else {
        console.warn("⚠️ useMessageBus: Cannot send message - Not connected to Workspace");
        setError("Not connected to Workspace.");
      }
    },
    [isConnected, sessionId]
  );

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    console.log("✅ useMessageBus: Component mounted");

    return () => {
      console.log("🧹 useMessageBus: Component unmounting, cleaning up connections...");
      isMountedRef.current = false;

      // Clean up WebSocket connection
      if (webSocketRef.current) {
        webSocketRef.current.disconnect();
        webSocketRef.current = null;
      }
      isConnectingRef.current = false;
      connectPromiseRef.current = null;
    };
  }, []);

  // Log state changes
  useEffect(() => {
    console.log("📊 useMessageBus: State changed", {
      isConnecting,
      isConnected,
      hasError: !!error,
      error
    });
  }, [isConnecting, isConnected, error]);

  return {
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    send,
  };
};