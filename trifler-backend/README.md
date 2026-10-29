# Trifler Chat Backend

Express and MongoDB backend for the Trifler chat application. It provides a JSON REST API for accounts, users, conversations, and groups, plus an authenticated WebSocket endpoint for live messages and typing events.

## Project layout

```text
trifler-backend/
├── .env.example
├── .gitignore
├── package-lock.json
├── README.md
├── server.js
├── package.json
└── src/
    ├── app.js
    ├── config/
    │   ├── db.js
    │   └── env.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── conversation.controller.js
    │   ├── group.controller.js
    │   ├── message.controller.js
    │   └── user.controller.js
    ├── middleware/
    │   ├── auth.js
    │   ├── errorHandler.js
    │   ├── notFound.js
    │   ├── rateLimiter.js
    │   └── validate.js
    ├── models/
    │   ├── Conversation.js
    │   ├── Message.js
    │   └── User.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── conversation.routes.js
    │   ├── group.routes.js
    │   ├── index.js
    │   └── user.routes.js
    ├── services/
    │   ├── conversation.service.js
    │   ├── group.service.js
    │   ├── message.service.js
    │   ├── realtime.service.js
    │   ├── token.service.js
    │   └── user.service.js
    ├── utils/
    │   ├── ApiError.js
    │   ├── asyncHandler.js
    │   └── logger.js
    ├── validators/
    │   ├── auth.schema.js
    │   ├── common.schema.js
    │   ├── conversation.schema.js
    │   ├── group.schema.js
    │   ├── message.schema.js
    │   └── user.schema.js
    └── websocket/
        ├── connectionStore.js
        ├── index.js
        ├── router.js
        └── handlers/
            ├── message.handler.js
            ├── presence.handler.js
            ├── subscribe.handler.js
            └── typing.handler.js
```

- `server.js` connects to MongoDB, starts the HTTP server, attaches WebSockets at `/ws`, and handles graceful shutdown.
- `src/app.js` configures Express, CORS, JSON parsing, the health check, API rate limiting, and error handling.
- `config/` loads environment settings and connects Mongoose to MongoDB.
- `routes/` declares REST paths; `controllers/` handles HTTP requests; `services/` contains shared business logic.
- `middleware/` handles authentication, validation, rate limits, 404s, and API errors.
- `models/` defines MongoDB users, conversations (direct chats and groups), and messages.
- `validators/` contains Zod request/event schemas; `utils/` contains common error, async, and logging helpers.
- `websocket/` authenticates and routes live events and tracks connected clients. The handlers for `presence` and `subscribe` exist as files but are not registered by the current `websocket/router.js`.
- The package scripts are `npm run dev` (nodemon) and `npm start` (Node).

## Requirements and local setup

Requirements: Node.js, npm, and a reachable MongoDB instance.

From PowerShell:

```powershell
cd trifler-backend
npm install
Copy-Item .env.example .env
```

Edit `trifler-backend/.env` and set at least:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/trifler-all-db
JWT_SECRET=replace-with-a-long-random-secret
```

Optional settings and their defaults:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | HTTP and WebSocket listen port |
| `NODE_ENV` | `development` | Enables production behavior when set to `production` |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated allowed browser origins for CORS |

Start the backend:

```powershell
npm run dev
```

Check it is running at `http://localhost:8080/api/health`. MongoDB and the required environment variables must be available before the server starts.

## API conventions

- REST base URL: `http://localhost:8080/api` (replace `8080` if `PORT` is changed).
- Requests and responses use JSON. Protected endpoints require `Authorization: Bearer <JWT>`.
- Register and login return `{ "success": true, "token": "...", "user": { ... } }`. The frontend stores the token and sends it on later API requests.
- Successful endpoints return a `success: true` object; validation and other API errors use `{ "success": false, "message": "...", "errors": [...] }` where applicable.
- User and conversation IDs are MongoDB ObjectIds. Message history is ordered oldest to newest; use `before` to fetch an older page.

### REST endpoints

