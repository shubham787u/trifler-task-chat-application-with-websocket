import { useCallback, useEffect, useState } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  publishMessage,
  subscribeToConversation,
} from "../services/websocketService";
import { isBackendEnabled } from "../services/api";

export default function useWebSocket() {
  const [status, setStatus] = useState(isBackendEnabled ? "offline" : "local");

  const connect = useCallback(() => connectWebSocket({ onStatus: setStatus }), []);

  const disconnect = useCallback(() => {
    disconnectWebSocket().catch((error) => {
      console.error("[Trifler WebSocket] Could not disconnect cleanly.", error);
    });
    setStatus(isBackendEnabled ? "offline" : "local");
  }, []);

  const sendMessage = useCallback((conversationId, message) => {
    if (!conversationId || !message) return false;
    return publishMessage(conversationId, message);
  }, []);

  const subscribe = useCallback((conversationId, onMessage) => (
    subscribeToConversation(conversationId, onMessage)
  ), []);

  useEffect(() => {
    if (isBackendEnabled) connect();
    return () => {
      disconnectWebSocket().catch((error) => {
        console.error("[Trifler WebSocket] Could not disconnect during cleanup.", error);
      });
    };
  }, [connect]);

  return {
    status,
    isConnected: status === "connected",
    connect,
    disconnect,
    publishMessage: sendMessage,
    subscribe,
  };
}