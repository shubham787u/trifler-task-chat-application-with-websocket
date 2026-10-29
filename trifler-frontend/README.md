# Trifler Chat Frontend

Trifler is a React chat application with a Vite frontend and an Express/MongoDB backend in the sibling `trifler-backend/` folder. The frontend connects to backend authentication, profile, conversation, group, and real-time messaging features. Chat state can also use browser storage when backend chat loading is disabled; authentication itself still calls the backend.

This guide describes the frontend files and workflow, and the exact REST and WebSocket contract used to connect it to the backend.

## Contents

- [Project structure](#project-structure)
- [Requirements and installation](#requirements-and-installation)
- [Environment configuration](#environment-configuration)
- [Run the frontend and backend](#run-the-frontend-and-backend)
- [Frontend routes and application flow](#frontend-routes-and-application-flow)
- [Frontend-to-backend connection](#frontend-to-backend-connection)
- [REST API reference](#rest-api-reference)
- [WebSocket reference](#websocket-reference)
- [Current integration coverage](#current-integration-coverage)
- [Local mode and browser storage](#local-mode-and-browser-storage)
- [Commands and validation](#commands-and-validation)

## Project structure

```text
trifler-frontend/
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── chat/
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── MessageItem.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── StartDirectChatModal.jsx
│   │   │   └── TypeIndicator.jsx
│   │   ├── common/
│   │   │   ├── Avatar.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   └── groups/
│   │       ├── AddMemberModel.jsx
│   │       ├── CreateGroupModel.jsx
│   │       ├── GroupInfoPanel.jsx
│   │       ├── GroupItem.jsx
│   │       ├── GroupList.jsx
│   │       └── GroupMembers.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ChatContext.jsx
│   │   ├── authContextValue.js
│   │   └── chatContextValue.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useChat.js
│   │   └── useWebSocket.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Groups.jsx
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   ├── PrivateChat.jsx
│   │   ├── Profile.jsx
│   │   └── Register.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── chatService.js
│   │   ├── groupService.js
│   │   ├── userService.js
│   │   └── websocketService.js
│   ├── styles/
│   │   ├── auth.css
│   │   ├── chat.css
│   │   ├── dashboard.css
│   │   ├── not-found.css
│   │   └── profile.css
│   └── utils/
│       ├── constants.js
│       ├── formatData.js
│       └── validators.js
└── vite.config.js
```

### What the files and folders do

- Root configuration: `.env.example` documents Vite variables; `package.json` and `package-lock.json` define scripts/dependencies; `eslint.config.js` configures ESLint; `vite.config.js` configures React and Tailwind's Vite plugin; `index.html` is the browser entry document; `.gitignore` excludes generated/local files.
- `public/` contains static icons copied as-is into the build. `src/assets/` contains imported images and starter assets.
- `src/main.jsx` mounts the React app and global stylesheet; `src/App.jsx` renders the route/provider tree.
- `components/auth/` contains login/register form UI. `components/chat/` contains message UI, chat controls, and the direct-chat modal. `components/common/` contains shared navigation, avatar/loading UI, and route protection. `components/groups/` contains group creation, membership, list, and details UI.
- `context/` owns shared authentication and conversation state. `AuthContext.jsx` restores the saved token/user and calls profile/account services. `ChatContext.jsx` loads backend conversations/messages, maps API data into UI data, and coordinates group/direct-chat actions.
- `hooks/` exposes the auth and chat contexts and wraps the WebSocket lifecycle and message publishing.
- `pages/` contains route-level screens. `routes/AppRoutes.jsx` declares routes and wraps them in the providers.
- `services/` is the only layer that should define backend request paths. `api.js` configures Axios and the auth header; the other files group REST and WebSocket calls by feature.
- `styles/` contains feature stylesheets. `index.css` loads global styles and Tailwind. `utils/` contains shared constants, data formatting, and client-side validation.

## Requirements and installation

- Node.js `20.19+` or `22.12+` (or Node.js `22.12+`).
- npm.
- A modern browser.
- For backend mode: the sibling Express backend and a running MongoDB instance.

From PowerShell:

```powershell
cd .\trifler-frontend
npm ci
Copy-Item .env.example .env.local
```

`npm ci` installs the exact versions from the lockfile. Use `npm install` when intentionally changing dependencies.

## Environment configuration

The checked-in `.env.example` currently enables backend mode and points to port `9000`. The backend's default port is `8080`. These must match.

Recommended local setup: use the backend default port `8080` and create/update `trifler-frontend/.env.local`:

```dotenv
VITE_ENABLE_BACKEND=true
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

Alternatively, keep the frontend URLs at port `9000` and set `PORT=9000` in `trifler-backend/.env`.

| Variable | Default in frontend code | Purpose |
|---|---|---|
| `VITE_ENABLE_BACKEND` | Enabled unless set to exactly `false` | Controls backend conversation loading and WebSocket use. Setting it to `false` does not disable login, registration, or profile REST calls. |
| `VITE_API_BASE_URL` | `http://localhost:9000/api` | Axios REST base URL; must match the backend host, port, and `/api` prefix. |
| `VITE_WS_URL` | `ws://localhost:9000/ws` | Native WebSocket URL; must match the backend host, port, and `/ws` path. |

These are public browser-side values, not secrets. Never put passwords, JWT secrets, or private API keys in `VITE_*` variables. Restart Vite after changing `.env.local`.

## Run the frontend and backend

### 1. Start MongoDB and configure the backend

In a separate PowerShell terminal:

```powershell
cd .\trifler-backend
npm ci
Copy-Item .env.example .env
```

Set `MONGO_URI` and a private `JWT_SECRET` in `trifler-backend/.env`. The backend defaults to port `8080`; optionally set `PORT=9000` to match the unmodified frontend example. For local Vite, ensure the backend allows `http://localhost:5173` by setting:

```dotenv
CLIENT_URL=http://localhost:5173
```

Start it:

```powershell
npm run dev
```

Verify the API at `http://localhost:8080/api/health` (or the configured port). The backend must be running and connected to MongoDB before frontend backend mode can work.

### 2. Start the frontend

In another PowerShell terminal:

```powershell
cd .\trifler-frontend
npm run dev
```

Open the Vite URL shown in the terminal, typically `http://localhost:5173`. Register or sign in using the backend; successful authentication returns a JWT that the frontend stores and uses for protected REST and WebSocket connections.

## Frontend routes and application flow

| Route | Access | Screen |
|---|---|---|
| `/` | Redirect | Redirects to `/dashboard` |
| `/login` | Public | Sign-in |
| `/register` | Public | Registration |
| `/dashboard` | Protected | Main workspace and conversations |
| `/private-chat` | Protected | Direct conversation view |
| `/private-chat/:userId` | Protected | Direct chat selected by user ID |
| `/groups` | Protected | Group list and conversation view |
| `/groups/:groupId` | Protected | Group selected by ID |
| `/profile` | Protected | Profile and account actions |
| Any unmatched path | Public fallback | Not found |

`AppRoutes.jsx` mounts `AuthProvider` and `ChatProvider`. `ProtectedRoute` restricts chat/profile routes to authenticated users and redirects signed-out visitors to `/login`. Components should use the contexts/hooks; contexts should call the feature services rather than calling Axios directly.

## Frontend-to-backend connection

**All REST endpoint URLs belong in `src/services/`**, not in pages or components:

| Frontend file | Backend connection |
|---|---|
| `src/services/api.js` | Axios base URL, JSON header, 15-second timeout, and `Authorization: Bearer <JWT>` from `chatconnect_token` |
| `src/services/authService.js` | Registration and login endpoints |
| `src/services/userService.js` | Current-user profile, account deletion, and user search endpoints |
| `src/services/chatService.js` | Conversation list, direct-conversation creation, and message-history endpoints |
| `src/services/groupService.js` | Group creation and add-member endpoints |
| `src/services/websocketService.js` | Native authenticated WebSocket connection, sending messages, and receiving events |
| `src/context/AuthContext.jsx` | Calls auth/user services for login lifecycle, profile update, and account deletion |
| `src/context/ChatContext.jsx` | Calls chat/group services, loads and normalizes server data, and updates UI state from WebSocket events |
| `src/hooks/useWebSocket.js` | Connects/disconnects the WebSocket and exposes publish/subscribe operations to chat UI |

Example: a login form calls the login handler, which calls `loginUser()` in `authService.js`; that service calls `api.post("/auth/login", ...)`; `api.js` combines that relative path with `VITE_API_BASE_URL`. On successful login, the token is stored under `chatconnect_token`. The Axios request interceptor then attaches it to protected calls.

### REST API reference

All paths below are relative to the base URL, for example `http://localhost:8080/api`. Protected calls require `Authorization: Bearer <JWT>`. JSON responses use `{ "success": true, ... }`; errors use `{ "success": false, "message": "...", "errors": [...] }` where applicable.

| Method and path | Auth | Request | Frontend service and use |
|---|---|---|---|
| `GET /health` | No | None | Health check only; no dedicated frontend service |
| `POST /auth/register` | No | `{ "name", "email", "password" }` | `authService.registerUser()` from `Register.jsx`; returns `token`, `user` |
| `POST /auth/login` | No | `{ "email", "password" }` | `authService.loginUser()` from `Login.jsx`; returns `token`, `user` |
| `GET /users/me` | Yes | None | `userService.getCurrentUser()` from `AuthContext`; verifies/restores current session |
| `PATCH /users/me` | Yes | Any of `{ "name", "email", "avatar" }` | `userService.updateUserProfile()` from `AuthContext` |
| `DELETE /users/me` | Yes | None | `userService.deleteCurrentUser()` from `AuthContext`; removes the account |
| `GET /users?search=<text>&limit=10` | Yes | Query: `search` (2–50 chars), optional `limit` (1–20) | `userService.searchUsers()` used by direct-chat and group dialogs; email matches are exact |
| `GET /conversations` | Yes | None | `chatService.getConversations()` from `ChatContext` |
| `POST /conversations/direct` | Yes | `{ "userId": "<user id>" }` | `chatService.createDirectConversation()` from `ChatContext` |
| `GET /conversations/:id/messages?limit=100&before=<date>` | Yes | Query: `limit` 1–100, optional `before` timestamp | `chatService.getConversationMessages()` from `ChatContext`; current frontend requests up to 100 and does not yet expose older-page pagination |
| `GET /groups` | Yes | None | Backend route exists; frontend currently does not call it directly |
| `POST /groups` | Yes | `{ "name", "description"?, "memberIds": ["<user id>"] }` | `groupService.createGroup()` from `ChatContext`; creator is added as admin |
| `GET /groups/:groupId` | Yes | None | Backend route exists; frontend currently does not call it directly |
| `POST /groups/:groupId/members` | Yes | `{ "userId": "<user id>" }` | `groupService.addGroupMember()` from `ChatContext`; admin only |
| `DELETE /groups/:groupId/members/:userId` | Yes | None | Backend route supports admin removal or self-leave; frontend currently has no service wrapper |

The backend defaults to port `8080`, while the frontend `.env.example` and fallback URLs currently use `9000`. Choose one port and set both `VITE_API_BASE_URL` and `VITE_WS_URL` to match. The backend `CLIENT_URL` must include the exact frontend origin (usually `http://localhost:5173`) or browser requests will fail CORS checks.

### Authentication behavior

Registration and login return a JWT and user object. `AuthContext` stores them in local storage, revalidates the token with `GET /users/me` after page load, and clears the local session if that request fails. The backend expects a Bearer token for protected HTTP routes. Do not send a JWT as a URL query parameter.

### WebSocket events

The backend uses a native WebSocket at `/ws` (not STOMP). The frontend connects with handshake subprotocols `trifler-chat` and `trifler-auth.<JWT>`. The token is sent in the subprotocol, not in the URL.

Frontend currently sends:

```json
{ "type": "message.send", "conversationId": "<conversation id>", "text": "Hello", "clientId": "<temporary message id>" }
```

The backend validates membership and text, stores the message, then broadcasts:

```json
{ "type": "message.new", "clientId": "<temporary message id>", "message": { "conversation": "<id>", "sender": {}, "text": "Hello", "createdAt": "..." } }
```

The frontend also listens for `connected`, `conversation.created`, `typing`, `error`, and other server events. `ChatContext` refreshes conversations on `conversation.created` and adds received `message.new` events to the matching conversation. Reconnection is attempted after a connection closes.

The backend accepts `ping`, `message.send`, and `typing` client events. Although the backend supports typing notifications, the current frontend WebSocket service does not yet publish a `typing` event. The current backend router does not register its `presence` and `subscribe` handler files; there is no STOMP broker or topic/destination configuration.

## Current integration coverage

Implemented REST calls are collected in `authService.js`, `userService.js`, `chatService.js`, and `groupService.js` as listed above. Backend routes `GET /groups`, `GET /groups/:groupId`, and `DELETE /groups/:groupId/members/:userId` are available but not yet wrapped by frontend service methods. Add such methods to `src/services/groupService.js`, then expose them through `ChatContext` and use them from the group UI.

Message history currently loads the latest page (up to 100 messages); the backend supports `before` pagination, but the frontend does not currently request older pages. Typing events are supported by the backend but are not currently sent by the frontend. Confirm the UI integration before relying on these behaviors.

## Local mode and browser storage

Set `VITE_ENABLE_BACKEND=false` to disable backend conversation loading and WebSocket use. Conversations are then kept in the current browser's local storage and do not reach other users or devices. This is not a complete offline mode: login and registration pages still call the backend, and profile service methods still make REST calls when used. Local storage does not provide server authentication and should not be used for sensitive information.

| Local storage key | Purpose |
|---|---|
| `chatconnect_token` | JWT returned by backend login or registration |
| `chatconnect_user` | Cached signed-in user/profile |
| `trifler_conversations` | Locally persisted conversations when backend mode is disabled |
| `trifler_demo_conversations` | Legacy key removed during local conversation initialization |

Clearing browser site data removes these local values. Account deletion calls the backend and does not merely clear local data. Do not log or store passwords in browser storage.

## Commands and validation

Run commands from `trifler-frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create the optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |

There is no frontend test script configured in `package.json`. Validate code changes with:

```powershell
npm run lint
npm run build
```

`dist/` and `node_modules/` are generated artifacts; do not edit them by hand. Keep `.env.local` and other machine-specific configuration out of version control.

## Technology

- React 19 and React Router 7
- Vite 8 and the React Vite plugin
- Tailwind CSS 4 and project CSS
- Axios for REST requests
- Native browser WebSocket for real-time communication
- Lucide React for icons, date-fns for date utilities, and Sonner for notifications
- ESLint for linting