| Method and path | Auth | Purpose and request | Response data |
|---|---|---|---|
| `GET /api/health` | No | Health check | `status`, `uptime`, `timestamp` |
| `POST /api/auth/register` | No | `{ "name", "email", "password" }` | `token`, `user` (201) |
| `POST /api/auth/login` | No | `{ "email", "password" }` | `token`, `user` |
| `GET /api/users/me` | Yes | Get the signed-in user | `user` |
| `PATCH /api/users/me` | Yes | Update one or more of `name`, `email`, `avatar` | `user` |
| `DELETE /api/users/me` | Yes | Delete the account and related direct chats; remove the user from groups | `message` |
| `GET /api/users?search=<text>&limit=10` | Yes | Search users by partial name or exact email (search is at least 2 characters; limit is 1–20) | `users` (email is not returned) |
| `GET /api/conversations` | Yes | List the signed-in user's conversations | `conversations` |
| `POST /api/conversations/direct` | Yes | `{ "userId": "<other user id>" }`; finds or creates a direct chat | `conversation` (201 if created, otherwise 200) |
| `GET /api/conversations/:id/messages?limit=30&before=<ISO date>` | Yes | Fetch a page of messages; `limit` is 1–100 | `messages`, `hasMore` |
| `GET /api/groups` | Yes | List the signed-in user's groups | `groups` |
| `POST /api/groups` | Yes | `{ "name", "description": "", "memberIds": ["..."] }`; creator is automatically an admin | `group` (201) |
| `GET /api/groups/:groupId` | Yes | Get a group the user belongs to | `group` |
| `POST /api/groups/:groupId/members` | Yes | `{ "userId": "..." }`; admin only | `group` (201) |
| `DELETE /api/groups/:groupId/members/:userId` | Yes | Admin removes a member, or a member leaves by using their own ID | `groupDeleted` |

Group size is limited to 50 members. A group can be deleted when its last member leaves. A user's last remaining group admin role is transferred when that admin leaves.

## Real-time WebSocket

Connect to `ws://localhost:8080/ws` (use `wss://` in production). The browser client authenticates during the WebSocket handshake using these subprotocols:

```text
trifler-chat
trifler-auth.<JWT>
```

The JWT must not be put in the WebSocket URL. The current backend accepts these client events:

```json
{ "type": "ping" }
{ "type": "message.send", "conversationId": "<id>", "text": "Hello", "clientId": "optional-client-message-id" }
{ "type": "typing", "conversationId": "<id>", "isTyping": true }
```

Messages are saved before being broadcast to all online conversation members, including the sender's other tabs. Typing events are sent to the other members only. The server may send `connected`, `pong`, `message.new`, `conversation.created`, `typing`, or `error` events. REST conversation creation and group changes can emit `conversation.created` so connected clients can refresh their conversation list.

The socket enforces membership checks and limits each connection to 30 incoming events per 10 seconds. A `message.send` event must have non-empty text of at most 2,000 characters.

## Connect the frontend

The React/Vite app is in `../trifler-frontend`. Keep API calls in its service layer rather than making Axios calls directly from components:

| Frontend file | Backend endpoints/events handled | Current callers |
|---|---|---|
| `src/services/api.js` | Shared Axios base URL, JSON headers, and Bearer token attachment | All REST services |
| `src/services/authService.js` | `POST /auth/register`, `POST /auth/login` | `src/pages/Register.jsx`, `src/pages/Login.jsx` |
| `src/services/userService.js` | `GET/PATCH/DELETE /users/me`, `GET /users?search=...` | `src/context/AuthContext.jsx`; user search in chat/group dialogs |
| `src/services/chatService.js` | `GET /conversations`, `POST /conversations/direct`, `GET /conversations/:id/messages` | `src/context/ChatContext.jsx` |
| `src/services/groupService.js` | `POST /groups`, `POST /groups/:groupId/members` | `src/context/ChatContext.jsx` |
| `src/services/websocketService.js` | `/ws`; `message.send`, `typing`, and server events | `src/hooks/useWebSocket.js`, then chat pages/components |

`src/context/AuthContext.jsx` owns authentication and current-user profile actions. `src/context/ChatContext.jsx` loads chats and coordinates conversation/group actions. UI components should call these contexts/hooks; the contexts should call the service functions.

The current frontend does not yet have service wrappers for `GET /groups`, `GET /groups/:groupId`, or `DELETE /groups/:groupId/members/:userId`. Add those methods to `src/services/groupService.js`, then expose/use them through `src/context/ChatContext.jsx` and the relevant group UI. This keeps all endpoint URLs and request handling in one place.

### Frontend environment and port alignment

The backend defaults to port `8080`, while the frontend service defaults currently point to port `9000`. Create `trifler-frontend/.env.local` and set the URLs to the actual backend port:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

Set `CLIENT_URL=http://localhost:5173` in the backend `.env` for the Vite development origin (add other deployed frontend origins as comma-separated values). Restart Vite after changing its environment variables. `VITE_ENABLE_BACKEND=false` disables backend requests; otherwise backend mode is enabled.

Run the frontend separately:

```powershell
cd trifler-frontend
npm install
npm run dev
```

## Validation and security notes

- Inputs are validated with Zod before reaching route handlers. Passwords are hashed before storage; password fields are excluded from API user JSON.
- Use a unique, private `JWT_SECRET` outside local development and keep `.env` files out of version control.
- CORS allows the configured `CLIENT_URL` origin(s); command-line clients without an `Origin` header are also allowed.
- The backend package currently defines development and start scripts, but no dedicated test or lint script.