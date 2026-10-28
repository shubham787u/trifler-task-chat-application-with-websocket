//! All websocket logic writen here in this file,
//! # creates the WebSocketServer on path /ws, authenticates the connection
import { WebSocketServer } from "ws";
import { getUserFromToken } from "../services/token.service.js";
import logger from "../utils/logger.js";
import { routeEvent } from "./router.js";
import { addConnection, removeConnection } from "./connectionStore.js";

const HEARTBEAT_INTERVAL_MS = 30000;

//! Attaches a WebSocket server to the existing HTTP server (same port as the API).
//! Clients authenticate with a JWT in the WebSocket handshake subprotocol.
//
//! The JWT is checked BEFORE the connection is upgraded, so unauthenticated
//! clients never get a socket at all.
export const initWebSocket = (server) => {
  const wss = new WebSocketServer({
    noServer: true,
    handleProtocols: (protocols) =>
      protocols.has("trifler-chat") ? "trifler-chat" : false,
  });

  // --- 1. Authenticate during the HTTP -> WebSocket upgrade ---
  server.on("upgrade", async (req, socket, head) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname !== "/ws") {
        socket.destroy(); // not our endpoint
        return;
      }

      // Browsers cannot set Authorization headers on WebSockets. The token is
      //! sent as a handshake subprotocol so it does not appear in the URL.
      const requestedProtocols = (
        req.headers["sec-websocket-protocol"] || ""
      )
        .split(",")
        .map((protocol) => protocol.trim());
      const authProtocol = requestedProtocols.find((protocol) =>
        protocol.startsWith("trifler-auth."),
      );
      const token = authProtocol?.slice("trifler-auth.".length);
      const user = await getUserFromToken(token);

      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.user = user;
        wss.emit("connection", ws, req);
      });
    } catch (err) {
      logger.debug("WebSocket rejected:", err.message);
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
    }
  });

  // --- 2. Each authenticated connection ---
  wss.on("connection", (ws) => {
    addConnection(ws.user._id, ws);
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    logger.info(`WebSocket connected: ${ws.user.name} (${ws.user.id})`);

    ws.send(
      JSON.stringify({
        type: "connected",
        user: { id: ws.user.id, name: ws.user.name },
      }),
    );

    ws.on("message", (raw) => {
      routeEvent(ws, raw).catch((err) => {
        logger.error("WebSocket route failed:", err);
      });
    });

    ws.on("close", () => {
      removeConnection(ws.user._id, ws);
      logger.info(`WebSocket disconnected: ${ws.user.name} (${ws.user.id})`);
    });

    ws.on("error", (err) => logger.error("WebSocket error:", err.message));
  });

  // --- 3. Heartbeat: drop connections that silently died (closed laptop, lost wifi) ---
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => clearInterval(heartbeat));

  return wss;
};
